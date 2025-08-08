import { Input } from '@/components/common';
import { MultiSelectOptionSet, RadioOptionSet, RatingScale, SurveyField } from '@/types';
import { clsx } from 'clsx';
import { ChevronDown } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { getColorClasses } from '../../../utils/color.utils';
import { CheckboxGroup, RadioGroup } from '../index';

interface FieldRendererProps {
    field: SurveyField;
    value: any;
    onChange: (fieldId: string, value: any) => void;
    error?: string;
    ratingScales?: Record<string, RatingScale>;
    loadingScales?: Record<string, boolean>;
    onLoadRatingScale?: (scaleId: string) => Promise<void>;
    radioOptionSets?: Record<string, RadioOptionSet>;
    multiSelectOptionSets?: Record<string, MultiSelectOptionSet>;
    loadingOptionSets?: Record<string, boolean>;
    onLoadRadioOptionSet?: (optionSetId: string) => Promise<void>;
    onLoadMultiSelectOptionSet?: (optionSetId: string) => Promise<void>;
}

export const FieldRenderer: React.FC<FieldRendererProps> = ({
    field,
    value,
    onChange,
    error,
    ratingScales = {},
    loadingScales = {},
    onLoadRatingScale,
    radioOptionSets = {},
    multiSelectOptionSets = {},
    loadingOptionSets = {},
    onLoadRadioOptionSet,
    onLoadMultiSelectOptionSet
}) => {
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Click outside handler to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (target.closest('[data-dropdown-option]')) {
                return;
            }

            if (dropdownRef.current && !dropdownRef.current.contains(target)) {
                setOpenDropdown(null);
            }
        };

        const handleScroll = () => {
            if (openDropdown) {
                setOpenDropdown(null);
            }
        };

        const handleResize = () => {
            if (openDropdown) {
                setOpenDropdown(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScroll);
        window.addEventListener('resize', handleResize);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleResize);
        };
    }, [openDropdown]);

    // Load rating scale if needed
    useEffect(() => {
        if (field.type === 'rating' && field.ratingScaleId && onLoadRatingScale) {
            onLoadRatingScale(field.ratingScaleId);
        }
    }, [field, onLoadRatingScale]);

    // Load radio option set if needed
    useEffect(() => {
        if (field.type === 'radio' && field.radioOptionSetId && onLoadRadioOptionSet) {
            onLoadRadioOptionSet(field.radioOptionSetId);
        }
    }, [field, onLoadRadioOptionSet]);

    // Load multi-select option set if needed
    useEffect(() => {
        if (field.type === 'multiselect' && field.multiSelectOptionSetId && onLoadMultiSelectOptionSet) {
            onLoadMultiSelectOptionSet(field.multiSelectOptionSetId);
        }
    }, [field, onLoadMultiSelectOptionSet]);

    const handleFieldChange = useCallback((fieldId: string, newValue: any) => {
        onChange(fieldId, newValue);
    }, [onChange]);

    const getSelectedRatingColor = (value: string, options: any[]) => {
        const selectedOption = options.find(opt => opt.value === value);
        if (!selectedOption) return 'bg-gray-100 text-gray-700 border-gray-200';

        // Use shared color utility but adjust for rating display (lighter background)
        const colorClasses = getColorClasses(selectedOption.color);
        return colorClasses.replace('bg-', 'bg-').replace('50', '100').replace('border-', 'border-').replace('300', '200');
    };

    const getSelectedRatingLabel = (value: string, options: any[]) => {
        const selectedOption = options.find(opt => opt.value === value);
        return selectedOption?.label || 'Select rating';
    };

    switch (field.type) {
        case 'text':
        case 'email':
            return (
                <Input
                    name={field.id}
                    label={field.label}
                    value={value || ''}
                    onChange={(value) => handleFieldChange(field.id, value)}
                    placeholder={field.placeholder}
                    error={error}
                    required={field.required}
                    type={field.type}
                />
            );

        case 'textarea':
            return (
                <div className="mb-4">
                    <label htmlFor={`${field.id}-textarea`} className="block text-base font-medium text-gray-700 mb-2">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <textarea
                        id={`${field.id}-textarea`}
                        name={field.id}
                        value={value || ''}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        className={clsx(
                            "w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500",
                            error ? "border-red-500" : "border-gray-300"
                        )}
                        rows={4}
                    />
                    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
                </div>
            );

        case 'radio':
            // Determine which options to use - radio option set or individual options
            let radioOptions = field.options || [];
            let isRadioLoading = false;

            if (field.radioOptionSetId) {
                if (radioOptionSets[field.radioOptionSetId]) {
                    // Use loaded radio option set options
                    radioOptions = radioOptionSets[field.radioOptionSetId].options.map(opt => ({
                        value: opt.value,
                        label: opt.label,
                        color: opt.color,
                        isDefault: opt.isDefault
                    }));
                } else if (loadingOptionSets[field.radioOptionSetId]) {
                    isRadioLoading = true;
                }
            }

            if (isRadioLoading) {
                return (
                    <div className="mb-4">
                        <label className="block text-base font-medium text-gray-700 mb-2">
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <div className="text-gray-500 text-sm">Loading options...</div>
                    </div>
                );
            }

            return (
                <RadioGroup
                    name={field.id}
                    label={field.label}
                    options={radioOptions}
                    selectedValue={value}
                    onChange={(value) => handleFieldChange(field.id, value)}
                    error={error}
                    required={field.required}
                />
            );

        case 'multiselect':
            // Determine which options to use - multi-select option set or individual options
            let multiSelectOptions = field.options || [];
            let isMultiSelectLoading = false;

            console.log('🔍 Rendering multiselect field:', {
                fieldId: field.id,
                fieldLabel: field.label,
                hasOptionSetId: !!field.multiSelectOptionSetId,
                optionSetId: field.multiSelectOptionSetId,
                hasLoadedOptionSet: !!multiSelectOptionSets[field.multiSelectOptionSetId],
                isLoading: loadingOptionSets[field.multiSelectOptionSetId],
                loadedOptionSets: Object.keys(multiSelectOptionSets),
                loadingOptionSets: Object.keys(loadingOptionSets),
                availableOptionSets: Object.keys(multiSelectOptionSets),
                fieldOptions: field.options?.length || 0
            });

            if (field.multiSelectOptionSetId) {
                if (multiSelectOptionSets[field.multiSelectOptionSetId]) {
                    // Use loaded multi-select option set options
                    multiSelectOptions = multiSelectOptionSets[field.multiSelectOptionSetId].options.map(opt => ({
                        value: opt.value,
                        label: opt.label,
                        color: opt.color,
                        isDefault: opt.isDefault
                    }));
                    console.log('✅ Using loaded option set options:', multiSelectOptions);
                } else if (loadingOptionSets[field.multiSelectOptionSetId]) {
                    isMultiSelectLoading = true;
                    console.log('⏳ Option set is loading...');
                } else {
                    console.log('❌ Option set not found and not loading');
                }
            }

            if (isMultiSelectLoading) {
                return (
                    <div className="mb-4">
                        <label className="block text-base font-medium text-gray-700 mb-2">
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <div className="text-gray-500 text-sm">Loading options...</div>
                    </div>
                );
            }

            console.log('🎯 Final options for multiselect:', multiSelectOptions);
            console.log('🎯 CheckboxGroup props:', {
                name: field.id,
                label: field.label,
                optionsCount: multiSelectOptions.length,
                selectedValues: value || [],
                required: field.required,
                hasError: !!error
            });

            return (
                <CheckboxGroup
                    name={field.id}
                    label={field.label}
                    options={multiSelectOptions}
                    selectedValues={value || []}
                    onChange={(value) => handleFieldChange(field.id, value)}
                    error={error}
                    required={field.required}
                />
            );

        case 'rating':
            // Determine which options to use - rating scale or individual options
            let ratingOptions = field.options || [];
            let isLoading = false;

            if (field.ratingScaleId) {
                if (ratingScales[field.ratingScaleId]) {
                    // Use loaded rating scale options
                    ratingOptions = ratingScales[field.ratingScaleId].options.map(opt => ({
                        value: opt.value,
                        label: opt.label,
                        color: opt.color,
                        isDefault: opt.isDefault
                    }));
                } else if (loadingScales[field.ratingScaleId]) {
                    isLoading = true;
                }
            }

            return (
                <div className="mb-4">
                    <div className="flex items-center justify-between p-3 border border-green-200 rounded-lg bg-white">
                        <div className="text-gray-700">
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                        </div>
                        <div className="relative" ref={dropdownRef}>
                            <button
                                type="button"
                                disabled={isLoading}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const newOpenDropdown = openDropdown === field.id ? null : field.id;
                                    setOpenDropdown(newOpenDropdown);
                                }}
                                className={clsx(
                                    "px-3 py-2 rounded text-sm font-medium transition-all duration-200 flex items-center gap-2",
                                    isLoading ? "opacity-50 cursor-not-allowed" : "",
                                    getSelectedRatingColor(value, ratingOptions)
                                )}
                            >
                                {isLoading ? "Loading..." : getSelectedRatingLabel(value, ratingOptions)}
                                <ChevronDown className="w-4 h-4" />
                            </button>

                            {openDropdown === field.id && !isLoading && (
                                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-300 rounded-md shadow-xl z-[9999] min-w-[120px] max-h-60 overflow-y-auto">
                                    {ratingOptions.map((option) => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            data-dropdown-option
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleFieldChange(field.id, option.value);
                                                setOpenDropdown(null);
                                            }}
                                            className={clsx(
                                                'w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors duration-200 rounded',
                                                value === option.value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                                            )}
                                        >
                                            {option.label}
                                            {option.isDefault && value !== option.value && (
                                                <span className="ml-1 text-xs text-gray-500">(Default)</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
                </div>
            );

        default:
            return (
                <div className="mb-4">
                    <p className="text-red-500">Unsupported field type: {field.type}</p>
                </div>
            );
    }
};
