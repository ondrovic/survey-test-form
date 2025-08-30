import { useCallback } from 'react';
import { useSurveyData } from '../contexts/survey-data-context';
import { ErrorLoggingService } from '../services/error-logging.service';

/**
 * Hook to provide survey status validation utilities
 */
export const useSurveyStatusValidation = () => {
  const { validateSurveyInstanceStatuses } = useSurveyData();

  // Manual validation with user feedback
  const validateStatuses = useCallback(async () => {
    try {
      await validateSurveyInstanceStatuses();
      return { success: true, message: 'Survey statuses updated successfully' };
    } catch (error) {
      // Log status validation error
      ErrorLoggingService.logError({
        severity: 'medium',
        errorMessage: 'Failed to validate survey statuses',
        stackTrace: error instanceof Error ? error.stack : String(error),
        componentName: 'useSurveyStatusValidation',
        functionName: 'validateStatuses'
      });
      return { success: false, message: 'Failed to validate survey statuses', error };
    }
  }, [validateSurveyInstanceStatuses]);

  return {
    validateStatuses,
  };
};