import { Edit, Plus, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { firestoreHelpers } from '../../../config/firebase';
import { MultiSelectOptionSet, RadioOptionSet, SurveySection } from '../../../types/framework.types';
import { FieldType } from '../../../types/framework.types';
import { Button, Input, SortableList } from '../../common';
import { useValidation } from '../../../contexts/validation-context';
import { FIELD_TYPES } from './survey-builder.types';

// Utility function to generate kebab-case identifier from title
const generateSectionType = (title: string): string => {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
        .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
        + '-identifier';
};

interface SectionEditorProps {
    section: SurveySection;
    selectedFieldId: string | null;
    onUpdateSection: (sectionId: string, updates: Partial<SurveySection>) => void;
    onAddField: (sectionId: string, fieldType: FieldType) => void;
    onSelectField: (fieldId: string) => void;
    onOpenFieldEditor: (fieldId: string) => void;
    onDeleteField: (sectionId: string, fieldId: string) => void;
    onReorderFields: (sectionId: string, oldIndex: number, newIndex: number) => void;
}

export const SectionEditor: React.FC<SectionEditorProps> = ({
    section,
    selectedFieldId,
    onUpdateSection,
    onAddField,
    onSelectField,
    onOpenFieldEditor,
    onDeleteField,
    onReorderFields
}) => {
    const { validateSectionTitle, validateSectionDescription } = useValidation();
    const [radioOptionSets, setRadioOptionSets] = useState<Record<string, RadioOptionSet>>({});
    const [multiSelectOptionSets, setMultiSelectOptionSets] = useState<Record<string, MultiSelectOptionSet>>({});
    const [loadingOptionSets, setLoadingOptionSets] = useState<Record<string, boolean>>({});
    const [titleError, setTitleError] = useState<string>('');
    const [descriptionError, setDescriptionError] = useState<string>('');

    // Handle title change with validation and auto-update type
    const handleTitleChange = (newTitle: string) => {
        const validation = validateSectionTitle(newTitle);
        setTitleError(validation.isValid ? '' : validation.error || '');
        
                                const newType = newTitle.trim() ? generateSectionType(newTitle) : 'custom';
        onUpdateSection(section.id, { 
            title: newTitle,
            type: newType as any
        });
    };

    // Handle description change with validation
    const handleDescriptionChange = (newDescription: string) => {
        const validation = validateSectionDescription(newDescription);
        setDescriptionError(validation.isValid ? '' : validation.error || '');
        
        onUpdateSection(section.id, { description: newDescription });
    };

    // Validate on mount and section change
    useEffect(() => {
        const titleValidation = validateSectionTitle(section.title);
        setTitleError(titleValidation.isValid ? '' : titleValidation.error || '');
        
        if (section.description) {
            const descValidation = validateSectionDescription(section.description);
            setDescriptionError(descValidation.isValid ? '' : descValidation.error || '');
        }
    }, [section.id, section.title, section.description, validateSectionTitle, validateSectionDescription]);

    // Load option sets for fields that need them
    useEffect(() => {
        const loadOptionSets = async () => {
            const fieldsWithOptionSets = section.fields.filter(field =>
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
    }, [section.fields, radioOptionSets, multiSelectOptionSets]);

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
        <div>
            <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Section: {section.title}</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Input
                            name="sectionTitle"
                            label="Section Title *"
                            value={section.title}
                            onChange={handleTitleChange}
                            error={titleError}
                            placeholder="e.g., About Us, Contact Info"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                            Section Type (Auto-generated) *
                        </label>
                        <input
                            type="text"
                            value={section.type || ''}
                            readOnly
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 cursor-not-allowed"
                            placeholder={section.title ? generateSectionType(section.title) : 'Enter title to generate type'}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Auto-generated from title in kebab-case format
                        </p>
                    </div>
                </div>
                <Input
                    name="sectionDescription"
                    label="Description"
                    value={section.description || ''}
                    onChange={handleDescriptionChange}
                    placeholder="Enter section description (optional, max 300 characters)"
                    error={descriptionError}
                    className="mt-4"
                />
            </div>

            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h4 className="font-semibold">Fields</h4>
                        <p className="text-xs text-gray-500 mt-1">Click on a field to select it, then use the edit button to modify</p>
                    </div>
                    <Button 
                        size="sm" 
                        onClick={() => onAddField(section.id, 'text')}
                        disabled={!section.title || !section.type || titleError !== ''}
                        title={!section.title || !section.type ? 'Please enter a valid section title first' : ''}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Field
                    </Button>
                </div>
                <SortableList
                    items={section.fields}
                    onReorder={(oldIndex, newIndex) => onReorderFields(section.id, oldIndex, newIndex)}
                    className="space-y-4"
                    itemClassName="p-4 border rounded"
                    renderItem={(field, _isDragging) => (
                        <div
                            className={`${selectedFieldId === field.id
                                ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                                : "border-gray-200 hover:border-gray-300"
                                } transition-all duration-200`}
                        >
                            <div className="flex items-center justify-between">
                                <div 
                                    className="flex items-center gap-2 flex-1 cursor-pointer" 
                                    onClick={() => onSelectField(field.id)}
                                >
                                    <span className="font-medium">{field.label}</span>
                                    <span className="text-sm text-gray-500">({field.type})</span>
                                    {field.required && (
                                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                                            Required
                                        </span>
                                    )}
                                    {FIELD_TYPES.find(t => t.value === field.type)?.hasOptions && (
                                        <span className="text-xs text-blue-600">
                                            {getOptionCount(field)}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onOpenFieldEditor(field.id);
                                        }}
                                        className="text-blue-600 hover:text-blue-700"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteField(section.id, field.id);
                                        }}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                />
            </div>
        </div>
    );
};
