import { clsx } from 'clsx';
import { ChevronDown } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { firestoreHelpers } from '../../../config/firebase';
import { RatingScale, SurveyConfig, SurveyField, SurveySection } from '../../../types/survey.types';
import { Alert, Button, Input } from '../../common';
import { CheckboxGroup, RadioGroup } from '../index';

interface DynamicFormProps {
    config: SurveyConfig;
    onSubmit: (responses: Record<string, any>) => Promise<void>;
    loading?: boolean;
    error?: string | null;
    success?: string | null;
    onDismissAlert?: () => void;
    className?: string;
}

interface FormState {
    [fieldId: string]: any;
}

export const DynamicForm: React.FC<DynamicFormProps> = ({
    config,
    onSubmit,
    loading = false,
    error,
    success,
    onDismissAlert,
    className
}) => {
    const [formState, setFormState] = useState<FormState>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [ratingScales, setRatingScales] = useState<Record<string, RatingScale>>({});
    const [loadingScales, setLoadingScales] = useState<Record<string, boolean>>({});
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Click outside handler to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Check if the click target is part of a dropdown option
            const target = event.target as Element;
            if (target.closest('[data-dropdown-option]')) {
                return; // Don't close if clicking on a dropdown option
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

    // Load rating scale for a field
    const loadRatingScale = useCallback(async (scaleId: string) => {
        if (ratingScales[scaleId] || loadingScales[scaleId]) return;

        setLoadingScales(prev => ({ ...prev, [scaleId]: true }));
        try {
            const scale = await firestoreHelpers.getRatingScale(scaleId);
            if (scale) {
                setRatingScales(prev => ({ ...prev, [scaleId]: scale }));
            }
        } catch (error) {
            console.error('Error loading rating scale:', error);
        } finally {
            setLoadingScales(prev => ({ ...prev, [scaleId]: false }));
        }
    }, [ratingScales, loadingScales]);

    // Initialize form state with default values and load rating scales
    const initializeFormState = useCallback(() => {
        const initialState: FormState = {};
        const scalesToLoad: string[] = [];

        config.sections.forEach(section => {
            section.fields.forEach(field => {
                if (field.defaultValue !== undefined) {
                    initialState[field.id] = field.defaultValue;
                } else if (field.type === 'multiselect') {
                    initialState[field.id] = [];
                } else if (field.type === 'rating') {
                    if (field.ratingScaleId) {
                        // Load rating scale and use its default option
                        scalesToLoad.push(field.ratingScaleId);
                        // We'll set the default value after loading the scale
                    } else {
                        // Use default value from individual options if available
                        const defaultOption = field.options?.find(opt => opt.isDefault);
                        initialState[field.id] = defaultOption?.value || 'Not Important';
                    }
                }
            });
        });

        setFormState(initialState);

        // Load all needed rating scales
        scalesToLoad.forEach(scaleId => loadRatingScale(scaleId));
    }, [config, loadRatingScale]);

    React.useEffect(() => {
        initializeFormState();
    }, [initializeFormState]);

    // Set default values when rating scales are loaded
    React.useEffect(() => {
        config.sections.forEach(section => {
            section.fields.forEach(field => {
                if (field.type === 'rating' && field.ratingScaleId && ratingScales[field.ratingScaleId]) {
                    const scale = ratingScales[field.ratingScaleId];
                    const defaultOption = scale.options.find(opt => opt.isDefault);
                    if (defaultOption && !formState[field.id]) {
                        setFormState(prev => ({ ...prev, [field.id]: defaultOption.value }));
                    }
                }
            });
        });
    }, [ratingScales, config, formState]);

    const validateField = useCallback((field: SurveyField, value: any): string | null => {
        if (!field.validation) return null;

        for (const rule of field.validation) {
            switch (rule.type) {
                case 'required':
                    if (!value || (Array.isArray(value) && value.length === 0)) {
                        return rule.message || `${field.label} is required`;
                    }
                    break;
                case 'email':
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (value && !emailRegex.test(value)) {
                        return rule.message || 'Please enter a valid email address';
                    }
                    break;
                case 'min':
                    if (value && value.length < rule.value) {
                        return rule.message || `${field.label} must be at least ${rule.value} characters`;
                    }
                    break;
                case 'max':
                    if (value && value.length > rule.value) {
                        return rule.message || `${field.label} must be no more than ${rule.value} characters`;
                    }
                    break;
            }
        }
        return null;
    }, []);

    const validateForm = useCallback((): boolean => {
        const newErrors: Record<string, string> = {};
        let isValid = true;

        config.sections.forEach(section => {
            section.fields.forEach(field => {
                const value = formState[field.id];
                const error = validateField(field, value);
                if (error) {
                    newErrors[field.id] = error;
                    isValid = false;
                }
            });
        });

        setErrors(newErrors);
        return isValid;
    }, [config, formState, validateField]);

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

    const handleFieldChange = useCallback((fieldId: string, value: any) => {
        console.log('handleFieldChange called:', fieldId, value);
        setFormState(prev => {
            const newState = { ...prev, [fieldId]: value };
            console.log('New form state:', newState);
            return newState;
        });

        // Clear error when user starts typing
        if (errors[fieldId]) {
            setErrors(prev => ({ ...prev, [fieldId]: '' }));
        }
    }, [errors]);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        await onSubmit(formState);
    }, [formState, validateForm, onSubmit]);

    const renderField = useCallback((field: SurveyField) => {
        const value = formState[field.id];
        const error = errors[field.id];

        switch (field.type) {
            case 'text':
            case 'email':
                return (
                    <Input
                        key={field.id}
                        name={field.id}
                        label={field.label}
                        value={value || ''}
                        onChange={(value) => handleFieldChange(field.id, value)}
                        placeholder={field.placeholder}
                        error={error}
                        required={field.required}
                    />
                );

            case 'textarea':
                return (
                    <div key={field.id} className="mb-4">
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
                        key={field.id}
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
                        key={field.id}
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
                    <div key={field.id} className="mb-4">
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
                                                    console.log('Dropdown option clicked:', option.value, 'for field:', field.id);
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
                    <div key={field.id} className="mb-4">
                        <p className="text-red-500">Unsupported field type: {field.type}</p>
                    </div>
                );
        }
    }, [formState, errors, handleFieldChange, openDropdown]);

    const renderSection = useCallback((section: SurveySection) => {
        return (
            <div key={section.id} className="mb-6">
                <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {section.title}
                    </h3>
                    {section.description && (
                        <p className="text-gray-600">{section.description}</p>
                    )}
                </div>
                <div className="space-y-4">
                    {section.fields.map(renderField)}
                </div>
            </div>
        );
    }, [renderField]);

    return (
        <div className={clsx("max-w-4xl mx-auto bg-white rounded-lg shadow-md", className)}>
            <div className="px-8 py-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-3">
                        {config.title}
                    </h1>
                    {config.description && (
                        <p className="text-lg text-gray-600">
                            {config.description}
                        </p>
                    )}
                </div>

                {(error || success) && (
                    <Alert
                        type={error ? 'error' : 'success'}
                        message={error || success || ''}
                        onDismiss={onDismissAlert}
                        className="mb-6"
                    />
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {config.sections
                        .sort((a, b) => a.order - b.order)
                        .map(renderSection)}

                    <div className="flex justify-center pt-6">
                        <Button
                            type="submit"
                            loading={loading}
                            disabled={loading}
                            className="px-8 py-3 text-base"
                        >
                            Submit Survey
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
