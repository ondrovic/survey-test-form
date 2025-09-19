export interface NavigationLayoutSectionProps {
  selectedValue: string;
  onChange: (value: string) => void;
  register: (name: string, options?: any) => any;
  errors?: {
    navigationLayout?: { message?: string };
  };
  className?: string;
}
