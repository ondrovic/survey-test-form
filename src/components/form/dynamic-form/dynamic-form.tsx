import { clsx } from 'clsx';
import React, { useCallback } from 'react';
import { useForm } from '../../../contexts/form-context';
import { useSurveyData } from '../../../contexts/survey-data-context';
import { SurveyField, SurveySection } from '../../../types/framework.types';
import { getOrderedSectionContent } from '../../../utils/section-content.utils';
import { Button, ScrollableContent, SurveyFooter } from '../../common';
import { FieldRenderer } from '../field-renderer';
import { transformFormStateToDescriptiveIds } from '../utils/transform.utils';
import { validateAllFields, validateFieldValue } from '../utils/validation.utils';
import { DynamicFormProps } from './dynamic-form.types';

// Removed local helpers in favor of shared utils (DRY)

export const DynamicForm: React.FC<DynamicFormProps> = ({
    config,
    onSubmit,
    loading = false,
    className,
    resetTrigger,
    onActivityUpdate
}) => {
    // Use context providers
    const { state: formState, setFieldValue, setFieldError, setErrors, resetForm } = useForm();
    const { state: surveyDataState } = useSurveyData();
    
    console.log('🔍 DynamicForm - SurveyData context state:', {
        isLoading: surveyDataState.isLoading,
        ratingScalesCount: surveyDataState.ratingScales?.length || 0,
        radioOptionSetsCount: surveyDataState.radioOptionSets?.length || 0,
        multiSelectOptionSetsCount: surveyDataState.multiSelectOptionSets?.length || 0,
        selectOptionSetsCount: surveyDataState.selectOptionSets?.length || 0,
        error: surveyDataState.error,
        lastUpdated: surveyDataState.lastUpdated,
        surveyDataState: surveyDataState
    });

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
        console.log('🔍 DynamicForm - multiSelectOptionSetsRecord updated:', {
            isArray: Array.isArray(multiSelectOptionSets),
            count: multiSelectOptionSets?.length || 0,
            recordKeys: Object.keys(record),
            sets: multiSelectOptionSets?.map(set => ({ id: set.id, name: set.name, optionsCount: set.options?.length })) || []
        });
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

    // Removed local isFieldEmpty; use validateFieldValue for checks

    // Enhanced field validation using shared utils
    const validateField = useCallback((fieldId: string, value: any) => {
        let field: SurveyField | undefined;
        for (const section of config.sections) {
            field = section.fields.find(f => f.id === fieldId);
            if (field) break;
            field = section.subsections?.flatMap(s => s.fields).find(f => f.id === fieldId);
            if (field) break;
        }
        if (!field) return;

        const error = validateFieldValue(field, value, {
            ratingScales: ratingScalesRecord,
            radioOptionSets: radioOptionSetsRecord,
            multiSelectOptionSets: multiSelectOptionSetsRecord,
            selectOptionSets: selectOptionSetsRecord,
        });
        setFieldError(fieldId, error || '');
    }, [config.sections, setFieldError, ratingScalesRecord, radioOptionSetsRecord, multiSelectOptionSetsRecord, selectOptionSetsRecord]);

    const handleFieldChange = useCallback((fieldId: string, value: any) => {
        setFieldValue(fieldId, value);

        // Track activity when user interacts with form
        if (onActivityUpdate) {
            onActivityUpdate();
        }

        // Only validate if form has been submitted and there was already an error for this field
        if (hasSubmitted && formState.errors[fieldId]) {
            setTimeout(() => validateField(fieldId, value), 300);
        }
    }, [setFieldValue, validateField, formState.errors, hasSubmitted, onActivityUpdate]);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setHasSubmitted(true);

        // Get all fields from config for validation (including subsection fields)
        const allFields: SurveyField[] = [];
        config.sections.forEach(section => {
            // Add section-level fields
            allFields.push(...section.fields);

            // Add subsection fields
            if (section.subsections) {
                section.subsections.forEach(subsection => {
                    allFields.push(...subsection.fields);
                });
            }
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

        // Use shared validation across all fields to produce per-field errors
        const { errors: validationErrors } = validateAllFields(formState.formData, config, {
            ratingScales: ratingScalesRecord,
            radioOptionSets: radioOptionSetsRecord,
            multiSelectOptionSets: multiSelectOptionSetsRecord,
            selectOptionSets: selectOptionSetsRecord,
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
    }, [formState.formData, formState.errors, onSubmit, config, setErrors, multiSelectOptionSetsRecord, radioOptionSetsRecord, selectOptionSetsRecord, ratingScalesRecord]);

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
            <div key={section.id} className="mb-8">
                <div className="mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                        {section.title}
                    </h3>
                    {section.description && (
                        <p className="text-gray-600 text-lg">{section.description}</p>
                    )}
                </div>

                {/* Render content using unified ordering */}
                <div className="space-y-8">
                    {getOrderedSectionContent(section).map((contentItem) => {
                        if (contentItem.type === 'subsection') {
                            const subsection = contentItem.data as any;
                            return (
                                <div key={subsection.id} className="bg-gray-50/50 border border-gray-200 rounded-xl p-8">
                                    <div className="mb-8">
                                        <h4 className="text-xl font-semibold text-gray-800 mb-3">
                                            {subsection.title}
                                        </h4>
                                        {subsection.description && (
                                            <p className="text-gray-600 leading-relaxed">{subsection.description}</p>
                                        )}
                                    </div>
                                    <div className="space-y-6">
                                        {subsection.fields.map(renderField)}
                                    </div>
                                </div>
                            );
                        } else if (contentItem.type === 'field') {
                            const field = contentItem.data as any;
                            return <div key={field.id}>{renderField(field)}</div>;
                        }
                        return null;
                    })}
                </div>
            </div>
        );
    }, [renderField]);



    return (
        <div className={clsx("h-screen bg-amber-50/30 flex flex-col", className)}>
            <main className="flex-1 py-8 flex min-h-0">
                <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-md flex flex-col w-full h-full">
                    {/* Fixed Header Section */}
                    <div className="px-8 pt-8 pb-4 flex-shrink-0">
                        <div className="text-center mb-6">
                            <h1 className="text-3xl font-bold text-gray-900 mb-3">
                                {config.title}
                            </h1>
                            {config.description && (
                                <p className="text-lg text-gray-600">
                                    {config.description}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Scrollable Content Section */}
                    <div className="flex-1 px-8 min-h-0 overflow-hidden">
                        <ScrollableContent
                            maxHeight="100%"
                            minHeight="200px"
                            showScrollIndicators={true}
                            smoothScroll={true}
                            mobileOptimized={true}
                            className="mb-6 h-full"
                            resetTrigger={config.id}
                            onScroll={(_scrollTop, _scrollHeight, _clientHeight) => {
                                // Optional: Track scroll position for analytics or state
                                // Removed excessive logging to improve performance
                            }}
                        >
                            <div className="py-6 px-4">
                                <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto">
                                    {config.sections
                                        .sort((a, b) => a.order - b.order)
                                        .map(renderSection)}
                                </form>
                            </div>
                        </ScrollableContent>
                    </div>

                    {/* Fixed Submit Button */}
                    <div className="px-8 pb-8 pt-6 border-t flex-shrink-0">
                        <div className="flex justify-center max-w-4xl mx-auto">
                            <Button
                                type="submit"
                                loading={loading}
                                disabled={loading}
                                className="px-8 py-3 text-base"
                                onClick={handleSubmit}
                            >
                                Submit Survey
                            </Button>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <SurveyFooter config={config.footerConfig} />
        </div>
    );
};
