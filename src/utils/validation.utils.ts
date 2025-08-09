export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

export interface FieldValidationResult {
    isValid: boolean;
    error?: string;
}

// Generic validation functions
export const validateRequired = (value: string | undefined | null, fieldName: string): FieldValidationResult => {
    if (!value || value.trim().length === 0) {
        return {
            isValid: false,
            error: `${fieldName} is required`
        };
    }
    return { isValid: true };
};

export const validateMinLength = (value: string | undefined | null, minLength: number, fieldName: string): FieldValidationResult => {
    if (!value || value.trim().length < minLength) {
        return {
            isValid: false,
            error: `${fieldName} must be at least ${minLength} characters`
        };
    }
    return { isValid: true };
};

export const validateMaxLength = (value: string | undefined | null, maxLength: number, fieldName: string): FieldValidationResult => {
    if (value && value.trim().length > maxLength) {
        return {
            isValid: false,
            error: `${fieldName} must be no more than ${maxLength} characters`
        };
    }
    return { isValid: true };
};

export const validateUnique = (values: string[], fieldName: string): FieldValidationResult => {
    const uniqueValues = new Set(values.filter(v => v && v.trim()));
    if (uniqueValues.size !== values.filter(v => v && v.trim()).length) {
        return {
            isValid: false,
            error: `${fieldName} must be unique`
        };
    }
    return { isValid: true };
};

export const validateOptionValue = (value: string | undefined | null): FieldValidationResult => {
    if (!value || value.trim().length === 0) {
        return {
            isValid: false,
            error: 'Option value is required'
        };
    }
    
    // Check for valid characters (alphanumeric, underscore, hyphen)
    const validPattern = /^[a-zA-Z0-9_-]+$/;
    if (!validPattern.test(value.trim())) {
        return {
            isValid: false,
            error: 'Option value can only contain letters, numbers, underscores, and hyphens'
        };
    }
    
    return { isValid: true };
};

// Combine multiple validation results
export const combineValidations = (...validations: FieldValidationResult[]): FieldValidationResult => {
    const errors = validations
        .filter(v => !v.isValid)
        .map(v => v.error)
        .filter(Boolean) as string[];
    
    return {
        isValid: errors.length === 0,
        error: errors[0] // Return first error
    };
};

// Validation constants
export const VALIDATION_LIMITS = {
    SURVEY_TITLE_MIN: 3,
    SURVEY_TITLE_MAX: 100,
    SURVEY_DESCRIPTION_MAX: 500,
    SECTION_TITLE_MIN: 2,
    SECTION_TITLE_MAX: 80,
    SECTION_DESCRIPTION_MAX: 300,
    FIELD_LABEL_MIN: 1,
    FIELD_LABEL_MAX: 100,
    FIELD_PLACEHOLDER_MAX: 150,
    OPTION_LABEL_MIN: 1,
    OPTION_LABEL_MAX: 50,
    MIN_OPTIONS_FOR_SELECTION: 2,
    MIN_SECTIONS_PER_SURVEY: 1,
    MIN_FIELDS_PER_SECTION: 1
} as const;