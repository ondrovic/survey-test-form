-- Initial Optimized Schema Migration
-- This migration sets up the complete optimized survey database schema
-- Including legacy compatibility, normalized tables, RLS policies, and security fixes

-- ===================================
-- EXTENSIONS
-- ===================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===================================
-- LEGACY TABLES (for backward compatibility)
-- ===================================

-- Create survey_configs table (legacy structure)
CREATE TABLE IF NOT EXISTS survey_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    sections JSONB NOT NULL DEFAULT '[]',
    version VARCHAR(50) DEFAULT '1.0.0',
    paginator_config JSONB DEFAULT '{}',
    footer_config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create survey_instances table
CREATE TABLE IF NOT EXISTS survey_instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_id UUID NOT NULL REFERENCES survey_configs(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    slug VARCHAR(255) UNIQUE,
    paginator_config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    config_valid BOOLEAN DEFAULT true NOT NULL,
    active_date_range JSONB,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create survey_sessions table for tracking survey starts and progress
CREATE TABLE IF NOT EXISTS survey_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    survey_instance_id UUID NOT NULL REFERENCES survey_instances(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL, -- Unique token for tracking user session
    started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    current_section INTEGER DEFAULT 0,
    total_sections INTEGER,
    status VARCHAR(20) DEFAULT 'started' CHECK (status IN ('started', 'in_progress', 'completed', 'abandoned', 'expired')),
    user_agent TEXT,
    ip_address INET,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create survey_responses table (enhanced with timing and status tracking)
CREATE TABLE IF NOT EXISTS survey_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    survey_instance_id UUID NOT NULL REFERENCES survey_instances(id) ON DELETE CASCADE,
    session_id UUID REFERENCES survey_sessions(id) ON DELETE SET NULL,
    config_version VARCHAR(50) DEFAULT '1.0.0',
    responses JSONB NOT NULL DEFAULT '{}',
    
    -- Timing tracking
    started_at TIMESTAMP WITH TIME ZONE, -- When survey was first started (may be null for legacy data)
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT now(), -- When survey was completed
    completion_time_seconds INTEGER, -- Calculated completion time in seconds
    
    -- Status tracking
    completion_status VARCHAR(20) DEFAULT 'completed' CHECK (completion_status IN ('partial', 'completed', 'abandoned')),
    completion_percentage DECIMAL(5,2) DEFAULT 100.00, -- Percentage of fields completed
    
    -- Legacy field (renamed for clarity)
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(), -- Alias for completed_at for backward compatibility
    
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create option set tables
CREATE TABLE IF NOT EXISTS rating_scales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    options JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS radio_option_sets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    options JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS multi_select_option_sets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    options JSONB NOT NULL DEFAULT '[]',
    min_selections INTEGER,
    max_selections INTEGER,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS select_option_sets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    options JSONB NOT NULL DEFAULT '[]',
    allow_multiple BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create legacy surveys table (for backward compatibility)
CREATE TABLE IF NOT EXISTS surveys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    personal_info JSONB NOT NULL DEFAULT '{}',
    business_info JSONB NOT NULL DEFAULT '{}',
    service_lines JSONB NOT NULL DEFAULT '{}',
    additional_services JSONB NOT NULL DEFAULT '[]',
    feedback TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ===================================
-- NORMALIZED SCHEMA (optimized structure)
-- ===================================

-- Survey sections (normalized from survey_configs.sections JSONB)
CREATE TABLE IF NOT EXISTS survey_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    survey_config_id UUID NOT NULL REFERENCES survey_configs(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    section_type VARCHAR(100), -- e.g., 'personal_info', 'business_info', etc.
    order_index INTEGER NOT NULL DEFAULT 0,
    is_required BOOLEAN DEFAULT false,
    display_logic JSONB, -- Conditional display rules
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Ensure unique ordering per config
    CONSTRAINT unique_section_order_per_config UNIQUE(survey_config_id, order_index)
);

-- Survey fields (normalized from survey_sections)
CREATE TABLE IF NOT EXISTS survey_fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_id UUID NOT NULL REFERENCES survey_sections(id) ON DELETE CASCADE,
    field_key VARCHAR(255) NOT NULL, -- Unique key for referencing in responses
    label VARCHAR(500) NOT NULL,
    field_type VARCHAR(50) NOT NULL, -- 'text', 'email', 'select', 'rating', etc.
    description TEXT,
    placeholder VARCHAR(255),
    order_index INTEGER NOT NULL DEFAULT 0,
    is_required BOOLEAN DEFAULT false,
    
    -- Field validation rules (normalized)
    min_length INTEGER,
    max_length INTEGER,
    min_value DECIMAL,
    max_value DECIMAL,
    pattern VARCHAR(500), -- Regex pattern
    custom_validation JSONB, -- For complex validation rules
    
    -- Field configuration (reduced JSONB usage)
    default_value TEXT,
    field_config JSONB, -- For field-specific options that don't warrant separate tables
    display_logic JSONB, -- Conditional display rules
    
    -- References to option sets (instead of inline options)
    rating_scale_id UUID REFERENCES rating_scales(id) ON DELETE SET NULL,
    radio_option_set_id UUID REFERENCES radio_option_sets(id) ON DELETE SET NULL,
    multi_select_option_set_id UUID REFERENCES multi_select_option_sets(id) ON DELETE SET NULL,
    select_option_set_id UUID REFERENCES select_option_sets(id) ON DELETE SET NULL,
    
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Ensure unique field keys per section and ordering
    CONSTRAINT unique_field_key_per_section UNIQUE(section_id, field_key),
    CONSTRAINT unique_field_order_per_section UNIQUE(section_id, order_index),
    
    -- Ensure only one option set is referenced
    CONSTRAINT single_option_set_reference CHECK (
        (rating_scale_id IS NOT NULL)::integer +
        (radio_option_set_id IS NOT NULL)::integer +
        (multi_select_option_set_id IS NOT NULL)::integer +
        (select_option_set_id IS NOT NULL)::integer <= 1
    )
);

-- Survey field responses (normalized from survey_responses.responses JSONB)
CREATE TABLE IF NOT EXISTS survey_field_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    survey_response_id UUID NOT NULL REFERENCES survey_responses(id) ON DELETE CASCADE,
    field_id UUID NOT NULL REFERENCES survey_fields(id) ON DELETE CASCADE,
    field_key VARCHAR(255) NOT NULL, -- Denormalized for query performance
    
    -- Response value storage (multiple columns for type safety)
    text_value TEXT,
    numeric_value DECIMAL,
    boolean_value BOOLEAN,
    date_value TIMESTAMP WITH TIME ZONE,
    array_value JSONB, -- For multi-select responses
    
    -- Metadata about the response
    field_type VARCHAR(50) NOT NULL, -- Denormalized from survey_fields
    response_metadata JSONB DEFAULT '{}', -- Additional response-specific data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Ensure one response per field per survey response
    CONSTRAINT unique_field_response_per_survey UNIQUE(survey_response_id, field_id),
    
    -- Ensure only one value type is used per response
    CONSTRAINT single_value_type CHECK (
        (text_value IS NOT NULL)::integer +
        (numeric_value IS NOT NULL)::integer +
        (boolean_value IS NOT NULL)::integer +
        (date_value IS NOT NULL)::integer +
        (array_value IS NOT NULL)::integer = 1
    )
);

