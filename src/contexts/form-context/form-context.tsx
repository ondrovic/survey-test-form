import React, { createContext, ReactNode, useCallback, useContext, useReducer } from 'react';

// State interface
interface FormState {
    formData: Record<string, any>;
    errors: Record<string, string>;
    touched: Record<string, boolean>;
    isSubmitting: boolean;
    isValid: boolean;
}

// Action types
type FormAction =
    | { type: 'SET_FIELD_VALUE'; payload: { fieldId: string; value: any } }
    | { type: 'SET_FIELD_ERROR'; payload: { fieldId: string; error: string } }
    | { type: 'CLEAR_FIELD_ERROR'; payload: { fieldId: string } }
    | { type: 'SET_FIELD_TOUCHED'; payload: { fieldId: string; touched: boolean } }
    | { type: 'SET_IS_SUBMITTING'; payload: boolean }
    | { type: 'SET_IS_VALID'; payload: boolean }
    | { type: 'RESET_FORM'; payload?: Record<string, any> }
    | { type: 'SET_FORM_DATA'; payload: Record<string, any> }
    | { type: 'CLEAR_ERRORS' }
    | { type: 'SET_ERRORS'; payload: Record<string, string> };

// Initial state
const initialState: FormState = {
    formData: {},
    errors: {},
    touched: {},
    isSubmitting: false,
    isValid: true,
};

// Reducer
function formReducer(state: FormState, action: FormAction): FormState {
    switch (action.type) {
        case 'SET_FIELD_VALUE':
            return {
                ...state,
                formData: { ...state.formData, [action.payload.fieldId]: action.payload.value },
                // Clear error when user starts typing
                errors: action.payload.value !== undefined && action.payload.value !== ''
                    ? { ...state.errors, [action.payload.fieldId]: '' }
                    : state.errors
            };

        case 'SET_FIELD_ERROR':
            return {
                ...state,
                errors: { ...state.errors, [action.payload.fieldId]: action.payload.error }
            };

        case 'CLEAR_FIELD_ERROR':
            return {
                ...state,
                errors: { ...state.errors, [action.payload.fieldId]: '' }
            };

        case 'SET_FIELD_TOUCHED':
            return {
                ...state,
                touched: { ...state.touched, [action.payload.fieldId]: action.payload.touched }
            };

        case 'SET_IS_SUBMITTING':
            return { ...state, isSubmitting: action.payload };

        case 'SET_IS_VALID':
            return { ...state, isValid: action.payload };

        case 'RESET_FORM':
            return {
                ...initialState,
                formData: action.payload || {}
            };

        case 'SET_FORM_DATA':
            return { ...state, formData: action.payload };

        case 'CLEAR_ERRORS':
            return { ...state, errors: {} };

        case 'SET_ERRORS':
            return { ...state, errors: action.payload };

        default:
            return state;
    }
}

// Context
interface FormContextType {
    state: FormState;
    dispatch: React.Dispatch<FormAction>;
    // Convenience methods
    setFieldValue: (fieldId: string, value: any) => void;
    setFieldError: (fieldId: string, error: string) => void;
    clearFieldError: (fieldId: string) => void;
    setFieldTouched: (fieldId: string, touched: boolean) => void;
    setIsSubmitting: (isSubmitting: boolean) => void;
    setIsValid: (isValid: boolean) => void;
    resetForm: (initialData?: Record<string, any>) => void;
    setFormData: (formData: Record<string, any>) => void;
    clearErrors: () => void;
    setErrors: (errors: Record<string, string>) => void;
    validateForm: (validationRules: Record<string, any>) => boolean;
}

const FormContext = createContext<FormContextType | undefined>(undefined);

// Provider component
interface FormProviderProps {
    children: ReactNode;
    initialData?: Record<string, any>;
}

export const FormProvider: React.FC<FormProviderProps> = ({ children, initialData = {} }) => {
    const [state, dispatch] = useReducer(formReducer, {
        ...initialState,
        formData: initialData
    });

    const setFieldValue = useCallback((fieldId: string, value: any) => {
        dispatch({ type: 'SET_FIELD_VALUE', payload: { fieldId, value } });
    }, []);

    const setFieldError = useCallback((fieldId: string, error: string) => {
        dispatch({ type: 'SET_FIELD_ERROR', payload: { fieldId, error } });
    }, []);

    const clearFieldError = useCallback((fieldId: string) => {
        dispatch({ type: 'CLEAR_FIELD_ERROR', payload: { fieldId } });
    }, []);

    const setFieldTouched = useCallback((fieldId: string, touched: boolean) => {
        dispatch({ type: 'SET_FIELD_TOUCHED', payload: { fieldId, touched } });
    }, []);

    const setIsSubmitting = useCallback((isSubmitting: boolean) => {
        dispatch({ type: 'SET_IS_SUBMITTING', payload: isSubmitting });
    }, []);

    const setIsValid = useCallback((isValid: boolean) => {
        dispatch({ type: 'SET_IS_VALID', payload: isValid });
    }, []);

    const resetForm = useCallback((initialData?: Record<string, any>) => {
        dispatch({ type: 'RESET_FORM', payload: initialData });
    }, []);

    const setFormData = useCallback((formData: Record<string, any>) => {
        dispatch({ type: 'SET_FORM_DATA', payload: formData });
    }, []);

    const clearErrors = useCallback(() => {
        dispatch({ type: 'CLEAR_ERRORS' });
    }, []);

    const setErrors = useCallback((errors: Record<string, string>) => {
        dispatch({ type: 'SET_ERRORS', payload: errors });
    }, []);

    const validateForm = useCallback((validationRules: Record<string, any>): boolean => {
        const newErrors: Record<string, string> = {};
        let isValid = true;

        Object.keys(validationRules).forEach(fieldId => {
            const rules = validationRules[fieldId];
            const value = state.formData[fieldId];

            // Required validation
            if (rules.required && (!value || value === '')) {
                newErrors[fieldId] = rules.requiredMessage || 'This field is required';
                isValid = false;
            }

            // Email validation
            if (rules.email && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                newErrors[fieldId] = rules.emailMessage || 'Please enter a valid email address';
                isValid = false;
            }

            // Min length validation
            if (rules.minLength && value && value.length < rules.minLength) {
                newErrors[fieldId] = rules.minLengthMessage || `Minimum length is ${rules.minLength} characters`;
                isValid = false;
            }

            // Max length validation
            if (rules.maxLength && value && value.length > rules.maxLength) {
                newErrors[fieldId] = rules.maxLengthMessage || `Maximum length is ${rules.maxLength} characters`;
                isValid = false;
            }

            // Pattern validation
            if (rules.pattern && value && !rules.pattern.test(value)) {
                newErrors[fieldId] = rules.patternMessage || 'Please enter a valid value';
                isValid = false;
            }
        });

        setErrors(newErrors);
        setIsValid(isValid);
        return isValid;
    }, [state.formData, setErrors, setIsValid]);

    const value: FormContextType = {
        state,
        dispatch,
        setFieldValue,
        setFieldError,
        clearFieldError,
        setFieldTouched,
        setIsSubmitting,
        setIsValid,
        resetForm,
        setFormData,
        clearErrors,
        setErrors,
        validateForm,
    };

    return (
        <FormContext.Provider value={value}>
            {children}
        </FormContext.Provider>
    );
};

// Hook to use the context
export const useForm = (): FormContextType => {
    const context = useContext(FormContext);
    if (context === undefined) {
        throw new Error('useForm must be used within a FormProvider');
    }
    return context;
};
