import React, { createContext, forwardRef, useContext } from 'react';
import { clsx } from 'clsx';
import { transitions, typography } from '@/styles/design-tokens';
import { BaseFormProps } from '@/types/form.types';

/**
 * Form Field Context for compound component pattern
 */
interface FormFieldContextValue extends Pick<BaseFormProps, 'name' | 'required' | 'error' | 'disabled'> {
  fieldId: string;
  errorId: string;
}

const FormFieldContext = createContext<FormFieldContextValue | null>(null);

/**
 * Hook to access form field context
 */
export const useFormField = () => {
  const context = useContext(FormFieldContext);
  if (!context) {
    throw new Error('useFormField must be used within a FormField component');
  }
  return context;
};

/**
 * Main FormField Props
 */
export interface FormFieldProps extends Pick<BaseFormProps, 'name' | 'required' | 'error' | 'disabled' | 'className'> {
  children: React.ReactNode;
}

/**
 * Main FormField Component - provides context for child components
 */
export const FormField = forwardRef<HTMLDivElement, FormFieldProps>(({
  name,
  required = false,
  error,
  disabled = false,
  className,
  children,
}, ref) => {
  const fieldId = `${name}-field`;
  const errorId = `${name}-error`;

  const contextValue: FormFieldContextValue = {
    name,
    required,
    error,
    disabled,
    fieldId,
    errorId,
  };

  return (
    <FormFieldContext.Provider value={contextValue}>
      <div
        ref={ref}
        className={clsx('space-y-2', className)}
      >
        {children}
      </div>
    </FormFieldContext.Provider>
  );
});

FormField.displayName = 'FormField';

/**
 * FormField.Label - Label component with automatic associations
 */
export interface FormFieldLabelProps {
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
}

const FormFieldLabel = forwardRef<HTMLLabelElement, FormFieldLabelProps>(({
  children,
  className,
  htmlFor,
}, ref) => {
  const { fieldId, required } = useFormField();

  return (
    <label
      ref={ref}
      htmlFor={htmlFor || fieldId}
      className={clsx(
        'block font-medium text-gray-700',
        typography.text.sm,
        typography.weight.medium,
        {
          'opacity-50': useFormField().disabled,
        },
        className
      )}
    >
      {children}
      {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
    </label>
  );
});

FormFieldLabel.displayName = 'FormField.Label';

/**
 * FormField.Description - Help text component
 */
export interface FormFieldDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

const FormFieldDescription = forwardRef<HTMLParagraphElement, FormFieldDescriptionProps>(({
  children,
  className,
}, ref) => {
  const { disabled } = useFormField();

  return (
    <p
      ref={ref}
      className={clsx(
        'text-gray-600',
        typography.text.sm,
        {
          'opacity-50': disabled,
        },
        className
      )}
    >
      {children}
    </p>
  );
});

FormFieldDescription.displayName = 'FormField.Description';

/**
 * FormField.Error - Error message component with proper ARIA
 */
export interface FormFieldErrorProps {
  children?: React.ReactNode;
  className?: string;
}

const FormFieldError = forwardRef<HTMLParagraphElement, FormFieldErrorProps>(({
  children,
  className,
}, ref) => {
  const { error, errorId } = useFormField();
  
  const errorMessage = children || error;
  
  if (!errorMessage) return null;

  return (
    <p
      ref={ref}
      id={errorId}
      role="alert"
      aria-live="polite"
      className={clsx(
        'text-red-600',
        typography.text.sm,
        transitions.default,
        className
      )}
    >
      {errorMessage}
    </p>
  );
});

FormFieldError.displayName = 'FormField.Error';

/**
 * FormField.Control - Wrapper for form controls with proper associations
 */
export interface FormFieldControlProps {
  children: React.ReactElement;
  className?: string;
}

const FormFieldControl = forwardRef<HTMLDivElement, FormFieldControlProps>(({
  children,
  className,
}, ref) => {
  const { fieldId, errorId, error, disabled, required } = useFormField();

  // Clone the child element and pass the necessary props
  const childWithProps = React.cloneElement(children, {
    id: fieldId,
    'aria-describedby': error ? errorId : undefined,
    'aria-invalid': error ? 'true' : 'false',
    'aria-required': required,
    disabled: disabled || children.props.disabled,
    ...children.props, // Preserve existing props
  });

  return (
    <div ref={ref} className={className}>
      {childWithProps}
    </div>
  );
});

FormFieldControl.displayName = 'FormField.Control';

// Attach sub-components to main component
(FormField as any).Label = FormFieldLabel;
(FormField as any).Description = FormFieldDescription;
(FormField as any).Error = FormFieldError;
(FormField as any).Control = FormFieldControl;

// Export the compound component with proper typing
export interface FormFieldCompoundComponent extends React.ForwardRefExoticComponent<FormFieldProps & React.RefAttributes<HTMLDivElement>> {
  Label: typeof FormFieldLabel;
  Description: typeof FormFieldDescription;
  Error: typeof FormFieldError;
  Control: typeof FormFieldControl;
}

export default FormField as FormFieldCompoundComponent;