import React, { createContext, ReactNode, useCallback, useContext, useReducer } from 'react';
import { RatingScale, RatingScaleOption } from '../../types/survey.types';

// State interface
interface RatingScaleState {
    ratingScales: RatingScale[];
    editingScale: RatingScale | null;
    isCreating: boolean;
    isLoading: boolean;
    error: string | null;
}

// Action types
type RatingScaleAction =
    | { type: 'SET_RATING_SCALES'; payload: RatingScale[] }
    | { type: 'SET_EDITING_SCALE'; payload: RatingScale | null }
    | { type: 'SET_IS_CREATING'; payload: boolean }
    | { type: 'SET_IS_LOADING'; payload: boolean }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'ADD_RATING_SCALE'; payload: RatingScale }
    | { type: 'UPDATE_RATING_SCALE'; payload: RatingScale }
    | { type: 'DELETE_RATING_SCALE'; payload: string }
    | { type: 'UPDATE_SCALE_OPTION'; payload: { scaleId: string; optionIndex: number; updates: Partial<RatingScaleOption> } }
    | { type: 'RESET_EDITING_STATE' };

// Initial state
const initialState: RatingScaleState = {
    ratingScales: [],
    editingScale: null,
    isCreating: false,
    isLoading: false,
    error: null,
};

// Reducer
function ratingScaleReducer(state: RatingScaleState, action: RatingScaleAction): RatingScaleState {
    switch (action.type) {
        case 'SET_RATING_SCALES':
            return { ...state, ratingScales: action.payload };

        case 'SET_EDITING_SCALE':
            return { ...state, editingScale: action.payload };

        case 'SET_IS_CREATING':
            return { ...state, isCreating: action.payload };

        case 'SET_IS_LOADING':
            return { ...state, isLoading: action.payload };

        case 'SET_ERROR':
            return { ...state, error: action.payload };

        case 'ADD_RATING_SCALE':
            return { ...state, ratingScales: [...state.ratingScales, action.payload] };

        case 'UPDATE_RATING_SCALE':
            return {
                ...state,
                ratingScales: state.ratingScales.map(scale =>
                    scale.id === action.payload.id ? action.payload : scale
                ),
                editingScale: state.editingScale?.id === action.payload.id
                    ? action.payload
                    : state.editingScale
            };

        case 'DELETE_RATING_SCALE':
            return {
                ...state,
                ratingScales: state.ratingScales.filter(scale => scale.id !== action.payload),
                editingScale: state.editingScale?.id === action.payload
                    ? null
                    : state.editingScale
            };

        case 'UPDATE_SCALE_OPTION':
            return {
                ...state,
                editingScale: state.editingScale?.id === action.payload.scaleId
                    ? {
                        ...state.editingScale,
                        options: state.editingScale.options.map((opt, index) =>
                            index === action.payload.optionIndex
                                ? { ...opt, ...action.payload.updates }
                                : opt
                        )
                    }
                    : state.editingScale
            };

        case 'RESET_EDITING_STATE':
            return {
                ...state,
                editingScale: null,
                isCreating: false
            };

        default:
            return state;
    }
}

// Context
interface RatingScaleContextType {
    state: RatingScaleState;
    dispatch: React.Dispatch<RatingScaleAction>;
    // Convenience methods
    setRatingScales: (scales: RatingScale[]) => void;
    setEditingScale: (scale: RatingScale | null) => void;
    setIsCreating: (isCreating: boolean) => void;
    setIsLoading: (isLoading: boolean) => void;
    setError: (error: string | null) => void;
    addRatingScale: (scale: RatingScale) => void;
    updateRatingScale: (scale: RatingScale) => void;
    deleteRatingScale: (id: string) => void;
    updateScaleOption: (scaleId: string, optionIndex: number, updates: Partial<RatingScaleOption>) => void;
    resetEditingState: () => void;
}

const RatingScaleContext = createContext<RatingScaleContextType | undefined>(undefined);

// Provider component
interface RatingScaleProviderProps {
    children: ReactNode;
}

export const RatingScaleProvider: React.FC<RatingScaleProviderProps> = ({ children }) => {
    const [state, dispatch] = useReducer(ratingScaleReducer, initialState);

    const setRatingScales = useCallback((scales: RatingScale[]) => {
        dispatch({ type: 'SET_RATING_SCALES', payload: scales });
    }, []);

    const setEditingScale = useCallback((scale: RatingScale | null) => {
        dispatch({ type: 'SET_EDITING_SCALE', payload: scale });
    }, []);

    const setIsCreating = useCallback((isCreating: boolean) => {
        dispatch({ type: 'SET_IS_CREATING', payload: isCreating });
    }, []);

    const setIsLoading = useCallback((isLoading: boolean) => {
        dispatch({ type: 'SET_IS_LOADING', payload: isLoading });
    }, []);

    const setError = useCallback((error: string | null) => {
        dispatch({ type: 'SET_ERROR', payload: error });
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

    const updateScaleOption = useCallback((scaleId: string, optionIndex: number, updates: Partial<RatingScaleOption>) => {
        dispatch({
            type: 'UPDATE_SCALE_OPTION',
            payload: { scaleId, optionIndex, updates }
        });
    }, []);

    const resetEditingState = useCallback(() => {
        dispatch({ type: 'RESET_EDITING_STATE' });
    }, []);

    const value: RatingScaleContextType = {
        state,
        dispatch,
        setRatingScales,
        setEditingScale,
        setIsCreating,
        setIsLoading,
        setError,
        addRatingScale,
        updateRatingScale,
        deleteRatingScale,
        updateScaleOption,
        resetEditingState,
    };

    return (
        <RatingScaleContext.Provider value={value}>
            {children}
        </RatingScaleContext.Provider>
    );
};

// Hook to use the context
export const useRatingScale = (): RatingScaleContextType => {
    const context = useContext(RatingScaleContext);
    if (context === undefined) {
        throw new Error('useRatingScale must be used within a RatingScaleProvider');
    }
    return context;
};
