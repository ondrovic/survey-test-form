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
  type: "required" | "email" | "min" | "max" | "pattern" | "custom";
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
  metadata: {
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    isActive: boolean;
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
  metadata: {
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    isActive: boolean;
  };
}

export interface MultiSelectOptionSet {
  id: string;
  name: string;
  description?: string;
  options: OptionSetOption[];
  maxSelections?: number;
  minSelections?: number;
  metadata: {
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    isActive: boolean;
  };
}

export interface SelectOptionSet {
  id: string;
  name: string;
  description?: string;
  options: OptionSetOption[];
  allowMultiple?: boolean;
  metadata: {
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    isActive: boolean;
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
  metadata?: Record<string, any>;
}

export interface SurveySection {
  id: string;
  title: string;
  type: string;
  fields: SurveyField[];
  order: number;
  description?: string;
  metadata?: Record<string, any>;
}

export interface SurveyConfig {
  id: string;
  title: string;
  description?: string;
  sections: SurveySection[];
  metadata: {
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    version: string;
    isActive: boolean;
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
  };
}

export interface SurveyResponse {
  id: string;
  surveyInstanceId: string;
  configVersion: string;
  responses: Record<string, any>;
  metadata: {
    submittedAt: string;
    userAgent: string;
    ipAddress?: string;
    sessionId?: string;
  };
}