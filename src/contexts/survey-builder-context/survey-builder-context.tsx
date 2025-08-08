import React, { createContext, ReactNode, useContext, useReducer } from 'react';
import { SurveyConfig, SurveyField, SurveySection } from '../../types/survey.types';

interface SurveyBuilderState {
    config: SurveyConfig;
    selectedSection: string | null;
    selectedField: string | null;
    isPreviewMode: boolean;
    loading: boolean;
    showRatingScaleManager: boolean;
    showMultiSelectEditor: boolean;
    showFieldEditorModal: boolean;
    showRadioOptionSetManager: boolean;
    showMultiSelectOptionSetManager: boolean;
}

type SurveyBuilderAction =
    | { type: 'SET_CONFIG'; payload: SurveyConfig }
    | { type: 'UPDATE_CONFIG'; payload: Partial<SurveyConfig> }
    | { type: 'SELECT_SECTION'; payload: string | null }
    | { type: 'SELECT_FIELD'; payload: string | null }
    | { type: 'TOGGLE_PREVIEW_MODE' }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SHOW_RATING_SCALE_MANAGER'; payload: boolean }
    | { type: 'SHOW_MULTI_SELECT_EDITOR'; payload: boolean }
    | { type: 'SHOW_FIELD_EDITOR_MODAL'; payload: boolean }
    | { type: 'SHOW_RADIO_OPTION_SET_MANAGER'; payload: boolean }
    | { type: 'SHOW_MULTI_SELECT_OPTION_SET_MANAGER'; payload: boolean }
    | { type: 'ADD_SECTION'; payload: SurveySection }
    | { type: 'UPDATE_SECTION'; payload: { sectionId: string; updates: Partial<SurveySection> } }
    | { type: 'DELETE_SECTION'; payload: string }
    | { type: 'REORDER_SECTIONS'; payload: { fromIndex: number; toIndex: number } }
    | { type: 'ADD_FIELD'; payload: { sectionId: string; field: SurveyField } }
    | { type: 'UPDATE_FIELD'; payload: { sectionId: string; fieldId: string; updates: Partial<SurveyField> } }
    | { type: 'DELETE_FIELD'; payload: { sectionId: string; fieldId: string } }
    | { type: 'REORDER_FIELDS'; payload: { sectionId: string; fromIndex: number; toIndex: number } }
    | { type: 'ADD_FIELD_OPTION'; payload: { sectionId: string; fieldId: string; option: { label: string; value: string } } }
    | { type: 'UPDATE_FIELD_OPTION'; payload: { sectionId: string; fieldId: string; optionIndex: number; updates: { label?: string; value?: string } } }
    | { type: 'DELETE_FIELD_OPTION'; payload: { sectionId: string; fieldId: string; optionIndex: number } };

const initialState: SurveyBuilderState = {
    config: {
        id: '',
        title: '',
        description: '',
        sections: [],
        createdAt: new Date(),
        updatedAt: new Date()
    },
    selectedSection: null,
    selectedField: null,
    isPreviewMode: false,
    loading: false,
    showRatingScaleManager: false,
    showMultiSelectEditor: false,
    showFieldEditorModal: false,
    showRadioOptionSetManager: false,
    showMultiSelectOptionSetManager: false
};

