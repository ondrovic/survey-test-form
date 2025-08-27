import { SurveyField, SurveyFormState, UseSurveyFormReturn } from "@/types";
import { useCallback, useState } from "react";

export const useForm = (initialState: SurveyFormState = {}): UseSurveyFormReturn => {
  const [formState, setFormState] = useState<SurveyFormState>(initialState);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setFieldValue = useCallback(
    (fieldId: string, value: any) => {
      setFormState((prev) => ({ ...prev, [fieldId]: value }));

      // Clear error when user starts typing
      if (errors[fieldId]) {
        setErrors((prev) => ({ ...prev, [fieldId]: "" }));
      }
    },
    [errors]
  );

  const setFieldError = useCallback((fieldId: string, error: string) => {
    setErrors((prev) => ({ ...prev, [fieldId]: error }));
  }, []);

  const clearFieldError = useCallback((fieldId: string) => {
    setErrors((prev) => ({ ...prev, [fieldId]: "" }));
  }, []);

  const validateField = useCallback(
    (field: SurveyField, value: any): string | null => {
      if (!field.validation) return null;

      for (const rule of field.validation) {
        switch (rule.type) {
          case "required":
            if (!value || (Array.isArray(value) && value.length === 0)) {
              return rule.message || `${field.label} is required`;
            }
            break;
          case "email": {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (value && !emailRegex.test(value)) {
              return rule.message || "Please enter a valid email address";
            }
            break;
          }
          case "min":
            if (Array.isArray(value)) {
              // For multiselect fields, validate minimum selections
              if (value.length < (rule.value || 0)) {
                return (
                  rule.message ||
                  `${field.label} requires at least ${rule.value} selection${rule.value === 1 ? '' : 's'}`
                );
              }
            } else if (value && value.length < (rule.value || 0)) {
              return (
                rule.message ||
                `${field.label} must be at least ${rule.value} characters`
              );
            }
            break;
          case "max":
            if (Array.isArray(value)) {
              // For multiselect fields, validate maximum selections
              if (value.length > (rule.value || 0)) {
                return (
                  rule.message ||
                  `${field.label} can have at most ${rule.value} selection${rule.value === 1 ? '' : 's'}`
                );
              }
            } else if (value && value.length > (rule.value || 0)) {
              return (
                rule.message ||
                `${field.label} must be no more than ${rule.value} characters`
              );
            }
            break;
          case "minSelections":
            if (Array.isArray(value) && value.length < (rule.value || 0)) {
              return (
                rule.message ||
                `${field.label} requires at least ${rule.value} selection${rule.value === 1 ? '' : 's'}`
              );
            }
            break;
          case "maxSelections":
            if (Array.isArray(value) && value.length > (rule.value || 0)) {
              return (
                rule.message ||
                `${field.label} can have at most ${rule.value} selection${rule.value === 1 ? '' : 's'}`
              );
            }
            break;
        }
      }
      return null;
    },
    []
  );

  const validateForm = useCallback(
    (fields: SurveyField[]): boolean => {
      const newErrors: Record<string, string> = {};
      let isValid = true;

      fields.forEach((field) => {
        const value = formState[field.id];
        const error = validateField(field, value);
        if (error) {
          newErrors[field.id] = error;
          isValid = false;
        }
      });

      setErrors(newErrors);
      return isValid;
    },
    [formState, validateField]
  );

  const resetForm = useCallback(() => {
    setFormState(initialState);
    setErrors({});
  }, [initialState]);

  const getFieldValue = useCallback(
    (fieldId: string) => {
      return formState[fieldId];
    },
    [formState]
  );

  return {
    formState,
    errors,
    setFieldValue,
    setFieldError,
    clearFieldError,
    validateField,
    validateForm,
    resetForm,
    getFieldValue,
  };
};
