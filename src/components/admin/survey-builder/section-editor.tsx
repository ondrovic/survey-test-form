import { Edit, Plus, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { firestoreHelpers } from '../../../config/firebase';
import { FieldType, MultiSelectOptionSet, RadioOptionSet, SurveySection } from '../../../types/survey.types';
import { Button, Input, SortableList } from '../../common';
import { FIELD_TYPES } from './survey-builder.types';

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
    const [radioOptionSets, setRadioOptionSets] = useState<Record<string, RadioOptionSet>>({});
    const [multiSelectOptionSets, setMultiSelectOptionSets] = useState<Record<string, MultiSelectOptionSet>>({});
    const [loadingOptionSets, setLoadingOptionSets] = useState<Record<string, boolean>>({});

    // Load option sets for fields that need them
    useEffect(() => {
        const loadOptionSets = async () => {
            const fieldsWithOptionSets = section.fields.filter(field =>
                (field.type === 'radio' && field.radioOptionSetId) ||
                (field.type === 'multiselect' && field.multiSelectOptionSetId)
            );

            for (const field of fieldsWithOptionSets) {
                if (field.type === 'radio' && field.radioOptionSetId && !radioOptionSets[field.radioOptionSetId]) {
                    setLoadingOptionSets(prev => ({ ...prev, [field.radioOptionSetId]: true }));
                    try {
                        const optionSet = await firestoreHelpers.getRadioOptionSet(field.radioOptionSetId);
                        if (optionSet) {
                            setRadioOptionSets(prev => ({ ...prev, [field.radioOptionSetId]: optionSet }));
                        }
                    } catch (error) {
                        console.error('Error loading radio option set:', error);
                    } finally {
                        setLoadingOptionSets(prev => ({ ...prev, [field.radioOptionSetId]: false }));
                    }
                }

                if (field.type === 'multiselect' && field.multiSelectOptionSetId && !multiSelectOptionSets[field.multiSelectOptionSetId]) {
                    setLoadingOptionSets(prev => ({ ...prev, [field.multiSelectOptionSetId]: true }));
                    try {
                        const optionSet = await firestoreHelpers.getMultiSelectOptionSet(field.multiSelectOptionSetId);
                        if (optionSet) {
                            setMultiSelectOptionSets(prev => ({ ...prev, [field.multiSelectOptionSetId]: optionSet }));
                        }
                    } catch (error) {
                        console.error('Error loading multi-select option set:', error);
                    } finally {
                        setLoadingOptionSets(prev => ({ ...prev, [field.multiSelectOptionSetId]: false }));
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
                    <Input
                        name="sectionTitle"
                        label="Section Title"
                        value={section.title}
                        onChange={(value) => onUpdateSection(section.id, { title: value })}
                    />
                    <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                            Section Type
                        </label>
                        <select
                            value={section.type}
                            onChange={(e) => onUpdateSection(section.id, { type: e.target.value as any })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="custom">Custom Section</option>
                            <option value="service-line">Service Line Section</option>
                            <option value="rating">Rating Section</option>
                        </select>
                    </div>
                </div>
                <Input
                    name="sectionDescription"
                    label="Description"
                    value={section.description || ''}
                    onChange={(value) => onUpdateSection(section.id, { description: value })}
                    className="mt-4"
                />
            </div>

            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h4 className="font-semibold">Fields</h4>
                        <p className="text-xs text-gray-500 mt-1">Click on a field to edit it</p>
                    </div>
                    <Button size="sm" onClick={() => onAddField(section.id, 'text')}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Field
                    </Button>
                </div>
                <SortableList
                    items={section.fields}
                    onReorder={(oldIndex, newIndex) => onReorderFields(section.id, oldIndex, newIndex)}
                    className="space-y-4"
                    itemClassName="p-4 border rounded cursor-pointer"
                    renderItem={(field, _isDragging) => (
                        <div
                            className={`${selectedFieldId === field.id
                                ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                                : "border-gray-200 hover:border-gray-300"
                                } transition-all duration-200`}
                            onClick={() => onOpenFieldEditor(field.id)}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
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
