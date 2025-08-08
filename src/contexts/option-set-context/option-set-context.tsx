import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { RadioOptionSet, MultiSelectOptionSet, OptionSetOption } from '../../types/survey.types';

// State interface
interface OptionSetState {
  radioOptionSets: RadioOptionSet[];
  multiSelectOptionSets: MultiSelectOptionSet[];
  editingRadioOptionSet: RadioOptionSet | null;
  editingMultiSelectOptionSet: MultiSelectOptionSet | null;
  isCreating: boolean;
  isLoading: boolean;
}

// Action types
type OptionSetAction =
  | { type: 'SET_RADIO_OPTION_SETS'; payload: RadioOptionSet[] }
  | { type: 'SET_MULTI_SELECT_OPTION_SETS'; payload: MultiSelectOptionSet[] }
  | { type: 'SET_EDITING_RADIO_OPTION_SET'; payload: RadioOptionSet | null }
  | { type: 'SET_EDITING_MULTI_SELECT_OPTION_SET'; payload: MultiSelectOptionSet | null }
  | { type: 'SET_IS_CREATING'; payload: boolean }
  | { type: 'SET_IS_LOADING'; payload: boolean }
  | { type: 'UPDATE_RADIO_OPTION_SET'; payload: RadioOptionSet }
  | { type: 'UPDATE_MULTI_SELECT_OPTION_SET'; payload: MultiSelectOptionSet }
  | { type: 'ADD_RADIO_OPTION_SET'; payload: RadioOptionSet }
  | { type: 'ADD_MULTI_SELECT_OPTION_SET'; payload: MultiSelectOptionSet }
  | { type: 'DELETE_RADIO_OPTION_SET'; payload: string }
  | { type: 'DELETE_MULTI_SELECT_OPTION_SET'; payload: string }
  | { type: 'UPDATE_RADIO_OPTION_SET_OPTION'; payload: { optionSetId: string; optionIndex: number; updates: Partial<OptionSetOption> } }
  | { type: 'UPDATE_MULTI_SELECT_OPTION_SET_OPTION'; payload: { optionSetId: string; optionIndex: number; updates: Partial<OptionSetOption> } }
  | { type: 'RESET_EDITING_STATE' };

// Initial state
const initialState: OptionSetState = {
  radioOptionSets: [],
  multiSelectOptionSets: [],
  editingRadioOptionSet: null,
  editingMultiSelectOptionSet: null,
  isCreating: false,
  isLoading: false,
};

// Reducer
function optionSetReducer(state: OptionSetState, action: OptionSetAction): OptionSetState {
  switch (action.type) {
    case 'SET_RADIO_OPTION_SETS':
      return { ...state, radioOptionSets: action.payload };
    
    case 'SET_MULTI_SELECT_OPTION_SETS':
      return { ...state, multiSelectOptionSets: action.payload };
    
    case 'SET_EDITING_RADIO_OPTION_SET':
      return { ...state, editingRadioOptionSet: action.payload };
    
    case 'SET_EDITING_MULTI_SELECT_OPTION_SET':
      return { ...state, editingMultiSelectOptionSet: action.payload };
    
    case 'SET_IS_CREATING':
      return { ...state, isCreating: action.payload };
    
    case 'SET_IS_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'UPDATE_RADIO_OPTION_SET':
      return {
        ...state,
        radioOptionSets: state.radioOptionSets.map(set => 
          set.id === action.payload.id ? action.payload : set
        ),
        editingRadioOptionSet: state.editingRadioOptionSet?.id === action.payload.id 
          ? action.payload 
          : state.editingRadioOptionSet
      };
    
    case 'UPDATE_MULTI_SELECT_OPTION_SET':
      return {
        ...state,
        multiSelectOptionSets: state.multiSelectOptionSets.map(set => 
          set.id === action.payload.id ? action.payload : set
        ),
        editingMultiSelectOptionSet: state.editingMultiSelectOptionSet?.id === action.payload.id 
          ? action.payload 
          : state.editingMultiSelectOptionSet
      };
    
    case 'ADD_RADIO_OPTION_SET':
      return {
        ...state,
        radioOptionSets: [...state.radioOptionSets, action.payload]
      };
    
    case 'ADD_MULTI_SELECT_OPTION_SET':
      return {
        ...state,
        multiSelectOptionSets: [...state.multiSelectOptionSets, action.payload]
      };
    
    case 'DELETE_RADIO_OPTION_SET':
      return {
        ...state,
        radioOptionSets: state.radioOptionSets.filter(set => set.id !== action.payload),
        editingRadioOptionSet: state.editingRadioOptionSet?.id === action.payload 
          ? null 
          : state.editingRadioOptionSet
      };
    
    case 'DELETE_MULTI_SELECT_OPTION_SET':
      return {
        ...state,
        multiSelectOptionSets: state.multiSelectOptionSets.filter(set => set.id !== action.payload),
        editingMultiSelectOptionSet: state.editingMultiSelectOptionSet?.id === action.payload 
          ? null 
          : state.editingMultiSelectOptionSet
      };
    
    case 'UPDATE_RADIO_OPTION_SET_OPTION':
      return {
        ...state,
        editingRadioOptionSet: state.editingRadioOptionSet?.id === action.payload.optionSetId
          ? {
              ...state.editingRadioOptionSet,
              options: state.editingRadioOptionSet.options.map((opt, index) =>
                index === action.payload.optionIndex
                  ? { ...opt, ...action.payload.updates }
                  : opt
              )
            }
          : state.editingRadioOptionSet
      };
    
    case 'UPDATE_MULTI_SELECT_OPTION_SET_OPTION':
      return {
        ...state,
        editingMultiSelectOptionSet: state.editingMultiSelectOptionSet?.id === action.payload.optionSetId
          ? {
              ...state.editingMultiSelectOptionSet,
              options: state.editingMultiSelectOptionSet.options.map((opt, index) =>
                index === action.payload.optionIndex
                  ? { ...opt, ...action.payload.updates }
                  : opt
              )
            }
          : state.editingMultiSelectOptionSet
      };
    
    case 'RESET_EDITING_STATE':
      return {
        ...state,
        editingRadioOptionSet: null,
        editingMultiSelectOptionSet: null,
        isCreating: false
      };
    
    default:
      return state;
  }
}

