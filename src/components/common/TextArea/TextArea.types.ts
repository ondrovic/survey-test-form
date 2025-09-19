export interface TextAreaProps<T extends string = string> {
  name: string;
  value?: T;
  onChange?: (value: T) => void;
  register?: (name: string, options?: any) => any;
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  "data-testid"?: string;
  className?: string;
  rows?: number;
  maxLength?: number;
}
