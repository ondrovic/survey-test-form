import React, { createContext, ReactNode, useContext, useReducer } from 'react';
import { SurveyConfig, SurveySection, SurveyField, SurveySubsection } from '../../types/framework.types';
import { createMetadataSync, updateMetadata } from '../../utils/metadata.utils';
import { ensureContentArray, addContentItem, removeContentItem, reorderContent } from '../../utils/section-content.utils';

interface SurveyBuilderState {
    config: SurveyConfig;
    selectedSection: string | null;
    selectedSubsection: string | null;
    selectedField: string | null;
    isPreviewMode: boolean;
    loading: boolean;
    showRatingScaleManager: boolean;
    showMultiSelectEditor: boolean;
    showFieldEditorModal: boolean;
    showRadioOptionSetManager: boolean;
    showMultiSelectOptionSetManager: boolean;
    showSelectOptionSetManager: boolean;
}

type SurveyBuilderAction =
    | { type: 'SET_CONFIG'; payload: SurveyConfig }
    | { type: 'UPDATE_CONFIG'; payload: Partial<SurveyConfig> }
    | { type: 'SELECT_SECTION'; payload: string | null }
    | { type: 'SELECT_SUBSECTION'; payload: string | null }
    | { type: 'SELECT_FIELD'; payload: string | null }
    | { type: 'TOGGLE_PREVIEW_MODE' }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SHOW_RATING_SCALE_MANAGER'; payload: boolean }
    | { type: 'SHOW_MULTI_SELECT_EDITOR'; payload: boolean }
    | { type: 'SHOW_FIELD_EDITOR_MODAL'; payload: boolean }
    | { type: 'SHOW_RADIO_OPTION_SET_MANAGER'; payload: boolean }
    | { type: 'SHOW_MULTI_SELECT_OPTION_SET_MANAGER'; payload: boolean }
    | { type: 'SHOW_SELECT_OPTION_SET_MANAGER'; payload: boolean }
    | { type: 'ADD_SECTION'; payload: SurveySection }
    | { type: 'UPDATE_SECTION'; payload: { sectionId: string; updates: Partial<SurveySection> } }
    | { type: 'DELETE_SECTION'; payload: string }
    | { type: 'REORDER_SECTIONS'; payload: { fromIndex: number; toIndex: number } }
    | { type: 'ADD_SUBSECTION'; payload: { sectionId: string; subsection: SurveySubsection } }
    | { type: 'UPDATE_SUBSECTION'; payload: { sectionId: string; subsectionId: string; updates: Partial<SurveySubsection> } }
    | { type: 'DELETE_SUBSECTION'; payload: { sectionId: string; subsectionId: string } }
    | { type: 'REORDER_SUBSECTIONS'; payload: { sectionId: string; fromIndex: number; toIndex: number } }
    | { type: 'ADD_FIELD'; payload: { sectionId: string; subsectionId?: string; field: SurveyField } }
    | { type: 'UPDATE_FIELD'; payload: { sectionId: string; subsectionId?: string; fieldId: string; updates: Partial<SurveyField> } }
    | { type: 'DELETE_FIELD'; payload: { sectionId: string; subsectionId?: string; fieldId: string } }
    | { type: 'REORDER_FIELDS'; payload: { sectionId: string; subsectionId?: string; fromIndex: number; toIndex: number } }
    | { type: 'ADD_FIELD_OPTION'; payload: { sectionId: string; subsectionId?: string; fieldId: string; option: { label: string; value: string; color?: string } } }
    | { type: 'UPDATE_FIELD_OPTION'; payload: { sectionId: string; subsectionId?: string; fieldId: string; optionIndex: number; updates: { label?: string; value?: string; color?: string } } }
    | { type: 'DELETE_FIELD_OPTION'; payload: { sectionId: string; subsectionId?: string; fieldId: string; optionIndex: number } }
    | { type: 'REORDER_SECTION_CONTENT'; payload: { sectionId: string; fromIndex: number; toIndex: number } };

