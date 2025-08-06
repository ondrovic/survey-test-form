import { SurveyConfig } from '../../../types/survey.types';

export interface DynamicFormProps {
  config: SurveyConfig;
  onSubmit: (responses: Record<string, any>) => Promise<void>;
  loading?: boolean;
  error?: string | null;
  success?: string | null;
  onDismissAlert?: () => void;
  className?: string;
}

