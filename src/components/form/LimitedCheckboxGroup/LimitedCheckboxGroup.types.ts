export interface LimitedCheckboxGroupProps<T extends string | number = string> {
  name: string;
  options: Array<{
    value: T;
    label: string;
    disabled?: boolean;
  }>;
  selectedValues: T[];
  onChange: (values: T[]) => void;
  label?: string;
  maxSelections: number;
  required?: boolean;
  error?: string;
  layout?: "horizontal" | "vertical" | "grid";
  "data-testid"?: string;
  className?: string;
}
