import { RadioGroupProps as BaseRadioGroupProps } from "@/types/form.types";

export type RadioGroupProps<T extends string | number = string> =
  BaseRadioGroupProps<T> & {
    className?: string;
  };
