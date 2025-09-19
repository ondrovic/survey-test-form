export interface ImageRadioGroupProps<T extends string | number = string> {
  name: string;
  options: Array<{
    value: T;
    label: string;
    image?: string;
    images?: readonly string[];
    disabled?: boolean;
  }>;
  selectedValue: T | null;
  onChange: (value: T) => void;
  label?: string;
  required?: boolean;
  error?: string;
  layout?: "horizontal" | "vertical";
  "data-testid"?: string;
  className?: string;
}
