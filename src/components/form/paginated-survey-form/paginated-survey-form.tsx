import { clsx } from "clsx";
import React, { useCallback, useEffect, useState } from "react";
import { useForm } from "../../../contexts/form-context";
import { useSurveyData } from "../../../contexts/survey-data-context";
import { useSurveySession } from "../../../hooks/use-survey-session";
import { SurveyField, SurveySection } from "../../../types/framework.types";
import { ScrollableContent, SurveyFooter } from "../../common";
import { useSectionPagination } from "../../survey/section-paginator";
import { InteractiveSectionRenderer } from "../../survey/section-paginator/interactive-section-renderer";
import { transformFormStateToDescriptiveIds } from "../utils/transform.utils";
import {
  validateAllFields,
  validateFieldValue,
  validateSection as validateSectionShared,
} from "../utils/validation.utils";
import { ErrorLoggingService } from "../../../services/error-logging.service";
import { FormNavigationControls } from "./form-navigation-controls";
import { FormStepIndicator } from "./form-step-indicator";
import { PaginatedSurveyFormProps } from "./paginated-survey-form.types";

// Removed local helpers in favor of shared utils (DRY)

export const PaginatedSurveyForm: React.FC<PaginatedSurveyFormProps> = ({
  config,
  onSubmit,
  loading = false,
  showSectionPagination = true,
  className,
  resetTrigger,
  onSectionChange,
  surveyInstanceId,
}) => {
  // Use context providers - reuse ALL logic from DynamicForm
  const {
    state: formState,
    setFieldValue,
    setFieldError,
    setErrors,
    resetForm,
  } = useForm();
  const { state: surveyDataState } = useSurveyData();

  // Initialize survey session - always call hook but pass null when not needed
  const surveySession = useSurveySession(
    surveyInstanceId
      ? {
          surveyInstanceId,
          totalSections: config.sections?.length || 1,
          activityTimeoutMs: 24 * 60 * 60 * 1000, // 24 hours
        }
      : null
  );

  // Track pagination state
  const {
    state: paginationState,
    goToSection,
    goToNext,
    goToPrevious,
  } = useSectionPagination({
    totalSections: config.sections.length,
    initialIndex: 0,
    allowBackNavigation: config.paginatorConfig?.allowBackNavigation !== false,
  });

  // Track if form has been submitted to control when to show validation
  const [hasSubmitted, setHasSubmitted] = useState(false);
  // Track which sections have been validated (for progressive validation)
  const [validatedSections, setValidatedSections] = useState<Set<number>>(
    new Set()
  );
  // Track if answers have been restored from session
  const [answersRestored, setAnswersRestored] = useState(false);

  // Extract data from survey data context
  const {
    ratingScales,
    radioOptionSets,
    multiSelectOptionSets,
    selectOptionSets,
    isLoading,
  } = surveyDataState;

  // Convert arrays to records for easy lookup (same as DynamicForm)
  const ratingScalesRecord = React.useMemo(() => {
    const record: Record<string, any> = {};
    ratingScales.forEach((scale) => {
      record[scale.id] = scale;
    });
    return record;
  }, [ratingScales]);

  const radioOptionSetsRecord = React.useMemo(() => {
    const record: Record<string, any> = {};
    if (Array.isArray(radioOptionSets)) {
      radioOptionSets.forEach((set) => {
        record[set.id] = set;
      });
    }
    return record;
  }, [radioOptionSets]);

  const multiSelectOptionSetsRecord = React.useMemo(() => {
    const record: Record<string, any> = {};
    if (Array.isArray(multiSelectOptionSets)) {
      multiSelectOptionSets.forEach((set) => {
        record[set.id] = set;
      });
    }
    
    return record;
  }, [multiSelectOptionSets]);

  const selectOptionSetsRecord = React.useMemo(() => {
    const record: Record<string, any> = {};
    if (Array.isArray(selectOptionSets)) {
      selectOptionSets.forEach((set) => {
        record[set.id] = set;
      });
    }
    return record;
  }, [selectOptionSets]);

  // Track section changes for session activity
  useEffect(() => {
    if (
      onSectionChange &&
      typeof paginationState.currentSectionIndex === "number"
    ) {
      onSectionChange(paginationState.currentSectionIndex);
    }
  }, [paginationState.currentSectionIndex, onSectionChange]);

  // Helper function to process all fields in a section (including subsections)
  const processAllFields = useCallback(
    (section: SurveySection, callback: (field: SurveyField) => void) => {
      // Process section-level fields
      section.fields.forEach(callback);

      // Process subsection fields
      if (section.subsections) {
        section.subsections.forEach((subsection) => {
          subsection.fields.forEach(callback);
        });
      }
    },
    []
  );

  // Initialize form state with default values (reuse exact logic from DynamicForm)
  const initializeFormState = useCallback(() => {
    const initialState: Record<string, any> = {};

    config.sections.forEach((section) => {
      processAllFields(section, (field) => {
        if (field.type === "rating" && field.ratingScaleId) {
          const scale = ratingScalesRecord[field.ratingScaleId];
          if (scale) {
            const defaultOption = scale.options.find((opt) => opt.isDefault);
            if (defaultOption) {
              initialState[field.id] = defaultOption.value;
            } else {
              initialState[field.id] = "Not Important";
            }
          } else {
            initialState[field.id] = "Not Important";
          }
        } else if (field.type === "radio" && field.options) {
          const defaultOption = field.options.find((opt) => opt.isDefault);
          if (defaultOption) {
            initialState[field.id] = defaultOption.value;
          }
        } else if (
          field.type === "multiselect" ||
          field.type === "multiselectdropdown"
        ) {
          initialState[field.id] = [];
        } else if (field.type === "select" && field.options) {
          const defaultOption = field.options.find((opt) => opt.isDefault);
          if (defaultOption) {
            initialState[field.id] = defaultOption.value;
          }
        }
      });
    });

    return initialState;
  }, [config.id, config.sections, ratingScalesRecord, processAllFields]);

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

  // Restore answers from session when session data is available
  useEffect(() => {
    if (surveySession?.session.sessionId) {
      const hasAnswersToRestore =
        surveySession.session.savedAnswers &&
        Object.keys(surveySession.session.savedAnswers).length > 0;

      if (
        hasAnswersToRestore &&
        !answersRestored &&
        surveySession.session.savedAnswers
      ) {
        // Restore saved answers to form state
        Object.entries(surveySession.session.savedAnswers).forEach(
          ([fieldId, value]) => {
            setFieldValue(fieldId, value);
          }
        );

        // Restore saved page if available
        if (surveySession.getSavedPage) {
          surveySession
            .getSavedPage()
            .then((savedPage) => {
              if (savedPage !== null && savedPage >= 0) {
                const isValidPage = savedPage < (config.sections?.length || 0);
                const needsRestoration =
                  savedPage !== paginationState.currentSectionIndex;

                if (isValidPage && needsRestoration) {
                  goToSection(savedPage);
                }
            }})
            .catch((error) => {
              // Log page restoration error
              ErrorLoggingService.logError({
                severity: 'medium',
                errorMessage: 'Failed to restore saved page',
                stackTrace: error instanceof Error ? error.stack : String(error),
                componentName: 'PaginatedSurveyForm',
                functionName: 'useEffect-restoreAnswers',
                surveyInstanceId: surveyInstanceId || undefined
              });
            });
        }

        setAnswersRestored(true);
      }
    }
  }, [
    surveySession?.session.sessionId,
    surveySession?.session.savedAnswers,
    answersRestored,
    setFieldValue,
  ]);

  // Handle form reset when resetTrigger changes
  useEffect(() => {
    if (resetTrigger && resetTrigger > 0) {
      setupFormState();
    }
  }, [resetTrigger, setupFormState]);

  // Set default values when option sets are loaded (reuse exact logic from DynamicForm)
  useEffect(() => {
    config.sections.forEach((section) => {
      processAllFields(section, (field) => {
        if (
          field.type === "rating" &&
          field.ratingScaleId &&
          ratingScalesRecord[field.ratingScaleId]
        ) {
          const scale = ratingScalesRecord[field.ratingScaleId];
          const defaultOption = scale.options.find((opt) => opt.isDefault);
          if (defaultOption && !formState.formData[field.id]) {
            setFieldValue(field.id, defaultOption.value);
          }
        }
      });
    });
  }, [
    ratingScalesRecord,
    config,
    formState.formData,
    setFieldValue,
    processAllFields,
  ]);

  // Set default values when radio option sets are loaded
  useEffect(() => {
    config.sections.forEach((section) => {
      processAllFields(section, (field) => {
        if (
          field.type === "radio" &&
          field.radioOptionSetId &&
          radioOptionSetsRecord[field.radioOptionSetId]
        ) {
          const optionSet = radioOptionSetsRecord[field.radioOptionSetId];
          const defaultOption = optionSet.options.find((opt) => opt.isDefault);
          // Only set default value if there is a default option and no value is currently set
          if (defaultOption && formState.formData[field.id] === undefined) {
            setFieldValue(field.id, defaultOption.value);
          }
        }
      });
    });
  }, [
    radioOptionSetsRecord,
    config,
    formState.formData,
    setFieldValue,
    processAllFields,
  ]);

  // Set default values when multi-select option sets are loaded
  useEffect(() => {
    config.sections.forEach((section) => {
      processAllFields(section, (field) => {
        if (
          field.type === "multiselect" &&
          field.multiSelectOptionSetId &&
          multiSelectOptionSetsRecord[field.multiSelectOptionSetId]
        ) {
          const optionSet =
            multiSelectOptionSetsRecord[field.multiSelectOptionSetId];
          const defaultOptions = optionSet.options.filter(
            (opt) => opt.isDefault
          );
          // Only set default values if there are default options and no value is currently set
          if (
            defaultOptions.length > 0 &&
            formState.formData[field.id] === undefined
          ) {
            const defaultValues = defaultOptions.map((opt) => opt.value);
            setFieldValue(field.id, defaultValues);
          }
        }
      });
    });
  }, [
    multiSelectOptionSetsRecord,
    config,
    formState.formData,
    setFieldValue,
    processAllFields,
  ]);

  // Set default values when select option sets are loaded
  useEffect(() => {
    config.sections.forEach((section) => {
      processAllFields(section, (field) => {
        if (
          field.type === "select" &&
          field.selectOptionSetId &&
          selectOptionSetsRecord[field.selectOptionSetId]
        ) {
          const optionSet = selectOptionSetsRecord[field.selectOptionSetId];
          const defaultOption = optionSet.options.find((opt) => opt.isDefault);
          
          // Only set default value if there is a default option and no value is currently set
          if (defaultOption && formState.formData[field.id] === undefined) {
            setFieldValue(field.id, defaultOption.value);
          }
        } else if (
          field.type === "multiselectdropdown" &&
          field.selectOptionSetId &&
          selectOptionSetsRecord[field.selectOptionSetId]
        ) {
          const optionSet = selectOptionSetsRecord[field.selectOptionSetId];
          const defaultOptions = optionSet.options.filter(
            (opt) => opt.isDefault
          );
          // Only set default values if there are default options and no value is currently set
          if (
            defaultOptions.length > 0 &&
            formState.formData[field.id] === undefined
          ) {
            const defaultValues = defaultOptions.map((opt) => opt.value);
            setFieldValue(field.id, defaultValues);
          }
        }
      });
    });
  }, [
    selectOptionSetsRecord,
    config,
    formState.formData,
    setFieldValue,
    processAllFields,
  ]);

  const handleFieldChange = useCallback(
    (fieldId: string, value: any) => {
      setFieldValue(fieldId, value);

      // Save answers to session if session is available
      if (surveySession?.saveAnswersToSession) {
        // Get current form state and update with new value
        const currentAnswers = { ...formState.formData, [fieldId]: value };
        surveySession.saveAnswersToSession(
          currentAnswers,
          paginationState.currentSectionIndex
        );
      }

      // Find which section this field belongs to
      let fieldSectionIndex = -1;
      for (let i = 0; i < config.sections.length; i++) {
        const section = config.sections[i];
        const fieldInSection =
          section.fields.find((f) => f.id === fieldId) ||
          section.subsections
            ?.flatMap((s) => s.fields)
            .find((f) => f.id === fieldId);
        if (fieldInSection) {
          fieldSectionIndex = i;
          break;
        }
      }

      // Live-validate if form has been submitted, current section has been validated, or field has an error
      if (
        hasSubmitted ||
        validatedSections.has(fieldSectionIndex) ||
        formState.errors[fieldId]
      ) {
        let field: SurveyField | undefined;
        for (const section of config.sections) {
          field = section.fields.find((f) => f.id === fieldId);
          if (field) break;
          field = section.subsections
            ?.flatMap((s) => s.fields)
            .find((f) => f.id === fieldId);
          if (field) break;
        }
        if (field) {
          const err = validateFieldValue(field, value, {
            ratingScales: ratingScalesRecord,
            radioOptionSets: radioOptionSetsRecord,
            multiSelectOptionSets: multiSelectOptionSetsRecord,
            selectOptionSets: selectOptionSetsRecord,
          });
          setFieldError(fieldId, err || "");
        } else if (formState.errors[fieldId]) {
          setFieldError(fieldId, "");
        }
      }
    },
    [
      setFieldValue,
      setFieldError,
      formState.errors,
      formState.formData,
      hasSubmitted,
      validatedSections,
      config.sections,
      ratingScalesRecord,
      radioOptionSetsRecord,
      multiSelectOptionSetsRecord,
      selectOptionSetsRecord,
      surveySession,
      paginationState.currentSectionIndex,
    ]
  );

  // Enhanced validation function for a specific section
  const validateSection = useCallback(
    (
      sectionIndex: number
    ): { isValid: boolean; errors: Record<string, string> } => {
      return validateSectionShared(sectionIndex, formState.formData, config, {
        ratingScales: ratingScalesRecord,
        radioOptionSets: radioOptionSetsRecord,
        multiSelectOptionSets: multiSelectOptionSetsRecord,
        selectOptionSets: selectOptionSetsRecord,
      });
    },
    [
      config,
      formState.formData,
      ratingScalesRecord,
      radioOptionSetsRecord,
      multiSelectOptionSetsRecord,
      selectOptionSetsRecord,
    ]
  );

  // Handle next button with validation
  const handleNext = useCallback(() => {
    // Mark current section as validated
    setValidatedSections(
      (prev) => new Set([...prev, paginationState.currentSectionIndex])
    );

    const validation = validateSection(paginationState.currentSectionIndex);

    if (!validation.isValid) {
      // Update form errors to show validation issues
      setErrors({ ...formState.errors, ...validation.errors });

      // Scroll to first error field within the scroll container
      const firstErrorFieldId = Object.keys(validation.errors)[0];
      const firstErrorElement = document.querySelector(
        `[name="${firstErrorFieldId}"]`
      ) as HTMLElement;
      if (firstErrorElement) {
        // Find the scroll container
        const scrollContainer = document.querySelector(
          ".overflow-y-auto"
        ) as HTMLElement;
        if (scrollContainer) {
          const containerRect = scrollContainer.getBoundingClientRect();
          const elementRect = firstErrorElement.getBoundingClientRect();
          const relativeTop =
            elementRect.top - containerRect.top + scrollContainer.scrollTop;

          scrollContainer.scrollTo({
            top: relativeTop - 80, // 80px offset from top
            behavior: "smooth",
          });
        } else {
          // Fallback to regular scroll
          firstErrorElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
        firstErrorElement.focus();
      }

      return; // Don't proceed to next section
    }

    // Clear any existing errors for this section
    const currentSection = config.sections[paginationState.currentSectionIndex];
    const clearedErrors = { ...formState.errors };
    currentSection.fields.forEach((field) => {
      delete clearedErrors[field.id];
    });
    setErrors(clearedErrors);

    // Proceed to next section
    goToNext();
  }, [
    paginationState.currentSectionIndex,
    validateSection,
    setErrors,
    formState.errors,
    config.sections,
    goToNext,
  ]);

  // Handle form submission with full validation (reuse DynamicForm logic)
  const handleSubmit = useCallback(async () => {
    setHasSubmitted(true);

    // Validate entire form using shared validator (returns per-field errors)
    const { isValid: allSectionsValid, errors: allErrors } = validateAllFields(
      formState.formData,
      config,
      {
        ratingScales: ratingScalesRecord,
        radioOptionSets: radioOptionSetsRecord,
        multiSelectOptionSets: multiSelectOptionSetsRecord,
        selectOptionSets: selectOptionSetsRecord,
      }
    );

    if (!allSectionsValid) {
      setErrors(allErrors);

      // Navigate to first section with errors
      const firstErrorFieldId = Object.keys(allErrors)[0];
      let sectionWithError = -1;
      for (let i = 0; i < config.sections.length; i++) {
        const section = config.sections[i];
        const hasError =
          section.fields.some((field) => field.id === firstErrorFieldId) ||
          (section.subsections || []).some((subsection) =>
            subsection.fields.some((field) => field.id === firstErrorFieldId)
          );
        if (hasError) {
          sectionWithError = i;
          break;
        }
      }
      if (sectionWithError >= 0) {
        goToSection(sectionWithError);
        setTimeout(() => {
          const firstErrorElement = document.querySelector(
            `[name="${firstErrorFieldId}"]`
          ) as HTMLElement;
          if (firstErrorElement) {
            const scrollContainer = document.querySelector(
              ".overflow-y-auto"
            ) as HTMLElement;
            if (scrollContainer) {
              const containerRect = scrollContainer.getBoundingClientRect();
              const elementRect = firstErrorElement.getBoundingClientRect();
              const relativeTop =
                elementRect.top - containerRect.top + scrollContainer.scrollTop;
              scrollContainer.scrollTo({
                top: relativeTop - 80,
                behavior: "smooth",
              });
            }
            firstErrorElement.focus();
          }
        }, 100);
      }
      return;
    }

    try {
      const transformedData = transformFormStateToDescriptiveIds(
        formState.formData,
        config
      );
      await onSubmit(transformedData);
    } catch (error) {
      // Log form submission error
      ErrorLoggingService.logCriticalError(
        'Failed to submit form data',
        error instanceof Error ? error : new Error(String(error)),
        {
          componentName: 'PaginatedSurveyForm',
          functionName: 'handleSubmit',
          surveyInstanceId: surveyInstanceId || undefined,
          additionalContext: { formDataKeys: Object.keys(formState.formData) }
        }
      );
    }
  }, [
    formState.formData,
    onSubmit,
    setErrors,
    goToSection,
    config,
    ratingScalesRecord,
    radioOptionSetsRecord,
    multiSelectOptionSetsRecord,
    selectOptionSetsRecord,
  ]);

  // Check if current section has validation errors
  const currentSectionValidation = React.useMemo(() => {
    return validateSection(paginationState.currentSectionIndex);
  }, [
    validateSection,
    paginationState.currentSectionIndex,
    formState.formData,
    hasSubmitted,
  ]);

  // Calculate section validation states for step indicator
  const sectionValidationStates = React.useMemo(() => {
    const states: Record<number, boolean> = {};
    for (let i = 0; i < config.sections.length; i++) {
      const validation = validateSection(i);
      states[i] = validation.isValid;
    }
    return states;
  }, [
    config.sections.length,
    validateSection,
    formState.formData,
    hasSubmitted,
  ]);

  // Create a stable reset trigger that only changes when actually navigating sections
  const scrollResetTrigger = React.useMemo(() => {
    return `section-${paginationState.currentSectionIndex}`;
  }, [paginationState.currentSectionIndex]);

  // Memoize the current section to prevent unnecessary re-renders
  const currentSection = React.useMemo(() => {
    return config.sections[paginationState.currentSectionIndex];
  }, [config.sections, paginationState.currentSectionIndex]);

  // Memoize the onScroll callback to prevent unnecessary re-renders
  const handleScroll = React.useCallback(
    (_scrollTop: number, _scrollHeight: number, _clientHeight: number) => {
      // Optional: Track scroll position for analytics or state
      // Removed excessive logging to improve performance
    },
    []
  );

  return (
    <div className={clsx("h-screen bg-blue-50/30 dark:bg-gray-900 flex flex-col", className)}>
      <main className="flex-1 py-8 flex min-h-0">
        <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md flex flex-col w-full h-full">
          {/* Fixed Header Section */}
          <div className="px-8 pt-8 pb-4 flex-shrink-0">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                {config.title}
              </h1>
              {config.description && (
                <p className="text-lg text-gray-600 dark:text-gray-300">{config.description}</p>
              )}
            </div>

            {/* Progress and Step Indicator */}
            {(config.paginatorConfig?.showProgressBar !== false ||
              config.paginatorConfig?.showStepIndicator !== false) && (
              <div className="mb-4">
                <FormStepIndicator
                  sections={config.sections}
                  currentIndex={paginationState.currentSectionIndex}
                  visitedIndices={paginationState.visitedSections}
                  sectionValidationStates={sectionValidationStates}
                  hasSubmitted={
                    hasSubmitted ||
                    validatedSections.has(paginationState.currentSectionIndex)
                  }
                  showTitles={config.paginatorConfig?.showSectionTitles}
                  showProgressBar={config.paginatorConfig?.showProgressBar}
                  showProgressText={config.paginatorConfig?.showProgressText}
                  showStepIndicator={config.paginatorConfig?.showStepIndicator}
                />
              </div>
            )}
          </div>

          {/* Scrollable Content Section */}
          <div className="flex-1 px-8 min-h-0 overflow-hidden sm:dropdown-container-mobile">
            <ScrollableContent
              maxHeight="100%"
              minHeight="200px"
              showScrollIndicators={true}
              smoothScroll={true}
              mobileOptimized={true}
              className="mb-4 h-full"
              resetTrigger={scrollResetTrigger}
              onScroll={handleScroll}
            >
              <div className="py-6 px-4">
                <div className="max-w-3xl mx-auto">
                  <InteractiveSectionRenderer
                    section={currentSection}
                    sectionIndex={paginationState.currentSectionIndex}
                    totalSections={paginationState.totalSections}
                    showSectionPagination={showSectionPagination}
                    fieldValues={formState.formData}
                    fieldErrors={
                      hasSubmitted ||
                      validatedSections.has(paginationState.currentSectionIndex)
                        ? formState.errors
                        : {}
                    }
                    onFieldChange={handleFieldChange}
                    ratingScales={ratingScalesRecord}
                    radioOptionSets={radioOptionSetsRecord}
                    multiSelectOptionSets={multiSelectOptionSetsRecord}
                    selectOptionSets={selectOptionSetsRecord}
                    loadingOptionSets={isLoading}
                  />
                </div>
              </div>
            </ScrollableContent>
          </div>

          {/* Fixed Navigation Controls */}
          <div className="px-8 pb-8 pt-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="max-w-3xl mx-auto">
              <FormNavigationControls
                isFirstSection={paginationState.isFirstSection}
                isLastSection={paginationState.isLastSection}
                onPrevious={goToPrevious}
                onNext={handleNext}
                onSubmit={handleSubmit}
                disabled={loading}
                loading={loading}
                hasValidationErrors={
                  hasSubmitted && !currentSectionValidation.isValid
                }
              />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <SurveyFooter config={config.footerConfig} />
    </div>
  );
};
