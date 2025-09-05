import { CheckSquare, List, Plus, Star, Trash2 } from 'lucide-react';
import { ErrorLoggingService } from '../../../../../services/error-logging.service';
import React, { memo, useEffect, useState } from 'react';
import { databaseHelpers } from '../../../../../config/database';
import { useValidation } from '../../../../../contexts/validation-context';
import { FieldDefaults, FieldType, MultiSelectOptionSet, RadioOptionSet, RatingScale, SurveySubsection } from '../../../../../types/framework.types';
import { Button, Input } from '../../../../common';
import { FIELD_TYPES } from '../../survey-builder.types';
import { FieldDropZone, DraggableField } from '../../drag-and-drop';

interface SubsectionEditorProps {
    subsection: SurveySubsection;
    sectionId: string;
    sectionDefaults?: FieldDefaults;
    onUpdateSubsection: (sectionId: string, subsectionId: string, updates: Partial<SurveySubsection>) => void;
    onAddField: (sectionId: string, fieldType: FieldType, subsectionId: string) => void;
    onOpenFieldEditor: (fieldId: string) => void;
    onDeleteField: (sectionId: string, fieldId: string, subsectionId?: string) => void;
    onReorderFields: (sectionId: string, oldIndex: number, newIndex: number, subsectionId: string) => void;
    onShowRatingScaleManager?: () => void;
    onShowRadioOptionSetManager?: () => void;
    onShowMultiSelectOptionSetManager?: () => void;
}

