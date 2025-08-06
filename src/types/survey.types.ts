export type RatingValue = "High" | "Medium" | "Low" | "Not Important";

export interface PersonalInfo {
  fullName: string;
  email: string;
  franchise: string;
}

export interface BusinessInfo {
  marketRegions: string[];
  otherMarket?: string;
  numberOfLicenses: string;
  businessFocus: string;
}

export interface ServiceLineItem {
  name: string;
  rating: RatingValue | "Not Important";
}

export interface ServiceLineCategory {
  heading: string;
  items: ServiceLineItem[];
}

export interface ServiceLineSection {
  residentialServices: ServiceLineCategory[];
  residentialAdditionalNotes?: string;
  commercialServices: ServiceLineCategory[];
  commercialAdditionalNotes?: string;
  industries: ServiceLineCategory[];
  industriesAdditionalNotes?: string;
}

export interface SurveyData {
  id: string;
  personalInfo: PersonalInfo;
  businessInfo: BusinessInfo;
  serviceLines: ServiceLineSection;
  submittedAt: string;
  updatedAt: string;
}

export interface SurveyFormData {
  personalInfo: PersonalInfo;
  businessInfo: BusinessInfo;
  serviceLines: ServiceLineSection;
  recaptchaToken?: string | null;
}

// New Framework Types
export type FieldType =
  | "text"
  | "email"
  | "select"
  | "multiselect"
  | "radio"
  | "checkbox"
  | "rating"
  | "textarea"
  | "number";
export type SectionType =
  | "personal_info"
  | "business_info"
  | "rating_section"
  | "checkbox_section"
  | "radio_section"
  | "text_input"
  | "custom";

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

export interface SurveyField {
  id: string;
  label: string;
  type: FieldType;
  options?: FieldOption[];
  ratingScaleId?: string;
  ratingScaleName?: string;
  required: boolean;
  validation?: ValidationRule[];
  placeholder?: string;
  defaultValue?: any;
  metadata?: Record<string, any>;
}

export interface SurveySection {
  id: string;
  title: string;
  type: SectionType;
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

export interface FormField<T> {
  value: T;
  error?: string;
  touched?: boolean;
  required?: boolean;
}

export type FormState<T> = {
  [K in keyof T]: FormField<T[K]>;
};

export type FormValues<T> = {
  [K in keyof T]: T[K] extends FormField<infer U> ? U : T[K];
};

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type ChangeHandler<T> = (value: T) => void;
export type SubmitHandler<T> = (values: T) => Promise<void> | void;
