import { firestoreHelpers } from "@/config/firebase";
import { useSurveyDataContext } from "@/contexts/SurveyDataContext";
import { useToast } from "@/contexts/ToastContext";
import { RatingScale, SurveyResponse } from "@/types";
import {
  downloadFrameworkResponsesAsExcel,
  downloadSurveyDataAsExcel,
} from "@/utils/excel.utils";
import { useCallback } from "react";

export const useAdminOperations = () => {
  const { showSuccess, showError } = useToast();
  const { refreshAll } = useSurveyDataContext();

  const deleteSurvey = useCallback(
    async (surveyId: string) => {
      try {
        await firestoreHelpers.deleteSurvey(surveyId);
        showSuccess("Survey deleted successfully!");
        await refreshAll();
      } catch (error) {
        showError("Failed to delete survey");
      }
    },
    [showSuccess, showError, refreshAll]
  );

  const deleteSurveyConfig = useCallback(
    async (configId: string) => {
      try {
        await firestoreHelpers.deleteSurveyConfig(configId);
        showSuccess("Survey configuration deleted successfully!");
        await refreshAll();
      } catch (error) {
        showError("Failed to delete survey configuration");
      }
    },
    [showSuccess, showError, refreshAll]
  );

  const deleteSurveyInstance = useCallback(
    async (instanceId: string) => {
      try {
        await firestoreHelpers.updateSurveyInstance(instanceId, {
          isActive: false,
        });
        showSuccess("Survey instance deactivated successfully!");
        await refreshAll();
      } catch (error) {
        showError("Failed to deactivate survey instance");
      }
    },
    [showSuccess, showError, refreshAll]
  );

  const permanentlyDeleteSurveyInstance = useCallback(
    async (instanceId: string) => {
      try {
        await firestoreHelpers.deleteSurveyInstance(instanceId);
        showSuccess("Survey instance permanently deleted!");
        await refreshAll();
      } catch (error) {
        showError("Failed to delete survey instance");
      }
    },
    [showSuccess, showError, refreshAll]
  );

  const deleteRatingScale = useCallback(
    async (scaleId: string) => {
      try {
        await firestoreHelpers.deleteRatingScale(scaleId);
        showSuccess("Rating scale deleted successfully!");
        await refreshAll();
      } catch (error) {
        showError("Failed to delete rating scale");
      }
    },
    [showSuccess, showError, refreshAll]
  );

  const toggleInstanceActive = useCallback(
    async (instanceId: string, isActive: boolean) => {
      try {
        await firestoreHelpers.updateSurveyInstance(instanceId, { isActive });
        showSuccess(
          `Survey instance ${
            isActive ? "activated" : "deactivated"
          } successfully!`
        );
        await refreshAll();
      } catch (error) {
        showError(
          `Failed to ${isActive ? "activate" : "deactivate"} survey instance`
        );
      }
    },
    [showSuccess, showError, refreshAll]
  );

  const updateInstanceDateRange = useCallback(
    async (
      instanceId: string,
      dateRange: { startDate: string; endDate: string } | null
    ) => {
      try {
        const updateData = dateRange
          ? { activeDateRange: dateRange }
          : { activeDateRange: undefined };
        await firestoreHelpers.updateSurveyInstance(instanceId, updateData);
        showSuccess(
          dateRange
            ? "Date range updated successfully!"
            : "Date range removed successfully!"
        );
        await refreshAll();
      } catch (error) {
        showError("Failed to update date range");
      }
    },
    [showSuccess, showError, refreshAll]
  );

  const downloadLegacyData = useCallback(
    async (surveyId?: string) => {
      try {
        if (surveyId) {
          // Download specific survey data
          const surveys = await firestoreHelpers.getSurveys();
          const survey = surveys.find((s) => s.id === surveyId);
          if (survey) {
            await downloadSurveyDataAsExcel([survey], survey.title || "Survey");
          }
        } else {
          // Download all survey data
          const surveys = await firestoreHelpers.getSurveys();
          await downloadSurveyDataAsExcel(surveys);
        }
        showSuccess("Survey data downloaded successfully!");
      } catch (error) {
        showError("Failed to download survey data");
      }
    },
    [showSuccess, showError]
  );

  const downloadFrameworkData = useCallback(
    async (instanceId?: string) => {
      try {
        if (instanceId) {
          const responses =
            await firestoreHelpers.getSurveyResponsesFromCollection(instanceId);
          const surveyInstances = await firestoreHelpers.getSurveyInstances();
          const instance = surveyInstances.find((i) => i.id === instanceId);
          if (instance) {
            // Get the survey configuration for proper ordering
            const surveyConfig = await firestoreHelpers.getSurveyConfig(
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
                sheetName: `${instance.title} Responses`,
              }
            );

            showSuccess(
              `Successfully downloaded ${responses.length} responses for ${instance.title}`
            );
          }
        } else {
          // For all instances, we need to get responses from each survey-specific collection
          const surveyInstances = await firestoreHelpers.getSurveyInstances();
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

          // Use the first config as a reference for ordering (or undefined if no configs)
          const referenceConfig = configs.length > 0 ? configs[0] : undefined;

          // Generate filename for all responses
          const now = new Date();
          const dateStr = now.toISOString().split("T")[0];
          const filename = `all-survey-responses-${dateStr}.xlsx`;

          downloadFrameworkResponsesAsExcel(allResponses, referenceConfig, {
            filename,
            sheetName: "All Survey Responses",
          });

          showSuccess(
            `Successfully downloaded ${allResponses.length} total responses`
          );
        }
      } catch (error) {
        showError("Failed to download framework survey data");
      }
    },
    [showSuccess, showError]
  );

  const cleanupDuplicateRatingScales = useCallback(async () => {
    try {
      const scales = await firestoreHelpers.getRatingScales();

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
            await firestoreHelpers.deleteRatingScale(scaleList[i].id);
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
    }
  }, [showSuccess, showError, refreshAll]);

  return {
    deleteSurvey,
    deleteSurveyConfig,
    deleteSurveyInstance,
    permanentlyDeleteSurveyInstance,
    deleteRatingScale,
    toggleInstanceActive,
    updateInstanceDateRange,
    downloadLegacyData,
    downloadFrameworkData,
    cleanupDuplicateRatingScales,
  };
};
