import { Plus, Trash2 } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { firestoreHelpers } from '../../../config/firebase';
import { useValidation } from '../../../contexts/validation-context';
import { FieldType, MultiSelectOptionSet, RadioOptionSet, SurveySection, SurveySubsection } from '../../../types/framework.types';
import { Button, Input, SortableList } from '../../common';
// import { FIELD_TYPES } from './survey-builder.types';
import { SubsectionEditor } from './subsection-editor';
// import { DraggableField } from './draggable-field';
import { DroppableFieldContainer } from './droppable-field-container';
import { FieldContainer } from './field-drag-context';
import { MemoizedFieldItem } from './memoized-field-item';

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
    selectedSubsectionId: string | null;
    onUpdateSection: (sectionId: string, updates: Partial<SurveySection>) => void;
    onAddSubsection: (sectionId: string, subsection: SurveySubsection) => void;
    onUpdateSubsection: (sectionId: string, subsectionId: string, updates: Partial<SurveySubsection>) => void;
    onDeleteSubsection: (sectionId: string, subsectionId: string) => void;
    onReorderSubsections: (sectionId: string, oldIndex: number, newIndex: number) => void;
    onSelectSubsection: (subsectionId: string) => void;
    onAddField: (sectionId: string, fieldType: FieldType, subsectionId?: string) => void;
    onSelectField: (fieldId: string) => void;
    onOpenFieldEditor: (fieldId: string) => void;
    onDeleteField: (sectionId: string, fieldId: string, subsectionId?: string) => void;
    onReorderFields: (sectionId: string, oldIndex: number, newIndex: number, subsectionId?: string) => void;
    onMoveField: (fieldId: string, fromContainer: FieldContainer, toContainer: FieldContainer, newIndex: number) => void;
}

