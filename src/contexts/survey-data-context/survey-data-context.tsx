import React, { createContext, ReactNode, useCallback, useContext, useEffect, useReducer } from 'react';
import { firestoreHelpers } from '../../config/firebase';
import { SurveyData } from '../../types/survey.types';
import {
    MultiSelectOptionSet,
    RadioOptionSet,
    RatingScale,
    SelectOptionSet,
    SurveyConfig,
    SurveyInstance
} from '../../types/framework.types';

// State interface
interface SurveyDataState {
    surveyConfigs: SurveyConfig[];
    surveyInstances: SurveyInstance[];
    surveys: SurveyData[];
    ratingScales: RatingScale[];
    radioOptionSets: RadioOptionSet[];
    multiSelectOptionSets: MultiSelectOptionSet[];
    selectOptionSets: SelectOptionSet[];
    isLoading: boolean;
    error: string | null;
    lastUpdated: Date | null;
}

// Action types
type SurveyDataAction =
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'SET_SURVEY_CONFIGS'; payload: SurveyConfig[] }
    | { type: 'SET_SURVEY_INSTANCES'; payload: SurveyInstance[] }
    | { type: 'SET_SURVEYS'; payload: SurveyData[] }
    | { type: 'SET_RATING_SCALES'; payload: RatingScale[] }
    | { type: 'SET_RADIO_OPTION_SETS'; payload: RadioOptionSet[] }
    | { type: 'SET_MULTI_SELECT_OPTION_SETS'; payload: MultiSelectOptionSet[] }
    | { type: 'SET_SELECT_OPTION_SETS'; payload: SelectOptionSet[] }
    | { type: 'ADD_SURVEY_CONFIG'; payload: SurveyConfig }
    | { type: 'UPDATE_SURVEY_CONFIG'; payload: SurveyConfig }
    | { type: 'DELETE_SURVEY_CONFIG'; payload: string }
    | { type: 'ADD_SURVEY_INSTANCE'; payload: SurveyInstance }
    | { type: 'UPDATE_SURVEY_INSTANCE'; payload: SurveyInstance }
    | { type: 'DELETE_SURVEY_INSTANCE'; payload: string }
    | { type: 'ADD_RATING_SCALE'; payload: RatingScale }
    | { type: 'UPDATE_RATING_SCALE'; payload: RatingScale }
    | { type: 'DELETE_RATING_SCALE'; payload: string }
    | { type: 'ADD_RADIO_OPTION_SET'; payload: RadioOptionSet }
    | { type: 'UPDATE_RADIO_OPTION_SET'; payload: RadioOptionSet }
    | { type: 'DELETE_RADIO_OPTION_SET'; payload: string }
    | { type: 'ADD_MULTI_SELECT_OPTION_SET'; payload: MultiSelectOptionSet }
    | { type: 'UPDATE_MULTI_SELECT_OPTION_SET'; payload: MultiSelectOptionSet }
    | { type: 'DELETE_MULTI_SELECT_OPTION_SET'; payload: string }
    | { type: 'SET_LAST_UPDATED'; payload: Date }
    | { type: 'RESET_STATE' };

// Initial state
const initialState: SurveyDataState = {
    surveyConfigs: [],
    surveyInstances: [],
    surveys: [],
    ratingScales: [],
    radioOptionSets: [],
    multiSelectOptionSets: [],
    selectOptionSets: [],
    isLoading: false,
    error: null,
    lastUpdated: null,
};

