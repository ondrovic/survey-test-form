import { SurveyFormData } from "@/types";

export interface SurveyFormProps {
  onSubmit: (data: SurveyFormData) => Promise<void>;
  loading?: boolean;
  className?: string;
  connected?: boolean;
}
