import { useCallback } from 'react';
import { useSurveyData } from '../contexts/survey-data-context';

/**
 * Hook to provide survey status validation utilities
 */
export const useSurveyStatusValidation = () => {
  const { validateSurveyInstanceStatuses } = useSurveyData();

  // Manual validation with user feedback
  const validateStatuses = useCallback(async () => {
    try {
      console.log('🔄 Triggering manual survey status validation...');
      await validateSurveyInstanceStatuses();
      console.log('✅ Survey status validation completed');
      return { success: true, message: 'Survey statuses updated successfully' };
    } catch (error) {
      console.error('❌ Survey status validation failed:', error);
      return { success: false, message: 'Failed to validate survey statuses', error };
    }
  }, [validateSurveyInstanceStatuses]);

  return {
    validateStatuses,
  };
};