// Reducer
function surveyDataReducer(state: SurveyDataState, action: SurveyDataAction): SurveyDataState {
    switch (action.type) {
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };

        case 'SET_ERROR':
            return { ...state, error: action.payload };

        case 'SET_SURVEY_CONFIGS':
            return { ...state, surveyConfigs: action.payload };

        case 'SET_SURVEY_INSTANCES':
            return { ...state, surveyInstances: action.payload };

        case 'SET_SURVEYS':
            return { ...state, surveys: action.payload };

        case 'SET_RATING_SCALES':
            return { ...state, ratingScales: action.payload };

        case 'SET_RADIO_OPTION_SETS':
            return { ...state, radioOptionSets: action.payload };

        case 'SET_MULTI_SELECT_OPTION_SETS':
            return { ...state, multiSelectOptionSets: action.payload };

        case 'SET_SELECT_OPTION_SETS':
            return { ...state, selectOptionSets: action.payload };

        case 'ADD_SURVEY_CONFIG':
            return { ...state, surveyConfigs: [...state.surveyConfigs, action.payload] };

        case 'UPDATE_SURVEY_CONFIG':
            return {
                ...state,
                surveyConfigs: state.surveyConfigs.map(config =>
                    config.id === action.payload.id ? action.payload : config
                )
            };

        case 'DELETE_SURVEY_CONFIG':
            return {
                ...state,
                surveyConfigs: state.surveyConfigs.filter(config => config.id !== action.payload)
            };

        case 'ADD_SURVEY_INSTANCE':
            return { ...state, surveyInstances: [...state.surveyInstances, action.payload] };

        case 'UPDATE_SURVEY_INSTANCE':
            return {
                ...state,
                surveyInstances: state.surveyInstances.map(instance =>
                    instance.id === action.payload.id ? action.payload : instance
                )
            };

        case 'DELETE_SURVEY_INSTANCE':
            return {
                ...state,
                surveyInstances: state.surveyInstances.filter(instance => instance.id !== action.payload)
            };

        case 'ADD_RATING_SCALE':
            return { ...state, ratingScales: [...state.ratingScales, action.payload] };

        case 'UPDATE_RATING_SCALE':
            return {
                ...state,
                ratingScales: state.ratingScales.map(scale =>
                    scale.id === action.payload.id ? action.payload : scale
                )
            };

        case 'DELETE_RATING_SCALE':
            return {
                ...state,
                ratingScales: state.ratingScales.filter(scale => scale.id !== action.payload)
            };

        case 'ADD_RADIO_OPTION_SET':
            return { ...state, radioOptionSets: [...state.radioOptionSets, action.payload] };

        case 'UPDATE_RADIO_OPTION_SET':
            return {
                ...state,
                radioOptionSets: state.radioOptionSets.map(set =>
                    set.id === action.payload.id ? action.payload : set
                )
            };

        case 'DELETE_RADIO_OPTION_SET':
            return {
                ...state,
                radioOptionSets: state.radioOptionSets.filter(set => set.id !== action.payload)
            };

        case 'ADD_MULTI_SELECT_OPTION_SET':
            return { ...state, multiSelectOptionSets: [...state.multiSelectOptionSets, action.payload] };

        case 'UPDATE_MULTI_SELECT_OPTION_SET':
            return {
                ...state,
                multiSelectOptionSets: state.multiSelectOptionSets.map(set =>
                    set.id === action.payload.id ? action.payload : set
                )
            };

        case 'DELETE_MULTI_SELECT_OPTION_SET':
            return {
                ...state,
                multiSelectOptionSets: state.multiSelectOptionSets.filter(set => set.id !== action.payload)
            };

        case 'SET_LAST_UPDATED':
            return { ...state, lastUpdated: action.payload };

        case 'RESET_STATE':
            return initialState;

        default:
            return state;
    }
}

// Context
interface SurveyDataContextType {
    state: SurveyDataState;
    dispatch: React.Dispatch<SurveyDataAction>;
    // Convenience methods
    loadFrameworkData: () => Promise<void>;
    loadLegacyData: () => Promise<void>;
    loadRatingScales: () => Promise<void>;
    loadRadioOptionSets: () => Promise<void>;
    loadMultiSelectOptionSets: () => Promise<void>;
    loadSelectOptionSets: () => Promise<void>;
    refreshAll: () => Promise<void>;
    addSurveyConfig: (config: SurveyConfig) => void;
    updateSurveyConfig: (config: SurveyConfig) => void;
    deleteSurveyConfig: (id: string) => void;
    addSurveyInstance: (instance: SurveyInstance) => void;
    updateSurveyInstance: (instance: SurveyInstance) => void;
    deleteSurveyInstance: (id: string) => void;
    addRatingScale: (scale: RatingScale) => void;
    updateRatingScale: (scale: RatingScale) => void;
    deleteRatingScale: (id: string) => void;
    addRadioOptionSet: (optionSet: RadioOptionSet) => void;
    updateRadioOptionSet: (optionSet: RadioOptionSet) => void;
    deleteRadioOptionSet: (id: string) => void;
    addMultiSelectOptionSet: (optionSet: MultiSelectOptionSet) => void;
    updateMultiSelectOptionSet: (optionSet: MultiSelectOptionSet) => void;
    deleteMultiSelectOptionSet: (id: string) => void;
}

