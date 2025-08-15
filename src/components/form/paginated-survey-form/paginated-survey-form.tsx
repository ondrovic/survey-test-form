import { clsx } from 'clsx';
import React, { useCallback, useEffect, useState } from 'react';
import { useForm } from '../../../contexts/form-context';
import { useSurveyData } from '../../../contexts/survey-data-context';
import { SurveySection, SurveyField } from '../../../types/framework.types';
import { transformFormStateToDescriptiveIds } from '../utils/transform.utils';
import { useSectionPagination } from '../../survey/section-paginator';
import { InteractiveSectionRenderer } from '../../survey/section-paginator/interactive-section-renderer';
import { FormStepIndicator } from './form-step-indicator';
import { FormNavigationControls } from './form-navigation-controls';
import { PaginatedSurveyFormProps } from './paginated-survey-form.types';
import { ScrollableContent, SurveyFooter } from '../../common';
import { validateAllFields, validateSection as validateSectionShared, validateFieldValue } from '../utils/validation.utils';

// Removed local helpers in favor of shared utils (DRY)

export const PaginatedSurveyForm: React.FC<PaginatedSurveyFormProps> = ({
    config,
    onSubmit,
    loading = false,
    showSectionPagination = true,
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

    // Initialize form state with default values (reuse exact logic from DynamicForm)
    const initializeFormState = useCallback(() => {
        const initialState: Record<string, any> = {};

        config.sections.forEach(section => {
            processAllFields(section, (field) => {
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
    }, [config.sections, ratingScalesRecord, processAllFields]);

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

    const handleFieldChange = useCallback((fieldId: string, value: any) => {
        setFieldValue(fieldId, value);
        
        // Live-validate if already submitted or field has an error
        if (hasSubmitted || formState.errors[fieldId]) {
            let field: SurveyField | undefined;
            for (const section of config.sections) {
                field = section.fields.find(f => f.id === fieldId);
                if (field) break;
                field = section.subsections?.flatMap(s => s.fields).find(f => f.id === fieldId);
                if (field) break;
            }
            if (field) {
                const err = validateFieldValue(field, value, {
                    ratingScales: ratingScalesRecord,
                    radioOptionSets: radioOptionSetsRecord,
                    multiSelectOptionSets: multiSelectOptionSetsRecord,
                    selectOptionSets: selectOptionSetsRecord,
                });
                setFieldError(fieldId, err || '');
            } else if (formState.errors[fieldId]) {
                setFieldError(fieldId, '');
            }
        }
    }, [setFieldValue, setFieldError, formState.errors, hasSubmitted, config.sections, ratingScalesRecord, radioOptionSetsRecord, multiSelectOptionSetsRecord, selectOptionSetsRecord]);



    // Enhanced validation function for a specific section
    const validateSection = useCallback((sectionIndex: number): { isValid: boolean; errors: Record<string, string> } => {
        return validateSectionShared(sectionIndex, formState.formData, config, {
            ratingScales: ratingScalesRecord,
            radioOptionSets: radioOptionSetsRecord,
            multiSelectOptionSets: multiSelectOptionSetsRecord,
            selectOptionSets: selectOptionSetsRecord,
        });
    }, [config, formState.formData, ratingScalesRecord, radioOptionSetsRecord, multiSelectOptionSetsRecord, selectOptionSetsRecord]);

    // Handle next button with validation
    const handleNext = useCallback(() => {
        setHasSubmitted(true);
        
        const validation = validateSection(paginationState.currentSectionIndex);
        
        if (!validation.isValid) {
            // Update form errors to show validation issues
            setErrors({ ...formState.errors, ...validation.errors });
            
            // Scroll to first error field within the scroll container
            const firstErrorFieldId = Object.keys(validation.errors)[0];
            const firstErrorElement = document.querySelector(`[name="${firstErrorFieldId}"]`) as HTMLElement;
            if (firstErrorElement) {
                // Find the scroll container
                const scrollContainer = document.querySelector('.overflow-y-auto') as HTMLElement;
                if (scrollContainer) {
                    const containerRect = scrollContainer.getBoundingClientRect();
                    const elementRect = firstErrorElement.getBoundingClientRect();
                    const relativeTop = elementRect.top - containerRect.top + scrollContainer.scrollTop;
                    
                    scrollContainer.scrollTo({
                        top: relativeTop - 80, // 80px offset from top
                        behavior: 'smooth'
                    });
                } else {
                    // Fallback to regular scroll
                    firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
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
        
        // Validate entire form using shared validator (returns per-field errors)
        const { isValid: allSectionsValid, errors: allErrors } = validateAllFields(formState.formData, config, {
            ratingScales: ratingScalesRecord,
            radioOptionSets: radioOptionSetsRecord,
            multiSelectOptionSets: multiSelectOptionSetsRecord,
            selectOptionSets: selectOptionSetsRecord,
        });

        if (!allSectionsValid) {
            setErrors(allErrors);
            
            // Navigate to first section with errors
            const firstErrorFieldId = Object.keys(allErrors)[0];
            let sectionWithError = -1;
            for (let i = 0; i < config.sections.length; i++) {
                const section = config.sections[i];
                const hasError = section.fields.some(field => field.id === firstErrorFieldId) ||
                    (section.subsections || []).some(subsection => 
                        subsection.fields.some(field => field.id === firstErrorFieldId)
                    );
                if (hasError) {
                    sectionWithError = i;
                    break;
                }
            }
            if (sectionWithError >= 0) {
                goToSection(sectionWithError);
                setTimeout(() => {
                    const firstErrorElement = document.querySelector(`[name="${firstErrorFieldId}"]`) as HTMLElement;
                    if (firstErrorElement) {
                        const scrollContainer = document.querySelector('.overflow-y-auto') as HTMLElement;
                        if (scrollContainer) {
                            const containerRect = scrollContainer.getBoundingClientRect();
                            const elementRect = firstErrorElement.getBoundingClientRect();
                            const relativeTop = elementRect.top - containerRect.top + scrollContainer.scrollTop;
                            scrollContainer.scrollTo({ top: relativeTop - 80, behavior: 'smooth' });
                        }
                        firstErrorElement.focus();
                    }
                }, 100);
            }
            return;
        }

        try {
            const transformedData = transformFormStateToDescriptiveIds(formState.formData, config);
            await onSubmit(transformedData);
        } catch (error) {
            console.error('Form submission error:', error);
        }
    }, [formState.formData, onSubmit, setErrors, goToSection, config, ratingScalesRecord, radioOptionSetsRecord, multiSelectOptionSetsRecord, selectOptionSetsRecord]);

    const currentSection = config.sections[paginationState.currentSectionIndex];

    // Check if current section has validation errors
    const currentSectionValidation = React.useMemo(() => {
        return validateSection(paginationState.currentSectionIndex);
    }, [validateSection, paginationState.currentSectionIndex]);

    // Calculate section validation states for step indicator
    const sectionValidationStates = React.useMemo(() => {
        const states: Record<number, boolean> = {};
        for (let i = 0; i < config.sections.length; i++) {
            const validation = validateSection(i);
            states[i] = validation.isValid;
        }
        return states;
    }, [config.sections.length, validateSection]);

    return (
        <div className={clsx("h-screen bg-amber-50/30 flex flex-col", className)}>
            <main className="flex-1 py-8 flex min-h-0">
                <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md flex flex-col w-full h-full">
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

                        {/* Progress and Step Indicator */}
                        {(config.paginatorConfig?.showProgressBar !== false || config.paginatorConfig?.showStepIndicator !== false) && (
                            <div className="mb-4">
                                <FormStepIndicator
                                    sections={config.sections}
                                    currentIndex={paginationState.currentSectionIndex}
                                    visitedIndices={paginationState.visitedSections}
                                    sectionValidationStates={sectionValidationStates}
                                    hasSubmitted={hasSubmitted}
                                    showTitles={config.paginatorConfig?.showSectionTitles}
                                    showProgressBar={config.paginatorConfig?.showProgressBar}
                                    showProgressText={config.paginatorConfig?.showProgressText}
                                    showStepIndicator={config.paginatorConfig?.showStepIndicator}
                                />
                            </div>
                        )}
                    </div>

                    {/* Scrollable Content Section */}
                    <div className="flex-1 px-8 min-h-0 overflow-hidden">
                        <ScrollableContent
                            maxHeight="100%"
                            minHeight="200px"
                            showScrollIndicators={true}
                            smoothScroll={true}
                            mobileOptimized={true}
                            className="mb-4 h-full"
                            resetTrigger={paginationState.currentSectionIndex}
                            onScroll={(scrollTop, scrollHeight, clientHeight) => {
                                // Optional: Track scroll position for analytics or state
                                console.debug('Section scroll:', { scrollTop, scrollHeight, clientHeight });
                            }}
                        >
                            <InteractiveSectionRenderer
                                section={currentSection}
                                sectionIndex={paginationState.currentSectionIndex}
                                totalSections={paginationState.totalSections}
                                showSectionPagination={showSectionPagination}
                                fieldValues={formState.formData}
                                fieldErrors={hasSubmitted ? formState.errors : {}}
                                onFieldChange={handleFieldChange}
                                ratingScales={ratingScalesRecord}
                                radioOptionSets={radioOptionSetsRecord}
                                multiSelectOptionSets={multiSelectOptionSetsRecord}
                                selectOptionSets={selectOptionSetsRecord}
                                loadingOptionSets={isLoading}
                            />
                        </ScrollableContent>
                    </div>

                    {/* Fixed Navigation Controls */}
                    <div className="px-8 pb-8 pt-4 border-t flex-shrink-0">
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
            </main>

            {/* Footer */}
            <SurveyFooter config={config.footerConfig} />
        </div>
    );
};

