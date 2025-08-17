import { baseRoute } from '@/routes';
import { SurveyInstance } from '@/types';
import { useToast } from '@/contexts/toast-context/index';
import { useCallback } from 'react';

export const useSurveyUrls = () => {
  const { showSuccess, showError } = useToast();

  const generateSurveyUrl = useCallback((instance: SurveyInstance) => {
    // Use slug if available, otherwise fall back to id for backward compatibility
    const urlIdentifier = instance.slug || instance.id;
    return `${window.location.origin}${baseRoute}/${urlIdentifier}`;
  }, []);

  const copySurveyUrl = useCallback(async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      showSuccess('Survey URL copied to clipboard!');
    } catch (error) {
      showError('Failed to copy URL to clipboard');
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