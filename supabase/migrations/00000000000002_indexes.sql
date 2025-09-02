-- ===================================
-- Indexes Migration: 00000000000002
-- Description: Add indexes for performance
-- ===================================

CREATE INDEX IF NOT EXISTS idx_survey_configs_is_active ON survey_configs(is_active);
CREATE INDEX IF NOT EXISTS idx_survey_instances_config_id ON survey_instances(config_id);
CREATE INDEX IF NOT EXISTS idx_survey_instances_is_active ON survey_instances(is_active);
CREATE INDEX IF NOT EXISTS idx_survey_instances_config_valid ON survey_instances(config_valid);
CREATE INDEX IF NOT EXISTS idx_survey_instances_slug ON survey_instances(slug);

CREATE INDEX IF NOT EXISTS idx_survey_sessions_survey_instance_id ON survey_sessions(survey_instance_id);
CREATE INDEX IF NOT EXISTS idx_survey_sessions_status ON survey_sessions(status);
CREATE INDEX IF NOT EXISTS idx_survey_sessions_started_at ON survey_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_survey_sessions_last_activity_at ON survey_sessions(last_activity_at);
CREATE INDEX IF NOT EXISTS idx_survey_sessions_session_token ON survey_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_survey_sessions_status_activity ON survey_sessions(status, last_activity_at, created_at);
CREATE INDEX IF NOT EXISTS idx_survey_sessions_instance_status ON survey_sessions(survey_instance_id, status, created_at);

CREATE INDEX IF NOT EXISTS idx_survey_responses_survey_instance_id ON survey_responses(survey_instance_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_session_id ON survey_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_submitted_at ON survey_responses(submitted_at);
CREATE INDEX IF NOT EXISTS idx_survey_responses_started_at ON survey_responses(started_at);
CREATE INDEX IF NOT EXISTS idx_survey_responses_completed_at ON survey_responses(completed_at);
CREATE INDEX IF NOT EXISTS idx_survey_responses_completion_status ON survey_responses(completion_status);
CREATE INDEX IF NOT EXISTS idx_survey_responses_completion_time ON survey_responses(completion_time_seconds) WHERE completion_time_seconds IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_rating_scales_is_active ON rating_scales(is_active);
CREATE INDEX IF NOT EXISTS idx_radio_option_sets_is_active ON radio_option_sets(is_active);
CREATE INDEX IF NOT EXISTS idx_dropdown_option_sets_is_active ON dropdown_option_sets(is_active);
CREATE INDEX IF NOT EXISTS idx_select_option_sets_is_active ON dropdown_option_sets(is_active);

CREATE INDEX IF NOT EXISTS idx_survey_instance_status_changes_instance_id ON survey_instance_status_changes(instance_id);
CREATE INDEX IF NOT EXISTS idx_survey_instance_status_changes_changed_at ON survey_instance_status_changes(changed_at);

CREATE INDEX IF NOT EXISTS idx_error_logs_occurred_at ON error_logs(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_status ON error_logs(status);
CREATE INDEX IF NOT EXISTS idx_error_logs_component ON error_logs(component_name);
CREATE INDEX IF NOT EXISTS idx_error_logs_error_code ON error_logs(error_code) WHERE error_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_error_logs_error_hash ON error_logs(error_hash) WHERE error_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_error_logs_user_email ON error_logs(user_email) WHERE user_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_error_logs_session_token ON error_logs(session_token) WHERE session_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_error_logs_survey_instance ON error_logs(survey_instance_id) WHERE survey_instance_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_error_logs_severity_status ON error_logs(severity, status, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_component_occurred ON error_logs(component_name, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_unresolved ON error_logs(status, occurred_at DESC) WHERE status IN ('open', 'investigating');
CREATE INDEX IF NOT EXISTS idx_error_logs_message_search ON error_logs USING gin(to_tsvector('english', error_message));
CREATE INDEX IF NOT EXISTS idx_error_logs_tags ON error_logs USING gin(tags) WHERE tags IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_survey_sessions_status_activity ON survey_sessions(status, last_activity_at, created_at);
    
CREATE INDEX IF NOT EXISTS idx_survey_sessions_instance_status ON survey_sessions(survey_instance_id, status, created_at);