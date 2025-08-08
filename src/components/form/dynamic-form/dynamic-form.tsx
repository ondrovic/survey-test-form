import { clsx } from 'clsx';
import React, { useCallback } from 'react';
import { useForm } from '../../../contexts/form-context';
import { useSurveyData } from '../../../contexts/survey-data-context';
import { SurveyConfig, SurveyField, SurveySection } from '../../../types/survey.types';
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
    const { state: formState, setFieldValue, resetForm } = useForm();
    const { state: surveyDataState } = useSurveyData();

    // Extract data from survey data context
    const { ratingScales, radioOptionSets, multiSelectOptionSets, isLoading } = surveyDataState;

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
        radioOptionSets.forEach(set => {
            record[set.id] = set;
        });
        return record;
    }, [radioOptionSets]);

    const multiSelectOptionSetsRecord = React.useMemo(() => {
        const record: Record<string, any> = {};
        multiSelectOptionSets.forEach(set => {
            record[set.id] = set;
        });
        return record;
    }, [multiSelectOptionSets]);

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
                } else if (field.type === 'multiselect' && field.options) {
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
    }, [config, ratingScalesRecord]);

    // Initialize form state with default values
    const setupFormState = useCallback(() => {
        const initialState = initializeFormState();

        // Reset form to initial state
        resetForm();

        // Set initial form state
        Object.entries(initialState).forEach(([fieldId, value]) => {
            setFieldValue(fieldId, value);
        });
    }, [config, ratingScalesRecord, radioOptionSetsRecord, multiSelectOptionSetsRecord, setFieldValue, resetForm]);

    // Initialize form on mount
    React.useEffect(() => {
        setupFormState();
    }, [config.id]); // Only re-initialize when config ID changes

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

    const handleFieldChange = useCallback((fieldId: string, value: any) => {
        console.log('🔄 handleFieldChange called:', {
            fieldId,
            value,
            timestamp: new Date().toISOString(),
            stackTrace: new Error().stack?.split('\n').slice(1, 4).join('\n')
        });
        setFieldValue(fieldId, value);
    }, [setFieldValue]);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        console.log('🚀 DynamicForm handleSubmit called - FIRST LINE');
        e.preventDefault();
        console.log('🚀 DynamicForm handleSubmit called');

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

        // Simple validation - check if required fields have values
        const validationErrors: Record<string, string> = {};
        allFields.forEach(field => {
            if (field.required && (!formState.formData[field.id] || formState.formData[field.id] === '')) {
                validationErrors[field.id] = 'This field is required';
            }
        });

        if (Object.keys(validationErrors).length > 0) {
            console.log('❌ Form validation failed, errors:', validationErrors);
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
    }, [formState.formData, formState.errors, onSubmit, config]);

    const renderField = (field: SurveyField) => {
        console.log(`🔍 renderField called for field: ${field.id}`, {
            fieldType: field.type,
            fieldLabel: field.label,
            currentValue: formState.formData[field.id],
            hasError: !!formState.errors[field.id],
            timestamp: new Date().toISOString(),
            stackTrace: new Error().stack?.split('\n').slice(1, 4).join('\n')
        });

        return (
            <FieldRenderer
                key={field.id}
                field={field}
                value={formState.formData[field.id]}
                onChange={handleFieldChange}
                error={formState.errors[field.id]}
                ratingScales={ratingScalesRecord}
                loadingScales={isLoading}
                radioOptionSets={radioOptionSetsRecord}
                multiSelectOptionSets={multiSelectOptionSetsRecord}
                loadingOptionSets={isLoading}
            />
        );
    };

    const renderSection = (section: SurveySection) => {
        console.log(`📋 renderSection called for section: ${section.id}`, {
            sectionTitle: section.title,
            fieldCount: section.fields.length,
            timestamp: new Date().toISOString(),
            stackTrace: new Error().stack?.split('\n').slice(1, 4).join('\n')
        });

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
    };

    console.log('🎯 DynamicForm render called', {
        configTitle: config.title,
        sectionsCount: config.sections.length,
        formStateKeys: Object.keys(formState.formData),
        errorsCount: Object.keys(formState.errors).length,
        timestamp: new Date().toISOString(),
        stackTrace: new Error().stack?.split('\n').slice(1, 4).join('\n')
    });

    // Test if component is rendering
    console.log('🔍 DynamicForm is rendering, config:', config);

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
                    onClick={() => console.log('🔍 Form clicked')}
                    onFocus={() => console.log('🔍 Form focused')}
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
