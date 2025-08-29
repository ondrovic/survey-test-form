import { databaseHelpers } from "@/config/database";
import { useSurveyData } from "@/contexts/survey-data-context/index";
import { useToast } from "@/contexts/toast-context";
import { RatingScale, SurveyResponse } from "@/types";
import {
  downloadFrameworkResponsesAsExcel,
} from "@/utils/excel.utils";
import { useCallback } from "react";
import { ErrorLoggingService } from "@/services/error-logging.service";

export const useAdminOperations = () => {
  const { showSuccess, showError } = useToast();
  const { refreshAll } = useSurveyData();


  const deleteSurveyConfig = useCallback(
    async (
      configId: string,
      configName?: string,
      validationResetCallback?: () => void
    ) => {
      try {
        console.log("Starting delete for config ID:", configId);
        await databaseHelpers.deleteSurveyConfig(configId);
        console.log("Firebase delete completed successfully");
        const itemName = configName || "Survey configuration";
        showSuccess(`Survey configuration "${itemName}" deleted!`);

        // Reset validation status if callback provided (since deleted config might have had validation errors)
        if (validationResetCallback) {
          validationResetCallback();
        }

        console.log("Calling refreshAll...");
        await refreshAll();
        console.log("refreshAll completed");
      } catch (error) {
        console.error("Error in deleteSurveyConfig:", error);
        const itemName = configName || "Survey configuration";
        showError(`Failed to delete survey configuration "${itemName}"`);
        ErrorLoggingService.logError({
          severity: 'medium',
          errorMessage: `Failed to delete survey configuration: ${itemName}`,
          componentName: 'useAdminOperations',
          functionName: 'deleteSurveyConfig',
          userAction: 'deleting survey configuration',
          additionalContext: {
            configId,
            configName,
            error: error instanceof Error ? error.message : String(error)
          },
          tags: ['admin', 'config', 'delete']
        });
      }
    },
    [showSuccess, showError, refreshAll]
  );

  // const deactivateSurveyInstance = useCallback(
  //   async (instanceId: string) => {
  //     try {
  //       await databaseHelpers.updateSurveyInstance(instanceId, {
  //         isActive: false,
  //       });
  //       showSuccess("Survey instance deactivated!");
  //       await refreshAll();
  //     } catch (error) {
  //       showError("Failed to deactivate survey instance");
  //     }
  //   },
  //   [showSuccess, showError, refreshAll]
  // );

  const permanentlyDeleteSurveyInstance = useCallback(
    async (
      instanceId: string,
      instanceName?: string,
      validationResetCallback?: () => void
    ) => {
      try {
        console.log("Starting delete for instance ID:", instanceId);
        await databaseHelpers.deleteSurveyInstance(instanceId);
        console.log("Firebase delete completed successfully");
        const itemName = instanceName || "Survey instance";
        showSuccess(`Survey instance "${itemName}" permanently deleted!`);

        // Reset validation status if callback provided (since deleted instance might have had validation errors)
        if (validationResetCallback) {
          validationResetCallback();
        }

        console.log("Calling refreshAll...");
        await refreshAll();
        console.log("refreshAll completed");
      } catch (error) {
        console.error("Error in permanentlyDeleteSurveyInstance:", error);
        const itemName = instanceName || "Survey instance";
        showError(`Failed to delete survey instance "${itemName}"`);
        ErrorLoggingService.logError({
          severity: 'medium',
          errorMessage: `Failed to permanently delete survey instance: ${itemName}`,
          componentName: 'useAdminOperations',
          functionName: 'permanentlyDeleteSurveyInstance',
          userAction: 'permanently deleting survey instance',
          additionalContext: {
            instanceId,
            instanceName,
            error: error instanceof Error ? error.message : String(error)
          },
          tags: ['admin', 'instance', 'delete']
        });
      }
    },
    [showSuccess, showError, refreshAll]
  );

  const deleteRatingScale = useCallback(
    async (scaleId: string, scaleName?: string) => {
      try {
        await databaseHelpers.deleteRatingScale(scaleId);
        const itemName = scaleName || "Unnamed Rating Scale";
        showSuccess(`Rating scale "${itemName}" deleted!`);
        await refreshAll();
      } catch (error) {
        const itemName = scaleName || "Unnamed Rating Scale";
        showError(`Failed to delete rating scale "${itemName}"`);
        ErrorLoggingService.logError({
          severity: 'medium',
          errorMessage: `Failed to delete rating scale: ${itemName}`,
          componentName: 'useAdminOperations',
          functionName: 'deleteRatingScale',
          userAction: 'deleting rating scale',
          additionalContext: {
            scaleId,
            scaleName,
            error: error instanceof Error ? error.message : String(error)
          },
          tags: ['admin', 'rating-scale', 'delete']
        });
      }
    },
    [showSuccess, showError, refreshAll]
  );

  const toggleInstanceActive = useCallback(
    async (instanceId: string, isActive: boolean, instanceName?: string) => {
      try {
        // Get the current instance to check if it has an active date range
        const instances = await databaseHelpers.getSurveyInstances();
        const instance = instances.find((i) => i.id === instanceId);

        const updateData: any = { isActive };

        // If deactivating an instance with an active date range, also set config_valid=false
        // to prevent automatic reactivation by date-based triggers
        if (!isActive && instance?.activeDateRange) {
          const now = new Date();
          const startDate = instance.activeDateRange.startDate ? new Date(instance.activeDateRange.startDate) : null;
          const endDate = instance.activeDateRange.endDate ? new Date(instance.activeDateRange.endDate) : null;

          // Check if the instance is currently within its active date range
          if (startDate && endDate && now >= startDate && now <= endDate) {
            updateData.config_valid = false;
            console.log(
              `🔄 Deactivating instance "${
                instanceName || "Unknown"
              }" within active date range - setting config_valid=false to prevent automatic reactivation`
            );
          }
        }

        await databaseHelpers.updateSurveyInstance(instanceId, updateData);
        const itemName = instanceName || "Survey instance";
        showSuccess(
          `Survey instance "${itemName}" ${
            isActive ? "activated" : "deactivated"
          }!`
        );
        await refreshAll();
      } catch (error) {
        const itemName = instanceName || "Survey instance";
        showError(
          `Failed to ${
            isActive ? "activate" : "deactivate"
          } survey instance "${itemName}"`
        );
        ErrorLoggingService.logError({
          severity: 'medium',
          errorMessage: `Failed to ${isActive ? 'activate' : 'deactivate'} survey instance: ${itemName}`,
          componentName: 'useAdminOperations',
          functionName: 'toggleInstanceActive',
          userAction: `${isActive ? 'activating' : 'deactivating'} survey instance`,
          additionalContext: {
            instanceId,
            instanceName,
            isActive,
            error: error instanceof Error ? error.message : String(error)
          },
          tags: ['admin', 'instance', 'toggle-active']
        });
      }
    },
    [showSuccess, showError, refreshAll]
  );

  const updateInstanceDateRange = useCallback(
    async (
      instanceId: string,
      dateRange: { startDate: string; endDate: string } | null,
      instanceName?: string
    ) => {
      try {
        const updateData: any = {};

        if (dateRange) {
          updateData.activeDateRange = dateRange;
        } else {
          // To remove the field entirely, we need to import deleteField
          // For now, we'll set it to null which is Firebase-safe
          updateData.activeDateRange = null;
        }

        console.log(
          "updateInstanceDateRange calling updateSurveyInstance with:",
          updateData
        );
        await databaseHelpers.updateSurveyInstance(instanceId, updateData);
        const itemName = instanceName || "Survey instance";
        showSuccess(
          dateRange
            ? `Survey instance "${itemName}" date range updated!`
            : `Survey instance "${itemName}" date range removed!`
        );
        await refreshAll();
      } catch (error) {
        console.error("Error in updateInstanceDateRange:", error);
        const itemName = instanceName || "Survey instance";
        showError(
          `Failed to update date range for survey instance "${itemName}"`
        );
        ErrorLoggingService.logError({
          severity: 'medium',
          errorMessage: `Failed to update date range for survey instance: ${itemName}`,
          componentName: 'useAdminOperations',
          functionName: 'updateInstanceDateRange',
          userAction: 'updating survey instance date range',
          additionalContext: {
            instanceId,
            instanceName,
            dateRange,
            error: error instanceof Error ? error.message : String(error)
          },
          tags: ['admin', 'instance', 'date-range']
        });
      }
    },
    [showSuccess, showError, refreshAll]
  );


  const downloadFrameworkData = useCallback(
    async (instanceId?: string) => {
      try {
        if (instanceId) {
          const responses =
            await databaseHelpers.getSurveyResponsesFromCollection(instanceId);
          const surveyInstances = await databaseHelpers.getSurveyInstances();
          const instance = surveyInstances.find((i) => i.id === instanceId);
          if (instance) {
            // Get the survey configuration for proper ordering
            const surveyConfig = await databaseHelpers.getSurveyConfig(
              instance.configId
            );

            // Generate filename with instance name and date
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
          // For all instances, we need to get responses from each survey-specific collection
          const surveyInstances = await databaseHelpers.getSurveyInstances();
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
              console.warn(
                `Failed to get responses for instance ${instance.id}:`,
                error
              );
              ErrorLoggingService.logError({
                severity: 'low',
                errorMessage: `Failed to get responses for instance ${instance.id}`,
                componentName: 'useAdminOperations',
                functionName: 'downloadFrameworkData',
                userAction: 'downloading framework data for all instances',
                additionalContext: {
                  instanceId: instance.id,
                  error: error instanceof Error ? error.message : String(error)
                },
                tags: ['admin', 'download', 'responses']
              });
            }
          }

          // Use the first config as a reference for ordering (or undefined if no configs)
          const referenceConfig = configs.length > 0 ? configs[0] : undefined;

          // Generate filename for all responses
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
          componentName: 'useAdminOperations',
          functionName: 'downloadFrameworkData',
          userAction: 'downloading framework survey data',
          additionalContext: {
            instanceId,
            error: error instanceof Error ? error.message : String(error)
          },
          tags: ['admin', 'download', 'data']
        });
      }
    },
    [showSuccess, showError]
  );

  const cleanupDuplicateRatingScales = useCallback(async () => {
    try {
      const scales = await databaseHelpers.getRatingScales();

      // Group scales by name
      const scalesByName = new Map<string, RatingScale[]>();
      scales.forEach((scale) => {
        if (!scalesByName.has(scale.name)) {
          scalesByName.set(scale.name, []);
        }
        scalesByName.get(scale.name)!.push(scale);
      });

      // Delete duplicates (keep the first one)
      let deletedCount = 0;
      for (const [, scaleList] of scalesByName) {
        if (scaleList.length > 1) {
          // Delete all but the first one
          for (let i = 1; i < scaleList.length; i++) {
            await databaseHelpers.deleteRatingScale(scaleList[i].id);
            deletedCount++;
          }
        }
      }

      if (deletedCount > 0) {
        showSuccess(`Cleaned up ${deletedCount} duplicate rating scales!`);
        await refreshAll();
      } else {
        showSuccess("No duplicate rating scales found.");
      }
    } catch (error) {
      showError("Failed to clean up duplicate rating scales");
      ErrorLoggingService.logError({
        severity: 'medium',
        errorMessage: 'Failed to clean up duplicate rating scales',
        componentName: 'useAdminOperations',
        functionName: 'cleanupDuplicateRatingScales',
        userAction: 'cleaning up duplicate rating scales',
        additionalContext: {
          error: error instanceof Error ? error.message : String(error)
        },
        tags: ['admin', 'rating-scales', 'cleanup']
      });
    }
  }, [showSuccess, showError, refreshAll]);

  // Option Set deletion methods
  const deleteRadioOptionSet = useCallback(
    async (optionSetId: string, optionSetName?: string) => {
      console.log("Starting deleteRadioOptionSet with ID:", optionSetId);
      try {
        await databaseHelpers.deleteRadioOptionSet(optionSetId);
        console.log("Firebase delete completed successfully");
        const itemName = optionSetName || "Unnamed Radio Option Set";
        showSuccess(`Radio option set "${itemName}" deleted!`);
        console.log("Calling refreshAll...");
        await refreshAll();
        console.log("refreshAll completed");
      } catch (error) {
        console.error("Error in deleteRadioOptionSet:", error);
        const itemName = optionSetName || "Unnamed Radio Option Set";
        showError(`Failed to delete radio option set "${itemName}"`);
        ErrorLoggingService.logError({
          severity: 'medium',
          errorMessage: `Failed to delete radio option set: ${itemName}`,
          componentName: 'useAdminOperations',
          functionName: 'deleteRadioOptionSet',
          userAction: 'deleting radio option set',
          additionalContext: {
            optionSetId,
            optionSetName,
            error: error instanceof Error ? error.message : String(error)
          },
          tags: ['admin', 'option-set', 'radio', 'delete']
        });
      }
    },
    [showSuccess, showError, refreshAll]
  );

  const deleteMultiSelectOptionSet = useCallback(
    async (optionSetId: string, optionSetName?: string) => {
      console.log("Starting deleteMultiSelectOptionSet with ID:", optionSetId);
      try {
        await databaseHelpers.deleteMultiSelectOptionSet(optionSetId);
        console.log("Firebase delete completed successfully");
        const itemName = optionSetName || "Unnamed Multi-Select Option Set";
        showSuccess(`Multi-select option set "${itemName}" deleted!`);
        console.log("Calling refreshAll...");
        await refreshAll();
        console.log("refreshAll completed");
      } catch (error) {
        console.error("Error in deleteMultiSelectOptionSet:", error);
        const itemName = optionSetName || "Unnamed Multi-Select Option Set";
        showError(`Failed to delete multi-select option set "${itemName}"`);
        ErrorLoggingService.logError({
          severity: 'medium',
          errorMessage: `Failed to delete multi-select option set: ${itemName}`,
          componentName: 'useAdminOperations',
          functionName: 'deleteMultiSelectOptionSet',
          userAction: 'deleting multi-select option set',
          additionalContext: {
            optionSetId,
            optionSetName,
            error: error instanceof Error ? error.message : String(error)
          },
          tags: ['admin', 'option-set', 'multi-select', 'delete']
        });
      }
    },
    [showSuccess, showError, refreshAll]
  );

  const deleteSelectOptionSet = useCallback(
    async (optionSetId: string, optionSetName?: string) => {
      console.log("Starting deleteSelectOptionSet with ID:", optionSetId);
      try {
        await databaseHelpers.deleteSelectOptionSet(optionSetId);
        console.log("Firebase delete completed successfully");
        const itemName = optionSetName || "Unnamed Select Option Set";
        showSuccess(`Select option set "${itemName}" deleted!`);
        console.log("Calling refreshAll...");
        await refreshAll();
        console.log("refreshAll completed");
      } catch (error) {
        console.error("Error in deleteSelectOptionSet:", error);
        const itemName = optionSetName || "Unnamed Select Option Set";
        showError(`Failed to delete select option set "${itemName}"`);
        ErrorLoggingService.logError({
          severity: 'medium',
          errorMessage: `Failed to delete select option set: ${itemName}`,
          componentName: 'useAdminOperations',
          functionName: 'deleteSelectOptionSet',
          userAction: 'deleting select option set',
          additionalContext: {
            optionSetId,
            optionSetName,
            error: error instanceof Error ? error.message : String(error)
          },
          tags: ['admin', 'option-set', 'select', 'delete']
        });
      }
    },
    [showSuccess, showError, refreshAll]
  );

  return {
    deleteSurveyConfig,

    permanentlyDeleteSurveyInstance,
    deleteRatingScale,
    toggleInstanceActive,
    updateInstanceDateRange,
    downloadFrameworkData,
    cleanupDuplicateRatingScales,
    deleteRadioOptionSet,
    deleteMultiSelectOptionSet,
    deleteSelectOptionSet,
  };
};
