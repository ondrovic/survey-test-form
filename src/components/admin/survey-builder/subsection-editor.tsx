import { Plus } from 'lucide-react';
import React, { useEffect, useState, useMemo } from 'react';
import { firestoreHelpers } from '../../../config/firebase';
import { MultiSelectOptionSet, RadioOptionSet, SurveySubsection } from '../../../types/framework.types';
import { FieldType } from '../../../types/framework.types';
import { Button, Input } from '../../common';
import { useValidation } from '../../../contexts/validation-context';
// import { FIELD_TYPES } from './survey-builder.types';
// import { DraggableField } from './draggable-field';
import { DroppableFieldContainer } from './droppable-field-container';
import { MemoizedFieldItem } from './memoized-field-item';

interface SubsectionEditorProps {
    subsection: SurveySubsection;
    sectionId: string;
    selectedFieldId: string | null;
    onUpdateSubsection: (sectionId: string, subsectionId: string, updates: Partial<SurveySubsection>) => void;
    onAddField: (sectionId: string, fieldType: FieldType, subsectionId: string) => void;
    onSelectField: (fieldId: string) => void;
    onOpenFieldEditor: (fieldId: string) => void;
    onDeleteField: (sectionId: string, fieldId: string, subsectionId?: string) => void;
    onReorderFields: (sectionId: string, oldIndex: number, newIndex: number, subsectionId: string) => void;
}

