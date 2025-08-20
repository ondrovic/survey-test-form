import { ReactNode } from "react";

/**
 * Common props shared across all form components
 */
export interface BaseFormProps {
  /** Component name for form handling */
  name: string;
  /** Field label */
  label?: string;
  /** Required field indicator */
  required?: boolean;
  /** Error message to display */
  error?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Test identifier for testing */
  "data-testid"?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Enhanced input props with better generics and standardized interface
 */
export interface InputProps<T = string> extends BaseFormProps {
  /** Current value */
  value?: T;
  /** Change handler for controlled inputs */
  onChange?: (value: T) => void;
  /** Blur handler */
  onBlur?: (value: T) => void;
  /** React Hook Form register function */
  register?: any;
  /** Input type */
  type?: "text" | "email" | "number" | "password" | "tel" | "url" | "search";
  /** Placeholder text */
  placeholder?: string;
  /** Maximum character length */
  maxLength?: number;
  /** Autocomplete attribute */
  autocomplete?: string;
  /** Minimum value (for number inputs) */
  min?: number;
  /** Maximum value (for number inputs) */
  max?: number;
  /** Step value (for number inputs) */
  step?: number;
  /** Pattern for validation */
  pattern?: string;
}

/**
 * Common props shared across all UI components  
 */
export interface BaseUIProps {
  /** Additional CSS classes */
  className?: string;
  /** Test identifier for testing */
  "data-testid"?: string;
}

/**
 * Enhanced button props with standardized interface
 */
export interface BaseButtonProps extends BaseUIProps {
  /** Button content */
  children: ReactNode;
  /** Visual variant */
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  /** Size variant */
  size?: "sm" | "md" | "lg" | "form" | "fixed";
  /** Disabled state */
  disabled?: boolean;
  /** Loading state with spinner */
  loading?: boolean;
  /** Icon to display */
  icon?: ReactNode;
  /** Full width button */
  fullWidth?: boolean;
}

export type ButtonProps<T extends React.ElementType = "button"> = {
  as?: T;
} & BaseButtonProps &
  Omit<React.ComponentPropsWithoutRef<T>, keyof BaseButtonProps>;

export interface FormGroupProps {
  children: ReactNode;
  label?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
}

export interface CheckboxGroupProps<T extends string | number = string> {
  name: string;
  options: Array<{
    value: T;
    label: string;
    disabled?: boolean;
  }>;
  selectedValues: T[];
  onChange: (values: T[]) => void;
  label?: string;
  required?: boolean;
  error?: string;
  layout?: "horizontal" | "vertical" | "grid" | "balanced";
  maxSelections?: number;
  minSelections?: number;
  "data-testid"?: string;
}

export interface RadioGroupProps<T extends string | number = string> {
  name: string;
  options: Array<{
    value: T;
    label: string;
    disabled?: boolean;
  }>;
  selectedValue: T | null;
  onChange: (value: T) => void;
  label?: string;
  required?: boolean;
  error?: string;
  layout?: "horizontal" | "vertical" | "grid" | "balanced";
  "data-testid"?: string;
}

/**
 * Enhanced alert props with standardized interface
 */
export interface AlertProps extends BaseUIProps {
  /** Alert type/variant */
  type: "success" | "error" | "warning" | "info";
  /** Optional title */
  title?: string;
  /** Alert message content */
  message: string;
  /** Dismiss handler */
  onDismiss?: () => void;
  /** Action handler */
  action?: () => void;
  /** Auto dismiss after timeout (in ms) */
  autoClose?: number;
}

export type AlertVariant =
  | { type: "success"; title?: string; message: string }
  | { type: "error"; title?: string; message: string; action?: () => void }
  | { type: "warning"; title?: string; message: string }
  | { type: "info"; title?: string; message: string };
