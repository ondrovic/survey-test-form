import { firestoreHelpers } from "@/config/firebase";
import { RatingScale, SurveyConfig, SurveyData, SurveyInstance } from "@/types";
import { useCallback, useState } from "react";

interface UseSurveyDataReturn {
  // Framework data
  surveyConfigs: SurveyConfig[];
  surveyInstances: SurveyInstance[];
  ratingScales: RatingScale[];

  // Legacy data
  surveys: SurveyData[];

  // Loading states
  isLoading: boolean;
  error: string | null;

  // Actions
  loadFrameworkData: () => Promise<void>;
  loadLegacyData: () => Promise<void>;
  loadRatingScales: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

export const useSurveyData = (): UseSurveyDataReturn => {
  const [surveyConfigs, setSurveyConfigs] = useState<SurveyConfig[]>([]);
  const [surveyInstances, setSurveyInstances] = useState<SurveyInstance[]>([]);
  const [ratingScales, setRatingScales] = useState<RatingScale[]>([]);
  const [surveys, setSurveys] = useState<SurveyData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFrameworkData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [configs, instances] = await Promise.all([
        firestoreHelpers.getSurveyConfigs(),
        firestoreHelpers.getSurveyInstances(),
      ]);

      setSurveyConfigs(configs);
      setSurveyInstances(instances);
    } catch (error) {
      console.error("Error loading framework data:", error);
      setError("Failed to load framework data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadLegacyData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const legacySurveys = await firestoreHelpers.getSurveys();
      setSurveys(legacySurveys);
    } catch (error) {
      console.error("Error loading legacy data:", error);
      setError("Failed to load legacy data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadRatingScales = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const scales = await firestoreHelpers.getRatingScales();
      setRatingScales(scales);
    } catch (error) {
      console.error("Error loading rating scales:", error);
      setError("Failed to load rating scales");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      await Promise.all([
        loadFrameworkData(),
        loadLegacyData(),
        loadRatingScales(),
      ]);
    } catch (error) {
      console.error("Error refreshing data:", error);
      setError("Failed to refresh data");
    } finally {
      setIsLoading(false);
    }
  }, [loadFrameworkData, loadLegacyData, loadRatingScales]);

  return {
    surveyConfigs,
    surveyInstances,
    ratingScales,
    surveys,
    isLoading,
    error,
    loadFrameworkData,
    loadLegacyData,
    loadRatingScales,
    refreshAll,
  };
};
