import { Input, Portal } from '@/components/common';
import { MultiSelectOptionSet, RadioOptionSet, RatingScale, SelectOptionSet, SurveyField } from '@/types';
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
    loadingScales?: boolean;
    radioOptionSets?: Record<string, RadioOptionSet>;
    multiSelectOptionSets?: Record<string, MultiSelectOptionSet>;
    selectOptionSets?: Record<string, SelectOptionSet>;
    loadingOptionSets?: boolean;
}

export const FieldRenderer: React.FC<FieldRendererProps> = ({
    field,
    value,
    onChange,
    error,
    ratingScales = {},
    loadingScales = false,
    radioOptionSets = {},
    multiSelectOptionSets = {},
    selectOptionSets = {},
    loadingOptionSets = false
}) => {
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
    const [isMobile, setIsMobile] = useState<boolean>(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const triggerRefs = useRef<Record<string, HTMLButtonElement>>({});

    // Check if we're on mobile
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Smart dropdown opening with viewport-based positioning
    const handleDropdownOpen = useCallback((fieldId: string) => {
        const newOpenDropdown = openDropdown === fieldId ? null : fieldId;
        setOpenDropdown(newOpenDropdown);

        if (newOpenDropdown && triggerRefs.current[fieldId]) {
            // Calculate position relative to viewport
            setTimeout(() => {
                const trigger = triggerRefs.current[fieldId];
                if (trigger) {
                    const triggerRect = trigger.getBoundingClientRect();
                    const viewportHeight = window.innerHeight;
                    const viewportWidth = window.innerWidth;
                    const dropdownHeight = 200;
                    const isMobile = viewportWidth <= 768;

                    // Check if there's enough space below
                    const spaceBelow = viewportHeight - triggerRect.bottom;
                    const spaceAbove = triggerRect.top;

                    let top: number;
                    let left: number;
                    let width: string | undefined;
                    let maxHeight: string;

                    // Mobile-first calculations
                    if (isMobile) {
                        // On mobile, use more viewport space and better positioning
                        const mobileMaxHeight = Math.max(150, Math.min(spaceBelow, spaceAbove, viewportHeight * 0.4));
                        maxHeight = `${mobileMaxHeight}px`;

                        if (spaceBelow >= 120) {
                            top = triggerRect.bottom + 4;
                        } else if (spaceAbove >= 120) {
                            top = Math.max(4, triggerRect.top - mobileMaxHeight - 4);
                        } else {
                            // Use the larger space available
                            if (spaceBelow > spaceAbove) {
                                top = triggerRect.bottom + 4;
                                maxHeight = `${Math.max(120, spaceBelow - 20)}px`;
                            } else {
                                top = Math.max(4, triggerRect.top - Math.max(120, spaceAbove - 20) - 4);
                                maxHeight = `${Math.max(120, spaceAbove - 20)}px`;
                            }
                        }

                        // Mobile positioning: always use full trigger width, positioned at trigger left
                        left = Math.max(8, Math.min(triggerRect.left, viewportWidth - triggerRect.width - 8));
                        width = `${Math.min(triggerRect.width, viewportWidth - 16)}px`;
                    } else {
                        // Desktop calculations
                        if (spaceBelow >= 150) {
                            top = triggerRect.bottom + 4;
                            maxHeight = '240px';
                        } else if (spaceAbove >= 150) {
                            top = triggerRect.top - Math.min(dropdownHeight, spaceAbove - 4);
                            maxHeight = '240px';
                        } else {
                            if (spaceBelow > spaceAbove) {
                                top = triggerRect.bottom + 4;
                                maxHeight = `${spaceBelow - 20}px`;
                            } else {
                                top = 4;
                                maxHeight = `${triggerRect.top - 20}px`;
                            }
                        }

                        // Desktop positioning
                        const isMultiSelect = field.type === 'multiselectdropdown';
                        left = isMultiSelect ? triggerRect.left : triggerRect.right - 120;
                        width = isMultiSelect ? `${triggerRect.width}px` : undefined;
                    }

                    setDropdownStyle({
                        position: 'fixed',
                        top: `${top}px`,
                        left: `${left}px`,
                        width,
                        minWidth: isMobile ? undefined : '120px',
                        maxHeight,
                        zIndex: isMobile ? 99999 : 9999,
                    });
                }
            }, 10);
        } else {
            setDropdownStyle({});
        }
    }, [openDropdown, field.type]);

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

        // Throttled scroll handler to update dropdown position or close it
        let scrollTimeout: NodeJS.Timeout | null = null;
        const handleScroll = () => {
            if (openDropdown && !scrollTimeout) {
                scrollTimeout = setTimeout(() => {
                    // Update dropdown position when scrolling
                    if (triggerRefs.current[openDropdown]) {
                        handleDropdownOpen(openDropdown);
                    }
                    scrollTimeout = null;
                }, 100);
            }
        };

        const handleResize = () => {
            if (openDropdown) {
                setOpenDropdown(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', handleResize);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleResize);
            if (scrollTimeout) {
                clearTimeout(scrollTimeout);
            }
        };
    }, [openDropdown, handleDropdownOpen]);



    const handleFieldChange = useCallback((fieldId: string, newValue: any) => {
        onChange(fieldId, newValue);
    }, [onChange]);

    const getSelectedRatingColor = (value: string, options: any[]) => {
        const selectedOption = options.find(opt => opt.value === value);
        if (!selectedOption) return 'bg-gray-100 text-gray-700 border-gray-200';

        // Use shared color utility but adjust for rating display (lighter background)
        const colorClasses = getColorClasses(selectedOption.color || 'transparent');
        return colorClasses.replace('bg-', 'bg-').replace('50', '100').replace('border-', 'border-').replace('300', '200');
    };

    const getSelectedRatingLabel = (value: string, options: any[]) => {
        const selectedOption = options.find(opt => opt.value === value);
        return selectedOption?.label || 'Select rating';
    };

    switch (field.type) {
        case 'text':
        case 'email':
        case 'number':
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
                <div className="mb-6">
                    <label htmlFor={`${field.id}-textarea`} className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                            "w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-y bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400",
                            error ? "border-red-500 dark:border-red-400" : "border-gray-300 dark:border-gray-600"
                        )}
                        rows={4}
                    />
                    {error && <p className="text-red-500 dark:text-red-400 text-sm mt-2">{error}</p>}
                </div>
            );

        case 'select': {
            // Determine which options to use - select option set or individual options
            let selectOptions = field.options || [];
            let isSelectLoading = false;

            if (field.selectOptionSetId) {
                if (selectOptionSets[field.selectOptionSetId]) {
                    // Use loaded select option set options
                    selectOptions = selectOptionSets[field.selectOptionSetId].options.map(opt => ({
                        value: opt.value,
                        label: opt.label,
                        color: opt.color,
                        isDefault: opt.isDefault
                    }));
                } else if (loadingOptionSets) {
                    isSelectLoading = true;
                }
            }

            if (isSelectLoading) {
                return (
                    <div className="mb-6">
                        <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <div className="text-gray-500 dark:text-gray-400 text-sm px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">Loading options...</div>
                    </div>
                );
            }

            return (
                <div className="mb-6">
                    <label htmlFor={`${field.id}-select`} className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <select
                        id={`${field.id}-select`}
                        name={field.id}
                        value={value || ''}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        className={clsx(
                            "w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white",
                            error ? "border-red-500 dark:border-red-400" : "border-gray-300 dark:border-gray-600"
                        )}
                    >
                        <option value="">{field.placeholder || 'Select an option...'}</option>
                        {selectOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    {error && <p className="text-red-500 dark:text-red-400 text-sm mt-2">{error}</p>}
                </div>
            );
        }

        case 'radio': {
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
                } else if (loadingOptionSets) {
                    isRadioLoading = true;
                }
            }

            if (isRadioLoading) {
                return (
                    <div className="mb-4">
                        <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <div className="text-gray-500 dark:text-gray-400 text-sm">Loading options...</div>
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
        }

        case 'multiselect': {
            // Determine which options to use - multi-select option set or individual options
            let multiSelectOptions = field.options || [];
            let isMultiSelectLoading = false;

            if (field.multiSelectOptionSetId) {
                if (multiSelectOptionSets[field.multiSelectOptionSetId]) {
                    // Use loaded multi-select option set options
                    multiSelectOptions = multiSelectOptionSets[field.multiSelectOptionSetId].options.map(opt => ({
                        value: opt.value,
                        label: opt.label,
                        color: opt.color,
                        isDefault: opt.isDefault
                    }));
                } else if (loadingOptionSets) {
                    isMultiSelectLoading = true;
                }
            }

            if (isMultiSelectLoading) {
                return (
                    <div className="mb-4">
                        <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <div className="text-gray-500 dark:text-gray-400 text-sm">Loading options...</div>
                    </div>
                );
            }

            // Extract min/max selections from option set or validation rules
            let minSelections: number | undefined;
            let maxSelections: number | undefined;

            if (field.multiSelectOptionSetId && multiSelectOptionSets[field.multiSelectOptionSetId]) {
                // Use option set constraints
                const optionSet = multiSelectOptionSets[field.multiSelectOptionSetId];
                minSelections = optionSet.minSelections;
                maxSelections = optionSet.maxSelections;
            } else if (field.validation) {
                // Use individual field validation rules
                const minRule = field.validation.find(rule => rule.type === 'minSelections');
                const maxRule = field.validation.find(rule => rule.type === 'maxSelections');
                minSelections = minRule?.value;
                maxSelections = maxRule?.value;
            }


            return (
                <CheckboxGroup
                    name={field.id}
                    label={field.label}
                    options={multiSelectOptions}
                    selectedValues={value || []}
                    onChange={(value) => handleFieldChange(field.id, value)}
                    error={error}
                    required={field.required}
                    minSelections={minSelections}
                    maxSelections={maxSelections}
                />
            );
        }

        case 'rating': {
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
                } else if (loadingScales) {
                    isLoading = true;
                }
            }

            return (
                <div className="mb-6">
                    <div className="flex items-center justify-between p-4 border border-green-200 dark:border-green-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-900/20">
                        <div className="text-gray-700 dark:text-gray-300 font-medium">
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                        </div>
                        <div className="relative" ref={dropdownRef}>
                            <button
                                ref={(el) => {
                                    if (el) triggerRefs.current[field.id] = el;
                                }}
                                type="button"
                                disabled={isLoading}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleDropdownOpen(field.id);
                                }}
                                className={clsx(
                                    "px-3 py-2 rounded text-sm font-medium transition-all duration-200 flex items-center gap-2",
                                    isLoading ? "opacity-50 cursor-not-allowed" : "",
                                    getSelectedRatingColor(value, ratingOptions)
                                )}
                            >
                                {isLoading ? "Loading..." : getSelectedRatingLabel(value, ratingOptions)}
                                <ChevronDown className={clsx(
                                    "w-4 h-4 transition-transform duration-200",
                                    openDropdown === field.id ? "rotate-180" : ""
                                )} />
                            </button>

                            {openDropdown === field.id && !isLoading && (
                                isMobile ? (
                                    <Portal>
                                        <div
                                            className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-xl dark:shadow-gray-900/50 overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-200 mobile-dropdown-override"
                                            style={dropdownStyle}
                                        >
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
                                                        'w-full text-left px-3 py-3 sm:py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 rounded touch-manipulation',
                                                        value === option.value ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium' : 'text-gray-700 dark:text-gray-300'
                                                    )}
                                                >
                                                    {option.label}
                                                    {option.isDefault && value !== option.value && (
                                                        <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">(Default)</span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </Portal>
                                ) : (
                                    <div
                                        className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-xl dark:shadow-gray-900/50 overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-200 mobile-dropdown-override"
                                        style={dropdownStyle}
                                    >
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
                                                    'w-full text-left px-3 py-3 sm:py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 rounded touch-manipulation',
                                                    value === option.value ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium' : 'text-gray-700 dark:text-gray-300'
                                                )}
                                            >
                                                {option.label}
                                                {option.isDefault && value !== option.value && (
                                                    <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">(Default)</span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
                </div>
            );
        }

        case 'multiselectdropdown': {
            // Determine which options to use - select option set (with allowMultiple=true) or individual options
            let multiDropdownOptions = field.options || [];
            let isMultiDropdownLoading = false;

            if (field.selectOptionSetId) {
                if (selectOptionSets[field.selectOptionSetId]) {
                    // Use loaded select option set options (should have allowMultiple=true)
                    multiDropdownOptions = selectOptionSets[field.selectOptionSetId].options.map(opt => ({
                        value: opt.value,
                        label: opt.label,
                        color: opt.color,
                        isDefault: opt.isDefault
                    }));
                } else if (loadingOptionSets) {
                    isMultiDropdownLoading = true;
                }
            }

            if (isMultiDropdownLoading) {
                return (
                    <div className="mb-4">
                        <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <div className="text-gray-500 dark:text-gray-400 text-sm">Loading options...</div>
                    </div>
                );
            }

            const selectedValues = value || [];
            const selectedLabels = selectedValues
                .map((val: string) => multiDropdownOptions.find(opt => opt.value === val)?.label)
                .filter(Boolean);

            return (
                <div className="mb-6">
                    <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-3">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <div className="relative" ref={dropdownRef}>
                        <button
                            ref={(el) => {
                                if (el) triggerRefs.current[field.id] = el;
                            }}
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDropdownOpen(field.id);
                            }}
                            className={clsx(
                                "w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-left flex items-center justify-between transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white",
                                error ? "border-red-500 dark:border-red-400" : "border-gray-300 dark:border-gray-600"
                            )}
                        >
                            <span className="truncate">
                                {selectedLabels.length > 0
                                    ? selectedLabels.length === 1
                                        ? selectedLabels[0]
                                        : `${selectedLabels.length} selected`
                                    : field.placeholder || 'Select options...'
                                }
                            </span>
                            <ChevronDown className={clsx(
                                "w-4 h-4 text-gray-400 dark:text-gray-300 transition-transform duration-200",
                                openDropdown === field.id ? "rotate-180" : ""
                            )} />
                        </button>

                        {openDropdown === field.id && (
                            isMobile ? (
                                <Portal>
                                    <div
                                        className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg dark:shadow-gray-900/50 overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-200 mobile-dropdown-override"
                                        style={dropdownStyle}
                                    >
                                        {multiDropdownOptions.map((option) => {
                                            const isSelected = selectedValues.includes(option.value);
                                            return (
                                                <label
                                                    key={option.value}
                                                    className="flex items-center px-4 py-3 sm:py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer touch-manipulation"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={(e) => {
                                                            e.stopPropagation();
                                                            const newValues = isSelected
                                                                ? selectedValues.filter((val: string) => val !== option.value)
                                                                : [...selectedValues, option.value];
                                                            handleFieldChange(field.id, newValues);
                                                        }}
                                                        className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                                                    />
                                                    <span className="ml-3 text-gray-900 dark:text-gray-100">{option.label}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </Portal>
                            ) : (
                                <div
                                    className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg dark:shadow-gray-900/50 overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-200 mobile-dropdown-override"
                                    style={dropdownStyle}
                                >
                                    {multiDropdownOptions.map((option) => {
                                        const isSelected = selectedValues.includes(option.value);
                                        return (
                                            <label
                                                key={option.value}
                                                className="flex items-center px-4 py-3 sm:py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer touch-manipulation"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={(e) => {
                                                        e.stopPropagation();
                                                        const newValues = isSelected
                                                            ? selectedValues.filter((val: string) => val !== option.value)
                                                            : [...selectedValues, option.value];
                                                        handleFieldChange(field.id, newValues);
                                                    }}
                                                    className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                                                />
                                                <span className="ml-3 text-gray-900 dark:text-gray-100">{option.label}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            )
                        )}
                    </div>
                    {error && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{error}</p>}
                </div>
            );
        }

        default:
            return (
                <div className="mb-4">
                    <p className="text-red-500 dark:text-red-400">Unsupported field type: {field.type}</p>
                </div>
            );
    }
};
