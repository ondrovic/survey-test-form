import { SurveyConfig } from "@/types";

export interface DynamicFormProps {
  config: SurveyConfig;
  onSubmit: (data: Record<string, any>) => Promise<void>;
  loading?: boolean;
  className?: string;
  resetTrigger?: number; // Add reset trigger prop
}
