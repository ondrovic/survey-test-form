import { clsx } from 'clsx';
import React, { useCallback } from 'react';
import { useForm } from '../../../contexts/form-context';
import { useSurveyData } from '../../../contexts/survey-data-context';
import { SurveyConfig, SurveySection, SurveyField } from '../../../types/framework.types';
import { Button } from '../../common';
import { FieldRenderer } from '../field-renderer';
import { DynamicFormProps } from './dynamic-form.types';

// Helper function to create descriptive field IDs
const createDescriptiveFieldId = (section: SurveySection, field: SurveyField): string => {
    const sectionSlug = section.title.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const fieldSlug = field.label.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    return `${sectionSlug}_${fieldSlug}`;
};

// Helper function to transform form state to use descriptive IDs
const transformFormStateToDescriptiveIds = (formState: Record<string, any>, config: SurveyConfig): Record<string, any> => {
    const transformedResponses: Record<string, any> = {};

    config.sections.forEach(section => {
        section.fields.forEach(field => {
            const descriptiveId = createDescriptiveFieldId(section, field);
            if (formState[field.id] !== undefined) {
                transformedResponses[descriptiveId] = formState[field.id];
            }
        });
    });

    return transformedResponses;
};

export const DynamicForm: React.FC<DynamicFormProps> = ({
    config,
    onSubmit,
    loading = false,
    className,
    resetTrigger
}) => {
    // Use context providers
    const { state: formState, setFieldValue, setFieldError, setErrors, resetForm } = useForm();
    const { state: surveyDataState } = useSurveyData();
    
    // Track if form has been submitted to control when to show validation
    const [hasSubmitted, setHasSubmitted] = React.useState(false);

    // Extract data from survey data context
    const { ratingScales, radioOptionSets, multiSelectOptionSets, selectOptionSets, isLoading } = surveyDataState;

    // Convert arrays to records for easy lookup
    const ratingScalesRecord = React.useMemo(() => {
        const record: Record<string, any> = {};
        ratingScales.forEach(scale => {
            record[scale.id] = scale;
        });
        return record;
    }, [ratingScales]);

    const radioOptionSetsRecord = React.useMemo(() => {
        const record: Record<string, any> = {};
        if (Array.isArray(radioOptionSets)) {
            radioOptionSets.forEach(set => {
                record[set.id] = set;
            });
        }
        return record;
    }, [radioOptionSets]);

    const multiSelectOptionSetsRecord = React.useMemo(() => {
        const record: Record<string, any> = {};
        if (Array.isArray(multiSelectOptionSets)) {
            multiSelectOptionSets.forEach(set => {
                record[set.id] = set;
            });
        }
        return record;
    }, [multiSelectOptionSets]);

    const selectOptionSetsRecord = React.useMemo(() => {
        const record: Record<string, any> = {};
        if (Array.isArray(selectOptionSets)) {
            selectOptionSets.forEach(set => {
                record[set.id] = set;
            });
        }
        return record;
    }, [selectOptionSets]);

    // Initialize form state with default values
    const initializeFormState = useCallback(() => {
        const initialState: Record<string, any> = {};

        config.sections.forEach(section => {
            section.fields.forEach(field => {
                console.log('🔍 Processing field:', {
                    fieldId: field.id,
                    fieldLabel: field.label,
                    fieldType: field.type,
                    hasMultiSelectOptionSetId: !!field.multiSelectOptionSetId,
                    multiSelectOptionSetId: field.multiSelectOptionSetId,
                    hasRadioOptionSetId: !!field.radioOptionSetId,
                    radioOptionSetId: field.radioOptionSetId,
                    hasRatingScaleId: !!field.ratingScaleId,
                    ratingScaleId: field.ratingScaleId
                });

                if (field.type === 'rating' && field.ratingScaleId) {
                    // Use default value from rating scale if available
                    const scale = ratingScalesRecord[field.ratingScaleId];
                    if (scale) {
                        const defaultOption = scale.options.find(opt => opt.isDefault);
                        if (defaultOption) {
                            initialState[field.id] = defaultOption.value;
                        } else {
                            initialState[field.id] = 'Not Important';
                        }
                    } else {
                        initialState[field.id] = 'Not Important';
                    }
                    console.log('🔍 Set rating field default:', { fieldId: field.id, value: initialState[field.id] });
                } else if (field.type === 'radio' && field.radioOptionSetId) {
                    // Load radio option set - don't set initial value, will be set when option set loads
                    console.log('📋 Found radio option set to load:', field.radioOptionSetId);
                } else if (field.type === 'radio' && field.options) {
                    // Use default value from individual radio options if available
                    const defaultOption = field.options.find(opt => opt.isDefault);
                    if (defaultOption) {
                        initialState[field.id] = defaultOption.value;
                    }
                    // If no default option, don't set any initial value (will be undefined)
                } else if (field.type === 'multiselect' && field.multiSelectOptionSetId) {
                    // Load multi-select option set - don't set initial value, will be set when option set loads
                    console.log('📋 Found multi-select option set to load:', field.multiSelectOptionSetId);
                } else if (field.type === 'select' && field.selectOptionSetId) {
                    // Load select option set - don't set initial value, will be set when option set loads
                    console.log('📋 Found select option set to load:', field.selectOptionSetId, 'for field:', field.label);
                } else if (field.type === 'select' && field.options) {
                    // Use default value from individual select options if available
                    const defaultOption = field.options.find(opt => opt.isDefault);
                    if (defaultOption) {
                        initialState[field.id] = defaultOption.value;
                    }
                    // If no default option, don't set any initial value (will be undefined)
                } else if (field.type === 'multiselectdropdown' && field.selectOptionSetId) {
                    // Load select option set for multi-select dropdown - don't set initial value, will be set when option set loads
                    console.log('📋 Found select option set for multi-select dropdown to load:', field.selectOptionSetId, 'for field:', field.label);
                } else if ((field.type === 'multiselect' || field.type === 'multiselectdropdown') && field.options) {
                    // Use default values from individual multi-select options if available
                    const defaultOptions = field.options.filter(opt => opt.isDefault);
                    if (defaultOptions.length > 0) {
                        const defaultValues = defaultOptions.map(opt => opt.value);
                        initialState[field.id] = defaultValues;
                    } else {
                        initialState[field.id] = [];
                    }
                }
            });
        });

        return initialState;
    }, [config.id, config.sections, ratingScalesRecord]);

    // Initialize form state with default values
    const setupFormState = useCallback(() => {
        const initialState = initializeFormState();

        // Reset form to initial state
        resetForm();

        // Set initial form state
        Object.entries(initialState).forEach(([fieldId, value]) => {
            setFieldValue(fieldId, value);
        });
    }, [initializeFormState, setFieldValue, resetForm]);

    // Initialize form on mount
    React.useEffect(() => {
        setupFormState();
    }, [setupFormState]); // Re-initialize when setup function changes

    // Handle form reset when resetTrigger changes
    React.useEffect(() => {
        if (resetTrigger && resetTrigger > 0) {
            setupFormState();
        }
    }, [resetTrigger, setupFormState]);

    // Set default values when rating scales are loaded
    React.useEffect(() => {
        config.sections.forEach(section => {
            section.fields.forEach(field => {
                if (field.type === 'rating' && field.ratingScaleId && ratingScalesRecord[field.ratingScaleId]) {
                    const scale = ratingScalesRecord[field.ratingScaleId];
                    const defaultOption = scale.options.find(opt => opt.isDefault);
                    if (defaultOption && !formState.formData[field.id]) {
                        setFieldValue(field.id, defaultOption.value);
                    }
                }
            });
        });
    }, [ratingScalesRecord, config, formState.formData, setFieldValue]);

    // Set default values when radio option sets are loaded
    React.useEffect(() => {
        config.sections.forEach(section => {
            section.fields.forEach(field => {
                if (field.type === 'radio' && field.radioOptionSetId && radioOptionSetsRecord[field.radioOptionSetId]) {
                    const optionSet = radioOptionSetsRecord[field.radioOptionSetId];
                    const defaultOption = optionSet.options.find(opt => opt.isDefault);
                    // Only set default value if there is a default option and no value is currently set
                    if (defaultOption && formState.formData[field.id] === undefined) {
                        setFieldValue(field.id, defaultOption.value);
                    }
                }
            });
        });
    }, [radioOptionSetsRecord, config, formState.formData, setFieldValue]);

    // Set default values when multi-select option sets are loaded
    React.useEffect(() => {
        config.sections.forEach(section => {
            section.fields.forEach(field => {
                if (field.type === 'multiselect' && field.multiSelectOptionSetId && multiSelectOptionSetsRecord[field.multiSelectOptionSetId]) {
                    const optionSet = multiSelectOptionSetsRecord[field.multiSelectOptionSetId];
                    const defaultOptions = optionSet.options.filter(opt => opt.isDefault);
                    // Only set default values if there are default options and no value is currently set
                    if (defaultOptions.length > 0 && formState.formData[field.id] === undefined) {
                        const defaultValues = defaultOptions.map(opt => opt.value);
                        setFieldValue(field.id, defaultValues);
                    }
                }
            });
        });
    }, [multiSelectOptionSetsRecord, config, formState.formData, setFieldValue]);

    // Set default values when select option sets are loaded
    React.useEffect(() => {
        config.sections.forEach(section => {
            section.fields.forEach(field => {
                if (field.type === 'select' && field.selectOptionSetId && selectOptionSetsRecord[field.selectOptionSetId]) {
                    const optionSet = selectOptionSetsRecord[field.selectOptionSetId];
                    const defaultOption = optionSet.options.find(opt => opt.isDefault);
                    console.log('🔍 Select option set loaded for field:', {
                        fieldId: field.id,
                        fieldLabel: field.label,
                        optionSetId: field.selectOptionSetId,
                        hasDefaultOption: !!defaultOption,
                        defaultValue: defaultOption?.value,
                        currentValue: formState.formData[field.id]
                    });
                    // Only set default value if there is a default option and no value is currently set
                    if (defaultOption && formState.formData[field.id] === undefined) {
                        console.log('🔄 Setting default value for select field:', field.id, defaultOption.value);
                        setFieldValue(field.id, defaultOption.value);
                    }
                } else if (field.type === 'multiselectdropdown' && field.selectOptionSetId && selectOptionSetsRecord[field.selectOptionSetId]) {
                    const optionSet = selectOptionSetsRecord[field.selectOptionSetId];
                    const defaultOptions = optionSet.options.filter(opt => opt.isDefault);
                    console.log('🔍 Multi-select dropdown option set loaded for field:', {
                        fieldId: field.id,
                        fieldLabel: field.label,
                        optionSetId: field.selectOptionSetId,
                        hasDefaultOptions: defaultOptions.length > 0,
                        currentValue: formState.formData[field.id]
                    });
                    // Only set default values if there are default options and no value is currently set
                    if (defaultOptions.length > 0 && formState.formData[field.id] === undefined) {
                        const defaultValues = defaultOptions.map(opt => opt.value);
                        console.log('🔄 Setting default values for multi-select dropdown field:', field.id, defaultValues);
                        setFieldValue(field.id, defaultValues);
                    }
                }
            });
        });
    }, [selectOptionSetsRecord, config, formState.formData, setFieldValue]);

    // Helper function to check if a field value is considered "empty" based on field type
    const isFieldEmpty = useCallback((field: SurveyField, value: any): boolean => {
        if (value === null || value === undefined) return true;
        
        switch (field.type) {
            case 'multiselect':
            case 'multiselectdropdown':
                return Array.isArray(value) ? value.length === 0 : true;
            case 'text':
            case 'email':
            case 'textarea':
            case 'number':
                return String(value).trim() === '';
            case 'select':
                // For single select, empty string or exactly empty string means no selection
                return value === '' || value === null || value === undefined;
            case 'radio':
            case 'rating':
                // For radio/rating, empty string or exactly empty string means no selection
                return value === '' || value === null || value === undefined;
            default:
                return !value || value === '';
        }
    }, []);

    // Real-time field validation
    const validateField = useCallback((fieldId: string, value: any) => {
        // Find the field definition
        let field: SurveyField | undefined;
        config.sections.forEach(section => {
            const foundField = section.fields.find(f => f.id === fieldId);
            if (foundField) field = foundField;
        });

        if (!field) return;

        // Clear any existing error for this field
        setFieldError(fieldId, '');

        // Check if required field is empty
        if (field.required && isFieldEmpty(field, value)) {
            setFieldError(fieldId, 'This field is required');
        }
    }, [config, setFieldError, isFieldEmpty]);

    const handleFieldChange = useCallback((fieldId: string, value: any) => {
        setFieldValue(fieldId, value);
        
        // Only validate if form has been submitted and there was already an error for this field
        if (hasSubmitted && formState.errors[fieldId]) {
            setTimeout(() => validateField(fieldId, value), 300);
        }
    }, [setFieldValue, validateField, formState.errors, hasSubmitted]);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setHasSubmitted(true);

        // Get all fields from config for validation
        const allFields: SurveyField[] = [];
        config.sections.forEach(section => {
            allFields.push(...section.fields);
        });

        console.log('📋 Validation check:', {
            fieldsCount: allFields.length,
            formStateKeys: Object.keys(formState.formData),
            hasErrors: Object.keys(formState.errors).length > 0,
            errors: formState.errors
        });

        // Clear any existing errors first
        setErrors({});

        // Comprehensive validation - check if required fields have values
        const validationErrors: Record<string, string> = {};
        allFields.forEach(field => {
            const fieldValue = formState.formData[field.id];
            const isEmpty = isFieldEmpty(field, fieldValue);
            
            console.log('🔍 Validating field:', {
                fieldId: field.id,
                fieldLabel: field.label,
                fieldType: field.type,
                fieldValue,
                isEmpty,
                isRequired: field.required,
                willError: field.required && isEmpty
            });
            
            if (field.required && isEmpty) {
                validationErrors[field.id] = 'This field is required';
            }
        });

        if (Object.keys(validationErrors).length > 0) {
            console.log('❌ Form validation failed, errors:', validationErrors);
            // Set the validation errors in the form state so they show in the UI
            setErrors(validationErrors);
            
            // Scroll to the first error field
            const firstErrorFieldId = Object.keys(validationErrors)[0];
            const firstErrorElement = document.querySelector(`[name="${firstErrorFieldId}"]`) as HTMLElement;
            if (firstErrorElement) {
                firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstErrorElement.focus();
            }
            
            return;
        }

        console.log('✅ Form validation passed, calling onSubmit');
        try {
            const transformedData = transformFormStateToDescriptiveIds(formState.formData, config);
            console.log('📤 Calling onSubmit with data:', transformedData);
            await onSubmit(transformedData);

            // Don't show success state here since we're redirecting to confirmation page
            // The success will be handled by the confirmation page
        } catch (error) {
            // Don't show success state if there was an error
            // The error will be handled by the parent component
            console.error('Form submission error:', error);
        }
    }, [formState.formData, formState.errors, onSubmit, config, isFieldEmpty, setErrors]);

    const renderField = useCallback((field: SurveyField) => {
        // Only show error if form has been submitted
        const fieldError = hasSubmitted ? formState.errors[field.id] : undefined;

        return (
            <FieldRenderer
                key={field.id}
                field={field}
                value={formState.formData[field.id]}
                onChange={handleFieldChange}
                error={fieldError}
                ratingScales={ratingScalesRecord}
                loadingScales={isLoading}
                radioOptionSets={radioOptionSetsRecord}
                multiSelectOptionSets={multiSelectOptionSetsRecord}
                selectOptionSets={selectOptionSetsRecord}
                loadingOptionSets={isLoading}
            />
        );
    }, [formState.formData, formState.errors, handleFieldChange, hasSubmitted, ratingScalesRecord, radioOptionSetsRecord, multiSelectOptionSetsRecord, selectOptionSetsRecord, isLoading]);

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

                <form
                    onSubmit={handleSubmit}
                    className="space-y-6"
                >


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
