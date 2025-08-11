import React, { createContext, useContext, useCallback, useState } from 'react';
import { SurveyConfig, SurveySection, SurveyField } from '../../types/framework.types';
import { 
    ValidationResult, 
    FieldValidationResult,
    validateRequired, 
    validateMinLength, 
    validateMaxLength,
    validateUnique,
    validateOptionValue,
    combineValidations,
    VALIDATION_LIMITS 
} from '../../utils/validation.utils';

interface ValidationError {
    id: string;
    type: 'survey' | 'section' | 'field' | 'option';
    path: string; // e.g., 'survey.title', 'section.123.title', 'field.456.label'
    message: string;
}

interface ValidationContextState {
    errors: ValidationError[];
    isValidating: boolean;
}

interface ValidationContextValue {
    state: ValidationContextState;
    validateSurveyTitle: (title: string) => FieldValidationResult;
    validateSurveyDescription: (description: string) => FieldValidationResult;
    validateSectionTitle: (title: string) => FieldValidationResult;
    validateSectionDescription: (description: string) => FieldValidationResult;
    validateFieldLabel: (label: string) => FieldValidationResult;
    validateFieldPlaceholder: (placeholder: string) => FieldValidationResult;
    validateFieldOptions: (field: SurveyField) => FieldValidationResult;
    validateSection: (section: SurveySection) => ValidationResult;
    validateSurvey: (config: SurveyConfig) => ValidationResult;
    clearErrors: (path?: string) => void;
    addError: (error: ValidationError) => void;
    getErrorsForPath: (path: string) => ValidationError[];
    hasErrors: () => boolean;
}

const ValidationContext = createContext<ValidationContextValue | undefined>(undefined);

export const useValidation = (): ValidationContextValue => {
    const context = useContext(ValidationContext);
    if (!context) {
        throw new Error('useValidation must be used within a ValidationProvider');
    }
    return context;
};

interface ValidationProviderProps {
    children: React.ReactNode;
}

