import { firestoreHelpers } from "@/config/database";
import { useSurveyData } from "@/contexts/survey-data-context/index";
import { useToast } from "@/contexts/toast-context/index";
import {
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

export const useSurveyOperations = () => {
  const surveyDataContext = useSurveyData();
  const {
    state: {
      surveyInstances,
    },
    refreshAll,
  } = surveyDataContext;
  const { showSuccess, showError } = useToast();

  const createSurveyInstance = useCallback(
    async (config: SurveyConfig) => {
      try {
        // Generate a unique slug using the shared utility
        const slug = generateUniqueSlug(config.title, surveyInstances);

        const instance = {
          configId: config.id,
          title: config.title,
          description: config.description,
          slug: slug, // Store the slug in the slug field
          isActive: true,
          metadata: await createMetadata(),
        };

        await firestoreHelpers.addSurveyInstance(instance);
        showSuccess(`Survey instance "${config.title}" created!`);
        await refreshAll();
      } catch (error) {
        showError(`Failed to create survey instance for "${config.title}"`);
      }
    },
    [surveyInstances, refreshAll, showSuccess, showError]
  );

  const downloadSurveyData = useCallback(
    async (instanceId?: string) => {
      try {
        if (instanceId) {
          const responses =
            await firestoreHelpers.getSurveyResponsesFromCollection(instanceId);
          const instance = surveyInstances.find((i) => i.id === instanceId);
          if (instance) {
            const surveyConfig = await firestoreHelpers.getSurveyConfig(
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
          const configs = await firestoreHelpers.getSurveyConfigs();

          for (const instance of surveyInstances) {
            try {
              const responses =
                await firestoreHelpers.getSurveyResponsesFromCollection(
                  instance.id
                );
              allResponses.push(...responses);
            } catch (error) {
              console.warn(
                `Failed to get responses for instance ${instance.id}:`,
                error
              );
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
      }
    },
    [surveyInstances, showSuccess, showError]
  );

  const verifyConfig = useCallback(async () => {
    try {
      showSuccess("Verifying survey configurations...");
      
      // Get fresh data directly from database to bypass React state issues
      console.log('🔄 Loading fresh data directly from database...');
      const [
        freshSurveyConfigs,
        freshSurveyInstances,
        freshRatingScales,
        freshRadioOptionSets,
        freshMultiSelectOptionSets,
        freshSelectOptionSets
      ] = await Promise.all([
        firestoreHelpers.getSurveyConfigs(),
        firestoreHelpers.getSurveyInstances(),
        firestoreHelpers.getRatingScales(),
        firestoreHelpers.getRadioOptionSets(),
        firestoreHelpers.getMultiSelectOptionSets(),
        firestoreHelpers.getSelectOptionSets()
      ]);
      
      const currentData = {
        surveyConfigs: freshSurveyConfigs,
        surveyInstances: freshSurveyInstances,
        ratingScales: freshRatingScales,
        radioOptionSets: freshRadioOptionSets,
        multiSelectOptionSets: freshMultiSelectOptionSets,
        selectOptionSets: freshSelectOptionSets
      };
      
      console.log('📊 Fresh database data for validation:', {
        ratingScales: currentData.ratingScales.length,
        radioOptionSets: currentData.radioOptionSets.length,
        multiSelectOptionSets: currentData.multiSelectOptionSets.length,
        selectOptionSets: currentData.selectOptionSets.length
      });

      const validationResults = {
        totalConfigs: currentData.surveyConfigs.length,
        validConfigs: 0,
        invalidConfigs: 0,
        totalInstances: currentData.surveyInstances.length,
        deactivatedInstances: 0,
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
          if (!section.fields || section.fields.length === 0) {
            configErrors.push(
              `Config "${config.title}" > Section "${section.title}": No fields defined`
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
        } else {
          validationResults.invalidConfigs++;
          validationResults.errors.push(...configErrors);
        }
      }

      // Handle invalid configurations by deactivating their instances
      if (validationResults.invalidConfigs > 0) {
        showError(
          `Configuration validation failed! ${validationResults.invalidConfigs} config(s) have issues.`
        );

        // Deactivate instances with invalid configurations
        for (const config of currentData.surveyConfigs) {
          const configErrors = validationResults.errors.filter((error) =>
            error.includes(`Config "${config.title}"`)
          );
          if (configErrors.length > 0) {
            // Find and deactivate all instances of this config
            const configInstances = currentData.surveyInstances.filter(
              (instance) => instance.configId === config.id
            );
            for (const instance of configInstances) {
              if (instance.isActive) {
                try {
                  await firestoreHelpers.updateSurveyInstance(instance.id, {
                    isActive: false,
                  });
                  validationResults.deactivatedInstances++;
                  console.log(
                    `Deactivated instance "${instance.title}" due to invalid configuration`
                  );
                } catch (error) {
                  console.error(
                    `Failed to deactivate instance "${instance.title}":`,
                    error
                  );
                  validationResults.warnings.push(
                    `Failed to deactivate instance "${instance.title}"`
                  );
                }
              }
            }
          }
        }

        // Update context state with fresh data 
        await refreshAll();
      } else {
        showSuccess(
          `Configuration validation passed! All ${validationResults.totalConfigs} configurations are valid.`
        );
      }

      console.log("Configuration validation results:", validationResults);
      return validationResults;
    } catch (error) {
      showError("Failed to verify configurations");
      console.error("Configuration verification error:", error);
      throw error;
    }
  }, [
    showSuccess,
    showError,
    refreshAll
  ]);

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
        if (!field.radioOptionSetId) {
          errors.push("Radio field must reference a radio option set");
        } else if (!optionSets.radioOptionSetsMap.has(field.radioOptionSetId)) {
          errors.push(
            `Referenced radio option set "${field.radioOptionSetId}" not found`
          );
        }
        break;

      case "multi-select":
        if (!field.multiSelectOptionSetId) {
          errors.push(
            "Multi-select field must reference a multi-select option set"
          );
        } else if (
          !optionSets.multiSelectOptionSetsMap.has(field.multiSelectOptionSetId)
        ) {
          errors.push(
            `Referenced multi-select option set "${field.multiSelectOptionSetId}" not found`
          );
        }
        break;

      case "select":
        if (!field.selectOptionSetId) {
          errors.push("Select field must reference a select option set");
        } else if (
          !optionSets.selectOptionSetsMap.has(field.selectOptionSetId)
        ) {
          errors.push(
            `Referenced select option set "${field.selectOptionSetId}" not found`
          );
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
