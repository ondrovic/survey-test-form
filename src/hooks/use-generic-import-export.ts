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

export const useGenericImportExport = () => {
  const { refreshAll } = useSurveyData();
  const { showSuccess, showError } = useToast();

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
    async (file: File, dataType?: ExportableDataType): Promise<boolean> => {
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

        // Process the data for import
        const processedData = processImportedData(data, finalDataType);

        // Save to database based on data type
        switch (finalDataType) {
          case "config": {
            // Check if ID already exists for conflict detection
            const originalId = data.metadata?.originalId;
            if (originalId) {
              const existing = await databaseHelpers.getSurveyConfig(originalId);
              if (existing) {
                const shouldCreateNew = confirm(
                  `A survey config with ID "${originalId}" already exists. Would you like to create a new one with a different ID?\n\nYes: Create new with different ID\nNo: Cancel import`
                );
                if (!shouldCreateNew) {
                  showError("Import cancelled - survey config already exists");
                  return false;
                }
                // Continue with new ID (let database generate new one)
              } else {
                // Use original ID since it doesn't exist
                (processedData as any).id = originalId;
              }
            }

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
                const shouldCreateNew = confirm(
                  `A rating scale with ID "${originalId}" already exists. Would you like to create a new one with a different ID?\n\nYes: Create new with different ID\nNo: Cancel import`
                );
                if (!shouldCreateNew) {
                  showError("Import cancelled - rating scale already exists");
                  return false;
                }
                // Continue with new ID (let database generate new one)
              } else {
                // Use original ID since it doesn't exist
                (processedData as any).id = originalId;
              }
            }

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
                const shouldCreateNew = confirm(
                  `A radio option set with ID "${originalId}" already exists. Would you like to create a new one with a different ID?\n\nYes: Create new with different ID\nNo: Cancel import`
                );
                if (!shouldCreateNew) {
                  showError("Import cancelled - radio option set already exists");
                  return false;
                }
                // Continue with new ID (let database generate new one)
              } else {
                // Use original ID since it doesn't exist
                (processedData as any).id = originalId;
              }
            }

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
                const shouldCreateNew = confirm(
                  `A multi-select option set with ID "${originalId}" already exists. Would you like to create a new one with a different ID?\n\nYes: Create new with different ID\nNo: Cancel import`
                );
                if (!shouldCreateNew) {
                  showError("Import cancelled - multi-select option set already exists");
                  return false;
                }
                // Continue with new ID (let database generate new one)
              } else {
                // Use original ID since it doesn't exist
                (processedData as any).id = originalId;
              }
            }

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
                const shouldCreateNew = confirm(
                  `A select option set with ID "${originalId}" already exists. Would you like to create a new one with a different ID?\n\nYes: Create new with different ID\nNo: Cancel import`
                );
                if (!shouldCreateNew) {
                  showError("Import cancelled - select option set already exists");
                  return false;
                }
                // Continue with new ID (let database generate new one)
              } else {
                // Use original ID since it doesn't exist
                (processedData as any).id = originalId;
              }
            }

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

        // Run automatic validation after config import
        if (finalDataType === "config") {
          console.log(`🔍 Running automatic validation after config import...`);
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
        showError(
          `Import failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
        return false;
      }
    },
    [refreshAll, showSuccess, showError]
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
    (file: File) => importItem(file, "config"),
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