-- Survey templates (for reusable survey configurations)
CREATE TABLE IF NOT EXISTS survey_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100), -- e.g., 'employee_feedback', 'customer_satisfaction'
    is_public BOOLEAN DEFAULT false,
    template_config JSONB NOT NULL, -- Serialized survey configuration
    tags TEXT[], -- For searching and categorization
    usage_count INTEGER DEFAULT 0,
    created_by VARCHAR(255) DEFAULT 'system',
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Survey response summaries (enhanced for better performance on large datasets)
CREATE TABLE IF NOT EXISTS survey_response_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    survey_instance_id UUID NOT NULL REFERENCES survey_instances(id) ON DELETE CASCADE,
    date_bucket DATE NOT NULL, -- For daily/weekly/monthly aggregations
    
    -- Session and response metrics
    total_sessions INTEGER DEFAULT 0, -- Total sessions started
    total_completed_responses INTEGER DEFAULT 0, -- Completed responses only
    total_partial_responses INTEGER DEFAULT 0, -- Partial responses
    total_abandoned_sessions INTEGER DEFAULT 0, -- Abandoned sessions
    
    -- Calculated rates
    completion_rate DECIMAL(5,2), -- (completed_responses / total_sessions) * 100
    abandonment_rate DECIMAL(5,2), -- (abandoned_sessions / total_sessions) * 100
    
    -- Timing metrics
    average_completion_time_seconds INTEGER, -- Average completion time for completed surveys
    median_completion_time_seconds INTEGER, -- Median completion time
    min_completion_time_seconds INTEGER, -- Fastest completion
    max_completion_time_seconds INTEGER, -- Slowest completion
    
    -- Additional analytics
    average_completion_percentage DECIMAL(5,2), -- Average percentage completion across all responses
    field_statistics JSONB, -- Aggregated field-level stats
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    CONSTRAINT unique_summary_per_instance_date UNIQUE(survey_instance_id, date_bucket)
);

-- ===================================
-- AUDIT AND TRACKING TABLES
-- ===================================

-- Survey instance status changes (audit trail)
CREATE TABLE IF NOT EXISTS survey_instance_status_changes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instance_id UUID NOT NULL REFERENCES survey_instances(id) ON DELETE CASCADE,
    old_status BOOLEAN,
    new_status BOOLEAN NOT NULL,
    reason VARCHAR(100) NOT NULL, -- 'date_range_activation', 'date_range_deactivation', 'manual', 'created'
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    changed_by VARCHAR(255) DEFAULT 'system', -- 'system' or user email
    details JSONB DEFAULT '{}' -- Additional context like date range values
);

-- Enhanced audit trail for all entity changes
CREATE TABLE IF NOT EXISTS entity_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(100) NOT NULL, -- 'survey_config', 'survey_instance', etc.
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete', 'activate', 'deactivate'
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[], -- Array of field names that changed
    user_id VARCHAR(255) DEFAULT 'system',
    user_context JSONB, -- IP, user agent, etc.
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Migration status tracking
CREATE TABLE IF NOT EXISTS migration_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    migration_name VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL, -- 'pending', 'running', 'completed', 'failed'
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    migration_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ===================================
-- INDEXES FOR PERFORMANCE
-- ===================================

