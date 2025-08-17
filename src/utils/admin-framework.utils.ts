import { SurveyConfig, SurveyInstance } from '@/types';

export const getInstanceConfig = (
  instance: SurveyInstance,
  surveyConfigs: SurveyConfig[]
): SurveyConfig | undefined => {
  return surveyConfigs.find(c => c.id === instance.configId);
};

export const getInstanceCount = (
  configId: string,
  surveyInstances: SurveyInstance[]
): number => {
  return surveyInstances.filter(instance => instance.configId === configId).length;
};

export const generateDeleteMessage = (
  type: 'config' | 'instance',
  name: string
): string => {
  return type === 'instance'
    ? `Are you sure you want to delete "${name}"? This will permanently delete the survey instance and ALL associated responses. This action cannot be undone.`
    : `Are you sure you want to delete "${name}"? This action cannot be undone.`;
};