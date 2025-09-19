import { CheckSquare, ChevronDown, ChevronRight, Clock, List, Plus, Star, Trash2, Image } from 'lucide-react';
import { ErrorLoggingService } from '../../../../../../services/error-logging.service';
import React, { useCallback, useEffect, useState, useRef } from 'react';
import { databaseHelpers } from '../../../../../../config/database';
import { useValidation } from '../../../../../../contexts/validation-context';
import { FieldType, MultiSelectOptionSet, RadioOptionSet, RatingScale, SelectOptionSet, SurveyField } from '../../../../../../types/framework.types';
import { Button, Input } from '../../../../../common';
import Modal from '../../../../../common/ui/modal/Modal';
import { OptionSetPreview } from '../../../shared';
import { ImagePicker } from '../../../../../common/form/image-picker';
import { IMAGE_PICKER_DEFAULTS } from '../../../../../common/form/image-picker/image-picker.types';
import { FIELD_TYPES } from '../../../survey-builder.types';

interface FieldEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    field: SurveyField | null;
    sectionId: string;
    configId: string;
    onUpdateField: (sectionId: string, fieldId: string, updates: Partial<SurveyField>) => void;
    onSaveFieldChanges?: (sectionId: string, fieldId: string, originalLabel: string, currentLabel: string, subsectionId?: string) => void;
    onAddFieldOption: (sectionId: string, fieldId: string) => void;
    onUpdateFieldOption: (sectionId: string, fieldId: string, optionIndex: number, updates: { label?: string; value?: string; color?: string }) => void;
    onDeleteFieldOption: (sectionId: string, fieldId: string, optionIndex: number) => void;
    onShowRatingScaleManager: () => void;
    onShowRadioOptionSetManager: () => void;
    onShowMultiSelectOptionSetManager: () => void;
    onShowSelectOptionSetManager: () => void;
    subsectionId?: string;
}