function surveyBuilderReducer(state: SurveyBuilderState, action: SurveyBuilderAction): SurveyBuilderState {
    switch (action.type) {
        case 'SET_CONFIG':
            return { ...state, config: action.payload };

        case 'UPDATE_CONFIG':
            return {
                ...state,
                config: { ...state.config, ...action.payload, updatedAt: new Date() }
            };

        case 'SELECT_SECTION':
            return { ...state, selectedSection: action.payload, selectedField: null };

        case 'SELECT_FIELD':
            return { ...state, selectedField: action.payload };

        case 'TOGGLE_PREVIEW_MODE':
            return { ...state, isPreviewMode: !state.isPreviewMode };

        case 'SET_LOADING':
            return { ...state, loading: action.payload };

        case 'SHOW_RATING_SCALE_MANAGER':
            return { ...state, showRatingScaleManager: action.payload };

        case 'SHOW_MULTI_SELECT_EDITOR':
            return { ...state, showMultiSelectEditor: action.payload };

        case 'SHOW_FIELD_EDITOR_MODAL':
            return { ...state, showFieldEditorModal: action.payload };

        case 'SHOW_RADIO_OPTION_SET_MANAGER':
            return { ...state, showRadioOptionSetManager: action.payload };

        case 'SHOW_MULTI_SELECT_OPTION_SET_MANAGER':
            return { ...state, showMultiSelectOptionSetManager: action.payload };

        case 'ADD_SECTION':
            return {
                ...state,
                config: {
                    ...state.config,
                    sections: [...state.config.sections, action.payload],
                    updatedAt: new Date()
                }
            };

        case 'UPDATE_SECTION':
            return {
                ...state,
                config: {
                    ...state.config,
                    sections: state.config.sections.map(section =>
                        section.id === action.payload.sectionId
                            ? { ...section, ...action.payload.updates }
                            : section
                    ),
                    updatedAt: new Date()
                }
            };

        case 'DELETE_SECTION':
            return {
                ...state,
                config: {
                    ...state.config,
                    sections: state.config.sections.filter(section => section.id !== action.payload),
                    updatedAt: new Date()
                },
                selectedSection: state.selectedSection === action.payload ? null : state.selectedSection,
                selectedField: state.selectedField === action.payload ? null : state.selectedField
            };

        case 'REORDER_SECTIONS':
            const newSections = [...state.config.sections];
            const [movedSection] = newSections.splice(action.payload.fromIndex, 1);
            newSections.splice(action.payload.toIndex, 0, movedSection);
            return {
                ...state,
                config: {
                    ...state.config,
                    sections: newSections,
                    updatedAt: new Date()
                }
            };

        case 'ADD_FIELD':
            return {
                ...state,
                config: {
                    ...state.config,
                    sections: state.config.sections.map(section =>
                        section.id === action.payload.sectionId
                            ? { ...section, fields: [...section.fields, action.payload.field] }
                            : section
                    ),
                    updatedAt: new Date()
                }
            };

        case 'UPDATE_FIELD':
            return {
                ...state,
                config: {
                    ...state.config,
                    sections: state.config.sections.map(section =>
                        section.id === action.payload.sectionId
                            ? {
                                ...section,
                                fields: section.fields.map(field =>
                                    field.id === action.payload.fieldId
                                        ? { ...field, ...action.payload.updates }
                                        : field
                                )
                            }
                            : section
                    ),
                    updatedAt: new Date()
                }
            };

        case 'DELETE_FIELD':
            return {
                ...state,
                config: {
                    ...state.config,
                    sections: state.config.sections.map(section =>
                        section.id === action.payload.sectionId
                            ? {
                                ...section,
                                fields: section.fields.filter(field => field.id !== action.payload.fieldId)
                            }
                            : section
                    ),
                    updatedAt: new Date()
                },
                selectedField: state.selectedField === action.payload.fieldId ? null : state.selectedField
            };

        case 'REORDER_FIELDS':
            return {
                ...state,
                config: {
                    ...state.config,
                    sections: state.config.sections.map(section =>
                        section.id === action.payload.sectionId
                            ? {
                                ...section,
                                fields: (() => {
                                    const newFields = [...section.fields];
                                    const [movedField] = newFields.splice(action.payload.fromIndex, 1);
                                    newFields.splice(action.payload.toIndex, 0, movedField);
                                    return newFields;
                                })()
                            }
                            : section
                    ),
                    updatedAt: new Date()
                }
            };

        case 'ADD_FIELD_OPTION':
            return {
                ...state,
                config: {
                    ...state.config,
                    sections: state.config.sections.map(section =>
                        section.id === action.payload.sectionId
                            ? {
                                ...section,
                                fields: section.fields.map(field =>
                                    field.id === action.payload.fieldId
                                        ? { ...field, options: [...(field.options || []), action.payload.option] }
                                        : field
                                )
                            }
                            : section
                    ),
                    updatedAt: new Date()
                }
            };

        case 'UPDATE_FIELD_OPTION':
            return {
                ...state,
                config: {
                    ...state.config,
                    sections: state.config.sections.map(section =>
                        section.id === action.payload.sectionId
                            ? {
                                ...section,
                                fields: section.fields.map(field =>
                                    field.id === action.payload.fieldId
                                        ? {
                                            ...field,
                                            options: field.options?.map((option, index) =>
                                                index === action.payload.optionIndex
                                                    ? { ...option, ...action.payload.updates }
                                                    : option
                                            ) || []
                                        }
                                        : field
                                )
                            }
                            : section
                    ),
                    updatedAt: new Date()
                }
            };

        case 'DELETE_FIELD_OPTION':
            return {
                ...state,
                config: {
                    ...state.config,
                    sections: state.config.sections.map(section =>
                        section.id === action.payload.sectionId
                            ? {
                                ...section,
                                fields: section.fields.map(field =>
                                    field.id === action.payload.fieldId
                                        ? {
                                            ...field,
                                            options: field.options?.filter((_, index) => index !== action.payload.optionIndex) || []
                                        }
                                        : field
                                )
                            }
                            : section
                    ),
                    updatedAt: new Date()
                }
            };

        default:
            return state;
    }
}

