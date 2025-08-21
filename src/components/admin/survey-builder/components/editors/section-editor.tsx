import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react';
import React, { memo, useEffect, useState } from 'react';
import { databaseHelpers } from '../../../../../config/database';
import { useValidation } from '../../../../../contexts/validation-context';
import { FieldType, MultiSelectOptionSet, RadioOptionSet, SurveySection, SurveySubsection } from '../../../../../types/framework.types';
import { getOrderedSectionContent } from '../../../../../utils/section-content.utils';
import { Button, Input, SortableList } from '../../../../common';
// import { FIELD_TYPES } from './survey-builder.types';
// import { DraggableField } from './draggable-field';
import { FieldDropZone, DraggableField } from '../../drag-and-drop';

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
    onReorderSectionContent?: (sectionId: string, fromIndex: number, toIndex: number) => void;
    onSelectSubsection: (subsectionId: string) => void;
    onAddField: (sectionId: string, fieldType: FieldType, subsectionId?: string) => void;
    onSelectField: (fieldId: string) => void;
    onOpenFieldEditor: (fieldId: string) => void;
    onDeleteField: (sectionId: string, fieldId: string, subsectionId?: string) => void;
    onReorderFields: (sectionId: string, oldIndex: number, newIndex: number, subsectionId?: string) => void;
}

