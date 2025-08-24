-- Initial Optimized Schema Migration
-- This migration sets up the complete optimized survey database schema
-- Including legacy compatibility, RLS policies, and security fixes

-- ===================================
-- EXTENSIONS
-- ===================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===================================
-- CORE TABLES (actively used)
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

-- ===================================
-- INDEXES FOR PERFORMANCE
-- ===================================

-- Core table indexes
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

-- Audit and tracking indexes
CREATE INDEX IF NOT EXISTS idx_survey_instance_status_changes_instance_id ON survey_instance_status_changes(instance_id);
CREATE INDEX IF NOT EXISTS idx_survey_instance_status_changes_changed_at ON survey_instance_status_changes(changed_at);

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

-- Add updated_at triggers for core tables
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
-- ROW LEVEL SECURITY SETUP
-- ===================================

-- Enable RLS on all tables
ALTER TABLE survey_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE rating_scales ENABLE ROW LEVEL SECURITY;
ALTER TABLE radio_option_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE multi_select_option_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE select_option_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_instance_status_changes ENABLE ROW LEVEL SECURITY;

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

-- Analytics and Audit - Admin only
CREATE POLICY "survey_instance_status_changes_admin_read" ON survey_instance_status_changes
  FOR SELECT TO authenticated
  USING (is_admin());

CREATE POLICY "survey_instance_status_changes_system_insert" ON survey_instance_status_changes
  FOR INSERT TO authenticated
  WITH CHECK (is_admin());


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
GRANT SELECT ON rating_scales TO anon;
GRANT SELECT ON radio_option_sets TO anon;
GRANT SELECT ON multi_select_option_sets TO anon;
GRANT SELECT ON select_option_sets TO anon;
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