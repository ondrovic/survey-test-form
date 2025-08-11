// Framework Types - Single Source of Truth

// Field Types
export type FieldType =
  | "text"
  | "email"
  | "select"
  | "multiselect"
  | "multiselectdropdown"
  | "radio"
  | "checkbox"
  | "rating"
  | "textarea"
  | "number";

// Section types are now dynamic strings generated from titles

// Field and Option Types
export interface FieldOption {
  value: string;
  label: string;
  color?: string;
  icon?: string;
  isDefault?: boolean;
  metadata?: Record<string, any>;
}

export interface ValidationRule {
  type: "required" | "email" | "min" | "max" | "minSelections" | "maxSelections" | "pattern" | "custom";
  value?: any;
  message?: string;
}

export interface RatingScaleOption {
  value: string;
  label: string;
  color?: string;
  isDefault?: boolean;
  order: number;
}

export interface RatingScale {
  id: string;
  name: string;
  description?: string;
  options: RatingScaleOption[];
  // Business logic field (moved from metadata)
  isActive: boolean;
  // Audit trail only
  metadata: {
    createdAt: string;
    updatedAt: string;
    createdBy: string;
  };
}

// Option Set Types
export interface OptionSetOption {
  value: string;
  label: string;
  color?: string;
  isDefault?: boolean;
  order: number;
  metadata?: Record<string, any>;
}

export interface RadioOptionSet {
  id: string;
  name: string;
  description?: string;
  options: OptionSetOption[];
  // Business logic field (moved from metadata)
  isActive: boolean;
  // Audit trail only
  metadata: {
    createdAt: string;
    updatedAt: string;
    createdBy: string;
  };
}

export interface MultiSelectOptionSet {
  id: string;
  name: string;
  description?: string;
  options: OptionSetOption[];
  maxSelections?: number;
  minSelections?: number;
  // Business logic field (moved from metadata)
  isActive: boolean;
  // Audit trail only
  metadata: {
    createdAt: string;
    updatedAt: string;
    createdBy: string;
  };
}

export interface SelectOptionSet {
  id: string;
  name: string;
  description?: string;
  options: OptionSetOption[];
  allowMultiple?: boolean;
  // Business logic field (moved from metadata)
  isActive: boolean;
  // Audit trail only
  metadata: {
    createdAt: string;
    updatedAt: string;
    createdBy: string;
  };
}

// Survey Structure Types
export interface SurveyField {
  id: string;
  label: string;
  type: FieldType;
  options?: FieldOption[];
  ratingScaleId?: string;
  ratingScaleName?: string;
  radioOptionSetId?: string;
  radioOptionSetName?: string;
  multiSelectOptionSetId?: string;
  multiSelectOptionSetName?: string;
  selectOptionSetId?: string;
  selectOptionSetName?: string;
  required: boolean;
  validation?: ValidationRule[];
  placeholder?: string;
  defaultValue?: any;
  // Track label history for data export/migration purposes
  labelHistory?: Array<{
    label: string;
    changedAt: string;
    changedBy?: string;
  }>;
}

export interface SurveySubsection {
  id: string;
  title: string;
  description?: string;
  fields: SurveyField[];
  order: number;
  metadata?: Record<string, any>;
}

export interface SectionContent {
  id: string;
  type: 'field' | 'subsection';
  order: number;
  fieldId?: string;      // Reference to field in fields array
  subsectionId?: string; // Reference to subsection in subsections array
}

export interface SurveySection {
  id: string;
  title: string;
  type: string;
  fields: SurveyField[];
  subsections: SurveySubsection[];
  content?: SectionContent[]; // New unified ordering array
  order: number;
  description?: string;
  metadata?: Record<string, any>;
}

export interface SurveyPaginatorConfig {
  renderSectionsAsPages: boolean;
  showStepIndicator: boolean;
  showSectionTitles: boolean;
  allowBackNavigation: boolean;
  showProgressBar: boolean;
  showProgressText: boolean;
  showSectionPagination: boolean;
  animateTransitions?: boolean;
  allowSkipping?: boolean;
}

export interface SurveyConfig {
  id: string;
  title: string;
  description?: string;
  sections: SurveySection[];
  // Pagination configuration
  paginatorConfig?: Partial<SurveyPaginatorConfig>;
  // Business logic fields (moved from metadata)
  isActive: boolean;
  version: string;
  // Audit trail only
  metadata: {
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    ip?: string;
  };
}

export interface SurveyInstance {
  id: string;
  configId: string;
  title: string;
  description?: string;
  isActive: boolean;
  activeDateRange?: {
    startDate: string; // ISO string
    endDate: string; // ISO string
  };
  metadata: {
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    ip?: string;
  };
}

export interface SurveyResponse {
  id: string;
  surveyInstanceId: string;
  configVersion: string;
  responses: Record<string, any>;
  submittedAt: string;
  metadata: {
    userAgent: string;
    ipAddress?: string;
    sessionId?: string;
  };
}