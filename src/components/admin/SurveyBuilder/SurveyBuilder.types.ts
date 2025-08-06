import { SurveyConfig } from "../../../types/survey.types";

export interface SurveyBuilderProps {
  onClose: () => void;
  editingConfig?: SurveyConfig | null;
}
