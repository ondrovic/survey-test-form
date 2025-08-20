// Types for the new normalized database schema

// ===================================
// DOMAIN TYPES (Business Logic Layer)
// ===================================

export interface SurveySection {
  id: string;
  surveyConfigId: string;
  title: string;
  description?: string;
  sectionType?: string;
  orderIndex: number;
  isRequired: boolean;
  displayLogic?: Record<string, any>;
  fields?: SurveyField[];
  metadata: {
    createdAt: string;
    updatedAt: string;
    createdBy: string;
  };
}

export interface SurveyField {
  id: string;
  sectionId: string;
  fieldKey: string;
  label: string;
  fieldType: string;
  description?: string;
  placeholder?: string;
  orderIndex: number;
  isRequired: boolean;
  
  // Validation
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  pattern?: string;
  customValidation?: Record<string, any>;
  
  // Configuration
  defaultValue?: string;
  fieldConfig?: Record<string, any>;
  displayLogic?: Record<string, any>;
  
  // Option set references
  ratingScaleId?: string;
  radioOptionSetId?: string;
  multiSelectOptionSetId?: string;
  selectOptionSetId?: string;
  
  // Resolved option sets (populated by queries)
  ratingScale?: any;
  radioOptionSet?: any;
  multiSelectOptionSet?: any;
  selectOptionSet?: any;
  
  metadata: {
    createdAt: string;
    updatedAt: string;
    createdBy: string;
  };
}

export interface SurveyFieldResponse {
  id: string;
  surveyResponseId: string;
  fieldId: string;
  fieldKey: string;
  fieldType: string;
  
  // Value storage (only one should be populated)
  textValue?: string;
  numericValue?: number;
  booleanValue?: boolean;
  dateValue?: string;
  arrayValue?: any[];
  
  responseMetadata?: Record<string, any>;
  createdAt: string;
}

export interface SurveyTemplate {
  id: string;
  name: string;
  description?: string;
  category?: string;
  isPublic: boolean;
  templateConfig: Record<string, any>;
  tags: string[];
  usageCount: number;
  createdBy: string;
  metadata: {
    createdAt: string;
    updatedAt: string;
    createdBy: string;
  };
}

export interface SurveyResponseSummary {
  id: string;
  surveyInstanceId: string;
  dateBucket: string; // Date string (YYYY-MM-DD)
  responseCount: number;
  completionRate?: number;
  averageCompletionTime?: number; // in seconds
  fieldStatistics?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface EntityAuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  changedFields?: string[];
  userId: string;
  userContext?: Record<string, any>;
  timestamp: string;
}

// ===================================
// DATABASE ROW TYPES (Data Access Layer)
// ===================================

export interface SurveySectionRow {
  id: string;
  survey_config_id: string;
  title: string;
  description?: string;
  section_type?: string;
  order_index: number;
  is_required: boolean;
  display_logic?: any; // JSONB
  metadata: any; // JSONB
  created_at: string;
  updated_at: string;
}

export interface SurveyFieldRow {
  id: string;
  section_id: string;
  field_key: string;
  label: string;
  field_type: string;
  description?: string;
  placeholder?: string;
  order_index: number;
  is_required: boolean;
  min_length?: number;
  max_length?: number;
  min_value?: number;
  max_value?: number;
  pattern?: string;
  custom_validation?: any; // JSONB
  default_value?: string;
  field_config?: any; // JSONB
  display_logic?: any; // JSONB
  rating_scale_id?: string;
  radio_option_set_id?: string;
  multi_select_option_set_id?: string;
  select_option_set_id?: string;
  metadata: any; // JSONB
  created_at: string;
  updated_at: string;
}

export interface SurveyFieldResponseRow {
  id: string;
  survey_response_id: string;
  field_id: string;
  field_key: string;
  text_value?: string;
  numeric_value?: number;
  boolean_value?: boolean;
  date_value?: string;
  array_value?: any; // JSONB
  field_type: string;
  response_metadata?: any; // JSONB
  created_at: string;
}

export interface SurveyTemplateRow {
  id: string;
  name: string;
  description?: string;
  category?: string;
  is_public: boolean;
  template_config: any; // JSONB
  tags: string[];
  usage_count: number;
  created_by: string;
  metadata: any; // JSONB
  created_at: string;
  updated_at: string;
}

export interface SurveyResponseSummaryRow {
  id: string;
  survey_instance_id: string;
  date_bucket: string;
  response_count: number;
  completion_rate?: number;
  average_completion_time?: number;
  field_statistics?: any; // JSONB
  created_at: string;
  updated_at: string;
}

export interface EntityAuditLogRow {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  old_values?: any; // JSONB
  new_values?: any; // JSONB
  changed_fields?: string[];
  user_id: string;
  user_context?: any; // JSONB
  timestamp: string;
}

// ===================================
// QUERY RESULT TYPES
// ===================================

export interface SurveyConfigWithSections extends Omit<SurveyConfig, 'sections'> {
  sections: SurveySection[];
}

export interface SurveySectionWithFields extends SurveySection {
  fields: SurveyField[];
}

export interface SurveyResponseWithFieldResponses extends SurveyResponse {
  fieldResponses: SurveyFieldResponse[];
}

// Import base types
import { SurveyConfig, SurveyResponse } from './framework.types';