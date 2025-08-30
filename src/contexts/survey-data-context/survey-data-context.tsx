import React, { createContext, ReactNode, useCallback, useContext, useEffect, useReducer, useRef } from 'react';
import { useAuth } from '../auth-context';
import { databaseHelpers, getDatabaseProviderInfo } from '../../config/database';
import { ErrorLoggingService } from '../../services/error-logging.service';
import {
    MultiSelectOptionSet,
    RadioOptionSet,
    RatingScale,
    SelectOptionSet,
    SurveyConfig,
    SurveyInstance
} from '../../types/framework.types';

/**
 * Check and update survey instance statuses based on their date ranges
 */
async function checkAndUpdateSurveyInstanceStatuses(instances: SurveyInstance[]): Promise<SurveyInstance[]> {
    const now = new Date();
    const updatedInstances: SurveyInstance[] = [];
    let _updateCount = 0;

    for (const instance of instances) {
        // Only check instances that have activeDateRange configured
        if (!instance.activeDateRange?.startDate || !instance.activeDateRange?.endDate) {
            updatedInstances.push(instance);
            continue;
        }

        const startDate = new Date(instance.activeDateRange.startDate);
        // Set endDate to end of day (23:59:59.999) to ensure survey is active through the entire end date
        const endDate = new Date(instance.activeDateRange.endDate);
        endDate.setHours(23, 59, 59, 999);
        // Determine what isActive should be based on current time
        const shouldBeActive = now >= startDate && now <= endDate;

        // Only allow activation if config is valid
        if (shouldBeActive && !instance.config_valid) {
            updatedInstances.push(instance);
            continue;
        }

        // Only allow deactivation if config is valid (prevents interference with manual deactivation)
        if (!shouldBeActive && !instance.config_valid) {
            updatedInstances.push(instance);
            continue;
        }

        // Update if status has changed
        if (shouldBeActive !== instance.isActive) {
            try {
                const updatedInstance = {
                    ...instance,
                    isActive: shouldBeActive,
                    metadata: {
                        ...instance.metadata,
                        createdAt: instance.metadata?.createdAt || instance.createdAt,
                        updatedAt: new Date().toISOString(),
                        createdBy: instance.metadata?.createdBy || 'system'
                    }
                };

                await databaseHelpers.updateSurveyInstance(instance.id, updatedInstance);
                updatedInstances.push(updatedInstance);
                _updateCount++; // Track update count

            } catch (error) {
                // Log to database
                await ErrorLoggingService.logError({
                    severity: 'high',
                    errorMessage: `Failed to update survey instance "${instance.title}" status`,
                    stackTrace: error instanceof Error ? error.stack : String(error),
                    componentName: 'SurveyDataContext',
                    functionName: 'checkAndUpdateSurveyInstanceStatuses',
                    userAction: `Automatically updating survey instance status for "${instance.title}"`,
                    additionalContext: {
                        surveyId: instance.id,
                        surveyTitle: instance.title,
                        currentStatus: instance.isActive,
                        targetStatus: shouldBeActive,
                        activeDateRange: instance.activeDateRange,
                        configValid: instance.config_valid
                    },
                    tags: ['survey-data', 'context', 'status-update', 'automatic-validation']
                });
                
                updatedInstances.push(instance); // Keep original if update fails
            }
        } else {
            updatedInstances.push(instance);
        }
    }

    return updatedInstances;
}

