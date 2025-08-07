import {
  FieldType,
  RatingScale,
  SectionType,
  SurveyConfig,
} from "../../../types/survey.types";

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
  { value: "radio", label: "Radio Buttons (Single Select)", hasOptions: true },
  {
    value: "multiselect",
    label: "Checkboxes (Multi Select)",
    hasOptions: true,
  },
  { value: "rating", label: "Rating", hasOptions: true },
  { value: "number", label: "Number Input", hasOptions: false },
];

export const SECTION_TYPES: { value: SectionType; label: string }[] = [
  { value: "personal_info", label: "Personal Information" },
  { value: "business_info", label: "Business Information" },
  { value: "rating_section", label: "Rating Section" },
  { value: "checkbox_section", label: "Checkbox Section" },
  { value: "radio_section", label: "Radio Section" },
  { value: "text_input", label: "Text Input Section" },
  { value: "custom", label: "Custom Section" },
];