export const SectionEditor: React.FC<SectionEditorProps> = ({
    section,
    selectedFieldId,
    selectedSubsectionId,
    onUpdateSection,
    onAddSubsection,
    onUpdateSubsection,
    onDeleteSubsection,
    onReorderSubsections,
    onSelectSubsection,
    onAddField,
    onSelectField,
    onOpenFieldEditor,
    onDeleteField,
    onReorderFields,
    // onMoveField
}) => {
    console.log('🔍 SectionEditor received section data:', {
        sectionId: section.id,
        sectionTitle: section.title,
        sectionFieldsCount: section.fields?.length || 0,
        sectionFields: section.fields?.map(f => ({ id: f.id, label: f.label })) || [],
        subsectionsCount: section.subsections?.length || 0,
        subsectionsDetail: section.subsections?.map(sub => ({
            id: sub.id,
            title: sub.title,
            fieldsCount: sub.fields?.length || 0,
            fields: sub.fields?.map(f => ({ id: f.id, label: f.label })) || []
        })) || []
    });
    const { validateSectionTitle, validateSectionDescription } = useValidation();
    // const isFieldDragging = useIsFieldDragging();

    // Memoize the container object to prevent unnecessary re-renders
    const sectionContainer = useMemo(() => {
        const container = {
            type: 'section' as const,
            sectionId: section.id,
            subsections: section.subsections || []
        };
        console.log('🏗️ Creating section container with subsections:', {
            sectionId: section.id,
            subsectionsCount: section.subsections?.length || 0,
            subsections: section.subsections?.map(sub => ({
                id: sub.id,
                title: sub.title,
                fieldsCount: sub.fields?.length || 0,
                actualFields: sub.fields?.map(f => ({ id: f.id, label: f.label })) || []
            })),
            fullContainer: {
                ...container,
                subsections: container.subsections.map(sub => ({
                    id: sub.id,
                    title: sub.title,
                    fieldsCount: sub.fields?.length || 0,
                    actualFields: sub.fields?.map(f => ({ id: f.id, label: f.label })) || []
                }))
            }
        });
        return container;
    }, [section.id, section.subsections]);
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
            // Get all fields from both section level and subsections
            const allFields = [
                ...(section.fields || []),
                ...(section.subsections || []).flatMap(subsection => subsection.fields || [])
            ];

            const fieldsWithOptionSets = allFields.filter(field =>
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
    }, [section.fields, section.subsections, radioOptionSets, multiSelectOptionSets]);

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

    // Handle adding a new subsection
    const handleAddSubsection = () => {
        const newSubsection: SurveySubsection = {
            id: `subsection-${Date.now()}`,
            title: 'New Subsection',
            description: '',
            fields: [],
            order: section.subsections?.length || 0,
            metadata: {}
        };
        onAddSubsection(section.id, newSubsection);
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
                        <label htmlFor="section-type" className="block text-sm font-semibold text-gray-800 mb-2">
                            Section Type (Auto-generated) *
                        </label>
                        <input
                            id="section-type"
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
                <div className="mt-4">
                    <label htmlFor="section-description" className="block text-sm font-medium text-gray-700 mb-1">
                        Description (optional)
                    </label>
                    <textarea
                        id="section-description"
                        name="sectionDescription"
                        value={section.description || ''}
                        onChange={(e) => handleDescriptionChange(e.target.value)}
                        placeholder="Enter section description (optional, max 300 characters)"
                        rows={3}
                        className={`w-full px-3 py-2 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${descriptionError ? 'border-red-500' : 'border-gray-300'
                            }`}
                    />
                    {descriptionError && (
                        <p className="mt-1 text-sm text-red-600">{descriptionError}</p>
                    )}
                </div>
            </div>

            {/* Subsections */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h4 className="font-semibold">Subsections</h4>
                        <p className="text-xs text-gray-500 mt-1">Group related fields together within this section</p>
                    </div>
                    <Button
                        size="sm"
                        onClick={handleAddSubsection}
                        disabled={!section.title || !section.type || titleError !== ''}
                        title={!section.title || !section.type ? 'Please enter a valid section title first' : ''}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Subsection
                    </Button>
                </div>
                {section.subsections && section.subsections.length > 0 && (
                    <SortableList
                        items={section.subsections as any[]}
                        onReorder={(oldIndex, newIndex) => onReorderSubsections(section.id, oldIndex, newIndex)}
                        className="space-y-4"
                        itemClassName="border rounded-lg"
                        disabled={true}
                        renderItem={(subsection, _isDragging) => {
                            const subsectionData = subsection as SurveySubsection;
                            return (
                                <div
                                    className={`${selectedSubsectionId === subsectionData.id
                                        ? "border-green-500 bg-green-50 ring-2 ring-green-200"
                                        : "border-gray-200 hover:border-gray-300"
                                        } transition-all duration-200`}
                                >
                                    <div className="p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <div
                                                className="flex items-center gap-2 flex-1 cursor-pointer"
                                                onClick={() => onSelectSubsection(subsectionData.id)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        e.preventDefault();
                                                        onSelectSubsection(subsectionData.id);
                                                    }
                                                }}
                                                role="button"
                                                tabIndex={0}
                                            >
                                                <span className="font-medium text-green-700">{subsectionData.title}</span>
                                                <span className="text-xs text-gray-500">({subsectionData.fields.length} fields)</span>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDeleteSubsection(section.id, subsectionData.id);
                                                }}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                        <SubsectionEditor
                                            subsection={subsectionData}
                                            sectionId={section.id}
                                            selectedFieldId={selectedFieldId}
                                            onUpdateSubsection={onUpdateSubsection}
                                            onAddField={onAddField}
                                            onSelectField={onSelectField}
                                            onOpenFieldEditor={onOpenFieldEditor}
                                            onDeleteField={onDeleteField}
                                            onReorderFields={onReorderFields}
                                        />
                                    </div>
                                </div>
                            );
                        }}
                    />
                )}
            </div>

            {/* Section-level Fields */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h4 className="font-semibold">Section Fields</h4>
                        <p className="text-xs text-gray-500 mt-1">
                            {(section.subsections && section.subsections.length > 0)
                                ? 'These fields will be hidden in the survey since subsections exist. Consider moving them to a subsection.'
                                : 'Fields that belong directly to this section (not in a subsection)'
                            }
                        </p>
                    </div>
                    <Button
                        size="sm"
                        onClick={() => {
                            console.log('🟦 ADD FIELD CLICKED:', section.id);
                            onAddField(section.id, 'text');
                        }}
                        disabled={!section.title || !section.type || titleError !== ''}
                        title={!section.title || !section.type ? 'Please enter a valid section title first' : ''}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Field
                    </Button>
                </div>
                <DroppableFieldContainer
                    container={sectionContainer}
                    className="space-y-4"
                    emptyMessage="Drop fields here or add new fields"
                >
                    {(section.fields || []).map((field) => (
                        <MemoizedFieldItem
                            key={field.id}
                            field={field}
                            container={sectionContainer}
                            isSelected={selectedFieldId === field.id}
                            onSelectField={onSelectField}
                            onOpenFieldEditor={onOpenFieldEditor}
                            onDeleteField={onDeleteField}
                            sectionId={section.id}
                            getOptionCount={getOptionCount}
                        />
                    ))}
                </DroppableFieldContainer>
            </div>
        </div>
    );
};
