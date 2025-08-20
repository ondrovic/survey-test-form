// Database Row Types - These match the exact Supabase table structure
// Used internally by repositories and mappers

export interface SurveyConfigRow {
  id: string;
  title: string;
  description?: string;
  sections: any; // JSONB
  version: string;
  paginator_config: any; // JSONB
  footer_config: any; // JSONB
  is_active: boolean;
  metadata: any; // JSONB
  created_at: string;
  updated_at: string;
}

export interface SurveyInstanceRow {
  id: string;
  config_id: string;
  title: string;
  slug?: string;
  description?: string;
  is_active: boolean;
  active_date_range?: any;
  config_valid?: boolean; // Tracks if configuration is valid
  validation_in_progress?: boolean; // Prevents date automation during validation
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface SurveyResponseRow {
  id: string;
  survey_instance_id: string;
  config_version: string;
  responses: any; // JSONB
  submitted_at: string;
  metadata: any; // JSONB
  created_at: string;
}

export interface RatingScaleRow {
  id: string;
  name: string;
  description?: string;
  options: any; // JSONB
  is_active: boolean;
  metadata: any; // JSONB
  created_at: string;
  updated_at: string;
}

export interface RadioOptionSetRow {
  id: string;
  name: string;
  description?: string;
  options: any; // JSONB
  is_active: boolean;
  metadata: any; // JSONB
  created_at: string;
  updated_at: string;
}

export interface MultiSelectOptionSetRow {
  id: string;
  name: string;
  description?: string;
  options: any; // JSONB
  min_selections?: number;
  max_selections?: number;
  is_active: boolean;
  metadata: any; // JSONB
  created_at: string;
  updated_at: string;
}

export interface SelectOptionSetRow {
  id: string;
  name: string;
  description?: string;
  options: any; // JSONB
  allow_multiple: boolean;
  is_active: boolean;
  metadata: any; // JSONB
  created_at: string;
  updated_at: string;
}

export interface SurveyInstanceStatusChangeRow {
  id: string;
  instance_id: string;
  old_status?: boolean;
  new_status: boolean;
  reason: string;
  changed_at: string;
  changed_by: string;
  details: any; // JSONB
}

// Legacy survey table
export interface SurveyRow {
  id: string;
  personal_info: any; // JSONB
  business_info: any; // JSONB
  service_lines: any; // JSONB
  additional_services: any; // JSONB
  feedback?: string;
  submitted_at: string;
  ip_address?: string;
  created_at: string;
}