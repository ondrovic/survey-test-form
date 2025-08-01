import { SurveyFormData } from "@/types";

export interface SurveyFormProps {
  onSubmit: (data: SurveyFormData) => Promise<void>;
  loading?: boolean;
  error?: string;
  success?: string;
  onDismissAlert?: () => void;
  className?: string;
  connected?: boolean;
}
