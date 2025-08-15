import { useState, useEffect, useMemo } from 'react';
import { firestoreHelpers } from '@/config/firebase';
import { useSurveyData } from '@/contexts/survey-data-context/index';
import { SurveyConfig, SurveyResponse } from '@/types';
import { AggregatedSeries, OptionSets } from '../types';
import { computeAggregations } from '../utils';

export const useVisualizationData = (instanceId?: string) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<SurveyConfig | undefined>(undefined);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);

  const { state: surveyDataState } = useSurveyData();

  // Build option sets for aggregation computation
  const optionSets = useMemo((): OptionSets => {
    const ratingScalesById: Record<string, any> = {};
    const ratingScalesByName: Record<string, any> = {};
    const radioSetsById: Record<string, any> = {};
    const radioSetsByName: Record<string, any> = {};
    const selectSetsById: Record<string, any> = {};
    const selectSetsByName: Record<string, any> = {};
    const multiSetsById: Record<string, any> = {};
    const multiSetsByName: Record<string, any> = {};

    (surveyDataState.ratingScales || []).forEach((s: any) => {
      ratingScalesById[s.id] = s;
      ratingScalesByName[(s.name || '').toLowerCase()] = s;
    });

    (surveyDataState.radioOptionSets || []).forEach((s: any) => {
      radioSetsById[s.id] = s;
      radioSetsByName[(s.name || '').toLowerCase()] = s;
    });

    (surveyDataState.selectOptionSets || []).forEach((s: any) => {
      selectSetsById[s.id] = s;
      selectSetsByName[(s.name || '').toLowerCase()] = s;
    });

    (surveyDataState.multiSelectOptionSets || []).forEach((s: any) => {
      multiSetsById[s.id] = s;
      multiSetsByName[(s.name || '').toLowerCase()] = s;
    });

    return {
      ratingScalesById,
      ratingScalesByName,
      radioSetsById,
      radioSetsByName,
      selectSetsById,
      selectSetsByName,
      multiSetsById,
      multiSetsByName,
    };
  }, [surveyDataState]);

  // Load data when instanceId changes
  useEffect(() => {
    let isMounted = true;
    
    async function loadData() {
      if (!instanceId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const [instanceResponses, legacyResponses, instances] = await Promise.all([
          firestoreHelpers.getSurveyResponsesFromCollection(instanceId).catch(() => []),
          firestoreHelpers.getSurveyResponses(instanceId).catch(() => []),
          firestoreHelpers.getSurveyInstances(),
        ]);
        
        const instance = instances.find((i) => i.id === instanceId);
        const cfg = instance ? await firestoreHelpers.getSurveyConfig(instance.configId) : undefined;
        
        if (!isMounted) return;
        
        // Merge instance-specific and legacy responses
        const combined = [...instanceResponses, ...legacyResponses];
        setResponses(combined);
        setConfig(cfg || undefined);
      } catch (e) {
        if (!isMounted) return;
        setError('Failed to load data');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    
    loadData();
    
    return () => {
      isMounted = false;
    };
  }, [instanceId]);

  // Compute aggregations
  const computeAggregatedSeries = (filteredResponses: SurveyResponse[]): AggregatedSeries[] => {
    return computeAggregations(filteredResponses, config, optionSets);
  };

  return {
    loading,
    error,
    config,
    responses,
    computeAggregatedSeries,
    optionSets
  };
};