import { CheckSquare, ChevronDown, ChevronRight, List, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { ErrorLoggingService } from '../../../../../services/error-logging.service';
import React, { memo, useEffect, useState, useCallback, useRef } from 'react';
import { databaseHelpers } from '../../../../../config/database';
import { useValidation } from '../../../../../contexts/validation-context';
import { FieldType, MultiSelectOptionSet, RadioOptionSet, RatingScale, SurveySection, SurveySubsection } from '../../../../../types/framework.types';
import { getOrderedSectionContent } from '../../../../../utils/section-content.utils';
import { Button, Input, SortableList } from '../../../../common';
import { FIELD_TYPES } from '../../survey-builder.types';
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
    onOpenFieldEditor: (fieldId: string) => void;
    onDeleteField: (sectionId: string, fieldId: string, subsectionId?: string) => void;
    onReorderFields: (sectionId: string, oldIndex: number, newIndex: number, subsectionId?: string) => void;
    onShowRatingScaleManager?: () => void;
    onShowRadioOptionSetManager?: () => void;
    onShowMultiSelectOptionSetManager?: () => void;
    onOptionSetSelect?: (optionSetId: string, optionSetName: string, optionSetType: 'rating' | 'radio' | 'multiselect') => void;
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
    onOpenFieldEditor,
    onDeleteField,
    onShowRatingScaleManager,
    onShowRadioOptionSetManager,
    onShowMultiSelectOptionSetManager
}) => {
    const { validateSectionTitle, validateSectionDescription } = useValidation();

    // State to track which subsections are expanded
    const [expandedSubsections, setExpandedSubsections] = useState<Set<string>>(new Set());
    
    // Local state for subsection inputs to prevent immediate updates
    const [subsectionInputs, setSubsectionInputs] = useState<Record<string, { title: string; description: string }>>({});
    const subsectionTimeoutRefs = useRef<Record<string, { title?: NodeJS.Timeout; description?: NodeJS.Timeout }>>({});

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
    const [ratingScales, setRatingScales] = useState<Record<string, RatingScale>>({});
    const [loadingOptionSets, setLoadingOptionSets] = useState<Record<string, boolean>>({});
    const [titleError, setTitleError] = useState<string>('');
    const [descriptionError, setDescriptionError] = useState<string>('');
    
    // Local state for inputs to prevent immediate updates
    const [localTitle, setLocalTitle] = useState(section.title);
    const [localDescription, setLocalDescription] = useState(section.description || '');
    
    // Debounce refs
    const titleTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const descriptionTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
    
    // Initialize subsection inputs when section changes
    useEffect(() => {
        const newInputs: Record<string, { title: string; description: string }> = {};
        (section.subsections || []).forEach(subsection => {
            newInputs[subsection.id] = {
                title: subsection.title,
                description: subsection.description || ''
            };
        });
        setSubsectionInputs(newInputs);
    }, [section.subsections?.length, section.id]); // Update when subsections change

    // Cleanup timeouts
    useEffect(() => {
        return () => {
            if (titleTimeoutRef.current) clearTimeout(titleTimeoutRef.current);
            if (descriptionTimeoutRef.current) clearTimeout(descriptionTimeoutRef.current);
            
            // Clean up subsection timeouts
            Object.values(subsectionTimeoutRefs.current).forEach(timeouts => {
                if (timeouts.title) clearTimeout(timeouts.title);
                if (timeouts.description) clearTimeout(timeouts.description);
            });
        };
    }, []);
    
    // Update local state when section changes
    useEffect(() => {
        setLocalTitle(section.title);
        setLocalDescription(section.description || '');
    }, [section.id]); // Only update when section ID changes, not on every prop update
    
    // Sync local state with section changes (but don't overwrite user input)
    useEffect(() => {
        // Only update if the section value changed from external source and we're not currently editing
        if (section.title !== localTitle && !titleTimeoutRef.current) {
            setLocalTitle(section.title);
        }
        if ((section.description || '') !== localDescription && !descriptionTimeoutRef.current) {
            setLocalDescription(section.description || '');
        }
    }, [section.title, section.description]); // Sync but don't interfere with active editing

    // Debounced handlers
    const handleTitleChange = useCallback((newTitle: string) => {
        setLocalTitle(newTitle);
        
        // Immediate validation for UI feedback
        const validation = validateSectionTitle(newTitle);
        setTitleError(validation.isValid ? '' : validation.error || '');
        
        // Debounce the actual state update
        if (titleTimeoutRef.current) clearTimeout(titleTimeoutRef.current);
        titleTimeoutRef.current = setTimeout(() => {
            const newType = newTitle.trim() ? generateSectionType(newTitle) : 'custom';
            onUpdateSection(section.id, {
                title: newTitle,
                type: newType as any
            });
        }, 500);
    }, [section.id, onUpdateSection, validateSectionTitle]);

    const handleDescriptionChange = useCallback((newDescription: string) => {
        setLocalDescription(newDescription);
        
        // Immediate validation for UI feedback
        const validation = validateSectionDescription(newDescription);
        setDescriptionError(validation.isValid ? '' : validation.error || '');
        
        // Debounce the actual state update
        if (descriptionTimeoutRef.current) clearTimeout(descriptionTimeoutRef.current);
        descriptionTimeoutRef.current = setTimeout(() => {
            onUpdateSection(section.id, { description: newDescription });
        }, 500);
    }, [section.id, onUpdateSection, validateSectionDescription]);

    // Debounced handlers for subsection inputs
    const handleSubsectionTitleChange = useCallback((subsectionId: string, newTitle: string) => {
        // Update local state immediately for UI feedback
        setSubsectionInputs(prev => ({
            ...prev,
            [subsectionId]: { ...prev[subsectionId], title: newTitle }
        }));
        
        // Debounce the actual state update
        if (!subsectionTimeoutRefs.current[subsectionId]) {
            subsectionTimeoutRefs.current[subsectionId] = {};
        }
        
        if (subsectionTimeoutRefs.current[subsectionId].title) {
            clearTimeout(subsectionTimeoutRefs.current[subsectionId].title);
        }
        
        subsectionTimeoutRefs.current[subsectionId].title = setTimeout(() => {
            onUpdateSubsection(section.id, subsectionId, { title: newTitle });
            delete subsectionTimeoutRefs.current[subsectionId].title;
        }, 500);
    }, [section.id, onUpdateSubsection]);

    const handleSubsectionDescriptionChange = useCallback((subsectionId: string, newDescription: string) => {
        // Update local state immediately for UI feedback
        setSubsectionInputs(prev => ({
            ...prev,
            [subsectionId]: { ...prev[subsectionId], description: newDescription }
        }));
        
        // Debounce the actual state update
        if (!subsectionTimeoutRefs.current[subsectionId]) {
            subsectionTimeoutRefs.current[subsectionId] = {};
        }
        
        if (subsectionTimeoutRefs.current[subsectionId].description) {
            clearTimeout(subsectionTimeoutRefs.current[subsectionId].description);
        }
        
        subsectionTimeoutRefs.current[subsectionId].description = setTimeout(() => {
            onUpdateSubsection(section.id, subsectionId, { description: newDescription });
            delete subsectionTimeoutRefs.current[subsectionId].description;
        }, 500);
    }, [section.id, onUpdateSubsection]);

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
                (field.type === 'multiselect' && field.multiSelectOptionSetId) ||
                (field.type === 'rating' && field.ratingScaleId)
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
                        ErrorLoggingService.logError({
                            severity: 'medium',
                            errorMessage: 'Failed to load radio option set for section field',
                            stackTrace: error instanceof Error ? error.stack : String(error),
                            componentName: 'SectionEditor',
                            functionName: 'loadOptionSets',
                            additionalContext: {
                                sectionId: section.id,
                                fieldId: field.id,
                                radioOptionSetId: field.radioOptionSetId,
                                error: error instanceof Error ? error.message : String(error)
                            }
                        });
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
                        ErrorLoggingService.logError({
                            severity: 'medium',
                            errorMessage: 'Failed to load multi-select option set for section field',
                            stackTrace: error instanceof Error ? error.stack : String(error),
                            componentName: 'SectionEditor',
                            functionName: 'loadOptionSets',
                            additionalContext: {
                                sectionId: section.id,
                                fieldId: field.id,
                                multiSelectOptionSetId: field.multiSelectOptionSetId,
                                error: error instanceof Error ? error.message : String(error)
                            }
                        });
                    } finally {
                        setLoadingOptionSets(prev => ({ ...prev, [field.multiSelectOptionSetId!]: false }));
                    }
                }

                if (field.type === 'rating' && field.ratingScaleId && !ratingScales[field.ratingScaleId]) {
                    setLoadingOptionSets(prev => ({ ...prev, [field.ratingScaleId!]: true }));
                    try {
                        const ratingScale = await databaseHelpers.getRatingScale(field.ratingScaleId);
                        if (ratingScale) {
                            setRatingScales(prev => ({ ...prev, [field.ratingScaleId!]: ratingScale }));
                        }
                    } catch (error) {
                        ErrorLoggingService.logError({
                            severity: 'medium',
                            errorMessage: 'Failed to load rating scale for section field',
                            stackTrace: error instanceof Error ? error.stack : String(error),
                            componentName: 'SectionEditor',
                            functionName: 'loadOptionSets',
                            additionalContext: {
                                sectionId: section.id,
                                fieldId: field.id,
                                ratingScaleId: field.ratingScaleId,
                                error: error instanceof Error ? error.message : String(error)
                            }
                        });
                    } finally {
                        setLoadingOptionSets(prev => ({ ...prev, [field.ratingScaleId!]: false }));
                    }
                }
            }
        };

        loadOptionSets();
    }, [section.id]);

    const getOptionCount = useCallback((field: any) => {
        if (field.ratingScaleId) {
            const ratingScale = ratingScales[field.ratingScaleId];
            if (ratingScale) {
                return `${ratingScale.options.length} options`;
            }
            if (loadingOptionSets[field.ratingScaleId]) {
                return 'Loading...';
            }
            return 'Failed to load';
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
    }, [ratingScales, radioOptionSets, multiSelectOptionSets, loadingOptionSets]);

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
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Section: {section.title}</h3>
                <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-4">
                    <div>
                        <Input
                            name="sectionTitle"
                            label="Section Title *"
                            value={localTitle}
                            onChange={handleTitleChange}
                            error={titleError}
                            placeholder="e.g., About Us, Contact Info"
                        />
                    </div>
                    <div>
                        <label htmlFor="section-type" className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                            Section Type (Auto-generated) *
                        </label>
                        <input
                            id="section-type"
                            type="text"
                            value={section.type || ''}
                            readOnly
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 cursor-not-allowed"
                            placeholder={localTitle ? generateSectionType(localTitle) : 'Enter title to generate type'}
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Auto-generated from title in kebab-case format
                        </p>
                    </div>
                </div>
                <div className="mt-4">
                    <label htmlFor="section-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Description (optional)
                    </label>
                    <textarea
                        id="section-description"
                        name="sectionDescription"
                        value={localDescription}
                        onChange={(e) => handleDescriptionChange(e.target.value)}
                        placeholder="Enter section description (optional, max 300 characters)"
                        rows={3}
                        className={`w-full px-3 py-2 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${descriptionError ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                            }`}
                    />
                    {descriptionError && (
                        <p className="mt-1 text-sm text-red-600">{descriptionError}</p>
                    )}
                </div>

                {/* Default Field Settings */}
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Default Field Settings</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
                        Set default field type and option sets for new fields added to this section. Subsections can inherit or override these defaults.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="section-default-field-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Default Field Type
                            </label>
                            <select
                                id="section-default-field-type"
                                value={section.defaults?.fieldType || ''}
                                onChange={(e) => {
                                    const fieldType = e.target.value as FieldType;
                                    onUpdateSection(section.id, {
                                        defaults: {
                                            ...section.defaults,
                                            fieldType: fieldType || undefined,
                                            // Clear option sets when field type changes
                                            ...(fieldType !== 'rating' && { ratingScaleId: undefined, ratingScaleName: undefined }),
                                            ...(fieldType !== 'radio' && { radioOptionSetId: undefined, radioOptionSetName: undefined }),
                                            ...(fieldType !== 'multiselect' && { multiSelectOptionSetId: undefined, multiSelectOptionSetName: undefined })
                                        }
                                    });
                                }}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            >
                                <option value="">No default (users choose)</option>
                                {FIELD_TYPES.map((type) => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Conditional Option Set Selection */}
                        {section.defaults?.fieldType === 'rating' && (
                            <div>
                                <div className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Default Rating Scale
                                </div>
                                <div className="space-y-2">
                                    {section.defaults?.ratingScaleId ? (
                                        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Star className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                    <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                                        {section.defaults.ratingScaleName || 'Unknown Scale'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => onShowRatingScaleManager?.()}
                                                        className="text-blue-700 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200 h-7 px-2"
                                                    >
                                                        Change
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            onUpdateSection(section.id, {
                                                                defaults: {
                                                                    ...section.defaults,
                                                                    ratingScaleId: undefined,
                                                                    ratingScaleName: undefined
                                                                }
                                                            });
                                                        }}
                                                        className="text-red-500 hover:text-red-600 h-7 px-2"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <Button
                                            size="sm"
                                            onClick={() => onShowRatingScaleManager?.()}
                                            className="w-full justify-start bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 border-dashed border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                                            variant="ghost"
                                        >
                                            <Star className="w-4 h-4 mr-2" />
                                            Select Rating Scale
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}

                        {section.defaults?.fieldType === 'radio' && (
                            <div>
                                <div className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Default Radio Option Set
                                </div>
                                <div className="space-y-2">
                                    {section.defaults?.radioOptionSetId ? (
                                        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg p-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <List className="w-4 h-4 text-green-600 dark:text-green-400" />
                                                    <span className="text-sm font-medium text-green-900 dark:text-green-100">
                                                        {section.defaults.radioOptionSetName || 'Unknown Set'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => onShowRadioOptionSetManager?.()}
                                                        className="text-green-700 hover:text-green-800 dark:text-green-300 dark:hover:text-green-200 h-7 px-2"
                                                    >
                                                        Change
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            onUpdateSection(section.id, {
                                                                defaults: {
                                                                    ...section.defaults,
                                                                    radioOptionSetId: undefined,
                                                                    radioOptionSetName: undefined
                                                                }
                                                            });
                                                        }}
                                                        className="text-red-500 hover:text-red-600 h-7 px-2"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <Button
                                            size="sm"
                                            onClick={() => onShowRadioOptionSetManager?.()}
                                            className="w-full justify-start bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 border-dashed border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                                            variant="ghost"
                                        >
                                            <List className="w-4 h-4 mr-2" />
                                            Select Radio Options
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}

                        {section.defaults?.fieldType === 'multiselect' && (
                            <div>
                                <div className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Default Multi-Select Option Set
                                </div>
                                <div className="space-y-2">
                                    {section.defaults?.multiSelectOptionSetId ? (
                                        <div className="bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 rounded-lg p-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <CheckSquare className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                                    <span className="text-sm font-medium text-purple-900 dark:text-purple-100">
                                                        {section.defaults.multiSelectOptionSetName || 'Unknown Set'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => onShowMultiSelectOptionSetManager?.()}
                                                        className="text-purple-700 hover:text-purple-800 dark:text-purple-300 dark:hover:text-purple-200 h-7 px-2"
                                                    >
                                                        Change
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            onUpdateSection(section.id, {
                                                                defaults: {
                                                                    ...section.defaults,
                                                                    multiSelectOptionSetId: undefined,
                                                                    multiSelectOptionSetName: undefined
                                                                }
                                                            });
                                                        }}
                                                        className="text-red-500 hover:text-red-600 h-7 px-2"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <Button
                                            size="sm"
                                            onClick={() => onShowMultiSelectOptionSetManager?.()}
                                            className="w-full justify-start bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 border-dashed border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                                            variant="ghost"
                                        >
                                            <CheckSquare className="w-4 h-4 mr-2" />
                                            Select Multi-Select Options
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Section Content - Unified Fields and Subsections */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">Section Content</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Fields and subsections will be rendered in the order shown below</p>
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
                                const defaultType = section.defaults?.fieldType || 'text';
                                onAddField(section.id, defaultType);
                            }}
                            disabled={!section.title || !section.type || titleError !== ''}
                            title={!section.title || !section.type ? 'Please enter a valid section title first' : ''}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Field {section.defaults?.fieldType && `(${FIELD_TYPES.find(t => t.value === section.defaults?.fieldType)?.label})`}
                        </Button>
                    </div>
                </div>

                {/* Content Layout Preview */}
                {onReorderSectionContent && getOrderedSectionContent(section).length > 0 && (
                    <div className="mb-6">
                        <h5 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">Content Order Preview</h5>
                        <SortableList
                            items={getOrderedSectionContent(section).map(item => ({ ...item, id: item.contentId }))}
                            onReorder={(oldIndex, newIndex) => onReorderSectionContent(section.id, oldIndex, newIndex)}
                            className="space-y-2"
                            itemClassName="border rounded-md"
                            disabled={false}
                            droppableId={`section-content-${section.id}`}
                            renderItem={(contentItem, _isDragging) => {
                                if (contentItem.type === 'subsection') {
                                    const subsectionData = contentItem.data as SurveySubsection;
                                    return (
                                        <div className="p-3 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-green-700 dark:text-green-300 text-sm">📁 {subsectionData.title}</span>
                                                </div>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">({subsectionData.fields.length} fields)</span>
                                            </div>
                                        </div>
                                    );
                                } else if (contentItem.type === 'field') {
                                    const field = contentItem.data as any;
                                    return (
                                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-blue-700 dark:text-blue-300 text-sm">🔷 {field.label}</span>
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
                            <h5 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-3">Subsections</h5>
                            <SortableList
                                items={section.subsections}
                                onReorder={(oldIndex, newIndex) => onReorderSubsections(section.id, oldIndex, newIndex)}
                                className="space-y-4"
                                itemClassName=""
                                disabled={true}
                                droppableId={`subsections-${section.id}`}
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
                                                ? "border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/20 ring-2 ring-green-200 dark:ring-green-700"
                                                : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800"
                                                } border rounded-lg transition-all duration-200`}
                                        >
                                            {/* Subsection Header - Always Visible */}
                                            <div className={`${isExpanded ? 'p-4' : 'p-3'}`}>
                                                <div className={`flex items-center justify-between ${isExpanded ? 'mb-3' : 'mb-0'}`}>
                                                    <div className="flex items-center gap-2 flex-1">
                                                        <button
                                                            onClick={() => toggleSubsection(subsection.id)}
                                                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                                            title={isExpanded ? "Collapse subsection" : "Expand subsection"}
                                                        >
                                                            {isExpanded ? (
                                                                <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                                            ) : (
                                                                <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
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
                                                            <span className="font-medium text-green-700 dark:text-green-300">📁 {subsection.title}</span>
                                                            <span className="text-xs text-gray-500 dark:text-gray-400">({subsection.fields.length} fields)</span>
                                                            {(isSelected || hasSelectedField) && (
                                                                <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
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
                                                    <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 ml-4">
                                                        <div className="mb-4">
                                                            <h4 className="text-md font-semibold mb-3 text-gray-800 dark:text-gray-200">Subsection: {subsection.title}</h4>
                                                            <div className="grid grid-cols-1 gap-3">
                                                                <div>
                                                                    <Input
                                                                        name="subsectionTitle"
                                                                        label="Subsection Title *"
                                                                        value={subsectionInputs[subsection.id]?.title || subsection.title}
                                                                        onChange={(newTitle) => {
                                                                            handleSubsectionTitleChange(subsection.id, newTitle);
                                                                        }}
                                                                        placeholder="e.g., Personal Details, Preferences"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label htmlFor="subsection-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                                        Description (optional)
                                                                    </label>
                                                                    <textarea
                                                                        id="subsection-description"
                                                                        name="subsectionDescription"
                                                                        value={subsectionInputs[subsection.id]?.description || subsection.description || ''}
                                                                        onChange={(e) => {
                                                                            handleSubsectionDescriptionChange(subsection.id, e.target.value);
                                                                        }}
                                                                        placeholder="Enter subsection description (optional, max 300 characters)"
                                                                        rows={2}
                                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="mb-4">
                                                            <div className="flex items-center justify-between mb-3">
                                                                <div>
                                                                    <h5 className="font-medium text-sm text-gray-900 dark:text-gray-100">Fields</h5>
                                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Click on a field to select it, then use the edit button to modify</p>
                                                                </div>
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        const defaultType = subsection.defaults?.fieldType || section.defaults?.fieldType || 'text';
                                                                        onAddField(section.id, defaultType, subsection.id);
                                                                    }}
                                                                    disabled={!subsection.title}
                                                                    title={!subsection.title ? 'Please enter a valid subsection title first' : ''}
                                                                >
                                                                    <Plus className="w-4 h-4 mr-2" />
                                                                    Add Field {(subsection.defaults?.fieldType || section.defaults?.fieldType) && `(${FIELD_TYPES.find(t => t.value === (subsection.defaults?.fieldType || section.defaults?.fieldType))?.label})`}
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
                                                                        <div className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 hover:shadow-sm transition-shadow">
                                                                            <div className="flex items-center justify-between">
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="font-medium text-gray-800 dark:text-gray-200">{field.label}</span>
                                                                                    <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{field.type}</span>
                                                                                    <span className="text-xs text-gray-400 dark:text-gray-500">{getOptionCount(field)}</span>
                                                                                    {field.required && (
                                                                                        <span className="text-xs bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-full font-medium">
                                                                                            Required
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                                <div className="flex items-center gap-1">
                                                                                    <Button
                                                                                        size="sm"
                                                                                        variant="ghost"
                                                                                        onClick={() => onOpenFieldEditor(field.id)}
                                                                                        className="text-blue-600 hover:text-blue-700 p-1"
                                                                                        title="Edit field"
                                                                                    >
                                                                                        <Pencil className="w-4 h-4" />
                                                                                    </Button>
                                                                                    <Button
                                                                                        size="sm"
                                                                                        variant="ghost"
                                                                                        onClick={() => onDeleteField(section.id, field.id, subsection.id)}
                                                                                        className="text-red-600 hover:text-red-700 p-1"
                                                                                        title="Delete field"
                                                                                    >
                                                                                        <Trash2 className="w-4 h-4" />
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
                        <h5 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-3">Section Fields</h5>
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
                                    <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 hover:shadow-sm transition-shadow">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-gray-800 dark:text-gray-200">{field.label}</span>
                                                <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{field.type}</span>
                                                <span className="text-xs text-gray-400 dark:text-gray-500">{getOptionCount(field)}</span>
                                                {field.required && (
                                                    <span className="text-xs bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-full font-medium">
                                                        Required
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => onOpenFieldEditor(field.id)}
                                                    className="text-blue-600 hover:text-blue-700 p-1"
                                                    title="Edit field"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => onDeleteField(section.id, field.id)}
                                                    className="text-red-600 hover:text-red-700 p-1"
                                                    title="Delete field"
                                                >
                                                    <Trash2 className="w-4 h-4" />
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
