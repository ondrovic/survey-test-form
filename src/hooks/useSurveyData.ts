import { firestoreHelpers } from "@/config/firebase";
import {
  MultiSelectOptionSet,
  RadioOptionSet,
  RatingScale,
  SelectOptionSet,
  SurveyConfig,
  SurveyData,
  SurveyInstance,
} from "@/types";
import { useCallback, useState } from "react";

interface UseSurveyDataReturn {
  // Framework data
  surveyConfigs: SurveyConfig[];
  surveyInstances: SurveyInstance[];
  ratingScales: RatingScale[];

  // Option Sets
  radioOptionSets: RadioOptionSet[];
  multiSelectOptionSets: MultiSelectOptionSet[];
  selectOptionSets: SelectOptionSet[];

  // Legacy data
  surveys: SurveyData[];

  // Loading states
  isLoading: boolean;
  error: string | null;

  // Actions
  loadFrameworkData: () => Promise<void>;
  loadLegacyData: () => Promise<void>;
  loadRatingScales: () => Promise<void>;
  loadRadioOptionSets: () => Promise<void>;
  loadMultiSelectOptionSets: () => Promise<void>;
  loadSelectOptionSets: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

export const useSurveyData = (): UseSurveyDataReturn => {
  const [surveyConfigs, setSurveyConfigs] = useState<SurveyConfig[]>([]);
  const [surveyInstances, setSurveyInstances] = useState<SurveyInstance[]>([]);
  const [ratingScales, setRatingScales] = useState<RatingScale[]>([]);
  const [radioOptionSets, setRadioOptionSets] = useState<RadioOptionSet[]>([]);
  const [multiSelectOptionSets, setMultiSelectOptionSets] = useState<
    MultiSelectOptionSet[]
  >([]);
  const [selectOptionSets, setSelectOptionSets] = useState<SelectOptionSet[]>(
    []
  );
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

  const loadRadioOptionSets = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const optionSets = (await firestoreHelpers.getRadioOptionSets?.()) || [];
      setRadioOptionSets(optionSets);
    } catch (error) {
      console.error("Error loading radio option sets:", error);
      setError("Failed to load radio option sets");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMultiSelectOptionSets = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const optionSets =
        (await firestoreHelpers.getMultiSelectOptionSets?.()) || [];
      setMultiSelectOptionSets(optionSets);
    } catch (error) {
      console.error("Error loading multi-select option sets:", error);
      setError("Failed to load multi-select option sets");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadSelectOptionSets = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const optionSets = (await firestoreHelpers.getSelectOptionSets?.()) || [];
      setSelectOptionSets(optionSets);
    } catch (error) {
      console.error("Error loading select option sets:", error);
      setError("Failed to load select option sets");
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
        loadRadioOptionSets(),
        loadMultiSelectOptionSets(),
        loadSelectOptionSets(),
      ]);
    } catch (error) {
      console.error("Error refreshing data:", error);
      setError("Failed to refresh data");
    } finally {
      setIsLoading(false);
    }
  }, [
    loadFrameworkData,
    loadLegacyData,
    loadRatingScales,
    loadRadioOptionSets,
    loadMultiSelectOptionSets,
    loadSelectOptionSets,
  ]);

  return {
    surveyConfigs,
    surveyInstances,
    ratingScales,
    radioOptionSets,
    multiSelectOptionSets,
    selectOptionSets,
    surveys,
    isLoading,
    error,
    loadFrameworkData,
    loadLegacyData,
    loadRatingScales,
    loadRadioOptionSets,
    loadMultiSelectOptionSets,
    loadSelectOptionSets,
    refreshAll,
  };
};