// State interface
interface SurveyDataState {
    surveyConfigs: SurveyConfig[];
    surveyInstances: SurveyInstance[];
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
    | { type: 'ADD_SELECT_OPTION_SET'; payload: SelectOptionSet }
    | { type: 'UPDATE_SELECT_OPTION_SET'; payload: SelectOptionSet }
    | { type: 'DELETE_SELECT_OPTION_SET'; payload: string }
    | { type: 'SET_LAST_UPDATED'; payload: Date }
    | { type: 'RESET_STATE' };

// Initial state
const initialState: SurveyDataState = {
    surveyConfigs: [],
    surveyInstances: [],
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

        case 'ADD_SELECT_OPTION_SET':
            return { ...state, selectOptionSets: [...state.selectOptionSets, action.payload] };

        case 'UPDATE_SELECT_OPTION_SET':
            return {
                ...state,
                selectOptionSets: state.selectOptionSets.map(set =>
                    set.id === action.payload.id ? action.payload : set
                )
            };

        case 'DELETE_SELECT_OPTION_SET':
            return {
                ...state,
                selectOptionSets: state.selectOptionSets.filter(set => set.id !== action.payload)
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
    loadRatingScales: () => Promise<void>;
    loadRadioOptionSets: () => Promise<void>;
    loadMultiSelectOptionSets: () => Promise<void>;
    loadSelectOptionSets: () => Promise<void>;
    refreshAll: () => Promise<void>;
    validateSurveyInstanceStatuses: () => Promise<void>;
    addSurveyConfig: (config: SurveyConfig) => void;
    updateSurveyConfig: (config: SurveyConfig) => void;
    deleteSurveyConfig: (id: string) => void;
    addSurveyInstance: (instance: SurveyInstance) => void;
    updateSurveyInstance: (instance: SurveyInstance) => void;
    deleteSurveyInstance: (id: string) => void;
    addRatingScale: (scale: RatingScale) => Promise<void>;
    updateRatingScale: (scale: RatingScale) => void;
    deleteRatingScale: (id: string) => void;
    addRadioOptionSet: (optionSet: RadioOptionSet) => Promise<void>;
    updateRadioOptionSet: (optionSet: RadioOptionSet) => void;
    deleteRadioOptionSet: (id: string) => void;
    addMultiSelectOptionSet: (optionSet: MultiSelectOptionSet) => Promise<void>;
    updateMultiSelectOptionSet: (optionSet: MultiSelectOptionSet) => void;
    deleteMultiSelectOptionSet: (id: string) => void;
    addSelectOptionSet: (optionSet: SelectOptionSet) => Promise<void>;
    updateSelectOptionSet: (optionSet: SelectOptionSet) => void;
    deleteSelectOptionSet: (id: string) => void;
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
    const { isAuthenticated, isLoading: authLoading } = useAuth();

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
            const dbInfo = getDatabaseProviderInfo();
            if (!dbInfo.isInitialized) {
                return;
            }
            setLoading(true);
            setError(null);

            const [configs, instances] = await Promise.all([
                databaseHelpers.getSurveyConfigs(),
                databaseHelpers.getSurveyInstances(),
            ]);

            // Don't automatically check statuses during data load - only during explicit validation
            // This prevents interference with validation deactivation

            dispatch({ type: 'SET_SURVEY_CONFIGS', payload: configs });
            dispatch({ type: 'SET_SURVEY_INSTANCES', payload: instances });
            setLastUpdated();
        } catch (error) {
            setError("Failed to load framework data");
            
            // Log to database
            await ErrorLoggingService.logError({
                severity: 'critical',
                errorMessage: 'Failed to load framework data (survey configs and instances)',
                stackTrace: error instanceof Error ? error.stack : String(error),
                componentName: 'SurveyDataContext',
                functionName: 'loadFrameworkData',
                userAction: 'Loading survey framework data',
                additionalContext: {
                    databaseProviderInfo: getDatabaseProviderInfo(),
                    autoLoad: true
                },
                tags: ['survey-data', 'context', 'framework-loading', 'critical-failure']
            });
        } finally {
            setLoading(false);
        }
    }, [setLoading, setError, setLastUpdated]);


    const loadRatingScales = useCallback(async () => {
        try {
            const dbInfo = getDatabaseProviderInfo();
            if (!dbInfo.isInitialized) {
                return;
            }
            const scales = await databaseHelpers.getRatingScales();
            dispatch({ type: 'SET_RATING_SCALES', payload: scales });
        } catch (error) {
            // Log to database
            await ErrorLoggingService.logError({
                severity: 'medium',
                errorMessage: 'Failed to load rating scales data',
                stackTrace: error instanceof Error ? error.stack : String(error),
                componentName: 'SurveyDataContext',
                functionName: 'loadRatingScales',
                userAction: 'Loading rating scales data',
                additionalContext: {
                    databaseProviderInfo: getDatabaseProviderInfo()
                },
                tags: ['survey-data', 'context', 'rating-scales', 'data-loading']
            });
        }
    }, []);

    const loadRadioOptionSets = useCallback(async () => {
        try {
            const dbInfo = getDatabaseProviderInfo();
            if (!dbInfo.isInitialized) {
                return;
            }
            const optionSets = await databaseHelpers.getRadioOptionSets();
            dispatch({ type: 'SET_RADIO_OPTION_SETS', payload: optionSets });
        } catch (error) {
            // Log to database
            await ErrorLoggingService.logError({
                severity: 'medium',
                errorMessage: 'Failed to load radio option sets data',
                stackTrace: error instanceof Error ? error.stack : String(error),
                componentName: 'SurveyDataContext',
                functionName: 'loadRadioOptionSets',
                userAction: 'Loading radio option sets data',
                additionalContext: {
                    databaseProviderInfo: getDatabaseProviderInfo()
                },
                tags: ['survey-data', 'context', 'radio-option-sets', 'data-loading']
            });
        }
    }, []);

    const loadMultiSelectOptionSets = useCallback(async () => {
        try {
            const dbInfo = getDatabaseProviderInfo();
            if (!dbInfo.isInitialized) {
                return;
            }
            const optionSets = await databaseHelpers.getMultiSelectOptionSets();
            dispatch({ type: 'SET_MULTI_SELECT_OPTION_SETS', payload: optionSets });
        } catch (error) {
            // Log to database
            await ErrorLoggingService.logError({
                severity: 'medium',
                errorMessage: 'Failed to load multi-select option sets data',
                stackTrace: error instanceof Error ? error.stack : String(error),
                componentName: 'SurveyDataContext',
                functionName: 'loadMultiSelectOptionSets',
                userAction: 'Loading multi-select option sets data',
                additionalContext: {
                    databaseProviderInfo: getDatabaseProviderInfo()
                },
                tags: ['survey-data', 'context', 'multi-select-option-sets', 'data-loading']
            });
        }
    }, []);

    const loadSelectOptionSets = useCallback(async () => {
        try {
            const dbInfo = getDatabaseProviderInfo();
            if (!dbInfo.isInitialized) {
                return;
            }
            const optionSets = await databaseHelpers.getSelectOptionSets();
            dispatch({ type: 'SET_SELECT_OPTION_SETS', payload: optionSets });
        } catch (error) {
            // Log to database
            await ErrorLoggingService.logError({
                severity: 'medium',
                errorMessage: 'Failed to load select option sets data',
                stackTrace: error instanceof Error ? error.stack : String(error),
                componentName: 'SurveyDataContext',
                functionName: 'loadSelectOptionSets',
                userAction: 'Loading select option sets data',
                additionalContext: {
                    databaseProviderInfo: getDatabaseProviderInfo()
                },
                tags: ['survey-data', 'context', 'select-option-sets', 'data-loading']
            });
        }
    }, []);

    const refreshAll = useCallback(async () => {
        // Check if database is initialized before proceeding
        const dbInfo = getDatabaseProviderInfo();
        if (!dbInfo.isInitialized) {
            return;
        }

        await Promise.all([
            loadFrameworkData(),
            loadRatingScales(),
            loadRadioOptionSets(),
            loadMultiSelectOptionSets(),
            loadSelectOptionSets(),
        ]);
    }, [loadFrameworkData, loadRatingScales, loadRadioOptionSets, loadMultiSelectOptionSets, loadSelectOptionSets]);

    // Manual validation of survey instance statuses based on date ranges
    const validateSurveyInstanceStatuses = useCallback(async () => {
        try {
            // Check if database is initialized
            const dbInfo = getDatabaseProviderInfo();
            if (!dbInfo.isInitialized) {
                return;
            }

            // Get current instances from state
            const instances = state.surveyInstances;
            if (instances.length === 0) {
                return;
            }

            // Update statuses based on date ranges
            const updatedInstances = await checkAndUpdateSurveyInstanceStatuses(instances);

            // Update state with any changes
            dispatch({ type: 'SET_SURVEY_INSTANCES', payload: updatedInstances });

        } catch (error) {
            // Log to database
            await ErrorLoggingService.logError({
                severity: 'medium',
                errorMessage: 'Failed during manual survey instance status validation',
                stackTrace: error instanceof Error ? error.stack : String(error),
                componentName: 'SurveyDataContext',
                functionName: 'validateSurveyInstanceStatuses',
                userAction: 'Manually validating survey instance statuses',
                additionalContext: {
                    instanceCount: state.surveyInstances.length,
                    databaseProviderInfo: getDatabaseProviderInfo(),
                    instances: state.surveyInstances.map(instance => ({
                        id: instance.id,
                        title: instance.title,
                        isActive: instance.isActive,
                        configValid: instance.config_valid,
                        activeDateRange: instance.activeDateRange
                    }))
                },
                tags: ['survey-data', 'context', 'status-validation', 'manual-validation']
            });
        }
    }, [state.surveyInstances]);

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

    const addRatingScale = useCallback(async (scale: RatingScale) => {
        try {
            await databaseHelpers.addRatingScale(scale);
            dispatch({ type: 'ADD_RATING_SCALE', payload: scale });
        } catch (error) {
            // Log to database
            await ErrorLoggingService.logError({
                severity: 'high',
                errorMessage: 'Failed to add rating scale to database',
                stackTrace: error instanceof Error ? error.stack : String(error),
                componentName: 'SurveyDataContext',
                functionName: 'addRatingScale',
                userAction: 'Adding new rating scale',
                additionalContext: {
                    ratingScale: {
                        id: scale.id,
                        name: scale.name,
                        description: scale.description,
                        optionsCount: scale.options?.length || 0,
                        isActive: scale.isActive
                    }
                },
                tags: ['survey-data', 'context', 'rating-scale', 'crud-create']
            });
            
            throw error;
        }
    }, []);

    const updateRatingScale = useCallback((scale: RatingScale) => {
        dispatch({ type: 'UPDATE_RATING_SCALE', payload: scale });
    }, []);

    const deleteRatingScale = useCallback((id: string) => {
        dispatch({ type: 'DELETE_RATING_SCALE', payload: id });
    }, []);

    const addRadioOptionSet = useCallback(async (optionSet: RadioOptionSet) => {
        try {
            await databaseHelpers.addRadioOptionSet(optionSet);
            dispatch({ type: 'ADD_RADIO_OPTION_SET', payload: optionSet });
        } catch (error) {
            // Log to database
            await ErrorLoggingService.logError({
                severity: 'high',
                errorMessage: 'Failed to add radio option set to database',
                stackTrace: error instanceof Error ? error.stack : String(error),
                componentName: 'SurveyDataContext',
                functionName: 'addRadioOptionSet',
                userAction: 'Adding new radio option set',
                additionalContext: {
                    radioOptionSet: {
                        id: optionSet.id,
                        name: optionSet.name,
                        optionsCount: optionSet.options?.length || 0
                    }
                },
                tags: ['survey-data', 'context', 'radio-option-set', 'crud-create']
            });
            
            throw error;
        }
    }, []);

    const updateRadioOptionSet = useCallback((optionSet: RadioOptionSet) => {
        dispatch({ type: 'UPDATE_RADIO_OPTION_SET', payload: optionSet });
    }, []);

    const deleteRadioOptionSet = useCallback((id: string) => {
        dispatch({ type: 'DELETE_RADIO_OPTION_SET', payload: id });
    }, []);

    const addMultiSelectOptionSet = useCallback(async (optionSet: MultiSelectOptionSet) => {
        try {
            await databaseHelpers.addMultiSelectOptionSet(optionSet);
            dispatch({ type: 'ADD_MULTI_SELECT_OPTION_SET', payload: optionSet });
        } catch (error) {
            // Log to database
            await ErrorLoggingService.logError({
                severity: 'high',
                errorMessage: 'Failed to add multi-select option set to database',
                stackTrace: error instanceof Error ? error.stack : String(error),
                componentName: 'SurveyDataContext',
                functionName: 'addMultiSelectOptionSet',
                userAction: 'Adding new multi-select option set',
                additionalContext: {
                    multiSelectOptionSet: {
                        id: optionSet.id,
                        name: optionSet.name,
                        optionsCount: optionSet.options?.length || 0
                    }
                },
                tags: ['survey-data', 'context', 'multi-select-option-set', 'crud-create']
            });
            
            throw error;
        }
    }, []);

    const updateMultiSelectOptionSet = useCallback((optionSet: MultiSelectOptionSet) => {
        dispatch({ type: 'UPDATE_MULTI_SELECT_OPTION_SET', payload: optionSet });
    }, []);

    const deleteMultiSelectOptionSet = useCallback((id: string) => {
        dispatch({ type: 'DELETE_MULTI_SELECT_OPTION_SET', payload: id });
    }, []);

    const addSelectOptionSet = useCallback(async (optionSet: SelectOptionSet) => {
        try {
            await databaseHelpers.addSelectOptionSet(optionSet);
            dispatch({ type: 'ADD_SELECT_OPTION_SET', payload: optionSet });
        } catch (error) {
            // Log to database
            await ErrorLoggingService.logError({
                severity: 'high',
                errorMessage: 'Failed to add select option set to database',
                stackTrace: error instanceof Error ? error.stack : String(error),
                componentName: 'SurveyDataContext',
                functionName: 'addSelectOptionSet',
                userAction: 'Adding new select option set',
                additionalContext: {
                    selectOptionSet: {
                        id: optionSet.id,
                        name: optionSet.name,
                        optionsCount: optionSet.options?.length || 0
                    }
                },
                tags: ['survey-data', 'context', 'select-option-set', 'crud-create']
            });
            
            throw error;
        }
    }, []);

    const updateSelectOptionSet = useCallback((optionSet: SelectOptionSet) => {
        dispatch({ type: 'UPDATE_SELECT_OPTION_SET', payload: optionSet });
    }, []);

    const deleteSelectOptionSet = useCallback((id: string) => {
        dispatch({ type: 'DELETE_SELECT_OPTION_SET', payload: id });
    }, []);

    // Auto-load data when authenticated and database is ready
    const hasLoadedRef = useRef(false);
    
    useEffect(() => {
        // Only auto-load when authenticated, not loading, and haven't loaded yet
        if (!autoLoad || authLoading || !isAuthenticated || hasLoadedRef.current) return;

        const dbInfo = getDatabaseProviderInfo();
        if (dbInfo.isInitialized) {
            hasLoadedRef.current = true;
            refreshAll();
        }
    }, [autoLoad, authLoading, isAuthenticated, refreshAll]);

    const value: SurveyDataContextType = {
        state,
        dispatch,
        loadFrameworkData,
        loadRatingScales,
        loadRadioOptionSets,
        loadMultiSelectOptionSets,
        loadSelectOptionSets,
        refreshAll,
        validateSurveyInstanceStatuses,
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
        addSelectOptionSet,
        updateSelectOptionSet,
        deleteSelectOptionSet,
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