export const FieldEditorModal: React.FC<FieldEditorModalProps> = ({
    isOpen,
    onClose,
    onSave,
    field,
    sectionId,
    configId,
    onUpdateField,
    onSaveFieldChanges,
    onAddFieldOption,
    onUpdateFieldOption,
    onDeleteFieldOption,
    onShowRatingScaleManager,
    onShowRadioOptionSetManager,
    onShowMultiSelectOptionSetManager,
    onShowSelectOptionSetManager,
    subsectionId
}) => {
    const { validateFieldLabel, validateFieldPlaceholder, validateFieldOptions } = useValidation();
    const [loadedRatingScale, setLoadedRatingScale] = useState<RatingScale | null>(null);
    const [loadedRadioOptionSet, setLoadedRadioOptionSet] = useState<RadioOptionSet | null>(null);
    const [loadedMultiSelectOptionSet, setLoadedMultiSelectOptionSet] = useState<MultiSelectOptionSet | null>(null);
    const [loadedSelectOptionSet, setLoadedSelectOptionSet] = useState<SelectOptionSet | null>(null);
    const [isLoadingOptionSets, setIsLoadingOptionSets] = useState(false);
    const [labelError, setLabelError] = useState<string>('');
    const [placeholderError, setPlaceholderError] = useState<string>('');
    const [optionsError, setOptionsError] = useState<string>('');
    const [showLabelHistory, setShowLabelHistory] = useState(false);

    // Track the original label when the modal opens to detect actual changes
    const [originalLabel, setOriginalLabel] = useState<string>('');
    
    // Local state for inputs to prevent immediate updates
    const [localLabel, setLocalLabel] = useState<string>('');
    const [localPlaceholder, setLocalPlaceholder] = useState<string>('');
    
    // Debounce refs
    const labelTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const placeholderTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const validationTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
    
    // Cleanup timeouts
    useEffect(() => {
        return () => {
            if (labelTimeoutRef.current) clearTimeout(labelTimeoutRef.current);
            if (placeholderTimeoutRef.current) clearTimeout(placeholderTimeoutRef.current);
            if (validationTimeoutRef.current) clearTimeout(validationTimeoutRef.current);
        };
    }, []);

    // Debounced validation
    const debouncedValidateLabel = useCallback((value: string) => {
        if (validationTimeoutRef.current) clearTimeout(validationTimeoutRef.current);
        validationTimeoutRef.current = setTimeout(() => {
            const validation = validateFieldLabel(value);
            setLabelError(validation.isValid ? '' : validation.error || '');
        }, 300);
    }, [validateFieldLabel]);

    const debouncedValidatePlaceholder = useCallback((value: string) => {
        if (validationTimeoutRef.current) clearTimeout(validationTimeoutRef.current);
        validationTimeoutRef.current = setTimeout(() => {
            const validation = validateFieldPlaceholder(value);
            setPlaceholderError(validation.isValid ? '' : validation.error || '');
        }, 300);
    }, [validateFieldPlaceholder]);

    // Debounced update handlers
    const handleLabelChange = useCallback((value: string) => {
        if (!field) return;
        setLocalLabel(value);
        debouncedValidateLabel(value);
        
        // Debounce the actual state update
        if (labelTimeoutRef.current) clearTimeout(labelTimeoutRef.current);
        labelTimeoutRef.current = setTimeout(() => {
            onUpdateField(sectionId, field.id, { label: value });
        }, 300);
    }, [field, sectionId, onUpdateField, debouncedValidateLabel]);

    const handlePlaceholderChange = useCallback((value: string) => {
        if (!field) return;
        setLocalPlaceholder(value);
        debouncedValidatePlaceholder(value);
        
        // Debounce the actual state update
        if (placeholderTimeoutRef.current) clearTimeout(placeholderTimeoutRef.current);
        placeholderTimeoutRef.current = setTimeout(() => {
            onUpdateField(sectionId, field.id, { placeholder: value });
        }, 300);
    }, [field, sectionId, onUpdateField, debouncedValidatePlaceholder]);

    const validateOptions = useCallback((): boolean => {
        if (!field) return true;
        const validation = validateFieldOptions(field);
        setOptionsError(validation.isValid ? '' : validation.error || '');
        return validation.isValid;
    }, [field, validateFieldOptions]);

    const handleSave = () => {
        if (!field) return;
        // Validate all fields before saving
        const labelValidation = validateFieldLabel(field.label);
        const placeholderValidation = validateFieldPlaceholder(field.placeholder || '');
        const optionsValidation = validateFieldOptions(field);

        setLabelError(labelValidation.isValid ? '' : labelValidation.error || '');
        setPlaceholderError(placeholderValidation.isValid ? '' : placeholderValidation.error || '');
        setOptionsError(optionsValidation.isValid ? '' : optionsValidation.error || '');

        if (labelValidation.isValid && placeholderValidation.isValid && optionsValidation.isValid) {
            // Always call save function for label history tracking (even if label didn't change)
            // This ensures existing fields get initialized with label history
            if (onSaveFieldChanges) {
                onSaveFieldChanges(sectionId, field.id, originalLabel, field.label, subsectionId);
            }

            onSave();
            onClose();
        }
    };

    const handleCancel = () => {
        onClose();
    };

    // Reset original label and local state when modal opens/closes
    useEffect(() => {
        if (isOpen && field) {
            setOriginalLabel(field.label);
            setLocalLabel(field.label);
            setLocalPlaceholder(field.placeholder || '');
        } else if (!isOpen) {
            setOriginalLabel('');
            setLocalLabel('');
            setLocalPlaceholder('');
        }
    }, [isOpen, field?.id]); // Only reset when modal opens or field ID changes
    
    // Sync local state with field changes (but don't overwrite user input)
    useEffect(() => {
        if (field && isOpen) {
            // Only update if the field value changed from external source and we're not currently editing
            if (field.label !== localLabel && !labelTimeoutRef.current) {
                setLocalLabel(field.label);
            }
            if ((field.placeholder || '') !== localPlaceholder && !placeholderTimeoutRef.current) {
                setLocalPlaceholder(field.placeholder || '');
            }
        }
    }, [field?.label, field?.placeholder, isOpen]); // Sync but don't interfere with active editing


    // Load option sets and validate when field changes
    useEffect(() => {
        const loadOptionSets = async () => {
            if (!field) return;

            setIsLoadingOptionSets(true);
            setLoadedRatingScale(null);
            setLoadedRadioOptionSet(null);
            setLoadedMultiSelectOptionSet(null);
            setLoadedSelectOptionSet(null);

            // Validate current field state
            const labelValidation = validateFieldLabel(field.label);
            setLabelError(labelValidation.isValid ? '' : labelValidation.error || '');

            const placeholderValidation = validateFieldPlaceholder(field.placeholder || '');
            setPlaceholderError(placeholderValidation.isValid ? '' : placeholderValidation.error || '');

            try {
                if (field.ratingScaleId) {
                    const ratingScale = await databaseHelpers.getRatingScale(field.ratingScaleId);
                    setLoadedRatingScale(ratingScale);
                }

                if (field.radioOptionSetId) {
                    const radioOptionSet = await databaseHelpers.getRadioOptionSet(field.radioOptionSetId);
                    setLoadedRadioOptionSet(radioOptionSet);
                }

                if (field.multiSelectOptionSetId) {
                    const multiSelectOptionSet = await databaseHelpers.getMultiSelectOptionSet(field.multiSelectOptionSetId);
                    setLoadedMultiSelectOptionSet(multiSelectOptionSet);
                }

                if (field.selectOptionSetId) {
                    const selectOptionSet = await databaseHelpers.getSelectOptionSet(field.selectOptionSetId);
                    setLoadedSelectOptionSet(selectOptionSet);
                }
            } catch (error) {
                ErrorLoggingService.logError({
                    severity: 'medium',
                    errorMessage: 'Failed to load option sets for field editor modal',
                    stackTrace: error instanceof Error ? error.stack : String(error),
                    componentName: 'FieldEditorModal',
                    functionName: 'loadOptionSets',
                    additionalContext: {
                        fieldId: field.id,
                        fieldType: field.type,
                        ratingScaleId: field.ratingScaleId,
                        radioOptionSetId: field.radioOptionSetId,
                        multiSelectOptionSetId: field.multiSelectOptionSetId,
                        selectOptionSetId: field.selectOptionSetId,
                        error: error instanceof Error ? error.message : String(error)
                    }
                });
            } finally {
                setIsLoadingOptionSets(false);
                // Validate options after loading
                validateOptions();
            }
        };

        loadOptionSets();
    }, [field?.ratingScaleId, field?.radioOptionSetId, field?.multiSelectOptionSetId, field?.selectOptionSetId, field?.label, field?.placeholder, validateFieldLabel, validateFieldPlaceholder, field, validateOptions]);

    // Validate options when they change
    useEffect(() => {
        if (field) {
            validateOptions();
        }
    }, [field?.options, validateOptions, field]);

    if (!field) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="full"
        >
            <Modal.Header>
                <Modal.Title>{`Edit Field: ${field.label} (${FIELD_TYPES.find(t => t.value === field.type)?.label})`}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
            <div className="space-y-6 max-h-[70vh] overflow-y-auto px-2">
                {/* Basic Field Configuration */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600 pb-2">
                        Basic Configuration
                    </h3>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <Input
                            name="fieldLabel"
                            label="Field Label *"
                            value={localLabel}
                            onChange={handleLabelChange}
                            placeholder="Enter field label (1-500 characters)"
                            error={labelError}
                        />
                        <div>
                            <label htmlFor="field-type" className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                                Field Type
                            </label>
                            <select
                                id="field-type"
                                value={field.type}
                                onChange={(e) => onUpdateField(sectionId, field.id, { type: e.target.value as FieldType })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            >
                                {FIELD_TYPES.map((type) => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <label className="flex items-center text-gray-900 dark:text-gray-100">
                            <input
                                type="checkbox"
                                checked={field.required}
                                onChange={(e) => onUpdateField(sectionId, field.id, { required: e.target.checked })}
                                className="mr-2 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
                            />
                            Required field
                        </label>
                    </div>

                    <Input
                        name="fieldPlaceholder"
                        label="Placeholder Text"
                        value={localPlaceholder}
                        onChange={handlePlaceholderChange}
                        placeholder="Enter placeholder text (optional, max 150 characters)"
                        error={placeholderError}
                    />

                    {/* Min/Max Selection Configuration for Multiselect */}
                    {((field.type === 'multiselect' && !field.multiSelectOptionSetId) || (field.type === 'multiselectdropdown' && !field.selectOptionSetId)) && (
                        <div className="space-y-4 p-4 border border-blue-200 dark:border-blue-700 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                            <h4 className="font-medium text-blue-900 dark:text-blue-100">Selection Constraints</h4>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                Set minimum and maximum number of options users can select. Leave empty for no limits.
                            </p>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <Input
                                    name="minSelections"
                                    label="Minimum Selections"
                                    type="number"
                                    value={field.validation?.find(rule => rule.type === 'minSelections')?.value?.toString() || ''}
                                    onChange={(value) => {
                                        const numValue = parseInt(value) || 0;
                                        const currentValidation = field.validation || [];
                                        const filteredValidation = currentValidation.filter(rule => rule.type !== 'minSelections');
                                        const newValidation = value ? [...filteredValidation, { type: 'minSelections' as const, value: numValue }] : filteredValidation;
                                        onUpdateField(sectionId, field.id, { validation: newValidation });
                                    }}
                                    placeholder="0"
                                />
                                <Input
                                    name="maxSelections"
                                    label="Maximum Selections"
                                    type="number"
                                    value={field.validation?.find(rule => rule.type === 'maxSelections')?.value?.toString() || ''}
                                    onChange={(value) => {
                                        const numValue = parseInt(value) || 0;
                                        const currentValidation = field.validation || [];
                                        const filteredValidation = currentValidation.filter(rule => rule.type !== 'maxSelections');
                                        const newValidation = value ? [...filteredValidation, { type: 'maxSelections' as const, value: numValue }] : filteredValidation;
                                        onUpdateField(sectionId, field.id, { validation: newValidation });
                                    }}
                                    placeholder="Unlimited"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Label History Section */}
                {field.labelHistory && field.labelHistory.length > 1 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600 pb-2 flex-1">
                                Label History
                            </h3>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setShowLabelHistory(!showLabelHistory)}
                                className="ml-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                            >
                                {showLabelHistory ? (
                                    <ChevronDown className="w-4 h-4" />
                                ) : (
                                    <ChevronRight className="w-4 h-4" />
                                )}
                                <span className="ml-1 text-sm">
                                    {showLabelHistory ? 'Hide' : 'Show'} ({field.labelHistory.length} changes)
                                </span>
                            </Button>
                        </div>

                        {showLabelHistory && (
                            <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                                <div className="flex items-center text-blue-700 dark:text-blue-300 mb-3">
                                    <Clock className="w-4 h-4 mr-2" />
                                    <span className="text-sm font-medium">
                                        Track of all label changes for data export and migration purposes
                                    </span>
                                </div>
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {field.labelHistory
                                        .slice()
                                        .reverse() // Show most recent first
                                        .map((entry, index) => (
                                            <div
                                                key={index}
                                                className="flex items-start justify-between p-3 bg-white dark:bg-gray-800 rounded border border-blue-100 dark:border-blue-700"
                                            >
                                                <div className="flex-1">
                                                    <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                                        &ldquo;{entry.label}&rdquo;
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                        {new Date(entry.changedAt).toLocaleString()}
                                                        {entry.changedBy && (
                                                            <span className="ml-2">by {entry.changedBy}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                {index === 0 && (
                                                    <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                                                        Current
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Field Options Configuration */}
                {FIELD_TYPES.find(t => t.value === field.type)?.hasOptions && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600 pb-2">
                            Field Options
                        </h3>

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Configure the options that users can select from.
                                    {field.type === 'radio' && ' Users can select only one option.'}
                                    {field.type === 'select' && ' Users can select one option from dropdown.'}
                                    {field.type === 'multiselect' && ' Users can select multiple options using checkboxes.'}
                                    {field.type === 'multiselectdropdown' && ' Users can select multiple options from dropdown.'}
                                    {field.type === 'rating' && ' Users can select one rating option.'}
                                </p>
                                {optionsError && (
                                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">{optionsError}</p>
                                )}
                            </div>
                            <div className="flex space-x-2">
                                {field.type === 'rating' && (
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={onShowRatingScaleManager}
                                        className="bg-gray-600 dark:bg-gray-600 hover:bg-gray-700 dark:hover:bg-gray-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                                    >
                                        <Star className="w-4 h-4 mr-1" />
                                        Use Rating Scale
                                    </Button>
                                )}
                                {field.type === 'radio' && (
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={onShowRadioOptionSetManager}
                                        className="bg-gray-600 dark:bg-gray-600 hover:bg-gray-700 dark:hover:bg-gray-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                                    >
                                        <List className="w-4 h-4 mr-1" />
                                        Use Radio Option Set
                                    </Button>
                                )}
                                {(field.type === 'select' || field.type === 'multiselectdropdown') && (
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={onShowSelectOptionSetManager}
                                        className="bg-gray-600 dark:bg-gray-600 hover:bg-gray-700 dark:hover:bg-gray-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                                    >
                                        <ChevronDown className="w-4 h-4 mr-1" />
                                        Use Select Option Set
                                    </Button>
                                )}
                                {field.type === 'multiselect' && (
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={onShowMultiSelectOptionSetManager}
                                        className="bg-gray-600 dark:bg-gray-600 hover:bg-gray-700 dark:hover:bg-gray-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                                    >
                                        <CheckSquare className="w-4 h-4 mr-1" />
                                        Use Multi-Select Option Set
                                    </Button>
                                )}
                                {!field.ratingScaleId && !field.radioOptionSetId && !field.multiSelectOptionSetId && !field.selectOptionSetId && (
                                    <Button
                                        size="sm"
                                        onClick={() => onAddFieldOption(sectionId, field.id)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                                    >
                                        <Plus className="w-4 h-4 mr-1" />
                                        Add Option
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            {field.ratingScaleId ? (
                                // Show rating scale options dynamically
                                <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <h6 className="font-medium text-gray-900 dark:text-gray-100">Rating Option Set {field.ratingScaleId}</h6>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {isLoadingOptionSets ? 'Loading...' : loadedRatingScale ? loadedRatingScale.description || loadedRatingScale.name : 'Loading rating scale...'}
                                            </p>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => onUpdateField(sectionId, field.id, {
                                                ratingScaleId: undefined,
                                                ratingScaleName: undefined,
                                                options: []
                                            })}
                                            className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-md transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {isLoadingOptionSets ? (
                                            <span className="px-3 py-1 text-sm rounded border bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-500">
                                                Loading options...
                                            </span>
                                        ) : loadedRatingScale ? (
                                            loadedRatingScale.options.map((option, index) => (
                                                <span
                                                    key={index}
                                                    className={`px-3 py-1 text-sm rounded border ${option.isDefault
                                                        ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-600'
                                                        : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-500'
                                                        }`}
                                                >
                                                    {option.label}
                                                    {option.isDefault && ' (Default)'}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="px-3 py-1 text-sm rounded border bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-600">
                                                Failed to load rating scale
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ) : field.radioOptionSetId ? (
                                // Show radio option set options as buttons
                                <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <h6 className="font-medium text-gray-900 dark:text-gray-100">{field.radioOptionSetName?.split('x')[0] || field.radioOptionSetName}</h6>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Radio Option Set</p>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => onUpdateField(sectionId, field.id, {
                                                radioOptionSetId: undefined,
                                                radioOptionSetName: undefined,
                                                options: []
                                            })}
                                            className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-md transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {isLoadingOptionSets ? (
                                            <span className="px-3 py-1 text-sm rounded border bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-500">
                                                Loading options...
                                            </span>
                                        ) : loadedRadioOptionSet ? (
                                            loadedRadioOptionSet.options.map((option, index) => (
                                                <span
                                                    key={index}
                                                    className={`px-3 py-1 text-sm rounded border ${option.isDefault
                                                        ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-600'
                                                        : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-500'
                                                        }`}
                                                >
                                                    {option.label}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="px-3 py-1 text-sm rounded border bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-500">
                                                Failed to load options
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ) : field.multiSelectOptionSetId ? (
                                // Show multi-select option set options as buttons
                                <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <h6 className="font-medium text-gray-900 dark:text-gray-100">{field.multiSelectOptionSetName?.split('x')[0] || field.multiSelectOptionSetName}</h6>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Multi-Select Option Set</p>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => onUpdateField(sectionId, field.id, {
                                                multiSelectOptionSetId: undefined,
                                                multiSelectOptionSetName: undefined,
                                                options: []
                                            })}
                                            className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-md transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {isLoadingOptionSets ? (
                                            <span className="px-3 py-1 text-sm rounded border bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-500">
                                                Loading options...
                                            </span>
                                        ) : loadedMultiSelectOptionSet ? (
                                            loadedMultiSelectOptionSet.options.map((option, index) => (
                                                <span
                                                    key={index}
                                                    className={`px-3 py-1 text-sm rounded border ${option.isDefault
                                                        ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-600'
                                                        : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-500'
                                                        }`}
                                                >
                                                    {option.label}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="px-3 py-1 text-sm rounded border bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-500">
                                                Failed to load options
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ) : field.selectOptionSetId ? (
                                // Show select option set options as buttons
                                <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <h6 className="font-medium text-gray-900 dark:text-gray-100">{field.selectOptionSetName?.split('x')[0] || field.selectOptionSetName}</h6>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Select Option Set</p>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => onUpdateField(sectionId, field.id, {
                                                selectOptionSetId: undefined,
                                                selectOptionSetName: undefined,
                                                options: []
                                            })}
                                            className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-md transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {isLoadingOptionSets ? (
                                            <span className="px-3 py-1 text-sm rounded border bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-500">
                                                Loading options...
                                            </span>
                                        ) : loadedSelectOptionSet ? (
                                            loadedSelectOptionSet.options.map((option, index) => (
                                                <span
                                                    key={index}
                                                    className={`px-3 py-1 text-sm rounded border ${option.isDefault
                                                        ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-600'
                                                        : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-500'
                                                        }`}
                                                >
                                                    {option.label}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="px-3 py-1 text-sm rounded border bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-500">
                                                Failed to load options
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                // Show individual options
                                <>
                                    {(field.options || []).map((option, index) => {
                                        const labelValidation = option.label ? { isValid: true } : { isValid: false, error: 'Label is required' };
                                        const valueValidation = option.value ?
                                            /^[a-zA-Z0-9_-]+$/.test(option.value) ?
                                                { isValid: true } :
                                                { isValid: false, error: 'Only letters, numbers, underscores, and hyphens allowed' }
                                            : { isValid: false, error: 'Value is required' };

                                        return (
                                            <div key={index} className="flex items-center space-x-3 p-4 border border-gray-200 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700">
                                                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                    <div>
                                                        <label htmlFor={`option-label-${index}`} className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                            Label *
                                                        </label>
                                                        <input
                                                            id={`option-label-${index}`}
                                                            type="text"
                                                            value={option.label}
                                                            onChange={(e) => {
                                                                // Update immediately for UI feedback
                                                                onUpdateFieldOption(sectionId, field.id, index, { label: e.target.value });
                                                                // Debounce validation
                                                                setTimeout(validateOptions, 300);
                                                            }}
                                                            className={`w-full px-3 py-2 text-sm border rounded focus:outline-none focus:ring-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${labelValidation.isValid
                                                                ? 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                                                                : 'border-red-300 dark:border-red-500 focus:ring-red-500'
                                                                }`}
                                                            placeholder="Option label (required)"
                                                        />
                                                        {!labelValidation.isValid && (
                                                            <p className="text-xs text-red-600 dark:text-red-400 mt-1">{labelValidation.error}</p>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label htmlFor={`option-value-${index}`} className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                            Value *
                                                        </label>
                                                        <input
                                                            id={`option-value-${index}`}
                                                            type="text"
                                                            value={option.value}
                                                            onChange={(e) => {
                                                                // Update immediately for UI feedback
                                                                onUpdateFieldOption(sectionId, field.id, index, { value: e.target.value });
                                                                // Debounce validation
                                                                setTimeout(validateOptions, 300);
                                                            }}
                                                            className={`w-full px-3 py-2 text-sm border rounded focus:outline-none focus:ring-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${valueValidation.isValid
                                                                ? 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                                                                : 'border-red-300 dark:border-red-500 focus:ring-red-500'
                                                                }`}
                                                            placeholder="option_value (letters, numbers, _, -)"
                                                        />
                                                        {!valueValidation.isValid && (
                                                            <p className="text-xs text-red-600 dark:text-red-400 mt-1">{valueValidation.error}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        onDeleteFieldOption(sectionId, field.id, index);
                                                        setTimeout(validateOptions, 100); // Re-validate after deletion
                                                    }}
                                                    className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-md transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        );
                                    })}
                                    {(field.options || []).length === 0 && (
                                        <div className="text-center text-gray-500 dark:text-gray-400 text-sm py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md">
                                            <p>No options configured.</p>
                                            <p className="text-xs mt-1">Add options to enable selection.</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Field Images */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600 pb-2 flex items-center">
                        <Image className="w-5 h-5 mr-2" />
                        Field Images
                        <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">(Optional)</span>
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Add images to display alongside this field question. Images will appear below the field label and help provide visual context for users.
                    </p>

                    <ImagePicker
                        multiple={true}
                        maxFiles={IMAGE_PICKER_DEFAULTS.MAX_FILES}
                        images={field.images || []}
                        onImagesChange={(images) => {
                            onUpdateField(sectionId, field.id, { images });
                        }}
                        uploadOptions={{
                            configId,
                            entityType: 'field',
                            entityId: field.id
                        }}
                        showGallery={true}
                        label="Upload Field Images"
                        helpText={`Supported formats: ${IMAGE_PICKER_DEFAULTS.ALLOWED_TYPES.map(type => type.replace('image/', '').toUpperCase()).join(', ')}. Maximum file size: ${IMAGE_PICKER_DEFAULTS.MAX_FILE_SIZE / 1024 / 1024}MB each. Up to ${IMAGE_PICKER_DEFAULTS.MAX_FILES} images.`}
                        className="mt-4"
                    />
                </div>

                {/* Field Preview */}
                <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600 pb-2">
                        Preview
                    </h3>
                    <div className="p-3 border border-gray-200 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {field.label}
                            {field.required && <span className="text-red-500 dark:text-red-400 ml-1">*</span>}
                        </label>
                        {field.type === 'text' && (
                            <input
                                type="text"
                                placeholder={field.placeholder || 'Enter text...'}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                disabled
                            />
                        )}
                        {field.type === 'textarea' && (
                            <textarea
                                placeholder={field.placeholder || 'Enter text...'}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                rows={3}
                                disabled
                            />
                        )}
                        {field.type === 'email' && (
                            <input
                                type="email"
                                placeholder={field.placeholder || 'Enter email...'}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                disabled
                            />
                        )}
                        {field.type === 'number' && (
                            <input
                                type="number"
                                placeholder={field.placeholder || 'Enter number...'}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                disabled
                            />
                        )}
                        {field.type === 'radio' && field.radioOptionSetId && (
                            <OptionSetPreview
                                type="radio"
                                optionSetId={field.radioOptionSetId}
                                optionSetName={field.radioOptionSetName || ''}
                                hideLabel={true}
                            />
                        )}
                        {field.type === 'radio' && !field.radioOptionSetId && field.options && field.options.length > 0 && (
                            <div className="space-y-2">
                                {field.options.map((option, index) => (
                                    <label key={index} className="flex items-center">
                                        <input
                                            type="radio"
                                            name="preview-radio"
                                            className="mr-2 text-blue-600 dark:bg-gray-700 dark:border-gray-600"
                                            disabled
                                        />
                                        <span className="text-sm text-gray-900 dark:text-gray-100">{option.label}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                        {field.type === 'multiselect' && field.multiSelectOptionSetId && (
                            <OptionSetPreview
                                type="multiselect"
                                optionSetId={field.multiSelectOptionSetId}
                                optionSetName={field.multiSelectOptionSetName || ''}
                                hideLabel={true}
                            />
                        )}
                        {field.type === 'multiselectdropdown' && field.selectOptionSetId && (
                            <OptionSetPreview
                                type="select"
                                optionSetId={field.selectOptionSetId}
                                optionSetName={field.selectOptionSetName || ''}
                                hideLabel={true}
                            />
                        )}
                        {(field.type === 'multiselect' || field.type === 'multiselectdropdown') && !field.multiSelectOptionSetId && !field.selectOptionSetId && field.options && field.options.length > 0 && (
                            <div className="space-y-2">
                                {field.options.map((option, index) => (
                                    <label key={index} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            className="mr-2 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
                                            disabled
                                        />
                                        <span className="text-sm text-gray-900 dark:text-gray-100">{option.label}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                        {field.type === 'select' && field.selectOptionSetId && (
                            <OptionSetPreview
                                type="select"
                                optionSetId={field.selectOptionSetId}
                                optionSetName={field.selectOptionSetName || ''}
                                hideLabel={true}
                            />
                        )}
                        {field.type === 'select' && !field.selectOptionSetId && field.options && field.options.length > 0 && (
                            <select
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                disabled
                            >
                                <option value="">{field.placeholder || 'Select an option...'}</option>
                                {field.options.map((option, index) => (
                                    <option key={index} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        )}
                        {field.type === 'rating' && field.ratingScaleId && (
                            <OptionSetPreview
                                type="rating"
                                optionSetId={field.ratingScaleId}
                                optionSetName={field.ratingScaleName || ''}
                                hideLabel={true}
                            />
                        )}
                        {field.type === 'rating' && !field.ratingScaleId && field.options && field.options.length > 0 && (
                            <div className="flex gap-2">
                                {field.options.map((option, index) => (
                                    <span key={index} className="px-3 py-1 text-sm rounded border bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-500">
                                        {option.label}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Field Images Preview */}
                        {field.images && field.images.length > 0 && (
                            <div className="mt-4">
                                <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Images:</div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {field.images.map((image) => (
                                        <div key={image.id} className="relative">
                                            <img
                                                src={image.storageUrl}
                                                alt={image.altText || image.originalFilename}
                                                className="w-full h-32 md:h-40 object-contain rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
                                            />
                                            {image.isPrimary && (
                                                <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                                                    Primary
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600 sticky bottom-0 bg-white dark:bg-gray-800">
                    <Button
                        variant="secondary"
                        onClick={handleCancel}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                    >
                        Save Changes
                    </Button>
                </div>
            </div>
            </Modal.Body>
        </Modal>
    );
};