interface SurveyBuilderContextType {
    state: SurveyBuilderState;
    dispatch: React.Dispatch<SurveyBuilderAction>;
    // Convenience methods
    setConfig: (config: SurveyConfig) => void;
    updateConfig: (updates: Partial<SurveyConfig>) => void;
    selectSection: (sectionId: string | null) => void;
    selectField: (fieldId: string | null) => void;
    togglePreviewMode: () => void;
    setLoading: (loading: boolean) => void;
    showRatingScaleManager: (show: boolean) => void;
    showMultiSelectEditor: (show: boolean) => void;
    showFieldEditorModal: (show: boolean) => void;
    showRadioOptionSetManager: (show: boolean) => void;
    showMultiSelectOptionSetManager: (show: boolean) => void;
    addSection: (section: SurveySection) => void;
    updateSection: (sectionId: string, updates: Partial<SurveySection>) => void;
    deleteSection: (sectionId: string) => void;
    reorderSections: (fromIndex: number, toIndex: number) => void;
    addField: (sectionId: string, field: SurveyField) => void;
    updateField: (sectionId: string, fieldId: string, updates: Partial<SurveyField>) => void;
    deleteField: (sectionId: string, fieldId: string) => void;
    reorderFields: (sectionId: string, fromIndex: number, toIndex: number) => void;
    addFieldOption: (sectionId: string, fieldId: string, option: { label: string; value: string }) => void;
    updateFieldOption: (sectionId: string, fieldId: string, optionIndex: number, updates: { label?: string; value?: string }) => void;
    deleteFieldOption: (sectionId: string, fieldId: string, optionIndex: number) => void;
    updateEntireConfig: (config: SurveyConfig) => void;
}

const SurveyBuilderContext = createContext<SurveyBuilderContextType | undefined>(undefined);

