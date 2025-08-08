import { CheckboxGroupProps as BaseCheckboxGroupProps } from "@/types/form.types";

export type CheckboxGroupProps<T extends string | number = string> =
  BaseCheckboxGroupProps<T> & {
    className?: string;
  };