export const SubsectionEditor: React.FC<SubsectionEditorProps> = ({
    subsection,
    sectionId,
    selectedFieldId,
    onUpdateSubsection,
    onAddField,
    onSelectField,
    onOpenFieldEditor,
    onDeleteField,
    // onReorderFields
}) => {
    const { validateSectionTitle, validateSectionDescription } = useValidation();
    
    // Memoize the container object to prevent unnecessary re-renders
    const subsectionContainer = useMemo(() => ({ 
        type: 'subsection' as const, 
        sectionId, 
        subsectionId: subsection.id 
    }), [sectionId, subsection.id]);
    
    const [radioOptionSets, setRadioOptionSets] = useState<Record<string, RadioOptionSet>>({});
    const [multiSelectOptionSets, setMultiSelectOptionSets] = useState<Record<string, MultiSelectOptionSet>>({});
    const [loadingOptionSets, setLoadingOptionSets] = useState<Record<string, boolean>>({});
    const [titleError, setTitleError] = useState<string>('');
    const [descriptionError, setDescriptionError] = useState<string>('');

    // Handle title change with validation
    const handleTitleChange = (newTitle: string) => {
        const validation = validateSectionTitle(newTitle);
        setTitleError(validation.isValid ? '' : validation.error || '');
        
        onUpdateSubsection(sectionId, subsection.id, { title: newTitle });
    };

    // Handle description change with validation
    const handleDescriptionChange = (newDescription: string) => {
        const validation = validateSectionDescription(newDescription);
        setDescriptionError(validation.isValid ? '' : validation.error || '');
        
        onUpdateSubsection(sectionId, subsection.id, { description: newDescription });
    };

    // Validate on mount and subsection change
    useEffect(() => {
        const titleValidation = validateSectionTitle(subsection.title);
        setTitleError(titleValidation.isValid ? '' : titleValidation.error || '');
        
        if (subsection.description) {
            const descValidation = validateSectionDescription(subsection.description);
            setDescriptionError(descValidation.isValid ? '' : descValidation.error || '');
        }
    }, [subsection.id, subsection.title, subsection.description, validateSectionTitle, validateSectionDescription]);

    // Load option sets for fields that need them
    useEffect(() => {
        const loadOptionSets = async () => {
            const fieldsWithOptionSets = (subsection.fields || []).filter(field =>
                (field.type === 'radio' && field.radioOptionSetId) ||
                (field.type === 'multiselect' && field.multiSelectOptionSetId)
            );

            for (const field of fieldsWithOptionSets) {
                if (field.type === 'radio' && field.radioOptionSetId && !radioOptionSets[field.radioOptionSetId]) {
                    setLoadingOptionSets(prev => ({ ...prev, [field.radioOptionSetId!]: true }));
                    try {
                        const optionSet = await firestoreHelpers.getRadioOptionSet(field.radioOptionSetId);
                        if (optionSet) {
                            setRadioOptionSets(prev => ({ ...prev, [field.radioOptionSetId!]: optionSet }));
                        }
                    } catch (error) {
                        console.error('Error loading radio option set:', error);
                    } finally {
                        setLoadingOptionSets(prev => ({ ...prev, [field.radioOptionSetId!]: false }));
                    }
                }

                if (field.type === 'multiselect' && field.multiSelectOptionSetId && !multiSelectOptionSets[field.multiSelectOptionSetId]) {
                    setLoadingOptionSets(prev => ({ ...prev, [field.multiSelectOptionSetId!]: true }));
                    try {
                        const optionSet = await firestoreHelpers.getMultiSelectOptionSet(field.multiSelectOptionSetId);
                        if (optionSet) {
                            setMultiSelectOptionSets(prev => ({ ...prev, [field.multiSelectOptionSetId!]: optionSet }));
                        }
                    } catch (error) {
                        console.error('Error loading multi-select option set:', error);
                    } finally {
                        setLoadingOptionSets(prev => ({ ...prev, [field.multiSelectOptionSetId!]: false }));
                    }
                }
            }
        };

        loadOptionSets();
    }, [subsection.fields, radioOptionSets, multiSelectOptionSets]);

    const getOptionCount = (field: any) => {
        if (field.ratingScaleId) {
            return '4 options'; // Rating scale has 4 options: High, Medium, Low, Not Important
        }

        if (field.radioOptionSetId) {
            const optionSet = radioOptionSets[field.radioOptionSetId];
            if (optionSet) {
                return `${optionSet.options.length} options`;
            }
            if (loadingOptionSets[field.radioOptionSetId]) {
                return 'Loading...';
            }
            return 'Failed to load';
        }

        if (field.multiSelectOptionSetId) {
            const optionSet = multiSelectOptionSets[field.multiSelectOptionSetId];
            if (optionSet) {
                return `${optionSet.options.length} options`;
            }
            if (loadingOptionSets[field.multiSelectOptionSetId]) {
                return 'Loading...';
            }
            return 'Failed to load';
        }

        if (field.options && field.options.length > 0) {
            return `${field.options.length} options`;
        }

        return 'No options';
    };

    return (
        <div className="bg-gray-50 border rounded-lg p-4 ml-4">
            <div className="mb-4">
                <h4 className="text-md font-semibold mb-3 text-gray-800">Subsection: {subsection.title}</h4>
                <div className="grid grid-cols-1 gap-3">
                    <div>
                        <Input
                            name="subsectionTitle"
                            label="Subsection Title *"
                            value={subsection.title}
                            onChange={handleTitleChange}
                            error={titleError}
                            placeholder="e.g., Personal Details, Preferences"
                        />
                    </div>
                    <div>
                        <label htmlFor="subsection-description" className="block text-sm font-medium text-gray-700 mb-1">
                            Description (optional)
                        </label>
                        <textarea
                            id="subsection-description"
                            name="subsectionDescription"
                            value={subsection.description || ''}
                            onChange={(e) => handleDescriptionChange(e.target.value)}
                            placeholder="Enter subsection description (optional, max 300 characters)"
                            rows={2}
                            className={`w-full px-3 py-2 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                descriptionError ? 'border-red-500' : 'border-gray-300'
                            }`}
                        />
                        {descriptionError && (
                            <p className="mt-1 text-sm text-red-600">{descriptionError}</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h5 className="font-medium text-sm">Fields</h5>
                        <p className="text-xs text-gray-500 mt-1">Click on a field to select it, then use the edit button to modify</p>
                    </div>
                    <Button 
                        size="sm" 
                        onClick={() => {
                            console.log('🟨 ADD SUBSECTION FIELD CLICKED:', sectionId, subsection.id);
                            onAddField(sectionId, 'text', subsection.id);
                        }}
                        disabled={!subsection.title || titleError !== ''}
                        title={!subsection.title ? 'Please enter a valid subsection title first' : ''}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Field
                    </Button>
                </div>
                <DroppableFieldContainer
                    container={subsectionContainer}
                    className="space-y-2"
                    emptyMessage="Drop fields here or add new fields"
                >
                    {(subsection.fields || []).map((field) => (
                        <MemoizedFieldItem
                            key={field.id}
                            field={field}
                            container={subsectionContainer}
                            isSelected={selectedFieldId === field.id}
                            onSelectField={onSelectField}
                            onOpenFieldEditor={onOpenFieldEditor}
                            onDeleteField={onDeleteField}
                            sectionId={sectionId}
                            subsectionId={subsection.id}
                            getOptionCount={getOptionCount}
                            isSubsection={true}
                        />
                    ))}
                </DroppableFieldContainer>
            </div>
        </div>
    );
};