export function SurveyBuilderProvider({ children, initialConfig }: { children: ReactNode; initialConfig?: SurveyConfig }) {
    const [state, dispatch] = useReducer(surveyBuilderReducer, {
        ...initialState,
        config: initialConfig || initialState.config
    });

    const setConfig = (config: SurveyConfig) => {
        dispatch({ type: 'SET_CONFIG', payload: config });
    };

    const updateConfig = (updates: Partial<SurveyConfig>) => {
        dispatch({ type: 'UPDATE_CONFIG', payload: updates });
    };

    const selectSection = (sectionId: string | null) => {
        dispatch({ type: 'SELECT_SECTION', payload: sectionId });
    };

    const selectField = (fieldId: string | null) => {
        dispatch({ type: 'SELECT_FIELD', payload: fieldId });
    };

    const togglePreviewMode = () => {
        dispatch({ type: 'TOGGLE_PREVIEW_MODE' });
    };

    const setLoading = (loading: boolean) => {
        dispatch({ type: 'SET_LOADING', payload: loading });
    };

    const showRatingScaleManager = (show: boolean) => {
        dispatch({ type: 'SHOW_RATING_SCALE_MANAGER', payload: show });
    };

    const showMultiSelectEditor = (show: boolean) => {
        dispatch({ type: 'SHOW_MULTI_SELECT_EDITOR', payload: show });
    };

    const showFieldEditorModal = (show: boolean) => {
        dispatch({ type: 'SHOW_FIELD_EDITOR_MODAL', payload: show });
    };

    const showRadioOptionSetManager = (show: boolean) => {
        dispatch({ type: 'SHOW_RADIO_OPTION_SET_MANAGER', payload: show });
    };

    const showMultiSelectOptionSetManager = (show: boolean) => {
        dispatch({ type: 'SHOW_MULTI_SELECT_OPTION_SET_MANAGER', payload: show });
    };

    const addSection = (section: SurveySection) => {
        dispatch({ type: 'ADD_SECTION', payload: section });
    };

    const updateSection = (sectionId: string, updates: Partial<SurveySection>) => {
        dispatch({ type: 'UPDATE_SECTION', payload: { sectionId, updates } });
    };

    const deleteSection = (sectionId: string) => {
        dispatch({ type: 'DELETE_SECTION', payload: sectionId });
    };

    const reorderSections = (fromIndex: number, toIndex: number) => {
        dispatch({ type: 'REORDER_SECTIONS', payload: { fromIndex, toIndex } });
    };

    const addField = (sectionId: string, field: SurveyField) => {
        dispatch({ type: 'ADD_FIELD', payload: { sectionId, field } });
    };

    const updateField = (sectionId: string, fieldId: string, updates: Partial<SurveyField>) => {
        dispatch({ type: 'UPDATE_FIELD', payload: { sectionId, fieldId, updates } });
    };

    const deleteField = (sectionId: string, fieldId: string) => {
        dispatch({ type: 'DELETE_FIELD', payload: { sectionId, fieldId } });
    };

    const reorderFields = (sectionId: string, fromIndex: number, toIndex: number) => {
        dispatch({ type: 'REORDER_FIELDS', payload: { sectionId, fromIndex, toIndex } });
    };

    const addFieldOption = (sectionId: string, fieldId: string, option: { label: string; value: string }) => {
        dispatch({ type: 'ADD_FIELD_OPTION', payload: { sectionId, fieldId, option } });
    };

    const updateFieldOption = (sectionId: string, fieldId: string, optionIndex: number, updates: { label?: string; value?: string }) => {
        dispatch({ type: 'UPDATE_FIELD_OPTION', payload: { sectionId, fieldId, optionIndex, updates } });
    };

    const deleteFieldOption = (sectionId: string, fieldId: string, optionIndex: number) => {
        dispatch({ type: 'DELETE_FIELD_OPTION', payload: { sectionId, fieldId, optionIndex } });
    };

    const updateEntireConfig = (newConfig: SurveyConfig) => {
        dispatch({ type: 'SET_CONFIG', payload: newConfig });
    };

    const value: SurveyBuilderContextType = {
        state,
        dispatch,
        setConfig,
        updateConfig,
        selectSection,
        selectField,
        togglePreviewMode,
        setLoading,
        showRatingScaleManager,
        showMultiSelectEditor,
        showFieldEditorModal,
        showRadioOptionSetManager,
        showMultiSelectOptionSetManager,
        addSection,
        updateSection,
        deleteSection,
        reorderSections,
        addField,
        updateField,
        deleteField,
        reorderFields,
        addFieldOption,
        updateFieldOption,
        deleteFieldOption,
        updateEntireConfig
    };

    return (
        <SurveyBuilderContext.Provider value={value}>
            {children}
        </SurveyBuilderContext.Provider>
    );
}

export function useSurveyBuilder() {
    const context = useContext(SurveyBuilderContext);
    if (context === undefined) {
        throw new Error('useSurveyBuilder must be used within a SurveyBuilderProvider');
    }
    return context;
}
