import { useForm } from '@/hooks';
import { clsx } from 'clsx';
import React, { useCallback, useState } from 'react';
import { firestoreHelpers } from '../../../config/firebase';
import { MultiSelectOptionSet, RadioOptionSet, RatingScale, SurveyConfig, SurveyField, SurveySection } from '../../../types/survey.types';
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
    const [ratingScales, setRatingScales] = useState<Record<string, RatingScale>>({});
    const [loadingScales, setLoadingScales] = useState<Record<string, boolean>>({});
    const [radioOptionSets, setRadioOptionSets] = useState<Record<string, RadioOptionSet>>({});
    const [multiSelectOptionSets, setMultiSelectOptionSets] = useState<Record<string, MultiSelectOptionSet>>({});
    const [loadingOptionSets, setLoadingOptionSets] = useState<Record<string, boolean>>({});
    const [showSuccess, setShowSuccess] = useState(false);

    // Use our custom form hook
    const {
        formState,
        errors,
        setFieldValue,
        validateForm,
        resetForm
    } = useForm();

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

    // Load radio option set for a field
    const loadRadioOptionSet = useCallback(async (optionSetId: string) => {
        if (radioOptionSets[optionSetId] || loadingOptionSets[optionSetId]) return;

        setLoadingOptionSets(prev => ({ ...prev, [optionSetId]: true }));
        try {
            const optionSet = await firestoreHelpers.getRadioOptionSet(optionSetId);
            if (optionSet) {
                setRadioOptionSets(prev => ({ ...prev, [optionSetId]: optionSet }));
            }
        } catch (error) {
            console.error('Error loading radio option set:', error);
        } finally {
            setLoadingOptionSets(prev => ({ ...prev, [optionSetId]: false }));
        }
    }, [radioOptionSets, loadingOptionSets]);

    // Load multi-select option set for a field
    const loadMultiSelectOptionSet = useCallback(async (optionSetId: string) => {
        if (multiSelectOptionSets[optionSetId] || loadingOptionSets[optionSetId]) return;

        console.log('🔄 Loading multi-select option set:', optionSetId);
        console.log('🔍 Current multiSelectOptionSets:', Object.keys(multiSelectOptionSets));
        console.log('🔍 Current loadingOptionSets:', Object.keys(loadingOptionSets));
        setLoadingOptionSets(prev => ({ ...prev, [optionSetId]: true }));
        try {
            const optionSet = await firestoreHelpers.getMultiSelectOptionSet(optionSetId);
            console.log('✅ Loaded multi-select option set:', optionSet);
            if (optionSet) {
                setMultiSelectOptionSets(prev => ({ ...prev, [optionSetId]: optionSet }));
                console.log('✅ Updated multiSelectOptionSets with:', optionSetId);
            } else {
                console.log('❌ Option set not found in database:', optionSetId);
            }
        } catch (error) {
            console.error('❌ Error loading multi-select option set:', error);
        } finally {
            setLoadingOptionSets(prev => ({ ...prev, [optionSetId]: false }));
        }
    }, [multiSelectOptionSets, loadingOptionSets]);

    // Initialize form state with default values and load rating scales
    const initializeFormState = useCallback(() => {
        const initialState: Record<string, any> = {};
        const scalesToLoad: string[] = [];
        const radioOptionSetsToLoad: string[] = [];
        const multiSelectOptionSetsToLoad: string[] = [];

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
                } else if (field.type === 'radio' && field.radioOptionSetId) {
                    // Load radio option set
                    radioOptionSetsToLoad.push(field.radioOptionSetId);
                    console.log('📋 Found radio option set to load:', field.radioOptionSetId);
                } else if (field.type === 'multiselect' && field.multiSelectOptionSetId) {
                    // Load multi-select option set
                    multiSelectOptionSetsToLoad.push(field.multiSelectOptionSetId);
                    console.log('📋 Found multi-select option set to load:', field.multiSelectOptionSetId);
                }
            });
        });

        // Reset form to initial state
        resetForm();

        // Set initial form state
        Object.entries(initialState).forEach(([fieldId, value]) => {
            setFieldValue(fieldId, value);
        });

        // Load all needed rating scales
        scalesToLoad.forEach(scaleId => loadRatingScale(scaleId));

        // Load all needed option sets
        radioOptionSetsToLoad.forEach(optionSetId => loadRadioOptionSet(optionSetId));
        multiSelectOptionSetsToLoad.forEach(optionSetId => loadMultiSelectOptionSet(optionSetId));
    }, [config, loadRatingScale, loadRadioOptionSet, loadMultiSelectOptionSet, setFieldValue, resetForm]);

    // Initialize form on mount
    React.useEffect(() => {
        initializeFormState();
    }, [config.id]); // Only re-initialize when config ID changes

    // Handle form reset when resetTrigger changes
    React.useEffect(() => {
        if (resetTrigger && resetTrigger > 0) {
            initializeFormState();
            setShowSuccess(false);
        }
    }, [resetTrigger, initializeFormState]);

    // Set default values when rating scales are loaded
    React.useEffect(() => {
        config.sections.forEach(section => {
            section.fields.forEach(field => {
                if (field.type === 'rating' && field.ratingScaleId && ratingScales[field.ratingScaleId]) {
                    const scale = ratingScales[field.ratingScaleId];
                    const defaultOption = scale.options.find(opt => opt.isDefault);
                    if (defaultOption && !formState[field.id]) {
                        setFieldValue(field.id, defaultOption.value);
                    }
                }
            });
        });
    }, [ratingScales, config, formState, setFieldValue]);

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
            formStateKeys: Object.keys(formState),
            hasErrors: Object.keys(errors).length > 0,
            errors: errors
        });

        if (!validateForm(allFields)) {
            console.log('❌ Form validation failed, errors:', errors);
            return;
        }

        console.log('✅ Form validation passed, calling onSubmit');
        try {
            const transformedData = transformFormStateToDescriptiveIds(formState, config);
            console.log('📤 Calling onSubmit with data:', transformedData);
            await onSubmit(transformedData);

            // Don't show success state here since we're redirecting to confirmation page
            // The success will be handled by the confirmation page
        } catch (error) {
            // Don't show success state if there was an error
            // The error will be handled by the parent component
            console.error('Form submission error:', error);
        }
    }, [formState, validateForm, onSubmit, config]);

    const renderField = (field: SurveyField) => {
        console.log(`🔍 renderField called for field: ${field.id}`, {
            fieldType: field.type,
            fieldLabel: field.label,
            currentValue: formState[field.id],
            hasError: !!errors[field.id],
            timestamp: new Date().toISOString(),
            stackTrace: new Error().stack?.split('\n').slice(1, 4).join('\n')
        });

        return (
            <FieldRenderer
                key={field.id}
                field={field}
                value={formState[field.id]}
                onChange={handleFieldChange}
                error={errors[field.id]}
                ratingScales={ratingScales}
                loadingScales={loadingScales}
                onLoadRatingScale={loadRatingScale}
                radioOptionSets={radioOptionSets}
                multiSelectOptionSets={multiSelectOptionSets}
                loadingOptionSets={loadingOptionSets}
                onLoadRadioOptionSet={loadRadioOptionSet}
                onLoadMultiSelectOptionSet={loadMultiSelectOptionSet}
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
        formStateKeys: Object.keys(formState),
        errorsCount: Object.keys(errors).length,
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
                        {showSuccess ? (
                            <div className="text-center">
                                <div className="text-green-600 text-lg font-semibold mb-2">
                                    ✓ Survey submitted successfully!
                                </div>
                                <p className="text-gray-600">
                                    Thank you for your response. The form will reset shortly.
                                </p>
                            </div>
                        ) : (
                            <Button
                                type="submit"
                                loading={loading}
                                disabled={loading}
                                className="px-8 py-3 text-base"
                            >
                                Submit Survey
                            </Button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};
