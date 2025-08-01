import { InputProps as BaseInputProps } from "@/types/form.types";

export type InputProps<T = string> = BaseInputProps<T> & {
  className?: string;
};