// Context
interface OptionSetContextType {
  state: OptionSetState;
  dispatch: React.Dispatch<OptionSetAction>;
  // Convenience methods
  setEditingRadioOptionSet: (optionSet: RadioOptionSet | null) => void;
  setEditingMultiSelectOptionSet: (optionSet: MultiSelectOptionSet | null) => void;
  setIsCreating: (isCreating: boolean) => void;
  resetEditingState: () => void;
  updateRadioOptionSetOption: (optionSetId: string, optionIndex: number, updates: Partial<OptionSetOption>) => void;
  updateMultiSelectOptionSetOption: (optionSetId: string, optionIndex: number, updates: Partial<OptionSetOption>) => void;
}

const OptionSetContext = createContext<OptionSetContextType | undefined>(undefined);

// Provider component
interface OptionSetProviderProps {
  children: ReactNode;
}

export const OptionSetProvider: React.FC<OptionSetProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(optionSetReducer, initialState);

  const setEditingRadioOptionSet = (optionSet: RadioOptionSet | null) => {
    dispatch({ type: 'SET_EDITING_RADIO_OPTION_SET', payload: optionSet });
  };

  const setEditingMultiSelectOptionSet = (optionSet: MultiSelectOptionSet | null) => {
    dispatch({ type: 'SET_EDITING_MULTI_SELECT_OPTION_SET', payload: optionSet });
  };

  const setIsCreating = (isCreating: boolean) => {
    dispatch({ type: 'SET_IS_CREATING', payload: isCreating });
  };

  const resetEditingState = () => {
    dispatch({ type: 'RESET_EDITING_STATE' });
  };

  const updateRadioOptionSetOption = (optionSetId: string, optionIndex: number, updates: Partial<OptionSetOption>) => {
    dispatch({ 
      type: 'UPDATE_RADIO_OPTION_SET_OPTION', 
      payload: { optionSetId, optionIndex, updates } 
    });
  };

  const updateMultiSelectOptionSetOption = (optionSetId: string, optionIndex: number, updates: Partial<OptionSetOption>) => {
    dispatch({ 
      type: 'UPDATE_MULTI_SELECT_OPTION_SET_OPTION', 
      payload: { optionSetId, optionIndex, updates } 
    });
  };

  const value: OptionSetContextType = {
    state,
    dispatch,
    setEditingRadioOptionSet,
    setEditingMultiSelectOptionSet,
    setIsCreating,
    resetEditingState,
    updateRadioOptionSetOption,
    updateMultiSelectOptionSetOption,
  };

  return (
    <OptionSetContext.Provider value={value}>
      {children}
    </OptionSetContext.Provider>
  );
};

// Hook to use the context
export const useOptionSet = (): OptionSetContextType => {
  const context = useContext(OptionSetContext);
  if (context === undefined) {
    throw new Error('useOptionSet must be used within an OptionSetProvider');
  }
  return context;
};
