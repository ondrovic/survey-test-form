import { BaseButtonProps } from "@/types/form.types";

/**
 * Enhanced button props with better TypeScript support
 */
export type ButtonProps<T extends React.ElementType = "button"> = {
  as?: T;
  'aria-label'?: string;
} & BaseButtonProps &
  Omit<React.ComponentPropsWithoutRef<T>, keyof BaseButtonProps | 'aria-label'>;