export const SubsectionEditor: React.FC<SubsectionEditorProps> = memo(({
    subsection,
    sectionId,
    sectionDefaults,
    onUpdateSubsection,
    onAddField,
    onOpenFieldEditor,
    onDeleteField,
    onShowRatingScaleManager,
    onShowRadioOptionSetManager,
    onShowMultiSelectOptionSetManager
}) => {
    const { validateSectionTitle, validateSectionDescription } = useValidation();


    const [radioOptionSets, setRadioOptionSets] = useState<Record<string, RadioOptionSet>>({});
    const [multiSelectOptionSets, setMultiSelectOptionSets] = useState<Record<string, MultiSelectOptionSet>>({});
    const [ratingScales, setRatingScales] = useState<Record<string, RatingScale>>({});
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
                            errorMessage: 'Failed to load radio option set for subsection field',
                            stackTrace: error instanceof Error ? error.stack : String(error),
                            componentName: 'SubsectionEditor',
                            functionName: 'loadOptionSets',
                            additionalContext: {
                                subsectionId: subsection.id,
                                sectionId,
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
                            errorMessage: 'Failed to load multi-select option set for subsection field',
                            stackTrace: error instanceof Error ? error.stack : String(error),
                            componentName: 'SubsectionEditor',
                            functionName: 'loadOptionSets',
                            additionalContext: {
                                subsectionId: subsection.id,
                                sectionId,
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
                            errorMessage: 'Failed to load rating scale for subsection field',
                            stackTrace: error instanceof Error ? error.stack : String(error),
                            componentName: 'SubsectionEditor',
                            functionName: 'loadOptionSets',
                            additionalContext: {
                                subsectionId: subsection.id,
                                sectionId,
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
    }, [subsection.id]);

    const getOptionCount = (field: any) => {
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
    };

    return (
        <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 ml-4">
            <div className="mb-4">
                <h4 className="text-md font-semibold mb-3 text-gray-800 dark:text-gray-200">Subsection: {subsection.title}</h4>
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
                        <label htmlFor="subsection-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Description (optional)
                        </label>
                        <textarea
                            id="subsection-description"
                            name="subsectionDescription"
                            value={subsection.description || ''}
                            onChange={(e) => handleDescriptionChange(e.target.value)}
                            placeholder="Enter subsection description (optional, max 300 characters)"
                            rows={2}
                            className={`w-full px-3 py-2 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${descriptionError ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                                }`}
                        />
                        {descriptionError && (
                            <p className="mt-1 text-sm text-red-600">{descriptionError}</p>
                        )}
                    </div>
                </div>

                {/* Default Field Settings */}
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                    <h5 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Subsection Default Field Settings</h5>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                        Override section defaults for this subsection or inherit from section settings.
                        {sectionDefaults?.fieldType && (
                            <span className="ml-1 text-blue-600 dark:text-blue-400">
                                (Section default: {FIELD_TYPES.find(t => t.value === sectionDefaults.fieldType)?.label})
                            </span>
                        )}
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label htmlFor="subsection-default-field-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Default Field Type
                            </label>
                            <select
                                id="subsection-default-field-type"
                                value={subsection.defaults?.fieldType || ''}
                                onChange={(e) => {
                                    const fieldType = e.target.value as FieldType;
                                    onUpdateSubsection(sectionId, subsection.id, {
                                        defaults: {
                                            ...subsection.defaults,
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
                                <option value="">Inherit from section</option>
                                {FIELD_TYPES.map((type) => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Show option set selection for the effective field type */}
                        {((subsection.defaults?.fieldType || sectionDefaults?.fieldType) === 'rating') && (
                            <div>
                                <div className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Default Rating Scale
                                </div>
                                <div className="space-y-2">
                                    {subsection.defaults?.ratingScaleId ? (
                                        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Star className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                    <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                                        {subsection.defaults.ratingScaleName || 'Unknown Scale'}
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
                                                            onUpdateSubsection(sectionId, subsection.id, {
                                                                defaults: {
                                                                    ...subsection.defaults,
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
                                        <div className="space-y-2">
                                            <Button
                                                size="sm"
                                                onClick={() => onShowRatingScaleManager?.()}
                                                className="w-full justify-start bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 border-dashed border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                                                variant="ghost"
                                            >
                                                <Star className="w-4 h-4 mr-2" />
                                                Select Rating Scale
                                            </Button>
                                            {sectionDefaults?.ratingScaleId && (
                                                <div className="text-xs text-blue-600 dark:text-blue-400 px-2">
                                                    📋 Inheriting: {sectionDefaults.ratingScaleName}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {((subsection.defaults?.fieldType || sectionDefaults?.fieldType) === 'radio') && (
                            <div>
                                <div className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Default Radio Option Set
                                </div>
                                <div className="space-y-2">
                                    {subsection.defaults?.radioOptionSetId ? (
                                        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg p-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <List className="w-4 h-4 text-green-600 dark:text-green-400" />
                                                    <span className="text-sm font-medium text-green-900 dark:text-green-100">
                                                        {subsection.defaults.radioOptionSetName || 'Unknown Set'}
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
                                                            onUpdateSubsection(sectionId, subsection.id, {
                                                                defaults: {
                                                                    ...subsection.defaults,
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
                                        <div className="space-y-2">
                                            <Button
                                                size="sm"
                                                onClick={() => onShowRadioOptionSetManager?.()}
                                                className="w-full justify-start bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 border-dashed border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                                                variant="ghost"
                                            >
                                                <List className="w-4 h-4 mr-2" />
                                                Select Radio Options
                                            </Button>
                                            {sectionDefaults?.radioOptionSetId && (
                                                <div className="text-xs text-green-600 dark:text-green-400 px-2">
                                                    📋 Inheriting: {sectionDefaults.radioOptionSetName}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {((subsection.defaults?.fieldType || sectionDefaults?.fieldType) === 'multiselect') && (
                            <div>
                                <div className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Default Multi-Select Option Set
                                </div>
                                <div className="space-y-2">
                                    {subsection.defaults?.multiSelectOptionSetId ? (
                                        <div className="bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 rounded-lg p-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <CheckSquare className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                                    <span className="text-sm font-medium text-purple-900 dark:text-purple-100">
                                                        {subsection.defaults.multiSelectOptionSetName || 'Unknown Set'}
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
                                                            onUpdateSubsection(sectionId, subsection.id, {
                                                                defaults: {
                                                                    ...subsection.defaults,
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
                                        <div className="space-y-2">
                                            <Button
                                                size="sm"
                                                onClick={() => onShowMultiSelectOptionSetManager?.()}
                                                className="w-full justify-start bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 border-dashed border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                                                variant="ghost"
                                            >
                                                <CheckSquare className="w-4 h-4 mr-2" />
                                                Select Multi-Select Options
                                            </Button>
                                            {sectionDefaults?.multiSelectOptionSetId && (
                                                <div className="text-xs text-purple-600 dark:text-purple-400 px-2">
                                                    📋 Inheriting: {sectionDefaults.multiSelectOptionSetName}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
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
                            const defaultType = subsection.defaults?.fieldType || sectionDefaults?.fieldType || 'text';
                            onAddField(sectionId, defaultType, subsection.id);
                        }}
                        disabled={!subsection.title || titleError !== ''}
                        title={!subsection.title ? 'Please enter a valid subsection title first' : ''}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Field {(subsection.defaults?.fieldType || sectionDefaults?.fieldType) && `(${FIELD_TYPES.find(t => t.value === (subsection.defaults?.fieldType || sectionDefaults?.fieldType))?.label})`}
                    </Button>
                </div>
                <FieldDropZone
                    containerId={`subsection-${subsection.id}`}
                    className="space-y-2 min-h-[80px] p-3"
                    emptyMessage="📁 Drop fields here or add new subsection fields"
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
                                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => onDeleteField(sectionId, field.id, subsection.id)}
                                            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
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
    );
});

SubsectionEditor.displayName = 'SubsectionEditor';