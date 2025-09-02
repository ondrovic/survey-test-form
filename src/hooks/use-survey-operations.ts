import { databaseHelpers } from "@/config/database";
import { useSurveyData } from "@/contexts/survey-data-context/index";
import { useToast } from "@/contexts/toast-context/index";
import {
  DateRange,
  MultiSelectOptionSet,
  RadioOptionSet,
  RatingScale,
  SelectOptionSet,
  SurveyConfig,
  SurveyResponse,
} from "@/types";
import { downloadFrameworkResponsesAsExcel } from "@/utils/excel.utils";
import { createMetadata } from "@/utils/metadata.utils";
import { generateUniqueSlug } from "@/utils/slug.utils";
import { useCallback } from "react";
import { ErrorLoggingService } from "@/services/error-logging.service";

export const useSurveyOperations = () => {
  const surveyDataContext = useSurveyData();
  const {
    state: { surveyInstances },
    refreshAll,
    updateSurveyInstance,
  } = surveyDataContext;
  const { showSuccess, showError } = useToast();

  const createSurveyInstance = useCallback(
    async (config: SurveyConfig, activeDateRange?: DateRange | null) => {
      try {
        // Generate a unique slug using the shared utility
        const slug = generateUniqueSlug(config.title, surveyInstances);

        const instance = {
          configId: config.id,
          title: config.title,
          description: config.description,
          slug: slug, // Store the slug in the slug field
          isActive: true,
          activeDateRange: activeDateRange || undefined,
          metadata: await createMetadata(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await databaseHelpers.addSurveyInstance(instance);
        showSuccess(`Survey instance "${config.title}" created!`);
        await refreshAll();
      } catch (error) {
        showError(`Failed to create survey instance for "${config.title}"`);
        ErrorLoggingService.logError({
          severity: 'medium',
          errorMessage: `Failed to create survey instance for: ${config.title}`,
          componentName: 'useSurveyOperations',
          functionName: 'createSurveyInstance',
          userAction: 'creating survey instance',
          additionalContext: {
            configId: config.id,
            configTitle: config.title,
            activeDateRange,
            error: error instanceof Error ? error.message : String(error)
          },
          tags: ['survey', 'instance', 'create']
        });
      }
    },
    [surveyInstances, refreshAll, showSuccess, showError]
  );

  const downloadSurveyData = useCallback(
    async (instanceId?: string) => {
      try {
        if (instanceId) {
          const responses =
            await databaseHelpers.getSurveyResponsesFromCollection(instanceId);
          const instance = surveyInstances.find((i) => i.id === instanceId);
          if (instance) {
            const surveyConfig = await databaseHelpers.getSurveyConfig(
              instance.configId
            );
            const now = new Date();
            const dateStr = now.toISOString().split("T")[0];
            const instanceSlug = instance.title
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-");
            const filename = `${instanceSlug}-responses-${dateStr}.xlsx`;

            downloadFrameworkResponsesAsExcel(
              responses,
              surveyConfig || undefined,
              {
                filename,
                sheetName: "Survey Data",
              }
            );

            showSuccess(
              `Successfully downloaded ${responses.length} responses for ${instance.title}`
            );
          }
        } else {
          const allResponses: SurveyResponse[] = [];
          const configs = await databaseHelpers.getSurveyConfigs();

          for (const instance of surveyInstances) {
            try {
              const responses =
                await databaseHelpers.getSurveyResponsesFromCollection(
                  instance.id
                );
              allResponses.push(...responses);
            } catch (error) {
              ErrorLoggingService.logError({
                severity: 'low',
                errorMessage: `Failed to get responses for instance ${instance.id}`,
                componentName: 'useSurveyOperations',
                functionName: 'downloadSurveyData',
                userAction: 'downloading survey data for all instances',
                additionalContext: {
                  instanceId: instance.id,
                  error: error instanceof Error ? error.message : String(error)
                },
                tags: ['survey', 'download', 'responses']
              });
            }
          }

          const referenceConfig = configs.length > 0 ? configs[0] : undefined;
          const now = new Date();
          const dateStr = now.toISOString().split("T")[0];
          const filename = `all-survey-responses-${dateStr}.xlsx`;

          downloadFrameworkResponsesAsExcel(allResponses, referenceConfig, {
            filename,
            sheetName: "Survey Data",
          });

          showSuccess(
            `Successfully downloaded ${allResponses.length} total responses`
          );
        }
      } catch (error) {
        showError("Failed to download framework survey data");
        ErrorLoggingService.logError({
          severity: 'medium',
          errorMessage: 'Failed to download framework survey data',
          componentName: 'useSurveyOperations',
          functionName: 'downloadSurveyData',
          userAction: 'downloading survey data',
          additionalContext: {
            instanceId,
            error: error instanceof Error ? error.message : String(error)
          },
          tags: ['survey', 'download', 'data']
        });
      }
    },
    [surveyInstances, showSuccess, showError]
  );

  const verifyConfig = useCallback(
    async (silent: boolean = false) => {
      try {
        if (!silent) {
          showSuccess("Verifying survey configurations...");
        }

        // Get fresh data directly from database to bypass React state issues
        const [
          freshSurveyConfigs,
          freshSurveyInstances,
          freshRatingScales,
          freshRadioOptionSets,
          freshMultiSelectOptionSets,
          freshSelectOptionSets,
        ] = await Promise.all([
          databaseHelpers.getSurveyConfigs(),
          databaseHelpers.getSurveyInstances(),
          databaseHelpers.getRatingScales(),
          databaseHelpers.getRadioOptionSets(),
          databaseHelpers.getMultiSelectOptionSets(),
          databaseHelpers.getSelectOptionSets(),
        ]);

        const currentData = {
          surveyConfigs: freshSurveyConfigs,
          surveyInstances: freshSurveyInstances,
          ratingScales: freshRatingScales,
          radioOptionSets: freshRadioOptionSets,
          multiSelectOptionSets: freshMultiSelectOptionSets,
          selectOptionSets: freshSelectOptionSets,
        };

        const validationResults = {
          totalConfigs: currentData.surveyConfigs.length,
          validConfigs: 0,
          invalidConfigs: 0,
          totalInstances: currentData.surveyInstances.length,
          deactivatedInstances: 0,
          reactivatedInstances: 0,
          errors: [] as string[],
          warnings: [] as string[],
        };

        // Create lookup maps for option sets using current data
        const ratingScalesMap = new Map(
          currentData.ratingScales.map((scale) => [scale.id, scale])
        );
        const radioOptionSetsMap = new Map(
          currentData.radioOptionSets.map((set) => [set.id, set])
        );
        const multiSelectOptionSetsMap = new Map(
          currentData.multiSelectOptionSets.map((set) => [set.id, set])
        );
        const selectOptionSetsMap = new Map(
          currentData.selectOptionSets.map((set) => [set.id, set])
        );

        // Validate each survey configuration using current data
        for (const config of currentData.surveyConfigs) {
          let configValid = true;
          const configErrors: string[] = [];

          // Validate sections
          if (!config.sections || config.sections.length === 0) {
            configErrors.push(`Config "${config.title}": No sections defined`);
            configValid = false;
          }

          // Validate each section and its fields
          for (const section of config.sections || []) {
            // Check if section has either section-level fields OR subsection fields
            const hasSectionFields = section.fields && section.fields.length > 0;
            const hasSubsectionFields = section.subsections && section.subsections.some(
              subsection => subsection.fields && subsection.fields.length > 0
            );
            
            if (!hasSectionFields && !hasSubsectionFields) {
              configErrors.push(
                `Config "${config.title}" > Section "${section.title}": No fields defined in section or subsections`
              );
              configValid = false;
            }

            // Validate fields in main section
            for (const field of section.fields || []) {
              const fieldValidation = validateField(field, {
                ratingScalesMap,
                radioOptionSetsMap,
                multiSelectOptionSetsMap,
                selectOptionSetsMap,
              });

              if (!fieldValidation.isValid) {
                configErrors.push(
                  `Config "${config.title}" > Section "${
                    section.title
                  }" > Field "${
                    field.label || field.id
                  }": ${fieldValidation.errors.join(", ")}`
                );
                configValid = false;
              }
            }

            // Validate subsections
            for (const subsection of section.subsections || []) {
              if (!subsection.fields || subsection.fields.length === 0) {
                configErrors.push(
                  `Config "${config.title}" > Section "${section.title}" > Subsection "${subsection.title}": No fields defined`
                );
                configValid = false;
              }

              for (const field of subsection.fields || []) {
                const fieldValidation = validateField(field, {
                  ratingScalesMap,
                  radioOptionSetsMap,
                  multiSelectOptionSetsMap,
                  selectOptionSetsMap,
                });

                if (!fieldValidation.isValid) {
                  configErrors.push(
                    `Config "${config.title}" > Section "${
                      section.title
                    }" > Subsection "${subsection.title}" > Field "${
                      field.label || field.id
                    }": ${fieldValidation.errors.join(", ")}`
                  );
                  configValid = false;
                }
              }
            }
          }

          if (configValid) {
            validationResults.validConfigs++;

            // If config is now valid, check if instances should be immediately reactivated
            const configInstances = currentData.surveyInstances.filter(
              (instance) => instance.configId === config.id
            );

            for (const instance of configInstances) {
              try {
                // Check if instance should be immediately reactivated
                let shouldActivate = false;
                const now = new Date();

                if (instance.activeDateRange && instance.activeDateRange.startDate && instance.activeDateRange.endDate) {
                  const startDate = new Date(
                    instance.activeDateRange.startDate
                  );
                  const endDate = new Date(instance.activeDateRange.endDate);

                  // Reactivate if currently within date range and not already active
                  if (
                    now >= startDate &&
                    now <= endDate &&
                    !instance.isActive
                  ) {
                    shouldActivate = true;
                  }
                } else {
                  // If no date range is set, reactivate if the instance was previously inactive due to config issues
                  // This handles imported instances that don't have date ranges configured
                  if (!instance.isActive && instance.config_valid === false) {
                    shouldActivate = true;
                  }
                }

                if (shouldActivate) {
                  // Immediately reactivate the instance
                  await databaseHelpers.updateSurveyInstance(instance.id, {
                    isActive: true,
                    config_valid: true,
                  });

                  updateSurveyInstance({
                    ...instance,
                    isActive: true,
                    config_valid: true,
                    metadata: {
                      ...instance.metadata,
                      createdAt: instance.metadata?.createdAt || instance.createdAt,
                      updatedAt: new Date().toISOString(),
                      createdBy: instance.metadata?.createdBy || 'system'
                    },
                  });

                  validationResults.reactivatedInstances++;
                } else {
                  // Just mark as config_valid=true for future activation
                  await databaseHelpers.updateSurveyInstance(instance.id, {
                    config_valid: true, // Allow automated date-range activation
                  });

                  updateSurveyInstance({
                    ...instance,
                    config_valid: true,
                    metadata: {
                      ...instance.metadata,
                      createdAt: instance.metadata?.createdAt || instance.createdAt,
                      updatedAt: new Date().toISOString(),
                      createdBy: instance.metadata?.createdBy || 'system'
                    },
                  });
                }
              } catch (error) {
                ErrorLoggingService.logError({
                  severity: 'medium',
                  errorMessage: `Failed to update instance during validation: ${instance.title}`,
                  componentName: 'useSurveyOperations',
                  functionName: 'verifyConfig',
                  userAction: 'validating and updating survey instance',
                  additionalContext: {
                    instanceId: instance.id,
                    instanceTitle: instance.title,
                    error: error instanceof Error ? error.message : String(error)
                  },
                  tags: ['survey', 'validation', 'instance-update']
                });
              }
            }
          } else {
            validationResults.invalidConfigs++;
            validationResults.errors.push(...configErrors);
          }
        }

        // Handle invalid configurations by deactivating their instances
        if (validationResults.invalidConfigs > 0) {
          if (!silent) {
            showError(
              `Configuration validation failed! ${validationResults.invalidConfigs} config(s) have issues.`
            );
          }

          // Track all instances affected by validation issues
          let totalAffectedInstances = 0;

          // Deactivate instances with invalid configurations
          for (const config of currentData.surveyConfigs) {
            const configErrors = validationResults.errors.filter((error) =>
              error.includes(`Config "${config.title}"`)
            );
            if (configErrors.length > 0) {
              // Find all instances of this config
              const configInstances = currentData.surveyInstances.filter(
                (instance) => instance.configId === config.id
              );

              for (const instance of configInstances) {
                totalAffectedInstances++;

                if (instance.isActive) {
                  try {
                    // Update both isActive and config_valid to prevent automated reactivation
                    // Also set validation_in_progress to prevent date automation from running
                    await databaseHelpers.updateSurveyInstance(instance.id, {
                        isActive: false,
                        config_valid: false, // Prevents automated date-range reactivation
                      });

                    // Immediately update local context state to reflect the change
                    updateSurveyInstance({
                      ...instance,
                      isActive: false,
                      config_valid: false,
                      metadata: {
                        createdAt: instance.metadata?.createdAt || new Date().toISOString(),
                        createdBy: instance.metadata?.createdBy || 'system',
                        ...instance.metadata,
                        updatedAt: new Date().toISOString(),
                      },
                    });
                  } catch (error) {
                    validationResults.warnings.push(
                      `Failed to deactivate instance "${instance.title}": ${
                        error instanceof Error ? error.message : "Unknown error"
                      }`
                    );
                    ErrorLoggingService.logError({
                      severity: 'high',
                      errorMessage: `Failed to deactivate instance during validation: ${instance.title}`,
                      componentName: 'useSurveyOperations',
                      functionName: 'verifyConfig',
                      userAction: 'deactivating instance due to invalid configuration',
                      additionalContext: {
                        instanceId: instance.id,
                        instanceTitle: instance.title,
                        error: error instanceof Error ? error.message : String(error)
                      },
                      tags: ['survey', 'validation', 'instance-deactivation', 'critical']
                    });
                  }
                } else {
                  // Also mark inactive instances with invalid configs as config_valid=false
                  try {
                    await databaseHelpers.updateSurveyInstance(instance.id, {
                        config_valid: false, // Prevents future automated activation
                        validation_in_progress: true, // Prevents date automation from running
                      });

                    updateSurveyInstance({
                      ...instance,
                      config_valid: false,
                      validation_in_progress: true,
                      metadata: {
                        createdAt: instance.metadata?.createdAt || new Date().toISOString(),
                        createdBy: instance.metadata?.createdBy || 'system',
                        ...instance.metadata,
                        updatedAt: new Date().toISOString(),
                      },
                    });

                  } catch (error) {
                    ErrorLoggingService.logError({
                      severity: 'medium',
                      errorMessage: `Failed to mark instance as invalid during validation: ${instance.title}`,
                      componentName: 'useSurveyOperations',
                      functionName: 'verifyConfig',
                      userAction: 'marking instance as invalid due to configuration errors',
                      additionalContext: {
                        instanceId: instance.id,
                        instanceTitle: instance.title,
                        error: error instanceof Error ? error.message : String(error)
                      },
                      tags: ['survey', 'validation', 'instance-marking']
                    });
                  }
                }
              }
            }
          }

          // Update the deactivated count to reflect all affected instances
          validationResults.deactivatedInstances = totalAffectedInstances;

          // Add a small delay to ensure database updates are committed
          if (totalAffectedInstances > 0) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }

          // Update context state with fresh data
          await refreshAll();
        } else {
          if (!silent) {
            let successMessage = `Configuration validation passed! All ${validationResults.totalConfigs} configurations are valid.`;

            if (validationResults.reactivatedInstances > 0) {
              successMessage += ` ${validationResults.reactivatedInstances} instance(s) were automatically reactivated.`;
            }

            showSuccess(successMessage);
          }
        }

        return validationResults;
      } catch (error) {
        if (!silent) {
          showError("Failed to verify configurations");
        }
        ErrorLoggingService.logError({
          severity: 'high',
          errorMessage: 'Configuration verification failed',
          componentName: 'useSurveyOperations',
          functionName: 'verifyConfig',
          userAction: 'verifying survey configurations',
          additionalContext: {
            silent,
            error: error instanceof Error ? error.message : String(error)
          },
          tags: ['survey', 'validation', 'verification', 'critical']
        });
        throw error;
      }
    },
    [showSuccess, showError, refreshAll]
  );

  // Helper function to validate individual fields
  const validateField = (
    field: any,
    optionSets: {
      ratingScalesMap: Map<string, RatingScale>;
      radioOptionSetsMap: Map<string, RadioOptionSet>;
      multiSelectOptionSetsMap: Map<string, MultiSelectOptionSet>;
      selectOptionSetsMap: Map<string, SelectOptionSet>;
    }
  ) => {
    const errors: string[] = [];

    // Check if field has required properties
    if (!field.type) {
      errors.push("Missing field type");
    }

    if (!field.label && !field.id) {
      errors.push("Missing field label or ID");
    }

    // Validate field-specific requirements
    switch (field.type) {
      case "rating":
        if (
          field.ratingScaleId &&
          !optionSets.ratingScalesMap.has(field.ratingScaleId)
        ) {
          errors.push(
            `Referenced rating scale "${field.ratingScaleId}" not found`
          );
        }
        break;

      case "radio":
        // Radio fields can either reference an option set or have manual options
        if (field.radioOptionSetId) {
          // If referencing an option set, validate it exists
          if (!optionSets.radioOptionSetsMap.has(field.radioOptionSetId)) {
            errors.push(
              `Referenced radio option set "${field.radioOptionSetId}" not found`
            );
          }
        } else if (!field.options || !Array.isArray(field.options) || field.options.length === 0) {
          // If not referencing an option set, must have manual options
          errors.push("Radio field must either reference a radio option set or have manual options defined");
        }
        break;

      case "multi-select":
        // Multi-select fields can either reference an option set or have manual options
        if (field.multiSelectOptionSetId) {
          // If referencing an option set, validate it exists
          if (!optionSets.multiSelectOptionSetsMap.has(field.multiSelectOptionSetId)) {
            errors.push(
              `Referenced multi-select option set "${field.multiSelectOptionSetId}" not found`
            );
          }
        } else if (!field.options || !Array.isArray(field.options) || field.options.length === 0) {
          // If not referencing an option set, must have manual options
          errors.push("Multi-select field must either reference a multi-select option set or have manual options defined");
        }
        break;

      case "select":
        // Select fields can either reference an option set or have manual options
        if (field.selectOptionSetId) {
          // If referencing an option set, validate it exists
          if (!optionSets.selectOptionSetsMap.has(field.selectOptionSetId)) {
            errors.push(
              `Referenced select option set "${field.selectOptionSetId}" not found`
            );
          }
        } else if (!field.options || !Array.isArray(field.options) || field.options.length === 0) {
          // If not referencing an option set, must have manual options
          errors.push("Select field must either reference a select option set or have manual options defined");
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  return {
    createSurveyInstance,
    downloadSurveyData,
    verifyConfig,
  };
};
