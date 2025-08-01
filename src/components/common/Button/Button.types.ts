import { BaseButtonProps } from "@/types/form.types";

export type ButtonProps<T extends React.ElementType = "button"> = {
  as?: T;
} & BaseButtonProps &
  Omit<React.ComponentPropsWithoutRef<T>, keyof BaseButtonProps>;
