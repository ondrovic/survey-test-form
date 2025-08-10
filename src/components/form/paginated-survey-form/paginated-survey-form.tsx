import { clsx } from 'clsx';
import React, { useCallback, useEffect, useState } from 'react';
import { useForm } from '../../../contexts/form-context';
import { useSurveyData } from '../../../contexts/survey-data-context';
import { SurveyConfig, SurveySection, SurveyField } from '../../../types/framework.types';
import { useSectionPagination } from '../../survey/section-paginator';
import { InteractiveSectionRenderer } from '../../survey/section-paginator/interactive-section-renderer';
import { FormStepIndicator } from './form-step-indicator';
import { FormNavigationControls } from './form-navigation-controls';
import { PaginatedSurveyFormProps } from './paginated-survey-form.types';

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

export const PaginatedSurveyForm: React.FC<PaginatedSurveyFormProps> = ({
    config,
    onSubmit,
    loading = false,
    className,
    resetTrigger
}) => {
    // Use context providers - reuse ALL logic from DynamicForm
    const { state: formState, setFieldValue, setFieldError, setErrors, resetForm } = useForm();
    const { state: surveyDataState } = useSurveyData();
    
    // Track pagination state
    const {
        state: paginationState,
        goToSection,
        goToNext,
        goToPrevious
    } = useSectionPagination({
        totalSections: config.sections.length,
        initialIndex: 0,
        allowBackNavigation: config.paginatorConfig?.allowBackNavigation !== false
    });

    // Track if form has been submitted to control when to show validation
    const [hasSubmitted, setHasSubmitted] = useState(false);

    // Extract data from survey data context
    const { ratingScales, radioOptionSets, multiSelectOptionSets, selectOptionSets, isLoading } = surveyDataState;

    // Convert arrays to records for easy lookup (same as DynamicForm)
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

    // Initialize form state with default values (reuse exact logic from DynamicForm)
    const initializeFormState = useCallback(() => {
        const initialState: Record<string, any> = {};

        config.sections.forEach(section => {
            section.fields.forEach(field => {
                if (field.type === 'rating' && field.ratingScaleId) {
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
                } else if (field.type === 'radio' && field.options) {
                    const defaultOption = field.options.find(opt => opt.isDefault);
                    if (defaultOption) {
                        initialState[field.id] = defaultOption.value;
                    }
                } else if (field.type === 'multiselect' || field.type === 'multiselectdropdown') {
                    initialState[field.id] = [];
                } else if (field.type === 'select' && field.options) {
                    const defaultOption = field.options.find(opt => opt.isDefault);
                    if (defaultOption) {
                        initialState[field.id] = defaultOption.value;
                    }
                }
            });
        });

        return initialState;
    }, [config.id, config.sections, ratingScalesRecord]);

    // Initialize form state
    const setupFormState = useCallback(() => {
        const initialState = initializeFormState();
        resetForm();
        Object.entries(initialState).forEach(([fieldId, value]) => {
            setFieldValue(fieldId, value);
        });
    }, [initializeFormState, setFieldValue, resetForm]);

    // Initialize form on mount
    useEffect(() => {
        setupFormState();
    }, [setupFormState]);

    // Handle form reset when resetTrigger changes
    useEffect(() => {
        if (resetTrigger && resetTrigger > 0) {
            setupFormState();
        }
    }, [resetTrigger, setupFormState]);

    // Set default values when option sets are loaded (reuse exact logic from DynamicForm)
    useEffect(() => {
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

    const handleFieldChange = useCallback((fieldId: string, value: any) => {
        setFieldValue(fieldId, value);
        
        // Clear field error when user starts typing
        if (formState.errors[fieldId]) {
            setFieldError(fieldId, '');
        }
    }, [setFieldValue, setFieldError, formState.errors]);

    // Helper function to check if a field value is considered "empty"
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
            case 'radio':
            case 'rating':
                return value === '' || value === null || value === undefined;
            default:
                return !value || value === '';
        }
    }, []);

    // Enhanced validation function for a specific section
    const validateSection = useCallback((sectionIndex: number): { isValid: boolean; errors: Record<string, string> } => {
        const section = config.sections[sectionIndex];
        if (!section) return { isValid: true, errors: {} };

        const sectionErrors: Record<string, string> = {};

        section.fields.forEach(field => {
            const fieldValue = formState.formData[field.id];
            const isEmpty = isFieldEmpty(field, fieldValue);

            // Required field validation
            if (field.required && isEmpty) {
                sectionErrors[field.id] = 'This field is required';
                return;
            }

            // Skip validation for empty non-required fields
            if (isEmpty && !field.required && !field.validation?.length) {
                return;
            }

            // Email validation
            if (field.type === 'email' && fieldValue) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(fieldValue)) {
                    sectionErrors[field.id] = 'Please enter a valid email address';
                    return;
                }
            }

            // Number validation
            if (field.type === 'number' && fieldValue) {
                const numValue = Number(fieldValue);
                if (isNaN(numValue)) {
                    sectionErrors[field.id] = 'Please enter a valid number';
                    return;
                }
            }

            // Multi-select field validation
            if ((field.type === 'multiselect' || field.type === 'multiselectdropdown') && Array.isArray(fieldValue)) {
                // For multiselect inline (uses multiSelectOptionSetId)
                if (field.type === 'multiselect' && field.multiSelectOptionSetId && multiSelectOptionSetsRecord[field.multiSelectOptionSetId]) {
                    const optionSet = multiSelectOptionSetsRecord[field.multiSelectOptionSetId];
                    
                    if (optionSet.minSelections && fieldValue.length < optionSet.minSelections) {
                        sectionErrors[field.id] = `Please select at least ${optionSet.minSelections} option${optionSet.minSelections === 1 ? '' : 's'}`;
                        return;
                    }
                    
                    if (optionSet.maxSelections && fieldValue.length > optionSet.maxSelections) {
                        sectionErrors[field.id] = `Please select at most ${optionSet.maxSelections} option${optionSet.maxSelections === 1 ? '' : 's'}`;
                        return;
                    }
                }
            }

            // Individual field validation rules
            if (field.validation && field.validation.length > 0) {
                for (const rule of field.validation) {
                    let validationError: string | null = null;

                    switch (rule.type) {
                        case 'required':
                            if (isEmpty) {
                                validationError = rule.message || 'This field is required';
                            }
                            break;
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
                                if (fieldValue.length < (rule.value || 0)) {
                                    validationError = rule.message || `Please select at least ${rule.value} option${rule.value === 1 ? '' : 's'}`;
                                }
                            } else if (fieldValue && typeof fieldValue === 'string') {
                                if (fieldValue.length < (rule.value || 0)) {
                                    validationError = rule.message || `Must be at least ${rule.value} characters`;
                                }
                            }
                            break;
                        case 'max':
                            if (Array.isArray(fieldValue)) {
                                if (fieldValue.length > (rule.value || 0)) {
                                    validationError = rule.message || `Please select at most ${rule.value} option${rule.value === 1 ? '' : 's'}`;
                                }
                            } else if (fieldValue && typeof fieldValue === 'string') {
                                if (fieldValue.length > (rule.value || 0)) {
                                    validationError = rule.message || `Must be no more than ${rule.value} characters`;
                                }
                            }
                            break;
                        case 'minSelections':
                            if (Array.isArray(fieldValue) && fieldValue.length < (rule.value || 0)) {
                                validationError = rule.message || `Please select at least ${rule.value} option${rule.value === 1 ? '' : 's'}`;
                            }
                            break;
                        case 'maxSelections':
                            if (Array.isArray(fieldValue) && fieldValue.length > (rule.value || 0)) {
                                validationError = rule.message || `Please select at most ${rule.value} option${rule.value === 1 ? '' : 's'}`;
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
                    }

                    if (validationError) {
                        sectionErrors[field.id] = validationError;
                        break;
                    }
                }
            }
        });

        return {
            isValid: Object.keys(sectionErrors).length === 0,
            errors: sectionErrors
        };
    }, [config.sections, formState.formData, isFieldEmpty, multiSelectOptionSetsRecord]);

    // Handle next button with validation
    const handleNext = useCallback(() => {
        setHasSubmitted(true);
        
        const validation = validateSection(paginationState.currentSectionIndex);
        
        if (!validation.isValid) {
            // Update form errors to show validation issues
            setErrors({ ...formState.errors, ...validation.errors });
            
            // Scroll to first error field
            const firstErrorFieldId = Object.keys(validation.errors)[0];
            const firstErrorElement = document.querySelector(`[name="${firstErrorFieldId}"]`) as HTMLElement;
            if (firstErrorElement) {
                firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstErrorElement.focus();
            }
            
            return; // Don't proceed to next section
        }
        
        // Clear any existing errors for this section
        const currentSection = config.sections[paginationState.currentSectionIndex];
        const clearedErrors = { ...formState.errors };
        currentSection.fields.forEach(field => {
            delete clearedErrors[field.id];
        });
        setErrors(clearedErrors);
        
        // Proceed to next section
        goToNext();
    }, [paginationState.currentSectionIndex, validateSection, setErrors, formState.errors, config.sections, goToNext]);

    // Handle form submission with full validation (reuse DynamicForm logic)
    const handleSubmit = useCallback(async () => {
        setHasSubmitted(true);
        
        // Validate all sections
        let allSectionsValid = true;
        const allErrors: Record<string, string> = {};
        
        for (let i = 0; i < config.sections.length; i++) {
            const validation = validateSection(i);
            if (!validation.isValid) {
                allSectionsValid = false;
                Object.assign(allErrors, validation.errors);
            }
        }

        if (!allSectionsValid) {
            setErrors(allErrors);
            
            // Navigate to first section with errors
            const firstErrorFieldId = Object.keys(allErrors)[0];
            const sectionWithError = config.sections.findIndex(section => 
                section.fields.some(field => field.id === firstErrorFieldId)
            );
            if (sectionWithError >= 0) {
                goToSection(sectionWithError);
            }
            return;
        }

        try {
            const transformedData = transformFormStateToDescriptiveIds(formState.formData, config);
            await onSubmit(transformedData);
        } catch (error) {
            console.error('Form submission error:', error);
        }
    }, [config.sections, formState.formData, onSubmit, setErrors, goToSection, validateSection]);

    const currentSection = config.sections[paginationState.currentSectionIndex];

    // Check if current section has validation errors
    const currentSectionValidation = React.useMemo(() => {
        return validateSection(paginationState.currentSectionIndex);
    }, [validateSection, paginationState.currentSectionIndex, formState.formData, hasSubmitted]);

    // Calculate section validation states for step indicator
    const sectionValidationStates = React.useMemo(() => {
        const states: Record<number, boolean> = {};
        for (let i = 0; i < config.sections.length; i++) {
            const validation = validateSection(i);
            states[i] = validation.isValid;
        }
        return states;
    }, [config.sections.length, validateSection, formState.formData, hasSubmitted]);

    return (
        <div className={clsx("min-h-screen bg-amber-50/30", className)}>
            <main className="py-8">
                <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md">
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

                        {/* Step Indicator */}
                        {config.paginatorConfig?.showStepIndicator !== false && (
                            <div className="mb-8">
                                <FormStepIndicator
                                    sections={config.sections}
                                    currentIndex={paginationState.currentSectionIndex}
                                    visitedIndices={paginationState.visitedSections}
                                    sectionValidationStates={sectionValidationStates}
                                    hasSubmitted={hasSubmitted}
                                    showTitles={config.paginatorConfig?.showSectionTitles}
                                    showProgressBar={config.paginatorConfig?.showProgressBar}
                                    showProgressText={config.paginatorConfig?.showProgressText}
                                />
                            </div>
                        )}

                        {/* Current Section */}
                        <div className="mb-8">
                            <InteractiveSectionRenderer
                                section={currentSection}
                                sectionIndex={paginationState.currentSectionIndex}
                                totalSections={paginationState.totalSections}
                                fieldValues={formState.formData}
                                fieldErrors={hasSubmitted ? formState.errors : {}}
                                onFieldChange={handleFieldChange}
                                ratingScales={ratingScalesRecord}
                                radioOptionSets={radioOptionSetsRecord}
                                multiSelectOptionSets={multiSelectOptionSetsRecord}
                                selectOptionSets={selectOptionSetsRecord}
                                loadingOptionSets={isLoading}
                            />
                        </div>

                        {/* Navigation Controls */}
                        <div className="border-t pt-6">
                            <FormNavigationControls
                                isFirstSection={paginationState.isFirstSection}
                                isLastSection={paginationState.isLastSection}
                                onPrevious={goToPrevious}
                                onNext={handleNext}
                                onSubmit={handleSubmit}
                                disabled={loading}
                                loading={loading}
                                hasValidationErrors={hasSubmitted && !currentSectionValidation.isValid}
                            />
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t mt-12">
                <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-center">
                        <p className="text-sm text-gray-500">© 2025 Service Line Survey</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

