import { databaseHelpers } from "@/config/database";
import { useSurveyData } from "@/contexts/survey-data-context/index";
import { useToast } from "@/contexts/toast-context/index";
import {
  MultiSelectOptionSet,
  RadioOptionSet,
  RatingScale,
  SelectOptionSet,
  SurveyConfig,
  SurveyInstance,
} from "@/types";
import {
  ExportableDataType,
  exportData,
  getDataTypeDisplayName,
  parseJsonFile,
  processImportedData,
  validateImportData,
} from "@/utils/generic-import-export.utils";
import { createMetadata } from "@/utils/metadata.utils";
import { useCallback } from "react";
import { useAutomaticValidation } from "./use-automatic-validation";
import { useConfirmation } from "@/contexts/modal-context";
import { IMPORT_CANCELLED_MESSAGE } from "@/constants/import-export.constants";

export const useGenericImportExport = () => {
  const { refreshAll } = useSurveyData();
  const { showSuccess, showError } = useToast();
  const showConfirmation = useConfirmation();

  // Create a dummy updateValidationStatus function since this hook doesn't need to update UI state
  const updateValidationStatus = useCallback((results: any) => {
    // This is a no-op function since this hook doesn't manage validation UI state
    // The validation results will be handled by the automatic validation system
    console.log("📊 Validation status update (import/export):", results);
  }, []);

  const { runPostImportValidation } = useAutomaticValidation(
    updateValidationStatus
  );

  // Generic export function
  const exportItem = useCallback(
    <T>(item: T, dataType: ExportableDataType, customFilename?: string) => {
      try {
        exportData(item, dataType, customFilename);
        showSuccess(
          `Successfully exported ${getDataTypeDisplayName(dataType)}`
        );
        console.log(
          `Successfully exported ${getDataTypeDisplayName(dataType)}`
        );
      } catch (error) {
        console.error(
          `Failed to export ${getDataTypeDisplayName(dataType)}:`,
          error
        );
        showError(`Failed to export ${getDataTypeDisplayName(dataType)}`);
      }
    },
    [showSuccess, showError]
  );

  // Generic import function
  const importItem = useCallback(
    async (file: File, dataType?: ExportableDataType, closeModalCallback?: () => void): Promise<boolean> => {
      try {
        // Parse the file
        const data = await parseJsonFile(file);

        // Validate the data
        const validation = validateImportData(data);
        if (!validation.isValid) {
          console.error("Import validation failed:", validation.errors);
          showError(`Import failed: ${validation.errors.join(", ")}`);
          return false;
        }

        // Use detected type if not provided
        const finalDataType = dataType || validation.dataType!;

        // Create a copy of data for processing
        const dataForProcessing = { ...data };

        // Save to database based on data type
        switch (finalDataType) {
          case "config": {
            // Check if ID already exists for conflict detection
            const originalId = data.metadata?.originalId;
            if (originalId) {
              const existing = await databaseHelpers.getSurveyConfig(originalId);
              if (existing) {
                // Close the import modal first
                closeModalCallback?.();
                
                const shouldCreateNew = await showConfirmation({
                  id: "import-config-duplicate-confirmation",
                  title: "Survey Config Already Exists",
                  message: `A survey config with ID "${originalId}" already exists. Would you like to create a new one with a different ID?`,
                  confirmText: "Create New",
                  cancelText: "Cancel Import",
                  variant: "warning"
                });
                if (!shouldCreateNew) {
                  showError(IMPORT_CANCELLED_MESSAGE);
                  return false;
                }
                // Remove the ID from data before processing so database generates a new one
                delete dataForProcessing.data.id;
              } else {
                // Use original ID since it doesn't exist - ensure it's set in the data
                dataForProcessing.data.id = originalId;
              }
            }

            // Process the data for import
            const processedData = processImportedData(dataForProcessing, finalDataType);

            const configWithMetadata = {
              ...processedData,
              metadata: await createMetadata(),
            } as SurveyConfig;
            const savedConfig = await databaseHelpers.addSurveyConfig(
              configWithMetadata
            );
            console.log(
              "✅ Config saved to database with ID:",
              savedConfig?.id,
              "Title:",
              savedConfig?.title
            );
            break;
          }

          case "instance": {
            // Check if ID already exists for conflict detection
            const originalId = data.metadata?.originalId;
            if (originalId) {
              const allInstances = await databaseHelpers.getSurveyInstances();
              const existing = allInstances.find(instance => instance.id === originalId);
              if (existing) {
                // Close the import modal first
                closeModalCallback?.();
                
                const shouldCreateNew = await showConfirmation({
                  id: "import-instance-duplicate-confirmation",
                  title: "Survey Instance Already Exists",
                  message: `A survey instance with ID "${originalId}" already exists. Would you like to create a new one with a different ID?`,
                  confirmText: "Create New",
                  cancelText: "Cancel Import",
                  variant: "warning"
                });
                if (!shouldCreateNew) {
                  showError(IMPORT_CANCELLED_MESSAGE);
                  return false;
                }
                // Remove the ID from data before processing so database generates a new one
                delete dataForProcessing.data.id;
              } else {
                // Use original ID since it doesn't exist - ensure it's set in the data
                dataForProcessing.data.id = originalId;
              }
            }

            // Process the data for import
            const processedData = processImportedData(dataForProcessing, finalDataType);
            
            const instanceWithMetadata = {
              ...processedData,
              metadata: await createMetadata(),
            } as SurveyInstance;
            await databaseHelpers.addSurveyInstance(instanceWithMetadata);
            break;
          }

          case "rating-scale": {
            // Check if ID already exists for conflict detection
            const originalId = data.metadata?.originalId;
            if (originalId) {
              const existing = await databaseHelpers.getRatingScale(originalId);
              if (existing) {
                // Close the import modal first
                closeModalCallback?.();
                
                const shouldCreateNew = await showConfirmation({
                  id: "import-rating-scale-duplicate-confirmation",
                  title: "Rating Scale Already Exists",
                  message: `A rating scale with ID "${originalId}" already exists. Would you like to create a new one with a different ID?`,
                  confirmText: "Create New",
                  cancelText: "Cancel Import",
                  variant: "warning"
                });
                if (!shouldCreateNew) {
                  showError(IMPORT_CANCELLED_MESSAGE);
                  return false;
                }
                // Remove the ID from data before processing so database generates a new one
                delete dataForProcessing.data.id;
              } else {
                // Use original ID since it doesn't exist - ensure it's set in the data
                dataForProcessing.data.id = originalId;
              }
            }

            // Process the data for import
            const processedData = processImportedData(dataForProcessing, finalDataType);

            const ratingScaleWithMetadata = {
              ...processedData,
              metadata: await createMetadata(),
            } as RatingScale;
            await databaseHelpers.addRatingScale(ratingScaleWithMetadata);
            break;
          }

          case "radio-option-set": {
            // Check if ID already exists for conflict detection
            const originalId = data.metadata?.originalId;
            if (originalId) {
              const existing = await databaseHelpers.getRadioOptionSet(originalId);
              if (existing) {
                // Close the import modal first
                closeModalCallback?.();
                
                const shouldCreateNew = await showConfirmation({
                  id: "import-radio-option-set-duplicate-confirmation",
                  title: "Radio Option Set Already Exists",
                  message: `A radio option set with ID "${originalId}" already exists. Would you like to create a new one with a different ID?`,
                  confirmText: "Create New",
                  cancelText: "Cancel Import",
                  variant: "warning"
                });
                if (!shouldCreateNew) {
                  showError(IMPORT_CANCELLED_MESSAGE);
                  return false;
                }
                // Remove the ID from data before processing so database generates a new one
                delete dataForProcessing.data.id;
              } else {
                // Use original ID since it doesn't exist - ensure it's set in the data
                dataForProcessing.data.id = originalId;
              }
            }

            // Process the data for import
            const processedData = processImportedData(dataForProcessing, finalDataType);

            const radioOptionSetWithMetadata = {
              ...processedData,
              metadata: await createMetadata(),
            } as RadioOptionSet;
            await databaseHelpers.addRadioOptionSet(radioOptionSetWithMetadata);
            break;
          }

          case "multi-select-option-set": {
            // Check if ID already exists for conflict detection
            const originalId = data.metadata?.originalId;
            if (originalId) {
              const existing = await databaseHelpers.getMultiSelectOptionSet(originalId);
              if (existing) {
                // Close the import modal first
                closeModalCallback?.();
                
                const shouldCreateNew = await showConfirmation({
                  id: "import-multi-select-option-set-duplicate-confirmation",
                  title: "Multi-Select Option Set Already Exists",
                  message: `A multi-select option set with ID "${originalId}" already exists. Would you like to create a new one with a different ID?`,
                  confirmText: "Create New",
                  cancelText: "Cancel Import",
                  variant: "warning"
                });
                if (!shouldCreateNew) {
                  showError(IMPORT_CANCELLED_MESSAGE);
                  return false;
                }
                // Remove the ID from data before processing so database generates a new one
                delete dataForProcessing.data.id;
              } else {
                // Use original ID since it doesn't exist - ensure it's set in the data
                dataForProcessing.data.id = originalId;
              }
            }

            // Process the data for import
            const processedData = processImportedData(dataForProcessing, finalDataType);

            const multiSelectOptionSetWithMetadata = {
              ...processedData,
              metadata: await createMetadata(),
            } as MultiSelectOptionSet;
            await databaseHelpers.addMultiSelectOptionSet(
              multiSelectOptionSetWithMetadata
            );
            break;
          }

          case "select-option-set": {
            // Check if ID already exists for conflict detection
            const originalId = data.metadata?.originalId;
            if (originalId) {
              const existing = await databaseHelpers.getSelectOptionSet(originalId);
              if (existing) {
                // Close the import modal first
                closeModalCallback?.();
                
                const shouldCreateNew = await showConfirmation({
                  id: "import-select-option-set-duplicate-confirmation",
                  title: "Select Option Set Already Exists",
                  message: `A select option set with ID "${originalId}" already exists. Would you like to create a new one with a different ID?`,
                  confirmText: "Create New",
                  cancelText: "Cancel Import",
                  variant: "warning"
                });
                if (!shouldCreateNew) {
                  showError(IMPORT_CANCELLED_MESSAGE);
                  return false;
                }
                // Remove the ID from data before processing so database generates a new one
                delete dataForProcessing.data.id;
              } else {
                // Use original ID since it doesn't exist - ensure it's set in the data
                dataForProcessing.data.id = originalId;
              }
            }

            // Process the data for import
            const processedData = processImportedData(dataForProcessing, finalDataType);

            const selectOptionSetWithMetadata = {
              ...processedData,
              metadata: await createMetadata(),
            } as SelectOptionSet;
            await databaseHelpers.addSelectOptionSet(
              selectOptionSetWithMetadata
            );
            break;
          }

          default:
            throw new Error(`Unsupported data type: ${finalDataType}`);
        }

        // Refresh all data from the database
        console.log(`🔄 Refreshing all data after ${finalDataType} import...`);
        await refreshAll();
        console.log(`✅ Data refresh completed after ${finalDataType} import`);

        // Run automatic validation after config or instance import
        if (finalDataType === "config" || finalDataType === "instance") {
          console.log(`🔍 Running automatic validation after ${finalDataType} import...`);
          await runPostImportValidation();
        }

        // Show success toast for the import operation
        showSuccess(
          `Successfully imported ${getDataTypeDisplayName(finalDataType)}`
        );
        console.log(
          `Successfully imported ${getDataTypeDisplayName(finalDataType)}`
        );
        return true;
      } catch (error) {
        console.error("Import failed:", error);
        
        // Handle specific database constraint errors
        if (error && typeof error === 'object' && 'code' in error) {
          const dbError = error as { code: string; message?: string; details?: string };
          
          if (dbError.code === '23505') {
            // Close the import modal first
            closeModalCallback?.();
            
            // Duplicate key constraint violation
            if (dbError.details?.includes('survey_instances_pkey')) {
              showError("Import failed: Survey instance already exists");
            } else if (dbError.details?.includes('survey_configs_pkey')) {
              showError("Import failed: Survey config already exists");
            } else {
              showError("Import failed: Duplicate entry already exists");
            }
            return false;
          }
        }
        
        // Fallback to generic error message
        showError(
          `Import failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
        return false;
      }
    },
    [refreshAll, showSuccess, showError, showConfirmation]
  );

  // Convenience functions for specific data types
  const exportConfig = useCallback(
    (config: SurveyConfig, customFilename?: string) => {
      exportItem(config, "config", customFilename);
    },
    [exportItem]
  );

  const exportInstance = useCallback(
    (instance: SurveyInstance, customFilename?: string) => {
      exportItem(instance, "instance", customFilename);
    },
    [exportItem]
  );

  const exportRatingScale = useCallback(
    (ratingScale: RatingScale, customFilename?: string) => {
      exportItem(ratingScale, "rating-scale", customFilename);
    },
    [exportItem]
  );

  const exportRadioOptionSet = useCallback(
    (radioOptionSet: RadioOptionSet, customFilename?: string) => {
      exportItem(radioOptionSet, "radio-option-set", customFilename);
    },
    [exportItem]
  );

  const exportMultiSelectOptionSet = useCallback(
    (multiSelectOptionSet: MultiSelectOptionSet, customFilename?: string) => {
      exportItem(
        multiSelectOptionSet,
        "multi-select-option-set",
        customFilename
      );
    },
    [exportItem]
  );

  const exportSelectOptionSet = useCallback(
    (selectOptionSet: SelectOptionSet, customFilename?: string) => {
      exportItem(selectOptionSet, "select-option-set", customFilename);
    },
    [exportItem]
  );

  // Import convenience functions
  const importConfig = useCallback(
    (file: File, closeModalCallback?: () => void) => importItem(file, "config", closeModalCallback),
    [importItem]
  );
  const importInstance = useCallback(
    (file: File) => importItem(file, "instance"),
    [importItem]
  );
  const importRatingScale = useCallback(
    (file: File) => importItem(file, "rating-scale"),
    [importItem]
  );
  const importRadioOptionSet = useCallback(
    (file: File) => importItem(file, "radio-option-set"),
    [importItem]
  );
  const importMultiSelectOptionSet = useCallback(
    (file: File) => importItem(file, "multi-select-option-set"),
    [importItem]
  );
  const importSelectOptionSet = useCallback(
    (file: File) => importItem(file, "select-option-set"),
    [importItem]
  );

  return {
    // Generic functions
    exportItem,
    importItem,

    // Specific export functions
    exportConfig,
    exportInstance,
    exportRatingScale,
    exportRadioOptionSet,
    exportMultiSelectOptionSet,
    exportSelectOptionSet,

    // Specific import functions
    importConfig,
    importInstance,
    importRatingScale,
    importRadioOptionSet,
    importMultiSelectOptionSet,
    importSelectOptionSet,

    // Utility functions
    getDataTypeDisplayName,
  };
};
