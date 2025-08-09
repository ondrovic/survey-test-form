// Legacy Survey Types (original system)

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
  responses?: any[];
}

export interface SurveyFormData {
  personalInfo: PersonalInfo;
  businessInfo: BusinessInfo;
  serviceLines: ServiceLineSection;
  recaptchaToken?: string | null;
}

// Framework types moved to framework.types.ts

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
