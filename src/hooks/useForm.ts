import { UseFormOptions, UseFormReturn } from "@/types";
import { useCallback } from "react";
import { useForm as useReactHookForm } from "react-hook-form";

/**
 * Custom hook that wraps react-hook-form to maintain the existing interface
 *
 * @param initialValues - Initial form values
 * @param validationRules - Validation rules for form fields
 * @param onSubmit - Function to call when form is submitted
 *
 * @returns Form state and handlers compatible with the existing interface
 *
 * @example
 * ```tsx
 * const { values, errors, handleSubmit, setValue } = useForm({
 *   initialValues: { email: '', password: '' },
 *   validationRules: {
 *     email: { required: 'Email is required' },
 *     password: { required: 'Password is required' }
 *   },
 *   onSubmit: async (values) => {
 *     await loginUser(values);
 *   }
 * });
 * ```
 */
export const useForm = <T extends Record<string, any>>({
  initialValues,
  onSubmit,
}: UseFormOptions<T>): UseFormReturn<T> => {
  const {
    register,
    handleSubmit: reactHookFormSubmit,
    formState: { errors, isSubmitting, isValid },
    setValue: setReactHookFormValue,
    reset,
    watch,
    setError,
    trigger,
  } = useReactHookForm({
    defaultValues: initialValues as any,
    mode: "onSubmit",
  });

  const values = watch() as T;

  const setValue = useCallback(
    <K extends keyof T>(field: K, value: T[K]) => {
      setReactHookFormValue(field as any, value);
    },
    [setReactHookFormValue]
  );

  const setFieldError = useCallback(
    (field: keyof T, error: string) => {
      setError(field as any, { message: error });
    },
    [setError]
  );

  const handleSubmit = useCallback(
    reactHookFormSubmit(async (data: any) => {
      await onSubmit(data as T);
    }),
    [reactHookFormSubmit, onSubmit]
  );

  const resetForm = useCallback(() => {
    reset(initialValues as any);
  }, [reset, initialValues]);

  // Use react-hook-form errors directly - no conversion needed

  return {
    values,
    errors, // Use react-hook-form errors directly
    touched: {}, // react-hook-form doesn't track touched state in the same way
    isSubmitting,
    isValid,
    setValue,
    setFieldError,
    handleSubmit,
    resetForm,
    register, // Expose the standard register function
    trigger, // Expose trigger function for manual validation
    setError, // Expose setError function for manual error setting
  };
};
