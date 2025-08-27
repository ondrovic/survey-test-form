/**
 * Common Hook Type Definitions
 * 
 * Generic type patterns and interfaces used across multiple React hooks
 * for consistent return types and option configurations.
 */

import { SurveyField } from './framework.types';

/**
 * Generic form state structure for survey forms
 */
export interface SurveyFormState {
  [fieldId: string]: any;
}

/**
 * Return type interface for survey form management hook
 */
export interface UseSurveyFormReturn {
  formState: SurveyFormState;
  errors: Record<string, string>;
  setFieldValue: (fieldId: string, value: any) => void;
  setFieldError: (fieldId: string, error: string) => void;
  clearFieldError: (fieldId: string) => void;
  validateField: (field: SurveyField, value: any) => string | null;
  validateForm: (fields: SurveyField[]) => boolean;
  resetForm: () => void;
  getFieldValue: (fieldId: string) => any;
}