const initialState: SurveyBuilderState = {
    config: {
        id: '',
        title: '',
        description: '',
        sections: [],
        isActive: true,
        version: '1.0.0',
        metadata: createMetadataSync()
    },
    selectedSection: null,
    selectedSubsection: null,
    selectedField: null,
    isPreviewMode: false,
    loading: false,
    showRatingScaleManager: false,
    showMultiSelectEditor: false,
    showFieldEditorModal: false,
    showRadioOptionSetManager: false,
    showMultiSelectOptionSetManager: false,
    showSelectOptionSetManager: false
};

function surveyBuilderReducer(state: SurveyBuilderState, action: SurveyBuilderAction): SurveyBuilderState {
    switch (action.type) {
        case 'SET_CONFIG': {
            // Ensure subsections array exists for backward compatibility and add content arrays
            const configWithSubsections = {
                ...action.payload,
                sections: action.payload.sections.map(section => ensureContentArray({
                    ...section,
                    subsections: section.subsections || []
                }))
            };
            return { ...state, config: configWithSubsections };
        }

        case 'UPDATE_CONFIG':
            return {
                ...state,
                config: {
                    ...state.config,
                    ...action.payload,
                    metadata: updateMetadata(state.config.metadata)
                }
            };

        case 'SELECT_SECTION':
            return { ...state, selectedSection: action.payload, selectedSubsection: null, selectedField: null };

        case 'SELECT_SUBSECTION':
            return { ...state, selectedSubsection: action.payload, selectedField: null };

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

        case 'SHOW_SELECT_OPTION_SET_MANAGER':
            return { ...state, showSelectOptionSetManager: action.payload };

        case 'ADD_SECTION':
            return {
                ...state,
                config: {
                    ...state.config,
                    sections: [...state.config.sections, ensureContentArray({ ...action.payload, subsections: action.payload.subsections || [] })],
                    metadata: updateMetadata(state.config.metadata)
                }
            };

        case 'UPDATE_SECTION': {
            const updatedConfig = {
                ...state.config,
                sections: state.config.sections.map(section =>
                    section.id === action.payload.sectionId
                        ? { ...section, ...action.payload.updates }
                        : section
                ),
                metadata: updateMetadata(state.config.metadata)
            };

            // Handle section ID changes - update selectedSection if needed
            let newSelectedSection = state.selectedSection;
            if (action.payload.updates.id && state.selectedSection === action.payload.sectionId) {
                newSelectedSection = action.payload.updates.id;
            }

            return {
                ...state,
                config: updatedConfig,
                selectedSection: newSelectedSection
            };
        }

        case 'DELETE_SECTION': {
            return {
                ...state,
                config: {
                    ...state.config,
                    sections: state.config.sections.filter(section => section.id !== action.payload),
                    metadata: updateMetadata(state.config.metadata)
                },
                selectedSection: state.selectedSection === action.payload ? null : state.selectedSection,
                selectedField: state.selectedField === action.payload ? null : state.selectedField
            };
        }

        case 'REORDER_SECTIONS': {
            const newSections = [...state.config.sections];
            const [movedSection] = newSections.splice(action.payload.fromIndex, 1);
            newSections.splice(action.payload.toIndex, 0, movedSection);
            return {
                ...state,
                config: {
                    ...state.config,
                    sections: newSections,
                    metadata: updateMetadata(state.config.metadata)
                }
            };
        }

        case 'ADD_SUBSECTION': {
            return {
                ...state,
                config: {
                    ...state.config,
                    sections: state.config.sections.map(section => {
                        if (section.id === action.payload.sectionId) {
                            const updatedSection = { 
                                ...section, 
                                subsections: [...(section.subsections || []), action.payload.subsection] 
                            };
                            // Ensure content array exists before adding to it
                            const sectionWithContent = ensureContentArray(section);
                            const newContentItem = addContentItem(section, 'subsection', action.payload.subsection.id);
                            return {
                                ...updatedSection,
                                content: [...(sectionWithContent.content || []), newContentItem]
                            };
                        }
                        return section;
                    }),
                    metadata: updateMetadata(state.config.metadata)
                }
            };
        }
        case 'UPDATE_SUBSECTION':
            return {
                ...state,
                config: {
                    ...state.config,
                    sections: state.config.sections.map(section =>
                        section.id === action.payload.sectionId
                            ? {
                                ...section,
                                subsections: (section.subsections || []).map(subsection =>
                                    subsection.id === action.payload.subsectionId
                                        ? { ...subsection, ...action.payload.updates }
                                        : subsection
                                )
                            }
                            : section
                    ),
                    metadata: updateMetadata(state.config.metadata)
                }
            };

        case 'DELETE_SUBSECTION':
            return {
                ...state,
                config: {
                    ...state.config,
                    sections: state.config.sections.map(section => {
                        if (section.id === action.payload.sectionId) {
                            return {
                                ...section,
                                subsections: (section.subsections || []).filter(subsection => subsection.id !== action.payload.subsectionId),
                                content: removeContentItem(section.content || [], 'subsection', action.payload.subsectionId)
                            };
                        }
                        return section;
                    }),
                    metadata: updateMetadata(state.config.metadata)
                },
                selectedSubsection: state.selectedSubsection === action.payload.subsectionId ? null : state.selectedSubsection
            };


        case 'REORDER_SUBSECTIONS':
            return {
                ...state,
                config: {
                    ...state.config,
                    sections: state.config.sections.map(section =>
                        section.id === action.payload.sectionId
                            ? {
                                ...section,
                                subsections: (() => {
                                    const newSubsections = [...(section.subsections || [])];
                                    const [movedSubsection] = newSubsections.splice(action.payload.fromIndex, 1);
                                    newSubsections.splice(action.payload.toIndex, 0, movedSubsection);
                                    return newSubsections;
                                })()
                            }
                            : section
                    ),
                    metadata: updateMetadata(state.config.metadata)
                }
            };

        case 'ADD_FIELD':
            return {
                ...state,
                config: {
                    ...state.config,
                    sections: state.config.sections.map(section => {
                        if (section.id === action.payload.sectionId) {
                            if (action.payload.subsectionId) {
                                // Adding field to subsection - don't add to content array
                                return {
                                    ...section,
                                    subsections: (section.subsections || []).map(subsection =>
                                        subsection.id === action.payload.subsectionId
                                            ? { ...subsection, fields: [...subsection.fields, action.payload.field] }
                                            : subsection
                                    )
                                };
                            } else {
                                // Adding field to section - add to content array
                                const updatedSection = { ...section, fields: [...section.fields, action.payload.field] };
                                // Ensure content array exists before adding to it
                                const sectionWithContent = ensureContentArray(section);
                                const newContentItem = addContentItem(section, 'field', action.payload.field.id);
                                return {
                                    ...updatedSection,
                                    content: [...(sectionWithContent.content || []), newContentItem]
                                };
                            }
                        }
                        return section;
                    }),
                    metadata: updateMetadata(state.config.metadata)
                }
            };

        case 'UPDATE_FIELD': {
            const updatedFieldConfig = {
                ...state.config,
                sections: state.config.sections.map(section =>
                    section.id === action.payload.sectionId
                        ? action.payload.subsectionId
                            ? {
                                ...section,
                                subsections: section.subsections.map(subsection =>
                                    subsection.id === action.payload.subsectionId
                                        ? {
                                            ...subsection,
                                            fields: subsection.fields.map(field => {
                                                if (field.id === action.payload.fieldId) {
                                                    // Debug logging for label history modifications
                                                    if (action.payload.updates.labelHistory) {
                                                        console.log('🔍 Label history being updated in reducer:', {
                                                            fieldId: field.id,
                                                            fieldLabel: field.label,
                                                            newLabelHistory: action.payload.updates.labelHistory,
                                                            historyCount: action.payload.updates.labelHistory?.length || 0
                                                        });
                                                    }
                                                    return { ...field, ...action.payload.updates };
                                                }
                                                return field;
                                            })
                                        }
                                        : subsection
                                )
                            }
                            : {
                                ...section,
                                fields: section.fields.map(field => {
                                    if (field.id === action.payload.fieldId) {
                                        // Debug logging for label history modifications
                                        if (action.payload.updates.labelHistory) {
                                            console.log('🔍 Label history being updated in reducer (section level):', {
                                                fieldId: field.id,
                                                fieldLabel: field.label,
                                                newLabelHistory: action.payload.updates.labelHistory,
                                                historyCount: action.payload.updates.labelHistory?.length || 0
                                            });
                                        }
                                        return { ...field, ...action.payload.updates };
                                    }
                                    return field;
                                })
                            }
                        : section
                ),
                metadata: updateMetadata(state.config.metadata)
            };

            // Handle field ID changes - update selectedField if needed
            let newSelectedField = state.selectedField;
            if (action.payload.updates.id && state.selectedField === action.payload.fieldId) {
                newSelectedField = action.payload.updates.id;
            }

            return {
                ...state,
                config: updatedFieldConfig,
                selectedField: newSelectedField
            };
        }

        case 'DELETE_FIELD':
            return {
                ...state,
                config: {
                    ...state.config,
                    sections: state.config.sections.map(section => {
                        if (section.id === action.payload.sectionId) {
                            if (action.payload.subsectionId) {
                                // Deleting field from subsection - don't modify content array
                                return {
                                    ...section,
                                    subsections: section.subsections.map(subsection =>
                                        subsection.id === action.payload.subsectionId
                                            ? {
                                                ...subsection,
                                                fields: subsection.fields.filter(field => field.id !== action.payload.fieldId)
                                            }
                                            : subsection
                                    )
                                };
                            } else {
                                // Deleting field from section - remove from content array
                                return {
                                    ...section,
                                    fields: section.fields.filter(field => field.id !== action.payload.fieldId),
                                    content: removeContentItem(section.content || [], 'field', action.payload.fieldId)
                                };
                            }
                        }
                        return section;
                    }),
                    metadata: updateMetadata(state.config.metadata)
                },
                selectedField: state.selectedField === action.payload.fieldId ? null : state.selectedField
            };

        case 'REORDER_FIELDS':
            console.log('📝 REORDER_FIELDS reducer called:', action.payload);
            return {
                ...state,
                config: {
                    ...state.config,
                    sections: state.config.sections.map(section =>
                        section.id === action.payload.sectionId
                            ? action.payload.subsectionId
                                ? {
                                    ...section,
                                    subsections: (section.subsections || []).map(subsection =>
                                        subsection.id === action.payload.subsectionId
                                            ? {
                                                ...subsection,
                                                fields: (() => {
                                                    const newFields = [...subsection.fields];
                                                    const [movedField] = newFields.splice(action.payload.fromIndex, 1);
                                                    newFields.splice(action.payload.toIndex, 0, movedField);
                                                    return newFields;
                                                })()
                                            }
                                            : subsection
                                    )
                                }
                                : {
                                    ...section,
                                    fields: (() => {
                                        const newFields = [...section.fields];
                                        console.log('🔧 BEFORE reorder:', {
                                            sectionId: section.id,
                                            fromIndex: action.payload.fromIndex,
                                            toIndex: action.payload.toIndex,
                                            fields: newFields.map(f => ({ id: f.id, label: f.label }))
                                        });
                                        const [movedField] = newFields.splice(action.payload.fromIndex, 1);
                                        newFields.splice(action.payload.toIndex, 0, movedField);
                                        console.log('🔧 AFTER reorder:', {
                                            sectionId: section.id,
                                            fields: newFields.map(f => ({ id: f.id, label: f.label })),
                                            movedField: { id: movedField?.id, label: movedField?.label }
                                        });
                                        return newFields;
                                    })()
                                }
                            : section
                    ),
                    metadata: updateMetadata(state.config.metadata)
                }
            };

        case 'ADD_FIELD_OPTION':
            return {
                ...state,
                config: {
                    ...state.config,
                    sections: state.config.sections.map(section =>
                        section.id === action.payload.sectionId
                            ? action.payload.subsectionId
                                ? {
                                    ...section,
                                    subsections: section.subsections.map(subsection =>
                                        subsection.id === action.payload.subsectionId
                                            ? {
                                                ...subsection,
                                                fields: subsection.fields.map(field =>
                                                    field.id === action.payload.fieldId
                                                        ? { ...field, options: [...(field.options || []), action.payload.option] }
                                                        : field
                                                )
                                            }
                                            : subsection
                                    )
                                }
                                : {
                                    ...section,
                                    fields: section.fields.map(field =>
                                        field.id === action.payload.fieldId
                                            ? { ...field, options: [...(field.options || []), action.payload.option] }
                                            : field
                                    )
                                }
                            : section
                    ),
                    metadata: updateMetadata(state.config.metadata)
                }
            };

        case 'UPDATE_FIELD_OPTION':
            return {
                ...state,
                config: {
                    ...state.config,
                    sections: state.config.sections.map(section =>
                        section.id === action.payload.sectionId
                            ? action.payload.subsectionId
                                ? {
                                    ...section,
                                    subsections: section.subsections.map(subsection =>
                                        subsection.id === action.payload.subsectionId
                                            ? {
                                                ...subsection,
                                                fields: subsection.fields.map(field =>
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
                                            : subsection
                                    )
                                }
                                : {
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
                    metadata: updateMetadata(state.config.metadata)
                }
            };

        case 'DELETE_FIELD_OPTION':
            return {
                ...state,
                config: {
                    ...state.config,
                    sections: state.config.sections.map(section =>
                        section.id === action.payload.sectionId
                            ? action.payload.subsectionId
                                ? {
                                    ...section,
                                    subsections: section.subsections.map(subsection =>
                                        subsection.id === action.payload.subsectionId
                                            ? {
                                                ...subsection,
                                                fields: subsection.fields.map(field =>
                                                    field.id === action.payload.fieldId
                                                        ? {
                                                            ...field,
                                                            options: field.options?.filter((_, index) => index !== action.payload.optionIndex) || []
                                                        }
                                                        : field
                                                )
                                            }
                                            : subsection
                                    )
                                }
                                : {
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
                    metadata: updateMetadata(state.config.metadata)
                }
            };

        case 'REORDER_SECTION_CONTENT':
            return {
                ...state,
                config: {
                    ...state.config,
                    sections: state.config.sections.map(section => {
                        if (section.id === action.payload.sectionId) {
                            return {
                                ...section,
                                content: reorderContent(
                                    section.content || [],
                                    action.payload.fromIndex,
                                    action.payload.toIndex
                                )
                            };
                        }
                        return section;
                    }),
                    metadata: updateMetadata(state.config.metadata)
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
    selectSubsection: (subsectionId: string | null) => void;
    selectField: (fieldId: string | null) => void;
    togglePreviewMode: () => void;
    setLoading: (loading: boolean) => void;
    showRatingScaleManager: (show: boolean) => void;
    showMultiSelectEditor: (show: boolean) => void;
    showFieldEditorModal: (show: boolean) => void;
    showRadioOptionSetManager: (show: boolean) => void;
    showMultiSelectOptionSetManager: (show: boolean) => void;
    showSelectOptionSetManager: (show: boolean) => void;
    addSection: (section: SurveySection) => void;
    updateSection: (sectionId: string, updates: Partial<SurveySection>) => void;
    deleteSection: (sectionId: string) => void;
    reorderSections: (fromIndex: number, toIndex: number) => void;
    addSubsection: (sectionId: string, subsection: SurveySubsection) => void;
    updateSubsection: (sectionId: string, subsectionId: string, updates: Partial<SurveySubsection>) => void;
    deleteSubsection: (sectionId: string, subsectionId: string) => void;
    reorderSubsections: (sectionId: string, fromIndex: number, toIndex: number) => void;
    reorderSectionContent: (sectionId: string, fromIndex: number, toIndex: number) => void;
    addField: (sectionId: string, field: SurveyField, subsectionId?: string) => void;
    updateField: (sectionId: string, fieldId: string, updates: Partial<SurveyField>, subsectionId?: string) => void;
    deleteField: (sectionId: string, fieldId: string, subsectionId?: string) => void;
    reorderFields: (sectionId: string, fromIndex: number, toIndex: number, subsectionId?: string) => void;
    addFieldOption: (sectionId: string, fieldId: string, option: { label: string; value: string; color?: string }, subsectionId?: string) => void;
    updateFieldOption: (sectionId: string, fieldId: string, optionIndex: number, updates: { label?: string; value?: string; color?: string }, subsectionId?: string) => void;
    deleteFieldOption: (sectionId: string, fieldId: string, optionIndex: number, subsectionId?: string) => void;
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

    const selectSubsection = (subsectionId: string | null) => {
        dispatch({ type: 'SELECT_SUBSECTION', payload: subsectionId });
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

    const showSelectOptionSetManager = (show: boolean) => {
        dispatch({ type: 'SHOW_SELECT_OPTION_SET_MANAGER', payload: show });
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

    const addSubsection = (sectionId: string, subsection: SurveySubsection) => {
        dispatch({ type: 'ADD_SUBSECTION', payload: { sectionId, subsection } });
    };

    const updateSubsection = (sectionId: string, subsectionId: string, updates: Partial<SurveySubsection>) => {
        dispatch({ type: 'UPDATE_SUBSECTION', payload: { sectionId, subsectionId, updates } });
    };

    const deleteSubsection = (sectionId: string, subsectionId: string) => {
        dispatch({ type: 'DELETE_SUBSECTION', payload: { sectionId, subsectionId } });
    };

    const reorderSubsections = (sectionId: string, fromIndex: number, toIndex: number) => {
        dispatch({ type: 'REORDER_SUBSECTIONS', payload: { sectionId, fromIndex, toIndex } });
    };

    const reorderSectionContent = (sectionId: string, fromIndex: number, toIndex: number) => {
        dispatch({ type: 'REORDER_SECTION_CONTENT', payload: { sectionId, fromIndex, toIndex } });
    };

    const addField = (sectionId: string, field: SurveyField, subsectionId?: string) => {
        dispatch({ type: 'ADD_FIELD', payload: { sectionId, subsectionId, field } });
    };

    const updateField = (sectionId: string, fieldId: string, updates: Partial<SurveyField>, subsectionId?: string) => {
        dispatch({ type: 'UPDATE_FIELD', payload: { sectionId, subsectionId, fieldId, updates } });
    };

    const deleteField = (sectionId: string, fieldId: string, subsectionId?: string) => {
        dispatch({ type: 'DELETE_FIELD', payload: { sectionId, subsectionId, fieldId } });
    };

    const reorderFields = (sectionId: string, fromIndex: number, toIndex: number, subsectionId?: string) => {
        dispatch({ type: 'REORDER_FIELDS', payload: { sectionId, subsectionId, fromIndex, toIndex } });
    };

    const addFieldOption = (sectionId: string, fieldId: string, option: { label: string; value: string; color?: string }, subsectionId?: string) => {
        dispatch({ type: 'ADD_FIELD_OPTION', payload: { sectionId, subsectionId, fieldId, option } });
    };

    const updateFieldOption = (sectionId: string, fieldId: string, optionIndex: number, updates: { label?: string; value?: string; color?: string }, subsectionId?: string) => {
        dispatch({ type: 'UPDATE_FIELD_OPTION', payload: { sectionId, subsectionId, fieldId, optionIndex, updates } });
    };

    const deleteFieldOption = (sectionId: string, fieldId: string, optionIndex: number, subsectionId?: string) => {
        dispatch({ type: 'DELETE_FIELD_OPTION', payload: { sectionId, subsectionId, fieldId, optionIndex } });
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
        selectSubsection,
        selectField,
        togglePreviewMode,
        setLoading,
        showRatingScaleManager,
        showMultiSelectEditor,
        showFieldEditorModal,
        showRadioOptionSetManager,
        showMultiSelectOptionSetManager,
        showSelectOptionSetManager,
        addSection,
        updateSection,
        deleteSection,
        reorderSections,
        addSubsection,
        updateSubsection,
        deleteSubsection,
        reorderSubsections,
        reorderSectionContent,
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
