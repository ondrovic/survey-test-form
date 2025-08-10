import { CheckSquare, ChevronDown, List, Plus, Star, Trash2 } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { firestoreHelpers } from '../../../config/firebase';
import { useValidation } from '../../../contexts/validation-context';
import { FieldType, MultiSelectOptionSet, RadioOptionSet, SelectOptionSet, SurveyField } from '../../../types/framework.types';
import { Button, Input, Modal } from '../../common';
import { OptionSetPreview } from './option-set-preview';
import { FIELD_TYPES } from './survey-builder.types';

interface FieldEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    field: SurveyField | null;
    sectionId: string;
    onUpdateField: (sectionId: string, fieldId: string, updates: Partial<SurveyField>) => void;
    onAddFieldOption: (sectionId: string, fieldId: string) => void;
    onUpdateFieldOption: (sectionId: string, fieldId: string, optionIndex: number, updates: { label?: string; value?: string }) => void;
    onDeleteFieldOption: (sectionId: string, fieldId: string, optionIndex: number) => void;
    onShowRatingScaleManager: () => void;
    onShowRadioOptionSetManager: () => void;
    onShowMultiSelectOptionSetManager: () => void;
    onShowSelectOptionSetManager: () => void;
}

export const FieldEditorModal: React.FC<FieldEditorModalProps> = ({
    isOpen,
    onClose,
    onSave,
    field,
    sectionId,
    onUpdateField,
    onAddFieldOption,
    onUpdateFieldOption,
    onDeleteFieldOption,
    onShowRatingScaleManager,
    onShowRadioOptionSetManager,
    onShowMultiSelectOptionSetManager,
    onShowSelectOptionSetManager
}) => {
    const { validateFieldLabel, validateFieldPlaceholder, validateFieldOptions } = useValidation();
    const [loadedRadioOptionSet, setLoadedRadioOptionSet] = useState<RadioOptionSet | null>(null);
    const [loadedMultiSelectOptionSet, setLoadedMultiSelectOptionSet] = useState<MultiSelectOptionSet | null>(null);
    const [loadedSelectOptionSet, setLoadedSelectOptionSet] = useState<SelectOptionSet | null>(null);
    const [isLoadingOptionSets, setIsLoadingOptionSets] = useState(false);
    const [labelError, setLabelError] = useState<string>('');
    const [placeholderError, setPlaceholderError] = useState<string>('');
    const [optionsError, setOptionsError] = useState<string>('');

    // Validation handlers
    const handleLabelChange = (value: string) => {
        if (!field) return;
        const validation = validateFieldLabel(value);
        setLabelError(validation.isValid ? '' : validation.error || '');
        onUpdateField(sectionId, field.id, { label: value });
    };

    const handlePlaceholderChange = (value: string) => {
        if (!field) return;
        const validation = validateFieldPlaceholder(value);
        setPlaceholderError(validation.isValid ? '' : validation.error || '');
        onUpdateField(sectionId, field.id, { placeholder: value });
    };

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
            onSave();
            onClose();
        }
    };

    const handleCancel = () => {
        onClose();
    };

    // Add keyboard shortcut to close modal with Escape
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            return () => {
                document.removeEventListener('keydown', handleEscape);
            };
        }

        return undefined;
    }, [isOpen, onClose]);

    // Load option sets and validate when field changes
    useEffect(() => {
        const loadOptionSets = async () => {
            if (!field) return;

            setIsLoadingOptionSets(true);
            setLoadedRadioOptionSet(null);
            setLoadedMultiSelectOptionSet(null);
            setLoadedSelectOptionSet(null);

            // Validate current field state
            const labelValidation = validateFieldLabel(field.label);
            setLabelError(labelValidation.isValid ? '' : labelValidation.error || '');

            const placeholderValidation = validateFieldPlaceholder(field.placeholder || '');
            setPlaceholderError(placeholderValidation.isValid ? '' : placeholderValidation.error || '');

            try {
                if (field.radioOptionSetId) {
                    const radioOptionSet = await firestoreHelpers.getRadioOptionSet(field.radioOptionSetId);
                    setLoadedRadioOptionSet(radioOptionSet);
                }

                if (field.multiSelectOptionSetId) {
                    const multiSelectOptionSet = await firestoreHelpers.getMultiSelectOptionSet(field.multiSelectOptionSetId);
                    setLoadedMultiSelectOptionSet(multiSelectOptionSet);
                }

                if (field.selectOptionSetId) {
                    const selectOptionSet = await firestoreHelpers.getSelectOptionSet(field.selectOptionSetId);
                    setLoadedSelectOptionSet(selectOptionSet);
                }
            } catch (error) {
                console.error('Error loading option sets:', error);
            } finally {
                setIsLoadingOptionSets(false);
                // Validate options after loading
                validateOptions();
            }
        };

        loadOptionSets();
    }, [field?.radioOptionSetId, field?.multiSelectOptionSetId, field?.selectOptionSetId, field?.label, field?.placeholder, validateFieldLabel, validateFieldPlaceholder, field, validateOptions]);

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
            title={`Edit Field: ${field.label} (${FIELD_TYPES.find(t => t.value === field.type)?.label})`}
            size="full"
            showCloseButton={true}
        >
            <div className="space-y-6 max-h-[70vh] overflow-y-auto px-2">
                {/* Basic Field Configuration */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                        Basic Configuration
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            name="fieldLabel"
                            label="Field Label *"
                            value={field.label}
                            onChange={handleLabelChange}
                            placeholder="Enter field label (1-100 characters)"
                            error={labelError}
                        />
                        <div>
                            <label htmlFor="field-type" className="block text-sm font-semibold text-gray-800 mb-2">
                                Field Type
                            </label>
                            <select
                                id="field-type"
                                value={field.type}
                                onChange={(e) => onUpdateField(sectionId, field.id, { type: e.target.value as FieldType })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={field.required}
                                onChange={(e) => onUpdateField(sectionId, field.id, { required: e.target.checked })}
                                className="mr-2"
                            />
                            Required field
                        </label>
                    </div>

                    <Input
                        name="fieldPlaceholder"
                        label="Placeholder Text"
                        value={field.placeholder || ''}
                        onChange={handlePlaceholderChange}
                        placeholder="Enter placeholder text (optional, max 150 characters)"
                        error={placeholderError}
                    />

                    {/* Min/Max Selection Configuration for Multiselect */}
                    {((field.type === 'multiselect' && !field.multiSelectOptionSetId) || (field.type === 'multiselectdropdown' && !field.selectOptionSetId)) && (
                        <div className="space-y-4 p-4 border rounded-lg bg-blue-50 border-blue-200">
                            <h4 className="font-medium text-blue-900">Selection Constraints</h4>
                            <p className="text-sm text-blue-700">
                                Set minimum and maximum number of options users can select. Leave empty for no limits.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                {/* Field Options Configuration */}
                {FIELD_TYPES.find(t => t.value === field.type)?.hasOptions && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                            Field Options
                        </h3>

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">
                                    Configure the options that users can select from.
                                    {field.type === 'radio' && ' Users can select only one option.'}
                                    {field.type === 'select' && ' Users can select one option from dropdown.'}
                                    {field.type === 'multiselect' && ' Users can select multiple options using checkboxes.'}
                                    {field.type === 'multiselectdropdown' && ' Users can select multiple options from dropdown.'}
                                    {field.type === 'rating' && ' Users can select one rating option.'}
                                </p>
                                {optionsError && (
                                    <p className="text-sm text-red-600 mt-1">{optionsError}</p>
                                )}
                            </div>
                            <div className="flex space-x-2">
                                {field.type === 'rating' && (
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={onShowRatingScaleManager}
                                        className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-md text-sm font-medium"
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
                                        className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-md text-sm font-medium"
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
                                        className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-md text-sm font-medium"
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
                                        className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-md text-sm font-medium"
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
                                // Show rating scale options as buttons
                                <div className="p-4 border rounded-md bg-gray-50">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <h6 className="font-medium text-gray-900">{field.ratingScaleName}</h6>
                                            <p className="text-xs text-gray-500">High, Medium, Low, Not Important Scale</p>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => onUpdateField(sectionId, field.id, {
                                                ratingScaleId: undefined,
                                                ratingScaleName: undefined,
                                                options: []
                                            })}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-md transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-3 py-1 text-sm rounded border bg-yellow-100 text-yellow-700 border-yellow-200">
                                            High (Default)
                                        </span>
                                        <span className="px-3 py-1 text-sm rounded border bg-gray-100 text-gray-700 border-gray-200">
                                            Medium
                                        </span>
                                        <span className="px-3 py-1 text-sm rounded border bg-gray-100 text-gray-700 border-gray-200">
                                            Low
                                        </span>
                                        <span className="px-3 py-1 text-sm rounded border bg-gray-100 text-gray-700 border-gray-200">
                                            Not Important
                                        </span>
                                    </div>
                                </div>
                            ) : field.radioOptionSetId ? (
                                // Show radio option set options as buttons
                                <div className="p-4 border rounded-md bg-gray-50">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <h6 className="font-medium text-gray-900">{field.radioOptionSetName?.split('x')[0] || field.radioOptionSetName}</h6>
                                            <p className="text-xs text-gray-500">Radio Option Set</p>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => onUpdateField(sectionId, field.id, {
                                                radioOptionSetId: undefined,
                                                radioOptionSetName: undefined,
                                                options: []
                                            })}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-md transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {isLoadingOptionSets ? (
                                            <span className="px-3 py-1 text-sm rounded border bg-gray-100 text-gray-700 border-gray-200">
                                                Loading options...
                                            </span>
                                        ) : loadedRadioOptionSet ? (
                                            loadedRadioOptionSet.options.map((option, index) => (
                                                <span
                                                    key={index}
                                                    className={`px-3 py-1 text-sm rounded border ${option.isDefault
                                                        ? 'bg-blue-100 text-blue-700 border-blue-200'
                                                        : 'bg-gray-100 text-gray-700 border-gray-200'
                                                        }`}
                                                >
                                                    {option.label}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="px-3 py-1 text-sm rounded border bg-gray-100 text-gray-700 border-gray-200">
                                                Failed to load options
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ) : field.multiSelectOptionSetId ? (
                                // Show multi-select option set options as buttons
                                <div className="p-4 border rounded-md bg-gray-50">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <h6 className="font-medium text-gray-900">{field.multiSelectOptionSetName?.split('x')[0] || field.multiSelectOptionSetName}</h6>
                                            <p className="text-xs text-gray-500">Multi-Select Option Set</p>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => onUpdateField(sectionId, field.id, {
                                                multiSelectOptionSetId: undefined,
                                                multiSelectOptionSetName: undefined,
                                                options: []
                                            })}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-md transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {isLoadingOptionSets ? (
                                            <span className="px-3 py-1 text-sm rounded border bg-gray-100 text-gray-700 border-gray-200">
                                                Loading options...
                                            </span>
                                        ) : loadedMultiSelectOptionSet ? (
                                            loadedMultiSelectOptionSet.options.map((option, index) => (
                                                <span
                                                    key={index}
                                                    className={`px-3 py-1 text-sm rounded border ${option.isDefault
                                                        ? 'bg-green-100 text-green-700 border-green-200'
                                                        : 'bg-gray-100 text-gray-700 border-gray-200'
                                                        }`}
                                                >
                                                    {option.label}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="px-3 py-1 text-sm rounded border bg-gray-100 text-gray-700 border-gray-200">
                                                Failed to load options
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ) : field.selectOptionSetId ? (
                                // Show select option set options as buttons
                                <div className="p-4 border rounded-md bg-gray-50">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <h6 className="font-medium text-gray-900">{field.selectOptionSetName?.split('x')[0] || field.selectOptionSetName}</h6>
                                            <p className="text-xs text-gray-500">Select Option Set</p>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => onUpdateField(sectionId, field.id, {
                                                selectOptionSetId: undefined,
                                                selectOptionSetName: undefined,
                                                options: []
                                            })}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-md transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {isLoadingOptionSets ? (
                                            <span className="px-3 py-1 text-sm rounded border bg-gray-100 text-gray-700 border-gray-200">
                                                Loading options...
                                            </span>
                                        ) : loadedSelectOptionSet ? (
                                            loadedSelectOptionSet.options.map((option, index) => (
                                                <span
                                                    key={index}
                                                    className={`px-3 py-1 text-sm rounded border ${option.isDefault
                                                        ? 'bg-purple-100 text-purple-700 border-purple-200'
                                                        : 'bg-gray-100 text-gray-700 border-gray-200'
                                                        }`}
                                                >
                                                    {option.label}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="px-3 py-1 text-sm rounded border bg-gray-100 text-gray-700 border-gray-200">
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
                                            <div key={index} className="flex items-center space-x-3 p-4 border rounded-md bg-gray-50">
                                                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                    <div>
                                                        <label htmlFor={`option-label-${index}`} className="block text-xs font-medium text-gray-700 mb-1">
                                                            Label *
                                                        </label>
                                                        <input
                                                            id={`option-label-${index}`}
                                                            type="text"
                                                            value={option.label}
                                                            onChange={(e) => {
                                                                onUpdateFieldOption(sectionId, field.id, index, { label: e.target.value });
                                                                setTimeout(validateOptions, 100); // Re-validate after update
                                                            }}
                                                            className={`w-full px-3 py-2 text-sm border rounded focus:outline-none focus:ring-1 ${labelValidation.isValid
                                                                ? 'border-gray-300 focus:ring-blue-500'
                                                                : 'border-red-300 focus:ring-red-500'
                                                                }`}
                                                            placeholder="Option label (required)"
                                                        />
                                                        {!labelValidation.isValid && (
                                                            <p className="text-xs text-red-600 mt-1">{labelValidation.error}</p>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label htmlFor={`option-value-${index}`} className="block text-xs font-medium text-gray-700 mb-1">
                                                            Value *
                                                        </label>
                                                        <input
                                                            id={`option-value-${index}`}
                                                            type="text"
                                                            value={option.value}
                                                            onChange={(e) => {
                                                                onUpdateFieldOption(sectionId, field.id, index, { value: e.target.value });
                                                                setTimeout(validateOptions, 100); // Re-validate after update
                                                            }}
                                                            className={`w-full px-3 py-2 text-sm border rounded focus:outline-none focus:ring-1 ${valueValidation.isValid
                                                                ? 'border-gray-300 focus:ring-blue-500'
                                                                : 'border-red-300 focus:ring-red-500'
                                                                }`}
                                                            placeholder="option_value (letters, numbers, _, -)"
                                                        />
                                                        {!valueValidation.isValid && (
                                                            <p className="text-xs text-red-600 mt-1">{valueValidation.error}</p>
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
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-md transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        );
                                    })}
                                    {(field.options || []).length === 0 && (
                                        <div className="text-center text-gray-500 text-sm py-4 border-2 border-dashed border-gray-300 rounded-md">
                                            <p>No options configured.</p>
                                            <p className="text-xs mt-1">Add options to enable selection.</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Field Preview */}
                <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                        Preview
                    </h3>
                    <div className="p-3 border rounded-md bg-gray-50">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        {field.type === 'text' && (
                            <input
                                type="text"
                                placeholder={field.placeholder || 'Enter text...'}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                disabled
                            />
                        )}
                        {field.type === 'textarea' && (
                            <textarea
                                placeholder={field.placeholder || 'Enter text...'}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                rows={3}
                                disabled
                            />
                        )}
                        {field.type === 'email' && (
                            <input
                                type="email"
                                placeholder={field.placeholder || 'Enter email...'}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                disabled
                            />
                        )}
                        {field.type === 'number' && (
                            <input
                                type="number"
                                placeholder={field.placeholder || 'Enter number...'}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                                            className="mr-2"
                                            disabled
                                        />
                                        <span className="text-sm">{option.label}</span>
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
                                            className="mr-2"
                                            disabled
                                        />
                                        <span className="text-sm">{option.label}</span>
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                                    <span key={index} className="px-3 py-1 text-sm rounded border bg-gray-100 text-gray-700 border-gray-200">
                                        {option.label}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t sticky bottom-0 bg-white">
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
        </Modal>
    );
};
