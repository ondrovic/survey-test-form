import { FieldType, RatingScale, SurveyConfig } from "../../../types/framework.types";

export interface SurveyBuilderProps {
  onClose: () => void;
  editingConfig?: SurveyConfig | null;
}

export interface BuilderState {
  config: SurveyConfig;
  selectedSection: string | null;
  selectedField: string | null;
  isPreviewMode: boolean;
  error: string | null;
  success: string | null;
  loading: boolean;
  showRatingScaleManager: boolean;
  showMultiSelectEditor: boolean;
  ratingScaleOptions: Record<string, number>; // Store option counts for rating scales
  ratingScales: Record<string, RatingScale>; // Store actual rating scale data for preview
}

export const FIELD_TYPES: {
  value: FieldType;
  label: string;
  hasOptions: boolean;
}[] = [
  { value: "text", label: "Text Input", hasOptions: false },
  { value: "email", label: "Email Input", hasOptions: false },
  { value: "textarea", label: "Text Area", hasOptions: false },
  { value: "select", label: "Dropdown", hasOptions: true },
  { value: "multiselectdropdown", label: "Dropdown (Multi Select)", hasOptions: true },
  { value: "radio", label: "Radio Buttons", hasOptions: true },
  {
    value: "multiselect",
    label: "Checkboxes",
    hasOptions: true,
  },
  { value: "rating", label: "Rating", hasOptions: true },
  { value: "number", label: "Number Input", hasOptions: false },
];