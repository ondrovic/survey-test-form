import React, { createContext, forwardRef, useContext } from 'react';
import { clsx } from 'clsx';
import { transitions, typography, input as inputTokens } from '@/styles/design-tokens';
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
        className={clsx(
          // Mobile-first spacing
          'space-y-2 sm:space-y-2',
          // Ensure touch-friendly layout
          'w-full',
          className
        )}
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
        // Mobile-friendly label sizing
        'text-base sm:text-sm',
        typography.weight.medium,
        // Ensure good touch target for labels (when clickable)
        'py-1',
        {
          'opacity-50': useFormField().disabled,
        },
        className
      )}
    >
      {children}
      {required && (
        <span 
          className="text-red-500 ml-1 text-base sm:text-sm" 
          aria-label="required"
        >
          *
        </span>
      )}
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
        // Mobile-friendly description text
        'text-sm',
        // Better spacing on mobile
        'leading-relaxed',
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
        // Mobile-friendly error text
        'text-sm',
        // Better visibility on mobile
        'font-medium leading-relaxed',
        // Add a subtle background for better contrast on mobile
        'sm:bg-transparent bg-red-50 sm:p-0 px-3 py-1 rounded-md',
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

  // Type-safe access to children props
  const childProps = children.props as Record<string, unknown>;

  // Clone the child element and pass the necessary props including mobile optimizations
  const enhancedProps = {
    id: fieldId,
    'aria-describedby': error ? errorId : undefined,
    'aria-invalid': error ? 'true' : 'false',
    'aria-required': required,
    disabled: disabled || (childProps.disabled as boolean),
    // Mobile-friendly enhancements
    style: {
      // Prevent iOS zoom on focus by ensuring font-size is at least 16px
      fontSize: window?.innerWidth <= 768 ? '16px' : undefined,
      ...(childProps.style as React.CSSProperties || {}),
    },
    className: clsx(
      // Add mobile touch target enhancements if it's an input-like element
      typeof children.type === 'string' && ['input', 'textarea', 'select'].includes(children.type) && inputTokens.mobile.touchTarget,
      typeof children.type === 'string' && ['input', 'textarea', 'select'].includes(children.type) && inputTokens.mobile.textSize,
      typeof children.type === 'string' && ['input', 'textarea', 'select'].includes(children.type) && inputTokens.mobile.spacing,
      childProps.className as string
    ),
  };

  const childWithProps = React.cloneElement(children, enhancedProps);

  return (
    <div 
      ref={ref} 
      className={clsx(
        // Mobile-first container
        'w-full',
        // Ensure proper touch interaction space
        'relative',
        className
      )}
    >
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