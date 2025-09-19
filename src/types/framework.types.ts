// Framework Types - Single Source of Truth

// Base utility types
export interface DateRange {
  start?: string;
  end?: string;
  startDate?: string;
  endDate?: string;
}

export interface Metadata {
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  [key: string]: any;
}

// Image Types
export interface SurveyImage {
  id: string;
  filename: string;
  originalFilename: string;
  fileSize: number;
  mimeType: string;
  storagePath: string;
  storageUrl: string;
  width?: number;
  height?: number;
  altText?: string;
  caption?: string;
  entityType: 'field' | 'option' | 'section' | 'subsection';
  entityId: string;
  configId: string;
  displayOrder: number;
  isPrimary: boolean;
  isActive: boolean;
  uploadStatus: 'uploading' | 'completed' | 'failed' | 'deleted';
  uploadedBy?: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ImageGalleryItem {
  original: string;
  thumbnail?: string;
  originalAlt?: string;
  thumbnailAlt?: string;
  description?: string;
}

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
  // Optional image support for all field types
  images?: SurveyImage[];
  // Track label history for data export/migration purposes
  labelHistory?: Array<{
    label: string;
    changedAt: string;
    changedBy?: string;
  }>;
}

export interface FieldDefaults {
  fieldType?: FieldType;
  ratingScaleId?: string;
  ratingScaleName?: string;
  radioOptionSetId?: string;
  radioOptionSetName?: string;
  multiSelectOptionSetId?: string;
  multiSelectOptionSetName?: string;
}

export interface SurveySubsection {
  id: string;
  title: string;
  description?: string;
  fields: SurveyField[];
  order: number;
  defaults?: FieldDefaults;
  // Optional image support for subsections
  images?: SurveyImage[];
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
  defaults?: FieldDefaults;
  // Optional image support for sections
  images?: SurveyImage[];
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

export interface FooterConfig {
  /** Whether to show the footer */
  show?: boolean;
  /** Custom footer text. If not provided, defaults will be used */
  text?: string;
  /** Organization name for copyright */
  organizationName?: string;
  /** Whether to include copyright year */
  includeCopyright?: boolean;
  /** Whether to auto-update the year */
  autoUpdateYear?: boolean;
  /** Whether to include "All rights reserved" text */
  includeAllRightsReserved?: boolean;
  /** Additional CSS classes for styling */
  className?: string;
  /** Custom links to display in footer */
  links?: Array<{
    text: string;
    url: string;
    external?: boolean;
  }>;
}

export interface SurveyConfig {
  id: string;
  title: string;
  description?: string;
  sections: SurveySection[];
  // Pagination configuration
  paginatorConfig?: Partial<SurveyPaginatorConfig>;
  // Footer configuration
  footerConfig?: FooterConfig;
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
  slug?: string;
  description?: string;
  isActive: boolean;
  activeDateRange?: DateRange;
  config_valid?: boolean; // Tracks if configuration is valid for automated activation
  validation_in_progress?: boolean; // Prevents date automation during validation
  metadata?: Metadata;
  createdAt: string;
  updatedAt: string;
}

export interface SurveyResponse {
  id: string;
  surveyInstanceId: string;
  sessionId?: string;
  configVersion: string;
  responses: Record<string, any>;
  
  // Timing tracking
  startedAt?: string;
  completedAt?: string;
  submittedAt: string; // Legacy field for backward compatibility
  completion_time_seconds?: number;
  
  // Status tracking
  completion_status?: 'partial' | 'completed' | 'abandoned';
  completion_percentage?: number;
  
  metadata: {
    userAgent: string;
    ipAddress?: string;
    sessionId?: string;
  };
}

export interface SurveySession {
  id: string;
  surveyInstanceId: string;
  sessionToken: string;
  startedAt: string;
  lastActivityAt: string;
  currentSection: number;
  totalSections?: number;
  status: 'started' | 'in_progress' | 'completed' | 'abandoned' | 'expired';
  userAgent?: string;
  ipAddress?: string;
  metadata: Record<string, any>;
}