export const ValidationProvider: React.FC<ValidationProviderProps> = ({ children }) => {
    const [state, setState] = useState<ValidationContextState>({
        errors: [],
        isValidating: false
    });

    const addError = useCallback((error: ValidationError) => {
        setState(prev => ({
            ...prev,
            errors: [...prev.errors.filter(e => e.path !== error.path), error]
        }));
    }, []);

    const clearErrors = useCallback((path?: string) => {
        setState(prev => ({
            ...prev,
            errors: path 
                ? prev.errors.filter(e => !e.path.startsWith(path))
                : []
        }));
    }, []);

    const getErrorsForPath = useCallback((path: string): ValidationError[] => {
        return state.errors.filter(e => e.path === path);
    }, [state.errors]);

    const hasErrors = useCallback((): boolean => {
        return state.errors.length > 0;
    }, [state.errors]);

    // Survey validation functions
    const validateSurveyTitle = useCallback((title: string): FieldValidationResult => {
        return combineValidations(
            validateRequired(title, 'Survey title'),
            validateMinLength(title, VALIDATION_LIMITS.SURVEY_TITLE_MIN, 'Survey title'),
            validateMaxLength(title, VALIDATION_LIMITS.SURVEY_TITLE_MAX, 'Survey title')
        );
    }, []);

    const validateSurveyDescription = useCallback((description: string): FieldValidationResult => {
        return validateMaxLength(description, VALIDATION_LIMITS.SURVEY_DESCRIPTION_MAX, 'Survey description');
    }, []);

    // Section validation functions
    const validateSectionTitle = useCallback((title: string): FieldValidationResult => {
        return combineValidations(
            validateRequired(title, 'Section title'),
            validateMinLength(title, VALIDATION_LIMITS.SECTION_TITLE_MIN, 'Section title'),
            validateMaxLength(title, VALIDATION_LIMITS.SECTION_TITLE_MAX, 'Section title')
        );
    }, []);

    const validateSectionDescription = useCallback((description: string): FieldValidationResult => {
        return validateMaxLength(description, VALIDATION_LIMITS.SECTION_DESCRIPTION_MAX, 'Section description');
    }, []);

    // Field validation functions
    const validateFieldLabel = useCallback((label: string): FieldValidationResult => {
        return combineValidations(
            validateRequired(label, 'Field label'),
            validateMinLength(label, VALIDATION_LIMITS.FIELD_LABEL_MIN, 'Field label'),
            validateMaxLength(label, VALIDATION_LIMITS.FIELD_LABEL_MAX, 'Field label')
        );
    }, []);

    const validateFieldPlaceholder = useCallback((placeholder: string): FieldValidationResult => {
        return validateMaxLength(placeholder, VALIDATION_LIMITS.FIELD_PLACEHOLDER_MAX, 'Field placeholder');
    }, []);

    const validateFieldOptions = useCallback((field: SurveyField): FieldValidationResult => {
        // Skip validation for fields that don't need options
        if (!['radio', 'multiselect', 'multiselectdropdown', 'rating', 'select'].includes(field.type)) {
            return { isValid: true };
        }

        // Skip validation if using external option sets or rating scales
        if (field.radioOptionSetId || field.multiSelectOptionSetId || field.ratingScaleId || field.selectOptionSetId) {
            return { isValid: true };
        }

        const options = field.options || [];

        // Check minimum options
        if (options.length < VALIDATION_LIMITS.MIN_OPTIONS_FOR_SELECTION) {
            return {
                isValid: false,
                error: `${field.type} fields require at least ${VALIDATION_LIMITS.MIN_OPTIONS_FOR_SELECTION} options`
            };
        }

        // Validate each option
        for (let i = 0; i < options.length; i++) {
            const option = options[i];
            
            // Validate option label
            const labelValidation = combineValidations(
                validateRequired(option.label, 'Option label'),
                validateMaxLength(option.label, VALIDATION_LIMITS.OPTION_LABEL_MAX, 'Option label')
            );
            if (!labelValidation.isValid) {
                return {
                    isValid: false,
                    error: `Option ${i + 1}: ${labelValidation.error}`
                };
            }

            // Validate option value
            const valueValidation = validateOptionValue(option.value);
            if (!valueValidation.isValid) {
                return {
                    isValid: false,
                    error: `Option ${i + 1}: ${valueValidation.error}`
                };
            }
        }

        // Check for unique labels and values
        const labels = options.map(o => o.label?.trim()).filter(Boolean);
        const values = options.map(o => o.value?.trim()).filter(Boolean);

        const labelUniqueness = validateUnique(labels, 'Option labels');
        if (!labelUniqueness.isValid) {
            return labelUniqueness;
        }

        const valueUniqueness = validateUnique(values, 'Option values');
        if (!valueUniqueness.isValid) {
            return valueUniqueness;
        }

        return { isValid: true };
    }, []);

    // Complex validation functions
    const validateSection = useCallback((section: SurveySection): ValidationResult => {
        const errors: string[] = [];

        // Validate section title
        const titleValidation = validateSectionTitle(section.title);
        if (!titleValidation.isValid && titleValidation.error) {
            errors.push(titleValidation.error);
        }

        // Validate section description
        if (section.description) {
            const descValidation = validateSectionDescription(section.description);
            if (!descValidation.isValid && descValidation.error) {
                errors.push(descValidation.error);
            }
        }

        // Check minimum content (fields OR subsections)
        const totalFields = section.fields.length;
        const totalSubsections = section.subsections?.length || 0;
        
        if (totalFields === 0 && totalSubsections === 0) {
            errors.push('Section must have at least 1 field or 1 subsection');
        }

        // Validate each field
        section.fields.forEach((field, index) => {
            const labelValidation = validateFieldLabel(field.label);
            if (!labelValidation.isValid && labelValidation.error) {
                errors.push(`Field ${index + 1}: ${labelValidation.error}`);
            }

            if (field.placeholder) {
                const placeholderValidation = validateFieldPlaceholder(field.placeholder);
                if (!placeholderValidation.isValid && placeholderValidation.error) {
                    errors.push(`Field ${index + 1}: ${placeholderValidation.error}`);
                }
            }

            const optionsValidation = validateFieldOptions(field);
            if (!optionsValidation.isValid && optionsValidation.error) {
                errors.push(`Field ${index + 1}: ${optionsValidation.error}`);
            }
        });

        // Check for unique field IDs within section
        const fieldIds = section.fields.map(f => f.id).filter(Boolean);
        const uniqueFieldIds = validateUnique(fieldIds, 'Field IDs');
        if (!uniqueFieldIds.isValid && uniqueFieldIds.error) {
            errors.push(uniqueFieldIds.error);
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }, [validateSectionTitle, validateSectionDescription, validateFieldLabel, validateFieldPlaceholder, validateFieldOptions]);

    const validateSurvey = useCallback((config: SurveyConfig): ValidationResult => {
        const errors: string[] = [];

        // Validate survey title
        const titleValidation = validateSurveyTitle(config.title);
        if (!titleValidation.isValid && titleValidation.error) {
            errors.push(titleValidation.error);
        }

        // Validate survey description
        if (config.description) {
            const descValidation = validateSurveyDescription(config.description);
            if (!descValidation.isValid && descValidation.error) {
                errors.push(descValidation.error);
            }
        }

        // Check minimum sections
        if (config.sections.length < VALIDATION_LIMITS.MIN_SECTIONS_PER_SURVEY) {
            errors.push(`Survey must have at least ${VALIDATION_LIMITS.MIN_SECTIONS_PER_SURVEY} section`);
        }

        // Validate each section
        config.sections.forEach((section, index) => {
            const sectionValidation = validateSection(section);
            if (!sectionValidation.isValid) {
                sectionValidation.errors.forEach(error => {
                    errors.push(`Section ${index + 1} (${section.title}): ${error}`);
                });
            }
        });

        // Check for unique section IDs
        const sectionIds = config.sections.map(s => s.id).filter(Boolean);
        const uniqueSectionIds = validateUnique(sectionIds, 'Section IDs');
        if (!uniqueSectionIds.isValid && uniqueSectionIds.error) {
            errors.push(uniqueSectionIds.error);
        }

        // Check for unique section types (warning, not error)
        const sectionTypes = config.sections.map(s => s.type).filter(Boolean);
        const duplicateTypes = sectionTypes.filter((type, index) => 
            sectionTypes.indexOf(type) !== index && type !== 'custom'
        );
        if (duplicateTypes.length > 0) {
            errors.push(`Warning: Duplicate section types found: ${duplicateTypes.join(', ')}`);
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }, [validateSurveyTitle, validateSurveyDescription, validateSection]);

    const value: ValidationContextValue = {
        state,
        validateSurveyTitle,
        validateSurveyDescription,
        validateSectionTitle,
        validateSectionDescription,
        validateFieldLabel,
        validateFieldPlaceholder,
        validateFieldOptions,
        validateSection,
        validateSurvey,
        clearErrors,
        addError,
        getErrorsForPath,
        hasErrors
    };

    return (
        <ValidationContext.Provider value={value}>
            {children}
        </ValidationContext.Provider>
    );
};