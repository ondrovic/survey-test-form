import { firestoreHelpers } from '@/config/database';
import { useSurveyData } from '@/contexts/survey-data-context/index';
import { useCallback } from 'react';
import {
  ExportableDataType,
  exportData,
  parseJsonFile,
  processImportedData,
  validateImportData,
  getDataTypeDisplayName
} from '@/utils/generic-import-export.utils';
import { SurveyConfig, SurveyInstance, RatingScale, RadioOptionSet, MultiSelectOptionSet, SelectOptionSet } from '@/types';
import { createMetadata } from '@/utils/metadata.utils';

export const useGenericImportExport = () => {
  const { refreshAll } = useSurveyData();

  // Generic export function
  const exportItem = useCallback(<T>(
    item: T,
    dataType: ExportableDataType,
    customFilename?: string
  ) => {
    try {
      exportData(item, dataType, customFilename);
      console.log(`Successfully exported ${getDataTypeDisplayName(dataType)}`);
    } catch (error) {
      console.error(`Failed to export ${getDataTypeDisplayName(dataType)}:`, error);
      alert(`Failed to export ${getDataTypeDisplayName(dataType)}`);
    }
  }, []);

  // Generic import function
  const importItem = useCallback(async (
    file: File,
    dataType?: ExportableDataType
  ): Promise<boolean> => {
    try {
      // Parse the file
      const data = await parseJsonFile(file);
      
      // Validate the data
      const validation = validateImportData(data);
      if (!validation.isValid) {
        console.error('Import validation failed:', validation.errors);
        alert(`Import failed:\n${validation.errors.join('\n')}`);
        return false;
      }

      // Use detected type if not provided
      const finalDataType = dataType || validation.dataType!;
      
      // Process the data for import
      const processedData = processImportedData(data, finalDataType);
      
      // Save to database based on data type
      switch (finalDataType) {
        case 'config': {
          const configWithMetadata = {
            ...processedData,
            metadata: await createMetadata()
          } as SurveyConfig;
          const savedConfig = await firestoreHelpers.addSurveyConfig(configWithMetadata);
          console.log('✅ Config saved to database with ID:', savedConfig?.id, 'Title:', savedConfig?.title);
          break;
        }
          
        case 'instance': {
          const instanceWithMetadata = {
            ...processedData,
            metadata: await createMetadata()
          } as SurveyInstance;
          await firestoreHelpers.addSurveyInstance(instanceWithMetadata);
          break;
        }
          
        case 'rating-scale': {
          const ratingScaleWithMetadata = {
            ...processedData,
            metadata: await createMetadata()
          } as RatingScale;
          await firestoreHelpers.addRatingScale(ratingScaleWithMetadata);
          break;
        }
          
        case 'radio-option-set': {
          const radioOptionSetWithMetadata = {
            ...processedData,
            metadata: await createMetadata()
          } as RadioOptionSet;
          await firestoreHelpers.addRadioOptionSet(radioOptionSetWithMetadata);
          break;
        }
          
        case 'multi-select-option-set': {
          const multiSelectOptionSetWithMetadata = {
            ...processedData,
            metadata: await createMetadata()
          } as MultiSelectOptionSet;
          await firestoreHelpers.addMultiSelectOptionSet(multiSelectOptionSetWithMetadata);
          break;
        }
          
        case 'select-option-set': {
          const selectOptionSetWithMetadata = {
            ...processedData,
            metadata: await createMetadata()
          } as SelectOptionSet;
          await firestoreHelpers.addSelectOptionSet(selectOptionSetWithMetadata);
          break;
        }
          
        default:
          throw new Error(`Unsupported data type: ${finalDataType}`);
      }
      
      // Refresh all data from the database
      console.log(`🔄 Refreshing all data after ${finalDataType} import...`);
      await refreshAll();
      console.log(`✅ Data refresh completed after ${finalDataType} import`);
      
      console.log(`Successfully imported ${getDataTypeDisplayName(finalDataType)}`);
      return true;
      
    } catch (error) {
      console.error('Import failed:', error);
      alert(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }, [refreshAll]);

  // Convenience functions for specific data types
  const exportConfig = useCallback((config: SurveyConfig, customFilename?: string) => {
    exportItem(config, 'config', customFilename);
  }, [exportItem]);

  const exportInstance = useCallback((instance: SurveyInstance, customFilename?: string) => {
    exportItem(instance, 'instance', customFilename);
  }, [exportItem]);

  const exportRatingScale = useCallback((ratingScale: RatingScale, customFilename?: string) => {
    exportItem(ratingScale, 'rating-scale', customFilename);
  }, [exportItem]);

  const exportRadioOptionSet = useCallback((radioOptionSet: RadioOptionSet, customFilename?: string) => {
    exportItem(radioOptionSet, 'radio-option-set', customFilename);
  }, [exportItem]);

  const exportMultiSelectOptionSet = useCallback((multiSelectOptionSet: MultiSelectOptionSet, customFilename?: string) => {
    exportItem(multiSelectOptionSet, 'multi-select-option-set', customFilename);
  }, [exportItem]);

  const exportSelectOptionSet = useCallback((selectOptionSet: SelectOptionSet, customFilename?: string) => {
    exportItem(selectOptionSet, 'select-option-set', customFilename);
  }, [exportItem]);

  // Import convenience functions
  const importConfig = useCallback((file: File) => importItem(file, 'config'), [importItem]);
  const importInstance = useCallback((file: File) => importItem(file, 'instance'), [importItem]);
  const importRatingScale = useCallback((file: File) => importItem(file, 'rating-scale'), [importItem]);
  const importRadioOptionSet = useCallback((file: File) => importItem(file, 'radio-option-set'), [importItem]);
  const importMultiSelectOptionSet = useCallback((file: File) => importItem(file, 'multi-select-option-set'), [importItem]);
  const importSelectOptionSet = useCallback((file: File) => importItem(file, 'select-option-set'), [importItem]);

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
    getDataTypeDisplayName
  };
};