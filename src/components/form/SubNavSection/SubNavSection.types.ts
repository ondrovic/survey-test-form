export interface SubNavSectionProps {
  subNavQuestions: Record<string, string[]>;
  onQuestionChange: (subNavKey: string, selectedValues: string[]) => void;
  register: (name: string, options?: any) => any;
  errors?: {
    subNavQuestions?: Record<string, { message?: string }>;
  };
  className?: string;
}
