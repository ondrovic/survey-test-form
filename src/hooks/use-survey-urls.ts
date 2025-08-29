import { routes } from '@/routes';
import { SurveyInstance } from '@/types';
import { useToast } from '@/contexts/toast-context/index';
import { useCallback } from 'react';
import { ErrorLoggingService } from '@/services/error-logging.service';

export const useSurveyUrls = () => {
  const { showSuccess, showError } = useToast();

  const generateSurveyUrl = useCallback((instance: SurveyInstance) => {
    // Use slug if available, otherwise fall back to id for backward compatibility
    const urlIdentifier = instance.slug || instance.id;
    return `${window.location.origin}/${routes.takeSurvey(urlIdentifier)}`;
  }, []);

  const copySurveyUrl = useCallback(async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      showSuccess('Survey URL copied to clipboard!');
    } catch (error) {
      showError('Failed to copy URL to clipboard');
      ErrorLoggingService.logError({
        severity: 'low',
        errorMessage: 'Failed to copy survey URL to clipboard',
        componentName: 'useSurveyUrls',
        functionName: 'copySurveyUrl',
        userAction: 'copying survey URL to clipboard',
        additionalContext: {
          url,
          error: error instanceof Error ? error.message : String(error)
        },
        tags: ['survey', 'clipboard', 'url']
      });
    }
  }, [showSuccess, showError]);

  const openSurveyInNewTab = useCallback((url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  return {
    generateSurveyUrl,
    copySurveyUrl,
    openSurveyInNewTab
  };
};