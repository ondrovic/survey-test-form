import { databaseHelpers } from '@/config/database';
import { useSurveyData } from '@/contexts/survey-data-context';
import { useToast } from '@/contexts/toast-context';
import { SurveyConfig } from '@/types';
import { createMetadata } from '@/utils/metadata.utils';
import { 
  exportSurveyConfig, 
  parseJsonFile, 
  processImportedConfig, 
  validateImportedConfig 
} from '@/utils/config-import-export.utils';
import { useCallback } from 'react';
import { ErrorLoggingService } from '../services/error-logging.service';

export const useConfigImportExport = () => {
  const { refreshAll } = useSurveyData();
  const { showSuccess, showError } = useToast();

  const handleExportConfig = useCallback((config: SurveyConfig) => {
    try {
      exportSurveyConfig(config);
      showSuccess(`Survey config "${config.title}" exported successfully!`);
    } catch (error) {
      // Log config export error
      ErrorLoggingService.logError({
        severity: 'medium',
        errorMessage: 'Failed to export survey config',
        stackTrace: error instanceof Error ? error.stack : String(error),
        componentName: 'useConfigImportExport',
        functionName: 'handleExportConfig',
        additionalContext: { surveyTitle: config.title }
      });
      showError('Failed to export survey config');
    }
  }, [showSuccess, showError]);

  const handleImportConfig = useCallback(async (file: File) => {
    try {
      // Parse the JSON file
      const data = await parseJsonFile(file);
      
      // Validate the structure
      const validation = validateImportedConfig(data);
      if (!validation.isValid) {
        const errorMessage = `Invalid config file:\n${validation.errors.join('\n')}`;
        showError(errorMessage);
        return false;
      }

      // Process the data for import
      const processedConfig = processImportedConfig(data);
      
      // Create the config in the database
      const configWithMetadata = {
        ...processedConfig,
        metadata: await createMetadata()
      };

      await databaseHelpers.addSurveyConfig(configWithMetadata);
      
      // Refresh the data
      await refreshAll();
      
      showSuccess(`Survey config "${processedConfig.title}" imported successfully!`);
      return true;
    } catch (error) {
      // Log config import error
      ErrorLoggingService.logError({
        severity: 'medium',
        errorMessage: 'Failed to import survey config',
        stackTrace: error instanceof Error ? error.stack : String(error),
        componentName: 'useConfigImportExport',
        functionName: 'handleImportConfig',
        additionalContext: { fileName: file.name, fileSize: file.size }
      });
      showError(`Failed to import survey config: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }, [refreshAll, showSuccess, showError]);

  return {
    exportConfig: handleExportConfig,
    importConfig: handleImportConfig
  };
};