const SurveyDataContext = createContext<SurveyDataContextType | undefined>(undefined);

// Provider component
interface SurveyDataProviderProps {
    children: ReactNode;
    autoLoad?: boolean;
}

export const SurveyDataProvider: React.FC<SurveyDataProviderProps> = ({
    children,
    autoLoad = true
}) => {
    const [state, dispatch] = useReducer(surveyDataReducer, initialState);

    const setLoading = useCallback((loading: boolean) => {
        dispatch({ type: 'SET_LOADING', payload: loading });
    }, []);

    const setError = useCallback((error: string | null) => {
        dispatch({ type: 'SET_ERROR', payload: error });
    }, []);

    const setLastUpdated = useCallback(() => {
        dispatch({ type: 'SET_LAST_UPDATED', payload: new Date() });
    }, []);

    const loadFrameworkData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const [configs, instances] = await Promise.all([
                firestoreHelpers.getSurveyConfigs(),
                firestoreHelpers.getSurveyInstances(),
            ]);

            dispatch({ type: 'SET_SURVEY_CONFIGS', payload: configs });
            dispatch({ type: 'SET_SURVEY_INSTANCES', payload: instances });
            setLastUpdated();
        } catch (error) {
            console.error("Error loading framework data:", error);
            setError("Failed to load framework data");
        } finally {
            setLoading(false);
        }
    }, [setLoading, setError, setLastUpdated]);

    const loadLegacyData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const legacySurveys = await firestoreHelpers.getSurveys();
            dispatch({ type: 'SET_SURVEYS', payload: legacySurveys });
            setLastUpdated();
        } catch (error) {
            console.error("Error loading legacy data:", error);
            setError("Failed to load legacy data");
        } finally {
            setLoading(false);
        }
    }, [setLoading, setError, setLastUpdated]);

    const loadRatingScales = useCallback(async () => {
        try {
            const scales = await firestoreHelpers.getRatingScales();
            dispatch({ type: 'SET_RATING_SCALES', payload: scales });
        } catch (error) {
            console.error("Error loading rating scales:", error);
        }
    }, []);

    const loadRadioOptionSets = useCallback(async () => {
        try {
            const optionSets = await firestoreHelpers.getRadioOptionSets();
            dispatch({ type: 'SET_RADIO_OPTION_SETS', payload: optionSets });
        } catch (error) {
            console.error("Error loading radio option sets:", error);
        }
    }, []);

    const loadMultiSelectOptionSets = useCallback(async () => {
        try {
            const optionSets = await firestoreHelpers.getMultiSelectOptionSets();
            dispatch({ type: 'SET_MULTI_SELECT_OPTION_SETS', payload: optionSets });
        } catch (error) {
            console.error("Error loading multi-select option sets:", error);
        }
    }, []);

    const loadSelectOptionSets = useCallback(async () => {
        try {
            const optionSets = await firestoreHelpers.getSelectOptionSets();
            dispatch({ type: 'SET_SELECT_OPTION_SETS', payload: optionSets });
        } catch (error) {
            console.error("Error loading select option sets:", error);
        }
    }, []);

    const refreshAll = useCallback(async () => {
        console.log("refreshAll called - starting data reload...");
        await Promise.all([
            loadFrameworkData(),
            loadLegacyData(),
            loadRatingScales(),
            loadRadioOptionSets(),
            loadMultiSelectOptionSets(),
            loadSelectOptionSets(),
        ]);
        console.log("refreshAll completed - all data reloaded");
    }, [loadFrameworkData, loadLegacyData, loadRatingScales, loadRadioOptionSets, loadMultiSelectOptionSets, loadSelectOptionSets]);

    // CRUD operations
    const addSurveyConfig = useCallback((config: SurveyConfig) => {
        dispatch({ type: 'ADD_SURVEY_CONFIG', payload: config });
    }, []);

    const updateSurveyConfig = useCallback((config: SurveyConfig) => {
        dispatch({ type: 'UPDATE_SURVEY_CONFIG', payload: config });
    }, []);

    const deleteSurveyConfig = useCallback((id: string) => {
        dispatch({ type: 'DELETE_SURVEY_CONFIG', payload: id });
    }, []);

    const addSurveyInstance = useCallback((instance: SurveyInstance) => {
        dispatch({ type: 'ADD_SURVEY_INSTANCE', payload: instance });
    }, []);

    const updateSurveyInstance = useCallback((instance: SurveyInstance) => {
        dispatch({ type: 'UPDATE_SURVEY_INSTANCE', payload: instance });
    }, []);

    const deleteSurveyInstance = useCallback((id: string) => {
        dispatch({ type: 'DELETE_SURVEY_INSTANCE', payload: id });
    }, []);

    const addRatingScale = useCallback((scale: RatingScale) => {
        dispatch({ type: 'ADD_RATING_SCALE', payload: scale });
    }, []);

    const updateRatingScale = useCallback((scale: RatingScale) => {
        dispatch({ type: 'UPDATE_RATING_SCALE', payload: scale });
    }, []);

    const deleteRatingScale = useCallback((id: string) => {
        dispatch({ type: 'DELETE_RATING_SCALE', payload: id });
    }, []);

    const addRadioOptionSet = useCallback((optionSet: RadioOptionSet) => {
        dispatch({ type: 'ADD_RADIO_OPTION_SET', payload: optionSet });
    }, []);

    const updateRadioOptionSet = useCallback((optionSet: RadioOptionSet) => {
        dispatch({ type: 'UPDATE_RADIO_OPTION_SET', payload: optionSet });
    }, []);

    const deleteRadioOptionSet = useCallback((id: string) => {
        dispatch({ type: 'DELETE_RADIO_OPTION_SET', payload: id });
    }, []);

    const addMultiSelectOptionSet = useCallback((optionSet: MultiSelectOptionSet) => {
        dispatch({ type: 'ADD_MULTI_SELECT_OPTION_SET', payload: optionSet });
    }, []);

    const updateMultiSelectOptionSet = useCallback((optionSet: MultiSelectOptionSet) => {
        dispatch({ type: 'UPDATE_MULTI_SELECT_OPTION_SET', payload: optionSet });
    }, []);

    const deleteMultiSelectOptionSet = useCallback((id: string) => {
        dispatch({ type: 'DELETE_MULTI_SELECT_OPTION_SET', payload: id });
    }, []);

    // Auto-load data on mount
    useEffect(() => {
        if (autoLoad) {
            refreshAll();
        }
    }, [autoLoad, refreshAll]);

    const value: SurveyDataContextType = {
        state,
        dispatch,
        loadFrameworkData,
        loadLegacyData,
        loadRatingScales,
        loadRadioOptionSets,
        loadMultiSelectOptionSets,
        loadSelectOptionSets,
        refreshAll,
        addSurveyConfig,
        updateSurveyConfig,
        deleteSurveyConfig,
        addSurveyInstance,
        updateSurveyInstance,
        deleteSurveyInstance,
        addRatingScale,
        updateRatingScale,
        deleteRatingScale,
        addRadioOptionSet,
        updateRadioOptionSet,
        deleteRadioOptionSet,
        addMultiSelectOptionSet,
        updateMultiSelectOptionSet,
        deleteMultiSelectOptionSet,
    };

    return (
        <SurveyDataContext.Provider value={value}>
            {children}
        </SurveyDataContext.Provider>
    );
};

// Hook to use the context
export const useSurveyData = (): SurveyDataContextType => {
    const context = useContext(SurveyDataContext);
    if (context === undefined) {
        throw new Error('useSurveyData must be used within a SurveyDataProvider');
    }
    return context;
};
