-- Supabase Database Schema Setup Script
-- Run this in your Supabase SQL Editor to set up all required tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create survey_configs table
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
    active_date_range JSONB,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create survey_responses table
CREATE TABLE IF NOT EXISTS survey_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    survey_instance_id UUID NOT NULL REFERENCES survey_instances(id) ON DELETE CASCADE,
    config_version VARCHAR(50) DEFAULT '1.0.0',
    responses JSONB NOT NULL DEFAULT '{}',
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create rating_scales table
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

-- Create radio_option_sets table
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

-- Create multi_select_option_sets table
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

-- Create select_option_sets table
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

-- Create survey_instance_status_changes table (audit trail)
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_survey_configs_is_active ON survey_configs(is_active);
CREATE INDEX IF NOT EXISTS idx_survey_instances_config_id ON survey_instances(config_id);
CREATE INDEX IF NOT EXISTS idx_survey_instances_is_active ON survey_instances(is_active);
CREATE INDEX IF NOT EXISTS idx_survey_responses_survey_instance_id ON survey_responses(survey_instance_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_submitted_at ON survey_responses(submitted_at);
CREATE INDEX IF NOT EXISTS idx_rating_scales_is_active ON rating_scales(is_active);
CREATE INDEX IF NOT EXISTS idx_radio_option_sets_is_active ON radio_option_sets(is_active);
CREATE INDEX IF NOT EXISTS idx_multi_select_option_sets_is_active ON multi_select_option_sets(is_active);
CREATE INDEX IF NOT EXISTS idx_select_option_sets_is_active ON select_option_sets(is_active);
CREATE INDEX IF NOT EXISTS idx_survey_instance_status_changes_instance_id ON survey_instance_status_changes(instance_id);
CREATE INDEX IF NOT EXISTS idx_survey_instance_status_changes_changed_at ON survey_instance_status_changes(changed_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
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

-- Function to log survey instance status changes
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
                WHEN NEW.is_active = true AND OLD.is_active = false THEN 'activation'
                WHEN NEW.is_active = false AND OLD.is_active = true THEN 'deactivation'
                ELSE 'status_change'
            END,
            'system', -- Will be overridden by application when manual
            jsonb_build_object(
                'active_date_range', NEW.active_date_range,
                'trigger_operation', TG_OP
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for survey instance status changes
DROP TRIGGER IF EXISTS survey_instance_status_change_audit ON survey_instances;
CREATE TRIGGER survey_instance_status_change_audit
    AFTER INSERT OR UPDATE ON survey_instances
    FOR EACH ROW EXECUTE FUNCTION log_survey_instance_status_change();

-- Function to automatically update survey instance statuses based on date ranges
CREATE OR REPLACE FUNCTION update_survey_instance_statuses()
RETURNS json AS $$
DECLARE
    activated_count INTEGER := 0;
    deactivated_count INTEGER := 0;
    activation_record RECORD;
    deactivation_record RECORD;
BEGIN
    -- Update instances that should be activated (currently inactive but within date range)
    FOR activation_record IN
        SELECT id, title, active_date_range
        FROM survey_instances 
        WHERE 
            is_active = false 
            AND active_date_range IS NOT NULL
            AND NOW() >= (active_date_range->>'startDate')::timestamp
            AND NOW() <= (active_date_range->>'endDate')::timestamp
    LOOP
        UPDATE survey_instances 
        SET is_active = true
        WHERE id = activation_record.id;
        
        -- Log the activation with specific reason
        INSERT INTO survey_instance_status_changes (
            instance_id,
            old_status,
            new_status,
            reason,
            changed_by,
            details
        ) VALUES (
            activation_record.id,
            false,
            true,
            'date_range_activation',
            'system',
            jsonb_build_object(
                'active_date_range', activation_record.active_date_range,
                'auto_activated_at', NOW()
            )
        );
        
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
        
        -- Log the deactivation with specific reason
        INSERT INTO survey_instance_status_changes (
            instance_id,
            old_status,
            new_status,
            reason,
            changed_by,
            details
        ) VALUES (
            deactivation_record.id,
            true,
            false,
            'date_range_deactivation',
            'system',
            jsonb_build_object(
                'active_date_range', deactivation_record.active_date_range,
                'auto_deactivated_at', NOW()
            )
        );
        
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get upcoming status changes (for future email notifications)
CREATE OR REPLACE FUNCTION get_upcoming_status_changes(hours_ahead INTEGER DEFAULT 24)
RETURNS json AS $$
DECLARE
    upcoming_activations RECORD;
    upcoming_deactivations RECORD;
    result json;
BEGIN
    WITH activations AS (
        SELECT id, title, slug, active_date_range
        FROM survey_instances 
        WHERE 
            is_active = false
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert some sample data for testing (optional)
/* INSERT INTO rating_scales (name, description, options) VALUES 
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
) ON CONFLICT DO NOTHING; */

-- Print completion message
DO $$
BEGIN
    RAISE NOTICE 'Supabase database schema setup completed successfully!';
    RAISE NOTICE 'You can now use the survey application with this database.';
END $$;