export const SectionEditor: React.FC<SectionEditorProps> = memo(({
    section,
    selectedFieldId,
    selectedSubsectionId,
    onUpdateSection,
    onAddSubsection,
    onUpdateSubsection,
    onDeleteSubsection,
    onReorderSubsections,
    onReorderSectionContent,
    onSelectSubsection,
    onAddField,
    onSelectField,
    onOpenFieldEditor,
    onDeleteField
}) => {
    const { validateSectionTitle, validateSectionDescription } = useValidation();

    // State to track which subsections are expanded
    const [expandedSubsections, setExpandedSubsections] = useState<Set<string>>(new Set());

    // Auto-expand subsections that are selected or have selected fields
    useEffect(() => {
        const newExpanded = new Set(expandedSubsections);

        // Always expand the selected subsection
        if (selectedSubsectionId) {
            newExpanded.add(selectedSubsectionId);
        }

        // Expand subsections that contain the selected field
        if (selectedFieldId && section.subsections) {
            for (const subsection of section.subsections) {
                if (subsection.fields.some(field => field.id === selectedFieldId)) {
                    newExpanded.add(subsection.id);
                }
            }
        }

        setExpandedSubsections(newExpanded);
    }, [selectedSubsectionId, selectedFieldId, section.subsections]);

    // Toggle subsection expansion (allow multiple expanded)
    const toggleSubsection = (subsectionId: string) => {
        setExpandedSubsections(prev => {
            const newSet = new Set(prev);
            if (newSet.has(subsectionId)) {
                newSet.delete(subsectionId);
            } else {
                newSet.add(subsectionId);
            }
            return newSet;
        });
    };

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
                        const optionSet = await databaseHelpers.getRadioOptionSet(field.radioOptionSetId);
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
                        const optionSet = await databaseHelpers.getMultiSelectOptionSet(field.multiSelectOptionSetId);
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
    }, [section.id]);

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

        // Auto-expand the new subsection
        setExpandedSubsections(prev => new Set([...prev, newSubsection.id]));
    };

    return (
        <div data-section-id={section.id}>
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

            {/* Section Content - Unified Fields and Subsections */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h4 className="font-semibold">Section Content</h4>
                        <p className="text-xs text-gray-500 mt-1">Fields and subsections will be rendered in the order shown below</p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            onClick={handleAddSubsection}
                            disabled={!section.title || !section.type || titleError !== ''}
                            title={!section.title || !section.type ? 'Please enter a valid section title first' : ''}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Subsection
                        </Button>
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
                </div>

                {/* Content Layout Preview */}
                {onReorderSectionContent && getOrderedSectionContent(section).length > 0 && (
                    <div className="mb-6">
                        <h5 className="font-medium text-sm text-gray-700 mb-2">Content Order Preview</h5>
                        <SortableList
                            items={getOrderedSectionContent(section).map(item => ({ ...item, id: item.contentId }))}
                            onReorder={(oldIndex, newIndex) => onReorderSectionContent(section.id, oldIndex, newIndex)}
                            className="space-y-2"
                            itemClassName="border rounded-md"
                            disabled={false}
                            renderItem={(contentItem, _isDragging) => {
                                if (contentItem.type === 'subsection') {
                                    const subsectionData = contentItem.data as SurveySubsection;
                                    return (
                                        <div className="p-3 bg-green-50 border-green-200">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-green-700 text-sm">📁 {subsectionData.title}</span>
                                                </div>
                                                <span className="text-xs text-gray-500">({subsectionData.fields.length} fields)</span>
                                            </div>
                                        </div>
                                    );
                                } else if (contentItem.type === 'field') {
                                    const field = contentItem.data as any;
                                    return (
                                        <div className="p-3 bg-blue-50 border-blue-200">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-blue-700 text-sm">🔷 {field.label}</span>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                    </div>
                )}

                {/* Detailed Content Editing */}
                <div className="space-y-6">
                    {/* Subsections */}
                    {section.subsections && section.subsections.length > 0 && (
                        <div>
                            <h5 className="font-medium text-sm text-gray-700 mb-3">Subsections</h5>
                            <SortableList
                                items={section.subsections}
                                onReorder={(oldIndex, newIndex) => onReorderSubsections(section.id, oldIndex, newIndex)}
                                className="space-y-4"
                                itemClassName=""
                                disabled={false}
                                renderItem={(item) => {
                                    const subsection = item as unknown as SurveySubsection;
                                    const isExpanded = expandedSubsections.has(subsection.id);
                                    const isSelected = selectedSubsectionId === subsection.id;
                                    const hasSelectedField = selectedFieldId && subsection.fields.some(f => f.id === selectedFieldId);
                                    

                                    return (
                                        <div
                                            key={subsection.id}
                                            data-subsection-id={subsection.id}
                                            className={`${isSelected
                                                ? "border-green-500 bg-green-50 ring-2 ring-green-200"
                                                : "border-gray-200 hover:border-gray-300"
                                                } border rounded-lg transition-all duration-200`}
                                        >
                                            {/* Subsection Header - Always Visible */}
                                            <div className={`${isExpanded ? 'p-4' : 'p-3'}`}>
                                                <div className={`flex items-center justify-between ${isExpanded ? 'mb-3' : 'mb-0'}`}>
                                                    <div className="flex items-center gap-2 flex-1">
                                                        <button
                                                            onClick={() => toggleSubsection(subsection.id)}
                                                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                                                            title={isExpanded ? "Collapse subsection" : "Expand subsection"}
                                                        >
                                                            {isExpanded ? (
                                                                <ChevronDown className="w-4 h-4 text-gray-600" />
                                                            ) : (
                                                                <ChevronRight className="w-4 h-4 text-gray-600" />
                                                            )}
                                                        </button>
                                                        <div
                                                            className="flex items-center gap-2 flex-1 cursor-pointer"
                                                            onClick={() => onSelectSubsection(subsection.id)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter' || e.key === ' ') {
                                                                    e.preventDefault();
                                                                    onSelectSubsection(subsection.id);
                                                                }
                                                            }}
                                                            role="button"
                                                            tabIndex={0}
                                                        >
                                                            <span className="font-medium text-green-700">📁 {subsection.title}</span>
                                                            <span className="text-xs text-gray-500">({subsection.fields.length} fields)</span>
                                                            {(isSelected || hasSelectedField) && (
                                                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                                                    Active
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onDeleteSubsection(section.id, subsection.id);
                                                        }}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>

                                                {/* Subsection Content - Collapsible */}
                                                {isExpanded && (
                                                    <div className="bg-gray-50 border rounded-lg p-4 ml-4">
                                                        <div className="mb-4">
                                                            <h4 className="text-md font-semibold mb-3 text-gray-800">Subsection: {subsection.title}</h4>
                                                            <div className="grid grid-cols-1 gap-3">
                                                                <div>
                                                                    <Input
                                                                        name="subsectionTitle"
                                                                        label="Subsection Title *"
                                                                        value={subsection.title}
                                                                        onChange={(newTitle) => {
                                                                            onUpdateSubsection(section.id, subsection.id, { title: newTitle });
                                                                        }}
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
                                                                        onChange={(e) => {
                                                                            onUpdateSubsection(section.id, subsection.id, { description: e.target.value });
                                                                        }}
                                                                        placeholder="Enter subsection description (optional, max 300 characters)"
                                                                        rows={2}
                                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                                    />
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
                                                                        console.log('🟨 ADD SUBSECTION FIELD CLICKED:', section.id, subsection.id);
                                                                        onAddField(section.id, 'text', subsection.id);
                                                                    }}
                                                                    disabled={!subsection.title}
                                                                    title={!subsection.title ? 'Please enter a valid subsection title first' : ''}
                                                                >
                                                                    <Plus className="w-4 h-4 mr-2" />
                                                                    Add Field
                                                                </Button>
                                                            </div>
                                                            <FieldDropZone
                                                                containerId={`subsection-${subsection.id}`}
                                                                className="space-y-2 min-h-[80px] p-3"
                                                                emptyMessage="Drop fields here or add new fields"
                                                            >
                                                                {(subsection.fields || []).map((field, index) => (
                                                                    <DraggableField
                                                                        key={field.id}
                                                                        fieldId={field.id}
                                                                        index={index}
                                                                    >
                                                                        <div className="p-3 border rounded-lg bg-white hover:shadow-sm transition-shadow">
                                                                            <div className="flex items-center justify-between">
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="font-medium text-gray-800">{field.label}</span>
                                                                                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">{field.type}</span>
                                                                                    <span className="text-xs text-gray-400">{getOptionCount(field)}</span>
                                                                                    {field.required && (
                                                                                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                                                                                            Required
                                                                                        </span>
                                                                                    )}
                                                                                    {selectedFieldId === field.id && (
                                                                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                                                                            Selected
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                                <div className="flex items-center gap-1">
                                                                                    <Button
                                                                                        size="sm"
                                                                                        variant="ghost"
                                                                                        onClick={() => onSelectField(field.id)}
                                                                                        className="text-gray-600 hover:text-gray-700"
                                                                                    >
                                                                                        Select
                                                                                    </Button>
                                                                                    <Button
                                                                                        size="sm"
                                                                                        variant="ghost"
                                                                                        onClick={() => onOpenFieldEditor(field.id)}
                                                                                        className="text-blue-600 hover:text-blue-700"
                                                                                    >
                                                                                        Edit
                                                                                    </Button>
                                                                                    <Button
                                                                                        size="sm"
                                                                                        variant="ghost"
                                                                                        onClick={() => onDeleteField(section.id, field.id, subsection.id)}
                                                                                        className="text-red-600 hover:text-red-700"
                                                                                    >
                                                                                        Delete
                                                                                    </Button>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </DraggableField>
                                                                ))}
                                                            </FieldDropZone>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                }}
                            />
                        </div>
                    )}

                    {/* Section Fields */}
                    <div>
                        <h5 className="font-medium text-sm text-gray-700 mb-3">Section Fields</h5>
                        <FieldDropZone
                            containerId={`section-${section.id}`}
                            className="space-y-4 min-h-[120px] p-4"
                            emptyMessage="Drop fields here or add new fields"
                        >
                            {section.fields.map((field, index) => (
                                <DraggableField
                                    key={field.id}
                                    fieldId={field.id}
                                    index={index}
                                >
                                    <div className="p-4 border rounded-lg bg-white hover:shadow-sm transition-shadow">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-gray-800">{field.label}</span>
                                                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">{field.type}</span>
                                                <span className="text-xs text-gray-400">{getOptionCount(field)}</span>
                                                {field.required && (
                                                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                                                        Required
                                                    </span>
                                                )}
                                                {selectedFieldId === field.id && (
                                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                                        Selected
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => onSelectField(field.id)}
                                                    className="text-gray-600 hover:text-gray-700"
                                                >
                                                    Select
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => onOpenFieldEditor(field.id)}
                                                    className="text-blue-600 hover:text-blue-700"
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => onDeleteField(section.id, field.id)}
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    Delete
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </DraggableField>
                            ))}
                        </FieldDropZone>
                    </div>
                </div>

            </div>
        </div>
    );
});

SectionEditor.displayName = 'SectionEditor';
