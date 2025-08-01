import { ReactNode } from "react";

export interface InputProps<T = string> {
  name: string;
  value?: T;
  onChange?: (value: T) => void;
  register?: any; // react-hook-form register function
  type?: "text" | "email" | "number";
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  "data-testid"?: string;
  maxLength?: number;
}

export interface BaseButtonProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  "data-testid"?: string;
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
  layout?: "horizontal" | "vertical" | "grid";
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
  layout?: "horizontal" | "vertical";
  "data-testid"?: string;
}

export interface AlertProps {
  type: "success" | "error" | "warning" | "info";
  title?: string;
  message: string;
  onDismiss?: () => void;
  action?: () => void;
  "data-testid"?: string;
}

export type AlertVariant =
  | { type: "success"; title?: string; message: string }
  | { type: "error"; title?: string; message: string; action?: () => void }
  | { type: "warning"; title?: string; message: string }
  | { type: "info"; title?: string; message: string };
