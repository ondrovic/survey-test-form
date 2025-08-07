import { Input } from '@/components/common';
import { RatingScale, SurveyField } from '@/types';
import { clsx } from 'clsx';
import { ChevronDown } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CheckboxGroup, RadioGroup } from '../index';

interface FieldRendererProps {
    field: SurveyField;
    value: any;
    onChange: (fieldId: string, value: any) => void;
    error?: string;
    ratingScales?: Record<string, RatingScale>;
    loadingScales?: Record<string, boolean>;
    onLoadRatingScale?: (scaleId: string) => Promise<void>;
}

export const FieldRenderer: React.FC<FieldRendererProps> = ({
    field,
    value,
    onChange,
    error,
    ratingScales = {},
    loadingScales = {},
    onLoadRatingScale
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

    const handleFieldChange = useCallback((fieldId: string, newValue: any) => {
        onChange(fieldId, newValue);
    }, [onChange]);

    const getSelectedRatingColor = (value: string, options: any[]) => {
        const selectedOption = options.find(opt => opt.value === value);
        if (!selectedOption) return 'bg-gray-100 text-gray-700';

        switch (selectedOption.color) {
            case 'success':
                return 'bg-green-100 text-green-700 border-green-200';
            case 'warning':
                return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'error':
                return 'bg-red-100 text-red-700 border-red-200';
            case 'default':
                return 'bg-blue-100 text-blue-700 border-blue-200';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200';
        }
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
            return (
                <RadioGroup
                    name={field.id}
                    label={field.label}
                    options={field.options || []}
                    selectedValue={value}
                    onChange={(value) => handleFieldChange(field.id, value)}
                    error={error}
                    required={field.required}
                />
            );

        case 'multiselect':
            return (
                <CheckboxGroup
                    name={field.id}
                    label={field.label}
                    options={field.options || []}
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
