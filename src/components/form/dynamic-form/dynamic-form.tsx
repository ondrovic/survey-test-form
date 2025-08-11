import { clsx } from 'clsx';
import React, { useCallback } from 'react';
import { useForm } from '../../../contexts/form-context';
import { useSurveyData } from '../../../contexts/survey-data-context';
import { SurveyConfig, SurveySection, SurveyField } from '../../../types/framework.types';
import { Button } from '../../common';
import { FieldRenderer } from '../field-renderer';
import { DynamicFormProps } from './dynamic-form.types';
import { getOrderedSectionContent } from '../../../utils/section-content.utils';

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

    // Helper function to process all fields in a section (including subsections)
    const processAllFields = useCallback((section: SurveySection, callback: (field: SurveyField) => void) => {
        // Process section-level fields
        section.fields.forEach(callback);
        
        // Process subsection fields
        if (section.subsections) {
            section.subsections.forEach(subsection => {
                subsection.fields.forEach(callback);
            });
        }
    }, []);

    // Initialize form state with default values
    const initializeFormState = useCallback(() => {
        const initialState: Record<string, any> = {};

        config.sections.forEach(section => {
            processAllFields(section, (field) => {
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
                    // Load multi-select option set - initialize as empty array, will be set when option set loads
                    console.log('📋 Found multi-select option set to load:', field.multiSelectOptionSetId);
                    initialState[field.id] = [];
                } else if (field.type === 'multiselect' && !field.multiSelectOptionSetId) {
                    // For multiselect without option set, always initialize as empty array
                    console.log('📋 Initializing multiselect field without option set:', field.id);
                    initialState[field.id] = [];
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
                    // Load select option set for multi-select dropdown - initialize as empty array, will be set when option set loads
                    console.log('📋 Found select option set for multi-select dropdown to load:', field.selectOptionSetId, 'for field:', field.label);
                    initialState[field.id] = [];
                } else if (field.type === 'multiselectdropdown' && !field.selectOptionSetId) {
                    // For multiselectdropdown without option set, always initialize as empty array
                    console.log('📋 Initializing multiselectdropdown field without option set:', field.id);
                    initialState[field.id] = [];
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
    }, [config.id, config.sections, ratingScalesRecord, processAllFields]);

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
            processAllFields(section, (field) => {
                if (field.type === 'rating' && field.ratingScaleId && ratingScalesRecord[field.ratingScaleId]) {
                    const scale = ratingScalesRecord[field.ratingScaleId];
                    const defaultOption = scale.options.find(opt => opt.isDefault);
                    if (defaultOption && !formState.formData[field.id]) {
                        setFieldValue(field.id, defaultOption.value);
                    }
                }
            });
        });
    }, [ratingScalesRecord, config, formState.formData, setFieldValue, processAllFields]);

    // Set default values when radio option sets are loaded
    React.useEffect(() => {
        config.sections.forEach(section => {
            processAllFields(section, (field) => {
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
    }, [radioOptionSetsRecord, config, formState.formData, setFieldValue, processAllFields]);

    // Set default values when multi-select option sets are loaded
    React.useEffect(() => {
        config.sections.forEach(section => {
            processAllFields(section, (field) => {
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
    }, [multiSelectOptionSetsRecord, config, formState.formData, setFieldValue, processAllFields]);

    // Set default values when select option sets are loaded
    React.useEffect(() => {
        config.sections.forEach(section => {
            processAllFields(section, (field) => {
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
    }, [selectOptionSetsRecord, config, formState.formData, setFieldValue, processAllFields]);

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

    // Enhanced field validation with option set support
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
            return;
        }

        // Skip validation for empty non-required fields
        if (isFieldEmpty(field, value) && !field.required) {
            return;
        }

        // Email validation
        if (field.type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                setFieldError(fieldId, 'Please enter a valid email address');
                return;
            }
        }

        // Number validation
        if (field.type === 'number' && value) {
            const numValue = Number(value);
            if (isNaN(numValue)) {
                setFieldError(fieldId, 'Please enter a valid number');
                return;
            }
        }

        // Multi-select field validation (both multiselect and multiselectdropdown)
        if ((field.type === 'multiselect' || field.type === 'multiselectdropdown') && Array.isArray(value)) {
            // For multiselect inline (uses multiSelectOptionSetId)
            if (field.type === 'multiselect' && field.multiSelectOptionSetId && multiSelectOptionSetsRecord[field.multiSelectOptionSetId]) {
                const optionSet = multiSelectOptionSetsRecord[field.multiSelectOptionSetId];
                
                if (optionSet.minSelections && value.length < optionSet.minSelections) {
                    setFieldError(fieldId, `Please select at least ${optionSet.minSelections} option${optionSet.minSelections === 1 ? '' : 's'}`);
                    return;
                }
                
                if (optionSet.maxSelections && value.length > optionSet.maxSelections) {
                    setFieldError(fieldId, `Please select at most ${optionSet.maxSelections} option${optionSet.maxSelections === 1 ? '' : 's'}`);
                    return;
                }
                
                // Validate that all selected values exist in the option set
                const validOptionValues = optionSet.options.map(opt => opt.value);
                const invalidValues = value.filter(val => !validOptionValues.includes(val));
                if (invalidValues.length > 0) {
                    setFieldError(fieldId, 'Some selected options are no longer available');
                    return;
                }
            }
            // For multiselectdropdown (uses selectOptionSetId)
            else if (field.type === 'multiselectdropdown' && field.selectOptionSetId && selectOptionSetsRecord[field.selectOptionSetId]) {
                const optionSet = selectOptionSetsRecord[field.selectOptionSetId];
                
                // Validate that all selected values exist in the option set
                const validOptionValues = optionSet.options.map(opt => opt.value);
                const invalidValues = value.filter(val => !validOptionValues.includes(val));
                if (invalidValues.length > 0) {
                    setFieldError(fieldId, 'Some selected options are no longer available');
                    return;
                }
            }
            // For both types using individual field options (validate integrity)
            if (field.options && field.options.length > 0) {
                // Validate that all selected values exist in individual field options
                const validOptionValues = field.options.map(opt => opt.value);
                const invalidValues = value.filter(val => !validOptionValues.includes(val));
                if (invalidValues.length > 0) {
                    setFieldError(fieldId, 'Some selected options are no longer available');
                    return;
                }
            }
        }

        // Radio and select field validation
        if ((field.type === 'radio' || field.type === 'select') && value) {
            if (field.radioOptionSetId && radioOptionSetsRecord[field.radioOptionSetId]) {
                // Validate that the selected value exists in the radio option set
                const optionSet = radioOptionSetsRecord[field.radioOptionSetId];
                const validOptionValues = optionSet.options.map(opt => opt.value);
                if (!validOptionValues.includes(value)) {
                    setFieldError(fieldId, 'Selected option is no longer available');
                    return;
                }
            } else if (field.selectOptionSetId && selectOptionSetsRecord[field.selectOptionSetId]) {
                // Validate that the selected value exists in the select option set
                const optionSet = selectOptionSetsRecord[field.selectOptionSetId];
                const validOptionValues = optionSet.options.map(opt => opt.value);
                if (!validOptionValues.includes(value)) {
                    setFieldError(fieldId, 'Selected option is no longer available');
                    return;
                }
            } else if (field.options && field.options.length > 0) {
                // Validate that the selected value exists in individual field options
                const validOptionValues = field.options.map(opt => opt.value);
                if (!validOptionValues.includes(value)) {
                    setFieldError(fieldId, 'Selected option is no longer available');
                    return;
                }
            }
        }

        // Rating field validation
        if (field.type === 'rating' && value) {
            if (field.ratingScaleId && ratingScalesRecord[field.ratingScaleId]) {
                // Validate that the selected value exists in the rating scale
                const ratingScale = ratingScalesRecord[field.ratingScaleId];
                const validOptionValues = ratingScale.options.map(opt => opt.value);
                if (!validOptionValues.includes(value)) {
                    setFieldError(fieldId, 'Selected rating is no longer available');
                    return;
                }
            } else if (field.options && field.options.length > 0) {
                // Validate that the selected value exists in individual field options
                const validOptionValues = field.options.map(opt => opt.value);
                if (!validOptionValues.includes(value)) {
                    setFieldError(fieldId, 'Selected rating is no longer available');
                    return;
                }
            }
        }

        // Individual field validation rules (applied to ALL fields regardless of option sets)
        if (field.validation && field.validation.length > 0) {
            for (const rule of field.validation) {
                let validationError: string | null = null;

                switch (rule.type) {
                    case 'email':
                        if (value && field.type !== 'email') {
                            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                            if (!emailRegex.test(value)) {
                                validationError = rule.message || 'Please enter a valid email address';
                            }
                        }
                        break;

                    case 'min':
                        if (Array.isArray(value)) {
                            // For multiselect fields, validate minimum selections
                            if (value.length < (rule.value || 0)) {
                                validationError = rule.message || `Please select at least ${rule.value} option${rule.value === 1 ? '' : 's'}`;
                            }
                        } else if (value && typeof value === 'string') {
                            // For text fields, validate minimum length
                            if (value.length < (rule.value || 0)) {
                                validationError = rule.message || `Must be at least ${rule.value} characters`;
                            }
                        } else if (value && typeof value === 'number') {
                            // For number fields, validate minimum value
                            if (value < (rule.value || 0)) {
                                validationError = rule.message || `Must be at least ${rule.value}`;
                            }
                        }
                        break;

                    case 'max':
                        if (Array.isArray(value)) {
                            // For multiselect fields, validate maximum selections
                            if (value.length > (rule.value || 0)) {
                                validationError = rule.message || `Please select at most ${rule.value} option${rule.value === 1 ? '' : 's'}`;
                            }
                        } else if (value && typeof value === 'string') {
                            // For text fields, validate maximum length
                            if (value.length > (rule.value || 0)) {
                                validationError = rule.message || `Must be no more than ${rule.value} characters`;
                            }
                        } else if (value && typeof value === 'number') {
                            // For number fields, validate maximum value
                            if (value > (rule.value || 0)) {
                                validationError = rule.message || `Must be no more than ${rule.value}`;
                            }
                        }
                        break;

                    case 'minSelections':
                        if (Array.isArray(value) && value.length < (rule.value || 0)) {
                            validationError = rule.message || `Please select at least ${rule.value} option${rule.value === 1 ? '' : 's'}`;
                        }
                        break;

                    case 'maxSelections':
                        if (Array.isArray(value) && value.length > (rule.value || 0)) {
                            validationError = rule.message || `Please select at most ${rule.value} option${rule.value === 1 ? '' : 's'}`;
                        }
                        break;

                    case 'pattern':
                        if (value && rule.value && typeof value === 'string') {
                            const regex = new RegExp(rule.value);
                            if (!regex.test(value)) {
                                validationError = rule.message || 'Invalid format';
                            }
                        }
                        break;

                    case 'required':
                        // Required validation is already handled above
                        break;

                    case 'custom':
                        // Custom validation would need to be implemented per use case
                        break;
                }

                if (validationError) {
                    setFieldError(fieldId, validationError);
                    return; // Stop at first validation error for this field
                }
            }
        }
    }, [config, setFieldError, isFieldEmpty, multiSelectOptionSetsRecord, radioOptionSetsRecord, selectOptionSetsRecord, ratingScalesRecord]);

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
            errors: formState.errors,
            formData: formState.formData,
            allFieldTypes: allFields.map(f => ({ id: f.id, type: f.type, label: f.label }))
        });

        // Clear any existing errors first
        setErrors({});

        // Comprehensive validation - check all field types and validation rules
        const validationErrors: Record<string, string> = {};
        allFields.forEach(field => {
            let fieldValue = formState.formData[field.id];
            
            // Normalize multiselect field values to arrays
            if ((field.type === 'multiselect' || field.type === 'multiselectdropdown') && !Array.isArray(fieldValue)) {
                console.log('⚠️ Normalizing multiselect field value to array:', { fieldId: field.id, originalValue: fieldValue });
                fieldValue = fieldValue ? [fieldValue] : [];
            }
            
            const isEmpty = isFieldEmpty(field, fieldValue);
            
            console.log('🔍 Validating field:', {
                fieldId: field.id,
                fieldLabel: field.label,
                fieldType: field.type,
                fieldValue,
                isEmpty,
                isRequired: field.required,
                hasValidationRules: !!field.validation?.length,
                validationRules: field.validation,
                hasMultiSelectOptionSetId: !!field.multiSelectOptionSetId,
                hasSelectOptionSetId: !!field.selectOptionSetId,
                hasOptions: !!field.options?.length,
                willError: field.required && isEmpty
            });
            
            // Required field validation
            if (field.required && isEmpty) {
                console.log('❌ Required field is empty:', { fieldId: field.id, fieldType: field.type, fieldValue });
                validationErrors[field.id] = 'This field is required';
                return;
            }

            // Skip validation for empty non-required fields UNLESS they have validation rules OR are multiselect fields
            const isMultiSelectField = field.type === 'multiselect' || field.type === 'multiselectdropdown';
            const hasOptionSet = (field.type === 'multiselect' && field.multiSelectOptionSetId) || 
                                (field.type === 'multiselectdropdown' && field.selectOptionSetId);
            
            if (isEmpty && !field.required && !field.validation?.length && !isMultiSelectField) {
                console.log('⏭️ Skipping validation for empty non-required field without validation rules:', field.id);
                return;
            }
            
            // For multiselect fields, always continue to validation even if empty and non-required
            if (isMultiSelectField) {
                console.log('🔄 Continuing validation for multiselect field:', { 
                    fieldId: field.id, 
                    hasOptionSet, 
                    hasValidationRules: !!field.validation?.length,
                    isRequired: field.required,
                    isEmpty 
                });
            }

            // Email validation
            if (field.type === 'email' && fieldValue) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(fieldValue)) {
                    validationErrors[field.id] = 'Please enter a valid email address';
                    return;
                }
            }

            // Number validation
            if (field.type === 'number' && fieldValue) {
                const numValue = Number(fieldValue);
                if (isNaN(numValue)) {
                    validationErrors[field.id] = 'Please enter a valid number';
                    return;
                }
            }

            // Multi-select field validation (both multiselect and multiselectdropdown)
            if (field.type === 'multiselect' || field.type === 'multiselectdropdown') {
                console.log('🔍 Processing multiselect field:', {
                    fieldId: field.id,
                    fieldType: field.type,
                    fieldValue,
                    isArray: Array.isArray(fieldValue),
                    fieldValueType: typeof fieldValue,
                    hasMultiSelectOptionSetId: !!field.multiSelectOptionSetId,
                    hasSelectOptionSetId: !!field.selectOptionSetId,
                    hasOptions: !!field.options?.length,
                    hasValidationRules: !!field.validation?.length,
                    validationRules: field.validation
                });
                
                // Ensure multiselect fields always have array values
                if (!Array.isArray(fieldValue)) {
                    console.log('⚠️ Multiselect field value is not an array, treating as empty array:', { fieldId: field.id, fieldValue });
                    fieldValue = [];
                }
            }
            
            if ((field.type === 'multiselect' || field.type === 'multiselectdropdown') && Array.isArray(fieldValue)) {
                // For multiselect inline (uses multiSelectOptionSetId)
                if (field.type === 'multiselect' && field.multiSelectOptionSetId && multiSelectOptionSetsRecord[field.multiSelectOptionSetId]) {
                    const optionSet = multiSelectOptionSetsRecord[field.multiSelectOptionSetId];
                    
                    if (optionSet.minSelections && fieldValue.length < optionSet.minSelections) {
                        validationErrors[field.id] = `Please select at least ${optionSet.minSelections} option${optionSet.minSelections === 1 ? '' : 's'}`;
                        return;
                    }
                    
                    if (optionSet.maxSelections && fieldValue.length > optionSet.maxSelections) {
                        validationErrors[field.id] = `Please select at most ${optionSet.maxSelections} option${optionSet.maxSelections === 1 ? '' : 's'}`;
                        return;
                    }
                    
                    // Validate that all selected values exist in the option set
                    const validOptionValues = optionSet.options.map(opt => opt.value);
                    const invalidValues = fieldValue.filter(val => !validOptionValues.includes(val));
                    if (invalidValues.length > 0) {
                        validationErrors[field.id] = 'Some selected options are no longer available';
                        return;
                    }
                }
                // For multiselectdropdown (uses selectOptionSetId)
                else if (field.type === 'multiselectdropdown' && field.selectOptionSetId && selectOptionSetsRecord[field.selectOptionSetId]) {
                    const optionSet = selectOptionSetsRecord[field.selectOptionSetId];
                    
                    // Validate that all selected values exist in the option set
                    const validOptionValues = optionSet.options.map(opt => opt.value);
                    const invalidValues = fieldValue.filter(val => !validOptionValues.includes(val));
                    if (invalidValues.length > 0) {
                        validationErrors[field.id] = 'Some selected options are no longer available';
                        return;
                    }
                }
                // For both types using individual field options (validate integrity)
                if (field.options && field.options.length > 0) {
                    // Validate that all selected values exist in individual field options
                    const validOptionValues = field.options.map(opt => opt.value);
                    const invalidValues = fieldValue.filter(val => !validOptionValues.includes(val));
                    if (invalidValues.length > 0) {
                        validationErrors[field.id] = 'Some selected options are no longer available';
                        return;
                    }
                }
            }

            // Radio and select field validation
            if ((field.type === 'radio' || field.type === 'select') && fieldValue) {
                if (field.radioOptionSetId && radioOptionSetsRecord[field.radioOptionSetId]) {
                    // Validate that the selected value exists in the radio option set
                    const optionSet = radioOptionSetsRecord[field.radioOptionSetId];
                    const validOptionValues = optionSet.options.map(opt => opt.value);
                    if (!validOptionValues.includes(fieldValue)) {
                        validationErrors[field.id] = 'Selected option is no longer available';
                        return;
                    }
                } else if (field.selectOptionSetId && selectOptionSetsRecord[field.selectOptionSetId]) {
                    // Validate that the selected value exists in the select option set
                    const optionSet = selectOptionSetsRecord[field.selectOptionSetId];
                    const validOptionValues = optionSet.options.map(opt => opt.value);
                    if (!validOptionValues.includes(fieldValue)) {
                        validationErrors[field.id] = 'Selected option is no longer available';
                        return;
                    }
                } else if (field.options && field.options.length > 0) {
                    // Validate that the selected value exists in individual field options
                    const validOptionValues = field.options.map(opt => opt.value);
                    if (!validOptionValues.includes(fieldValue)) {
                        validationErrors[field.id] = 'Selected option is no longer available';
                        return;
                    }
                }
            }

            // Rating field validation
            if (field.type === 'rating' && fieldValue) {
                if (field.ratingScaleId && ratingScalesRecord[field.ratingScaleId]) {
                    // Validate that the selected value exists in the rating scale
                    const ratingScale = ratingScalesRecord[field.ratingScaleId];
                    const validOptionValues = ratingScale.options.map(opt => opt.value);
                    if (!validOptionValues.includes(fieldValue)) {
                        validationErrors[field.id] = 'Selected rating is no longer available';
                        return;
                    }
                } else if (field.options && field.options.length > 0) {
                    // Validate that the selected value exists in individual field options
                    const validOptionValues = field.options.map(opt => opt.value);
                    if (!validOptionValues.includes(fieldValue)) {
                        validationErrors[field.id] = 'Selected rating is no longer available';
                        return;
                    }
                }
            }

            // Debug logging for multiselect fields (can be removed in production)
            if ((field.type === 'multiselect' || field.type === 'multiselectdropdown')) {
                console.log('🧪 Multiselect validation:', {
                    fieldId: field.id,
                    fieldType: field.type,
                    selectionCount: Array.isArray(fieldValue) ? fieldValue.length : 'N/A',
                    hasValidationRules: !!field.validation?.length
                });
            }

            // Individual field validation rules (applied to ALL fields regardless of option sets)
            if (field.validation && field.validation.length > 0) {
                console.log('📝 Applying individual validation rules for field:', field.id, field.validation);
                for (const rule of field.validation) {
                    let validationError: string | null = null;

                    switch (rule.type) {
                        case 'email':
                            if (fieldValue && field.type !== 'email') {
                                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                                if (!emailRegex.test(fieldValue)) {
                                    validationError = rule.message || 'Please enter a valid email address';
                                }
                            }
                            break;

                        case 'min':
                            if (Array.isArray(fieldValue)) {
                                // For multiselect fields, validate minimum selections
                                if (fieldValue.length < (rule.value || 0)) {
                                    validationError = rule.message || `Please select at least ${rule.value} option${rule.value === 1 ? '' : 's'}`;
                                }
                            } else if (fieldValue && typeof fieldValue === 'string') {
                                // For text fields, validate minimum length
                                if (fieldValue.length < (rule.value || 0)) {
                                    validationError = rule.message || `Must be at least ${rule.value} characters`;
                                }
                            } else if (fieldValue && typeof fieldValue === 'number') {
                                // For number fields, validate minimum value
                                if (fieldValue < (rule.value || 0)) {
                                    validationError = rule.message || `Must be at least ${rule.value}`;
                                }
                            }
                            break;

                        case 'max':
                            if (Array.isArray(fieldValue)) {
                                // For multiselect fields, validate maximum selections
                                if (fieldValue.length > (rule.value || 0)) {
                                    validationError = rule.message || `Please select at most ${rule.value} option${rule.value === 1 ? '' : 's'}`;
                                }
                            } else if (fieldValue && typeof fieldValue === 'string') {
                                // For text fields, validate maximum length
                                if (fieldValue.length > (rule.value || 0)) {
                                    validationError = rule.message || `Must be no more than ${rule.value} characters`;
                                }
                            } else if (fieldValue && typeof fieldValue === 'number') {
                                // For number fields, validate maximum value
                                if (fieldValue > (rule.value || 0)) {
                                    validationError = rule.message || `Must be no more than ${rule.value}`;
                                }
                            }
                            break;

                        case 'minSelections':
                            if (Array.isArray(fieldValue)) {
                                console.log('🔍 Checking minSelections rule:', { fieldValue, ruleValue: rule.value, willFail: fieldValue.length < (rule.value || 0) });
                                if (fieldValue.length < (rule.value || 0)) {
                                    validationError = rule.message || `Please select at least ${rule.value} option${rule.value === 1 ? '' : 's'}`;
                                }
                            }
                            break;

                        case 'maxSelections':
                            if (Array.isArray(fieldValue)) {
                                console.log('🔍 Checking maxSelections rule:', { fieldValue, ruleValue: rule.value, willFail: fieldValue.length > (rule.value || 0) });
                                if (fieldValue.length > (rule.value || 0)) {
                                    validationError = rule.message || `Please select at most ${rule.value} option${rule.value === 1 ? '' : 's'}`;
                                }
                            }
                            break;

                        case 'pattern':
                            if (fieldValue && rule.value && typeof fieldValue === 'string') {
                                const regex = new RegExp(rule.value);
                                if (!regex.test(fieldValue)) {
                                    validationError = rule.message || 'Invalid format';
                                }
                            }
                            break;

                        case 'required':
                            // Required validation is already handled above
                            break;

                        case 'custom':
                            // Custom validation would need to be implemented per use case
                            break;
                    }

                    if (validationError) {
                        console.log('❌ Validation error found:', validationError);
                        validationErrors[field.id] = validationError;
                        return; // Stop at first validation error for this field
                    }
                }
            }
            
            // Comprehensive multiselect validation - ensure ALL multiselect fields require at least one selection
            if ((field.type === 'multiselect' || field.type === 'multiselectdropdown') && Array.isArray(fieldValue) && fieldValue.length === 0) {
                // Only add validation if no error was already set
                if (!validationErrors[field.id]) {
                    console.log('🎯 COMPREHENSIVE: Empty multiselect field requires validation:', {
                        fieldId: field.id,
                        fieldType: field.type,
                        hasOptionSet: (field.type === 'multiselect' && field.multiSelectOptionSetId) || 
                                     (field.type === 'multiselectdropdown' && field.selectOptionSetId),
                        hasValidationRules: !!field.validation?.length,
                        isRequired: field.required
                    });
                    
                    // DEFAULT RULE: ALL multiselect fields should require at least one selection
                    // This covers all cases that the specific validation missed
                    validationErrors[field.id] = 'Please select at least 1 option';
                }
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
    }, [formState.formData, formState.errors, onSubmit, config, isFieldEmpty, setErrors, multiSelectOptionSetsRecord, radioOptionSetsRecord, selectOptionSetsRecord, ratingScalesRecord]);

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
                
                {/* Render content using unified ordering */}
                <div className="space-y-6">
                    {getOrderedSectionContent(section).map((contentItem) => {
                        if (contentItem.type === 'subsection') {
                            const subsection = contentItem.data as any;
                            return (
                                <div key={subsection.id} className="border-l-4 border-gray-200 pl-4">
                                    <div className="mb-4">
                                        <h4 className="text-lg font-semibold text-gray-800">
                                            {subsection.title}
                                        </h4>
                                        {subsection.description && (
                                            <p className="text-gray-600 text-sm">{subsection.description}</p>
                                        )}
                                    </div>
                                    <div className="space-y-4">
                                        {subsection.fields.map(renderField)}
                                    </div>
                                </div>
                            );
                        } else if (contentItem.type === 'field') {
                            const field = contentItem.data as any;
                            return <div key={field.id} className="space-y-4">{renderField(field)}</div>;
                        }
                        return null;
                    })}
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
