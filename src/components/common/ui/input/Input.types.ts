import { InputProps as BaseInputProps } from "@/types/form.types";

/**
 * Enhanced input props with forward ref support
 */
export type InputProps<T = string> = BaseInputProps<T> & {
  className?: string;
};