-- Legacy table indexes
CREATE INDEX IF NOT EXISTS idx_survey_configs_is_active ON survey_configs(is_active);
CREATE INDEX IF NOT EXISTS idx_survey_instances_config_id ON survey_instances(config_id);
CREATE INDEX IF NOT EXISTS idx_survey_instances_is_active ON survey_instances(is_active);
CREATE INDEX IF NOT EXISTS idx_survey_instances_config_valid ON survey_instances(config_valid);
CREATE INDEX IF NOT EXISTS idx_survey_instances_slug ON survey_instances(slug);
-- Survey Sessions indexes
CREATE INDEX IF NOT EXISTS idx_survey_sessions_survey_instance_id ON survey_sessions(survey_instance_id);
CREATE INDEX IF NOT EXISTS idx_survey_sessions_status ON survey_sessions(status);
CREATE INDEX IF NOT EXISTS idx_survey_sessions_started_at ON survey_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_survey_sessions_last_activity_at ON survey_sessions(last_activity_at);
CREATE INDEX IF NOT EXISTS idx_survey_sessions_session_token ON survey_sessions(session_token);

-- Survey Responses indexes (enhanced)
CREATE INDEX IF NOT EXISTS idx_survey_responses_survey_instance_id ON survey_responses(survey_instance_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_session_id ON survey_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_submitted_at ON survey_responses(submitted_at);
CREATE INDEX IF NOT EXISTS idx_survey_responses_started_at ON survey_responses(started_at);
CREATE INDEX IF NOT EXISTS idx_survey_responses_completed_at ON survey_responses(completed_at);
CREATE INDEX IF NOT EXISTS idx_survey_responses_completion_status ON survey_responses(completion_status);
CREATE INDEX IF NOT EXISTS idx_survey_responses_completion_time ON survey_responses(completion_time_seconds) WHERE completion_time_seconds IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_rating_scales_is_active ON rating_scales(is_active);
CREATE INDEX IF NOT EXISTS idx_radio_option_sets_is_active ON radio_option_sets(is_active);
CREATE INDEX IF NOT EXISTS idx_multi_select_option_sets_is_active ON multi_select_option_sets(is_active);
CREATE INDEX IF NOT EXISTS idx_select_option_sets_is_active ON select_option_sets(is_active);

-- Normalized schema indexes
CREATE INDEX IF NOT EXISTS idx_survey_sections_config_id ON survey_sections(survey_config_id);
CREATE INDEX IF NOT EXISTS idx_survey_sections_order ON survey_sections(survey_config_id, order_index);
CREATE INDEX IF NOT EXISTS idx_survey_sections_type ON survey_sections(section_type);

CREATE INDEX IF NOT EXISTS idx_survey_fields_section_id ON survey_fields(section_id);
CREATE INDEX IF NOT EXISTS idx_survey_fields_key ON survey_fields(field_key);
CREATE INDEX IF NOT EXISTS idx_survey_fields_type ON survey_fields(field_type);
CREATE INDEX IF NOT EXISTS idx_survey_fields_order ON survey_fields(section_id, order_index);
CREATE INDEX IF NOT EXISTS idx_survey_fields_option_sets ON survey_fields(rating_scale_id, radio_option_set_id, multi_select_option_set_id, select_option_set_id);

CREATE INDEX IF NOT EXISTS idx_field_responses_survey_id ON survey_field_responses(survey_response_id);
CREATE INDEX IF NOT EXISTS idx_field_responses_field_id ON survey_field_responses(field_id);
CREATE INDEX IF NOT EXISTS idx_field_responses_field_key ON survey_field_responses(field_key);
CREATE INDEX IF NOT EXISTS idx_field_responses_type ON survey_field_responses(field_type);
CREATE INDEX IF NOT EXISTS idx_field_responses_text_value ON survey_field_responses(text_value) WHERE text_value IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_field_responses_numeric_value ON survey_field_responses(numeric_value) WHERE numeric_value IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_survey_templates_category ON survey_templates(category);
CREATE INDEX IF NOT EXISTS idx_survey_templates_public ON survey_templates(is_public);
CREATE INDEX IF NOT EXISTS idx_survey_templates_tags ON survey_templates USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_response_summaries_instance_id ON survey_response_summaries(survey_instance_id);
CREATE INDEX IF NOT EXISTS idx_response_summaries_date ON survey_response_summaries(date_bucket);

-- Audit and tracking indexes
CREATE INDEX IF NOT EXISTS idx_survey_instance_status_changes_instance_id ON survey_instance_status_changes(instance_id);
CREATE INDEX IF NOT EXISTS idx_survey_instance_status_changes_changed_at ON survey_instance_status_changes(changed_at);
CREATE INDEX IF NOT EXISTS idx_entity_audit_log_entity ON entity_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_audit_log_timestamp ON entity_audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_entity_audit_log_user ON entity_audit_log(user_id);

-- ===================================
-- FUNCTIONS WITH SECURITY FIXES
-- ===================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql' SECURITY DEFINER SET search_path = public;

-- Survey instance status change logging
CREATE OR REPLACE FUNCTION log_survey_instance_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log if is_active actually changed
    IF (TG_OP = 'UPDATE' AND OLD.is_active IS DISTINCT FROM NEW.is_active) OR TG_OP = 'INSERT' THEN
        INSERT INTO survey_instance_status_changes (
            instance_id,
            old_status,
            new_status,
            reason,
            changed_by,
            details
        ) VALUES (
            NEW.id,
            CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE OLD.is_active END,
            NEW.is_active,
            CASE 
                WHEN TG_OP = 'INSERT' THEN 'created'
                WHEN NEW.config_valid = false AND NEW.is_active = false THEN 'config_validation_deactivation'
                WHEN NEW.is_active = true AND OLD.is_active = false THEN 'activation'
                WHEN NEW.is_active = false AND OLD.is_active = true THEN 'deactivation'
                ELSE 'status_change'
            END,
            'system', -- Will be overridden by application when manual
            jsonb_build_object(
                'active_date_range', NEW.active_date_range,
                'config_valid', NEW.config_valid,
                'trigger_operation', TG_OP
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to automatically update survey instance statuses based on date ranges
CREATE OR REPLACE FUNCTION update_survey_instance_statuses()
RETURNS json AS $$
DECLARE
    activated_count INTEGER := 0;
    deactivated_count INTEGER := 0;
    activation_record RECORD;
    deactivation_record RECORD;
BEGIN
    -- Update instances that should be activated 
    -- (currently inactive, within date range, AND config is valid)
    FOR activation_record IN
        SELECT id, title, active_date_range
        FROM survey_instances 
        WHERE 
            is_active = false 
            AND config_valid = true  -- Only activate if config is valid
            AND active_date_range IS NOT NULL
            AND NOW() >= (active_date_range->>'startDate')::timestamp
            AND NOW() <= (active_date_range->>'endDate')::timestamp
    LOOP
        UPDATE survey_instances 
        SET is_active = true
        WHERE id = activation_record.id;
        
        activated_count := activated_count + 1;
    END LOOP;
    
    -- Update instances that should be deactivated (currently active but outside date range)
    FOR deactivation_record IN
        SELECT id, title, active_date_range
        FROM survey_instances 
        WHERE 
            is_active = true 
            AND active_date_range IS NOT NULL
            AND (NOW() < (active_date_range->>'startDate')::timestamp
                 OR NOW() > (active_date_range->>'endDate')::timestamp)
    LOOP
        UPDATE survey_instances 
        SET is_active = false
        WHERE id = deactivation_record.id;
        
        deactivated_count := deactivated_count + 1;
    END LOOP;
    
    -- Return summary of changes
    RETURN json_build_object(
        'success', true,
        'activated', activated_count,
        'deactivated', deactivated_count,
        'timestamp', NOW(),
        'message', format('Processed %s activations and %s deactivations', activated_count, deactivated_count)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to get upcoming status changes
CREATE OR REPLACE FUNCTION get_upcoming_status_changes(hours_ahead INTEGER DEFAULT 24)
RETURNS json AS $$
DECLARE
    result json;
BEGIN
    WITH activations AS (
        SELECT id, title, slug, active_date_range
        FROM survey_instances 
        WHERE 
            is_active = false
            AND config_valid = true  -- Only consider valid configs for activation
            AND active_date_range IS NOT NULL
            AND (active_date_range->>'startDate')::timestamp 
                BETWEEN NOW() AND NOW() + (hours_ahead || ' hours')::interval
    ),
    deactivations AS (
        SELECT id, title, slug, active_date_range
        FROM survey_instances 
        WHERE 
            is_active = true
            AND active_date_range IS NOT NULL
            AND (active_date_range->>'endDate')::timestamp 
                BETWEEN NOW() AND NOW() + (hours_ahead || ' hours')::interval
    )
    SELECT json_build_object(
        'upcoming_activations', (SELECT json_agg(row_to_json(activations)) FROM activations),
        'upcoming_deactivations', (SELECT json_agg(row_to_json(deactivations)) FROM deactivations),
        'check_time', NOW(),
        'hours_ahead', hours_ahead
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to migrate existing JSONB sections to normalized tables
CREATE OR REPLACE FUNCTION migrate_survey_sections_to_normalized()
RETURNS json AS $$
DECLARE
    config_record RECORD;
    section_record RECORD;
    field_record RECORD;
    section_id UUID;
    migrated_configs INTEGER := 0;
    migrated_sections INTEGER := 0;
    migrated_fields INTEGER := 0;
BEGIN
    -- Loop through all survey configs that haven't been migrated yet
    FOR config_record IN
        SELECT id, title, sections
        FROM survey_configs 
        WHERE sections IS NOT NULL 
        AND NOT EXISTS (
            SELECT 1 FROM survey_sections WHERE survey_config_id = survey_configs.id
        )
    LOOP
        -- Loop through sections in the JSONB
        FOR section_record IN
            SELECT * FROM jsonb_array_elements(config_record.sections) WITH ORDINALITY AS t(section, order_index)
        LOOP
            -- Insert section
            INSERT INTO survey_sections (
                survey_config_id,
                title,
                description,
                section_type,
                order_index,
                metadata
            ) VALUES (
                config_record.id,
                COALESCE(section_record.section->>'title', 'Untitled Section'),
                section_record.section->>'description',
                section_record.section->>'type',
                section_record.order_index - 1, -- Convert to 0-based indexing
                COALESCE(section_record.section->'metadata', '{}')
            ) RETURNING id INTO section_id;
            
            migrated_sections := migrated_sections + 1;
            
            -- Loop through fields in the section
            IF section_record.section ? 'fields' THEN
                FOR field_record IN
                    SELECT * FROM jsonb_array_elements(section_record.section->'fields') WITH ORDINALITY AS f(field, field_order)
                LOOP
                    -- Insert field
                    INSERT INTO survey_fields (
                        section_id,
                        field_key,
                        label,
                        field_type,
                        description,
                        placeholder,
                        order_index,
                        is_required,
                        field_config,
                        metadata
                    ) VALUES (
                        section_id,
                        COALESCE(field_record.field->>'key', 'field_' || field_record.field_order),
                        COALESCE(field_record.field->>'label', 'Untitled Field'),
                        COALESCE(field_record.field->>'type', 'text'),
                        field_record.field->>'description',
                        field_record.field->>'placeholder',
                        field_record.field_order - 1, -- Convert to 0-based indexing
                        COALESCE((field_record.field->>'required')::boolean, false),
                        COALESCE(field_record.field->'config', '{}'),
                        COALESCE(field_record.field->'metadata', '{}')
                    );
                    
                    migrated_fields := migrated_fields + 1;
                END LOOP;
            END IF;
        END LOOP;
        
        migrated_configs := migrated_configs + 1;
    END LOOP;
    
    RETURN json_build_object(
        'success', true,
        'migrated_configs', migrated_configs,
        'migrated_sections', migrated_sections,
        'migrated_fields', migrated_fields,
        'timestamp', NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to migrate survey responses to normalized field responses
CREATE OR REPLACE FUNCTION migrate_survey_responses_to_normalized()
RETURNS json AS $$
DECLARE
    response_record RECORD;
    field_record RECORD;
    migrated_responses INTEGER := 0;
    migrated_field_responses INTEGER := 0;
    response_key TEXT;
    response_value JSONB;
BEGIN
    -- Loop through all survey responses that haven't been migrated yet
    FOR response_record IN
        SELECT id, responses
        FROM survey_responses 
        WHERE responses IS NOT NULL 
        AND NOT EXISTS (
            SELECT 1 FROM survey_field_responses WHERE survey_response_id = survey_responses.id
        )
    LOOP
        -- Loop through response key-value pairs
        FOR response_key, response_value IN
            SELECT * FROM jsonb_each(response_record.responses)
        LOOP
            -- Find corresponding field (if it exists in normalized structure)
            SELECT id, field_type INTO field_record
            FROM survey_fields 
            WHERE field_key = response_key
            LIMIT 1;
            
            IF FOUND THEN
                -- Insert normalized field response
                INSERT INTO survey_field_responses (
                    survey_response_id,
                    field_id,
                    field_key,
                    field_type,
                    text_value,
                    numeric_value,
                    boolean_value,
                    array_value
                ) VALUES (
                    response_record.id,
                    field_record.id,
                    response_key,
                    field_record.field_type,
                    CASE WHEN jsonb_typeof(response_value) = 'string' THEN response_value #>> '{}' ELSE NULL END,
                    CASE WHEN jsonb_typeof(response_value) = 'number' THEN (response_value #>> '{}')::DECIMAL ELSE NULL END,
                    CASE WHEN jsonb_typeof(response_value) = 'boolean' THEN (response_value #>> '{}')::BOOLEAN ELSE NULL END,
                    CASE WHEN jsonb_typeof(response_value) = 'array' THEN response_value ELSE NULL END
                );
                
                migrated_field_responses := migrated_field_responses + 1;
            END IF;
        END LOOP;
        
        migrated_responses := migrated_responses + 1;
    END LOOP;
    
    RETURN json_build_object(
        'success', true,
        'migrated_responses', migrated_responses,
        'migrated_field_responses', migrated_field_responses,
        'timestamp', NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to calculate completion time on survey response insert/update
CREATE OR REPLACE FUNCTION calculate_survey_completion_time()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate completion time if both started_at and completed_at are present
    IF NEW.started_at IS NOT NULL AND NEW.completed_at IS NOT NULL THEN
        NEW.completion_time_seconds = EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at))::INTEGER;
    END IF;
    
    -- Update session status if session_id is present
    IF NEW.session_id IS NOT NULL THEN
        UPDATE survey_sessions 
        SET 
            status = CASE 
                WHEN NEW.completion_status = 'completed' THEN 'completed'
                WHEN NEW.completion_status = 'partial' THEN 'in_progress'
                ELSE status
            END,
            last_activity_at = now(),
            updated_at = now()
        WHERE id = NEW.session_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to automatically mark abandoned sessions
CREATE OR REPLACE FUNCTION mark_abandoned_sessions()
RETURNS json AS $$
DECLARE
    abandoned_count INTEGER := 0;
    session_record RECORD;
BEGIN
    -- Mark sessions as abandoned if no activity for more than 24 hours
    -- and they're not already completed
    FOR session_record IN
        SELECT id, survey_instance_id, started_at
        FROM survey_sessions 
        WHERE 
            status IN ('started', 'in_progress')
            AND last_activity_at < (NOW() - INTERVAL '24 hours')
    LOOP
        UPDATE survey_sessions 
        SET 
            status = 'abandoned',
            updated_at = now()
        WHERE id = session_record.id;
        
        abandoned_count := abandoned_count + 1;
    END LOOP;
    
    RETURN json_build_object(
        'success', true,
        'abandoned_sessions', abandoned_count,
        'timestamp', NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to generate daily analytics summaries
CREATE OR REPLACE FUNCTION generate_daily_analytics_summary(target_date DATE DEFAULT CURRENT_DATE)
RETURNS json AS $$
DECLARE
    instance_record RECORD;
    summary_record RECORD;
    updated_summaries INTEGER := 0;
BEGIN
    -- Loop through each survey instance
    FOR instance_record IN
        SELECT DISTINCT survey_instance_id
        FROM survey_sessions
        WHERE DATE(started_at) = target_date
    LOOP
        -- Calculate metrics for this instance and date
        SELECT 
            COUNT(*) as total_sessions,
            COUNT(CASE WHEN ss.status = 'completed' THEN 1 END) as completed_sessions,
            COUNT(CASE WHEN ss.status = 'abandoned' THEN 1 END) as abandoned_sessions,
            COUNT(CASE WHEN sr.completion_status = 'completed' THEN 1 END) as completed_responses,
            COUNT(CASE WHEN sr.completion_status = 'partial' THEN 1 END) as partial_responses,
            ROUND(AVG(CASE WHEN sr.completion_time_seconds IS NOT NULL THEN sr.completion_time_seconds END)) as avg_completion_time,
            PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY sr.completion_time_seconds) as median_completion_time,
            MIN(sr.completion_time_seconds) as min_completion_time,
            MAX(sr.completion_time_seconds) as max_completion_time,
            ROUND(AVG(sr.completion_percentage), 2) as avg_completion_percentage
        INTO summary_record
        FROM survey_sessions ss
        LEFT JOIN survey_responses sr ON ss.id = sr.session_id
        WHERE 
            ss.survey_instance_id = instance_record.survey_instance_id
            AND DATE(ss.started_at) = target_date;
        
        -- Insert or update the summary
        INSERT INTO survey_response_summaries (
            survey_instance_id,
            date_bucket,
            total_sessions,
            total_completed_responses,
            total_partial_responses,
            total_abandoned_sessions,
            completion_rate,
            abandonment_rate,
            average_completion_time_seconds,
            median_completion_time_seconds,
            min_completion_time_seconds,
            max_completion_time_seconds,
            average_completion_percentage
        ) VALUES (
            instance_record.survey_instance_id,
            target_date,
            summary_record.total_sessions,
            summary_record.completed_responses,
            summary_record.partial_responses,
            summary_record.abandoned_sessions,
            CASE WHEN summary_record.total_sessions > 0 
                 THEN ROUND((summary_record.completed_responses::DECIMAL / summary_record.total_sessions) * 100, 2)
                 ELSE 0 END,
            CASE WHEN summary_record.total_sessions > 0 
                 THEN ROUND((summary_record.abandoned_sessions::DECIMAL / summary_record.total_sessions) * 100, 2)
                 ELSE 0 END,
            summary_record.avg_completion_time,
            summary_record.median_completion_time,
            summary_record.min_completion_time,
            summary_record.max_completion_time,
            summary_record.avg_completion_percentage
        ) ON CONFLICT (survey_instance_id, date_bucket) 
        DO UPDATE SET
            total_sessions = EXCLUDED.total_sessions,
            total_completed_responses = EXCLUDED.total_completed_responses,
            total_partial_responses = EXCLUDED.total_partial_responses,
            total_abandoned_sessions = EXCLUDED.total_abandoned_sessions,
            completion_rate = EXCLUDED.completion_rate,
            abandonment_rate = EXCLUDED.abandonment_rate,
            average_completion_time_seconds = EXCLUDED.average_completion_time_seconds,
            median_completion_time_seconds = EXCLUDED.median_completion_time_seconds,
            min_completion_time_seconds = EXCLUDED.min_completion_time_seconds,
            max_completion_time_seconds = EXCLUDED.max_completion_time_seconds,
            average_completion_percentage = EXCLUDED.average_completion_percentage,
            updated_at = now();
        
        updated_summaries := updated_summaries + 1;
    END LOOP;
    
    RETURN json_build_object(
        'success', true,
        'date', target_date,
        'updated_summaries', updated_summaries,
        'timestamp', NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Helper functions for RLS with security fixes
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  -- All authenticated users are admins for now
  -- In production, check user roles from auth.users metadata
  RETURN auth.uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION is_anonymous()
RETURNS boolean AS $$
BEGIN
  RETURN auth.uid() IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION current_user_email()
RETURNS text AS $$
BEGIN
  RETURN COALESCE(
    auth.jwt() ->> 'email',
    'anonymous@example.com'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION is_survey_public(instance_id UUID)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM survey_instances 
    WHERE id = instance_id 
    AND is_active = true
    AND (
      active_date_range IS NULL 
      OR (
        NOW() >= (active_date_range->>'startDate')::timestamptz
        AND NOW() <= (active_date_range->>'endDate')::timestamptz
      )
    )
  );
EXCEPTION
  WHEN OTHERS THEN
    -- If there's any error parsing dates, assume survey is public if it's active
    RETURN EXISTS (
      SELECT 1 FROM survey_instances 
      WHERE id = instance_id 
      AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ===================================
-- TRIGGERS
-- ===================================

-- Add updated_at triggers for legacy tables
DROP TRIGGER IF EXISTS update_survey_configs_updated_at ON survey_configs;
CREATE TRIGGER update_survey_configs_updated_at 
    BEFORE UPDATE ON survey_configs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_survey_instances_updated_at ON survey_instances;
CREATE TRIGGER update_survey_instances_updated_at 
    BEFORE UPDATE ON survey_instances 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rating_scales_updated_at ON rating_scales;
CREATE TRIGGER update_rating_scales_updated_at 
    BEFORE UPDATE ON rating_scales 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_radio_option_sets_updated_at ON radio_option_sets;
CREATE TRIGGER update_radio_option_sets_updated_at 
    BEFORE UPDATE ON radio_option_sets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_multi_select_option_sets_updated_at ON multi_select_option_sets;
CREATE TRIGGER update_multi_select_option_sets_updated_at 
    BEFORE UPDATE ON multi_select_option_sets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_select_option_sets_updated_at ON select_option_sets;
CREATE TRIGGER update_select_option_sets_updated_at 
    BEFORE UPDATE ON select_option_sets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add updated_at triggers for normalized tables
DROP TRIGGER IF EXISTS update_survey_sections_updated_at ON survey_sections;
CREATE TRIGGER update_survey_sections_updated_at 
    BEFORE UPDATE ON survey_sections 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_survey_fields_updated_at ON survey_fields;
CREATE TRIGGER update_survey_fields_updated_at 
    BEFORE UPDATE ON survey_fields 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_survey_templates_updated_at ON survey_templates;
CREATE TRIGGER update_survey_templates_updated_at 
    BEFORE UPDATE ON survey_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_response_summaries_updated_at ON survey_response_summaries;
CREATE TRIGGER update_response_summaries_updated_at 
    BEFORE UPDATE ON survey_response_summaries 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add updated_at trigger for survey_sessions
DROP TRIGGER IF EXISTS update_survey_sessions_updated_at ON survey_sessions;
CREATE TRIGGER update_survey_sessions_updated_at 
    BEFORE UPDATE ON survey_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Survey response completion time calculation trigger
DROP TRIGGER IF EXISTS calculate_completion_time_trigger ON survey_responses;
CREATE TRIGGER calculate_completion_time_trigger
    BEFORE INSERT OR UPDATE ON survey_responses
    FOR EACH ROW EXECUTE FUNCTION calculate_survey_completion_time();

-- Status change audit trigger
DROP TRIGGER IF EXISTS survey_instance_status_change_audit ON survey_instances;
CREATE TRIGGER survey_instance_status_change_audit
    AFTER INSERT OR UPDATE ON survey_instances
    FOR EACH ROW EXECUTE FUNCTION log_survey_instance_status_change();

-- ===================================
-- INITIAL DATA SETUP
-- ===================================
/*
-- Insert initial migration status records
INSERT INTO migration_status (migration_name, status) VALUES 
    ('sections_to_normalized', 'pending'),
    ('responses_to_normalized', 'pending'),
    ('generate_summaries', 'pending')
ON CONFLICT (migration_name) DO NOTHING;

-- Insert sample option sets for development
INSERT INTO rating_scales (name, description, options) VALUES 
(
    'Satisfaction Scale', 
    'Standard 1-5 satisfaction rating scale',
    '[
        {"value": "1", "label": "Very Dissatisfied", "color": "error", "isDefault": false, "order": 0},
        {"value": "2", "label": "Dissatisfied", "color": "orange", "isDefault": false, "order": 1},
        {"value": "3", "label": "Neutral", "color": "warning", "isDefault": true, "order": 2},
        {"value": "4", "label": "Satisfied", "color": "success", "isDefault": false, "order": 3},
        {"value": "5", "label": "Very Satisfied", "color": "green-dark", "isDefault": false, "order": 4}
    ]'::jsonb
) ON CONFLICT DO NOTHING;

INSERT INTO radio_option_sets (name, description, options) VALUES 
(
    'Yes/No/Maybe', 
    'Simple yes/no/maybe options',
    '[
        {"value": "yes", "label": "Yes", "color": "success", "isDefault": false, "order": 0},
        {"value": "no", "label": "No", "color": "error", "isDefault": false, "order": 1},
        {"value": "maybe", "label": "Maybe", "color": "warning", "isDefault": true, "order": 2}
    ]'::jsonb
) ON CONFLICT DO NOTHING;

INSERT INTO multi_select_option_sets (name, description, options, min_selections, max_selections) VALUES 
(
    'Services Offered', 
    'Multiple services selection',
    '[
        {"value": "consulting", "label": "Consulting", "color": "primary", "isDefault": false, "order": 0},
        {"value": "development", "label": "Development", "color": "success", "isDefault": false, "order": 1},
        {"value": "design", "label": "Design", "color": "info", "isDefault": false, "order": 2},
        {"value": "marketing", "label": "Marketing", "color": "warning", "isDefault": false, "order": 3},
        {"value": "support", "label": "Support", "color": "secondary", "isDefault": false, "order": 4}
    ]'::jsonb,
    1,
    3
) ON CONFLICT DO NOTHING;
*/
-- ===================================
-- ROW LEVEL SECURITY SETUP
-- ===================================

-- Enable RLS on all tables
ALTER TABLE survey_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_field_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_response_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE rating_scales ENABLE ROW LEVEL SECURITY;
ALTER TABLE radio_option_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE multi_select_option_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE select_option_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_instance_status_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE migration_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;

-- Survey Configs - Admin full access, Anonymous read active
CREATE POLICY "survey_configs_admin_all" ON survey_configs
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "survey_configs_anonymous_read" ON survey_configs
  FOR SELECT TO anon
  USING (is_active = true);

-- Survey Instances - Admin full access, Anonymous read active
CREATE POLICY "survey_instances_admin_all" ON survey_instances
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "survey_instances_anonymous_read" ON survey_instances
  FOR SELECT TO anon
  USING (
    is_active = true
    AND (
      active_date_range IS NULL 
      OR (
        NOW() >= (active_date_range->>'startDate')::timestamp
        AND NOW() <= (active_date_range->>'endDate')::timestamp
      )
    )
  );

-- Survey Sessions - Admin read/update, Anonymous insert/update for public surveys
CREATE POLICY "survey_sessions_admin_all" ON survey_sessions
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "survey_sessions_anonymous_insert" ON survey_sessions
  FOR INSERT TO anon
  WITH CHECK (is_survey_public(survey_instance_id));

CREATE POLICY "survey_sessions_anonymous_update" ON survey_sessions
  FOR UPDATE TO anon
  USING (is_survey_public(survey_instance_id))
  WITH CHECK (is_survey_public(survey_instance_id));

-- Survey Responses - Admin read/update, Anonymous insert for public surveys
CREATE POLICY "survey_responses_admin_read_update" ON survey_responses
  FOR SELECT TO authenticated
  USING (is_admin());

CREATE POLICY "survey_responses_admin_update" ON survey_responses
  FOR UPDATE TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "survey_responses_anonymous_insert" ON survey_responses
  FOR INSERT TO anon
  WITH CHECK (is_survey_public(survey_instance_id));

-- Survey Sections - Follow config permissions
CREATE POLICY "survey_sections_admin_all" ON survey_sections
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "survey_sections_anonymous_read" ON survey_sections
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM survey_configs 
      WHERE id = survey_sections.survey_config_id 
      AND is_active = true
    )
  );

-- Survey Fields - Follow section permissions
CREATE POLICY "survey_fields_admin_all" ON survey_fields
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "survey_fields_anonymous_read" ON survey_fields
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM survey_sections s
      JOIN survey_configs c ON s.survey_config_id = c.id
      WHERE s.id = survey_fields.section_id 
      AND c.is_active = true
    )
  );

-- Survey Field Responses - Admin read, Anonymous insert for public surveys
CREATE POLICY "survey_field_responses_admin_read" ON survey_field_responses
  FOR SELECT TO authenticated
  USING (is_admin());

CREATE POLICY "survey_field_responses_anonymous_insert" ON survey_field_responses
  FOR INSERT TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM survey_responses sr
      WHERE sr.id = survey_field_responses.survey_response_id
      AND is_survey_public(sr.survey_instance_id)
    )
  );

-- Option Sets - Admin full access, Anonymous read active
CREATE POLICY "rating_scales_admin_all" ON rating_scales
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "rating_scales_anonymous_read" ON rating_scales
  FOR SELECT TO anon
  USING (is_active = true);

CREATE POLICY "radio_option_sets_admin_all" ON radio_option_sets
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "radio_option_sets_anonymous_read" ON radio_option_sets
  FOR SELECT TO anon
  USING (is_active = true);

CREATE POLICY "multi_select_option_sets_admin_all" ON multi_select_option_sets
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "multi_select_option_sets_anonymous_read" ON multi_select_option_sets
  FOR SELECT TO anon
  USING (is_active = true);

CREATE POLICY "select_option_sets_admin_all" ON select_option_sets
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "select_option_sets_anonymous_read" ON select_option_sets
  FOR SELECT TO anon
  USING (is_active = true);

-- Survey Templates - Admin full access, Anonymous read public
CREATE POLICY "survey_templates_admin_all" ON survey_templates
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "survey_templates_anonymous_read" ON survey_templates
  FOR SELECT TO anon
  USING (is_public = true);

-- Analytics and Audit - Admin only
CREATE POLICY "survey_response_summaries_admin_only" ON survey_response_summaries
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "survey_instance_status_changes_admin_read" ON survey_instance_status_changes
  FOR SELECT TO authenticated
  USING (is_admin());

CREATE POLICY "survey_instance_status_changes_system_insert" ON survey_instance_status_changes
  FOR INSERT TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "entity_audit_log_admin_only" ON entity_audit_log
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "migration_status_admin_only" ON migration_status
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Legacy Surveys - Anonymous insert, Admin read
CREATE POLICY "surveys_anonymous_insert" ON surveys
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "surveys_admin_read" ON surveys
  FOR SELECT TO authenticated
  USING (is_admin());

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Anonymous user permissions
GRANT SELECT ON survey_configs TO anon;
GRANT SELECT ON survey_instances TO anon;
GRANT INSERT, UPDATE ON survey_sessions TO anon;
GRANT INSERT ON survey_responses TO anon;
GRANT SELECT ON survey_sections TO anon;
GRANT SELECT ON survey_fields TO anon;
GRANT INSERT ON survey_field_responses TO anon;
GRANT SELECT ON survey_templates TO anon;
GRANT SELECT ON rating_scales TO anon;
GRANT SELECT ON radio_option_sets TO anon;
GRANT SELECT ON multi_select_option_sets TO anon;
GRANT SELECT ON select_option_sets TO anon;
GRANT INSERT ON surveys TO anon;
GRANT EXECUTE ON FUNCTION is_survey_public(UUID) TO anon;

-- ===================================
-- ENABLE REALTIME
-- ===================================

-- Enable realtime for tables that need live updates
ALTER PUBLICATION supabase_realtime ADD TABLE survey_configs;
ALTER PUBLICATION supabase_realtime ADD TABLE survey_instances;
ALTER PUBLICATION supabase_realtime ADD TABLE survey_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE survey_responses;
ALTER PUBLICATION supabase_realtime ADD TABLE survey_instance_status_changes;