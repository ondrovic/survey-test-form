import { firestoreHelpers } from '@/config/database';
import { useSurveyData } from '@/contexts/survey-data-context/index';
import { useToast } from '@/contexts/toast-context/index';
import { SurveyConfig, SurveyInstance, SurveyResponse } from '@/types';
import { createMetadata } from '@/utils/metadata.utils';
import { downloadFrameworkResponsesAsExcel } from '@/utils/excel.utils';
import { useCallback } from 'react';

export const useSurveyOperations = () => {
  const { state: { surveyInstances }, refreshAll } = useSurveyData();
  const { showSuccess, showError } = useToast();

  const createSurveyInstance = useCallback(async (config: SurveyConfig) => {
    try {
      const instance = {
        configId: config.id,
        title: config.title,
        description: config.description,
        isActive: true,
        metadata: await createMetadata()
      };

      await firestoreHelpers.addSurveyInstance(instance);
      showSuccess(`Survey instance "${config.title}" created!`);
      await refreshAll();
    } catch (error) {
      showError(`Failed to create survey instance for "${config.title}"`);
    }
  }, [refreshAll, showSuccess, showError]);

  const downloadSurveyData = useCallback(async (instanceId?: string) => {
    try {
      if (instanceId) {
        const responses = await firestoreHelpers.getSurveyResponsesFromCollection(instanceId);
        const instance = surveyInstances.find(i => i.id === instanceId);
        if (instance) {
          const surveyConfig = await firestoreHelpers.getSurveyConfig(instance.configId);
          const now = new Date();
          const dateStr = now.toISOString().split('T')[0];
          const instanceSlug = instance.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          const filename = `${instanceSlug}-responses-${dateStr}.xlsx`;

          downloadFrameworkResponsesAsExcel(responses, surveyConfig || undefined, {
            filename,
            sheetName: "Survey Data"
          });

          showSuccess(`Successfully downloaded ${responses.length} responses for ${instance.title}`);
        }
      } else {
        const allResponses: SurveyResponse[] = [];
        const configs = await firestoreHelpers.getSurveyConfigs();

        for (const instance of surveyInstances) {
          try {
            const responses = await firestoreHelpers.getSurveyResponsesFromCollection(instance.id);
            allResponses.push(...responses);
          } catch (error) {
            console.warn(`Failed to get responses for instance ${instance.id}:`, error);
          }
        }

        const referenceConfig = configs.length > 0 ? configs[0] : undefined;
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const filename = `all-survey-responses-${dateStr}.xlsx`;

        downloadFrameworkResponsesAsExcel(allResponses, referenceConfig, {
          filename,
          sheetName: 'Survey Data'
        });

        showSuccess(`Successfully downloaded ${allResponses.length} total responses`);
      }
    } catch (error) {
      showError('Failed to download framework survey data');
    }
  }, [surveyInstances, showSuccess, showError]);

  const verifyDataSeparation = useCallback(async () => {
    try {
      showSuccess('Verifying data separation...');
      const result = await firestoreHelpers.verifyInstanceCollectionSeparation();
      showSuccess(`Verification completed! ${result.properlyIsolated}/${result.totalInstances} instances properly isolated.`);
      console.log('Verification results:', result);
    } catch (error) {
      showError('Failed to verify data separation');
      console.error('Verification error:', error);
    }
  }, [showSuccess, showError]);

  return {
    createSurveyInstance,
    downloadSurveyData,
    verifyDataSeparation
  };
};