-- Error Logging System Migration
-- Creates a comprehensive error logging system for the application
-- This migration adds error logging table with proper indexing, RLS, and functions

-- ===================================
-- ERROR LOGS TABLE
-- ===================================

-- Main error logs table
CREATE TABLE IF NOT EXISTS error_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Timestamp and basic info
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    
    -- Error details
    error_message TEXT NOT NULL,
    error_code VARCHAR(100), -- Application-specific error codes
    stack_trace TEXT, -- Full stack trace if available
    
    -- Context information
    component_name VARCHAR(255), -- React component name
    file_path VARCHAR(500), -- File where error occurred
    line_number INTEGER, -- Line number where error occurred
    function_name VARCHAR(255), -- Function where error occurred
    user_action TEXT, -- What the user was doing when error occurred
    
    -- User and session context
    user_id UUID, -- Authenticated user ID (if available)
    user_email VARCHAR(255), -- User email (if available)
    session_token VARCHAR(255), -- Survey session token (if applicable)
    survey_instance_id UUID REFERENCES survey_instances(id) ON DELETE SET NULL, -- Related survey (if applicable)
    
    -- System information
    user_agent TEXT, -- Browser user agent
    ip_address INET, -- User IP address
    url TEXT, -- URL where error occurred
    http_method VARCHAR(10), -- HTTP method if API error
    
    -- Browser/Client info
    browser_info JSONB DEFAULT '{}', -- Detailed browser information
    screen_resolution VARCHAR(50), -- Screen resolution
    viewport_size VARCHAR(50), -- Viewport dimensions
    
    -- Error metadata
    error_boundary BOOLEAN DEFAULT false, -- Was this caught by React Error Boundary?
    is_handled BOOLEAN DEFAULT false, -- Was this a handled error or unhandled?
    error_hash VARCHAR(64), -- Hash of error for deduplication
    occurrence_count INTEGER DEFAULT 1, -- How many times this error occurred
    
    -- Resolution tracking
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'ignored')),
    assigned_to VARCHAR(255), -- Who is investigating this error
    resolution_notes TEXT, -- Notes about the resolution
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by VARCHAR(255),
    
    -- Additional context
    additional_context JSONB DEFAULT '{}', -- Any other relevant data
    tags TEXT[], -- Tags for categorizing errors
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================
-- INDEXES FOR PERFORMANCE
-- ===================================

-- Primary query indexes
CREATE INDEX IF NOT EXISTS idx_error_logs_occurred_at ON error_logs(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_status ON error_logs(status);
CREATE INDEX IF NOT EXISTS idx_error_logs_component ON error_logs(component_name);
CREATE INDEX IF NOT EXISTS idx_error_logs_error_code ON error_logs(error_code) WHERE error_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_error_logs_error_hash ON error_logs(error_hash) WHERE error_hash IS NOT NULL;

-- User and session context indexes  
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_error_logs_user_email ON error_logs(user_email) WHERE user_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_error_logs_session_token ON error_logs(session_token) WHERE session_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_error_logs_survey_instance ON error_logs(survey_instance_id) WHERE survey_instance_id IS NOT NULL;

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_error_logs_severity_status ON error_logs(severity, status, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_component_occurred ON error_logs(component_name, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_unresolved ON error_logs(status, occurred_at DESC) WHERE status IN ('open', 'investigating');

-- Full text search index for error messages
CREATE INDEX IF NOT EXISTS idx_error_logs_message_search ON error_logs USING gin(to_tsvector('english', error_message));
CREATE INDEX IF NOT EXISTS idx_error_logs_tags ON error_logs USING gin(tags) WHERE tags IS NOT NULL;

-- ===================================
-- FUNCTIONS
-- ===================================

-- Function to log errors (can be called from application or functions)
CREATE OR REPLACE FUNCTION log_error(
    p_severity VARCHAR(20),
    p_error_message TEXT,
    p_error_code VARCHAR(100) DEFAULT NULL,
    p_stack_trace TEXT DEFAULT NULL,
    p_component_name VARCHAR(255) DEFAULT NULL,
    p_file_path VARCHAR(500) DEFAULT NULL,
    p_line_number INTEGER DEFAULT NULL,
    p_function_name VARCHAR(255) DEFAULT NULL,
    p_user_action TEXT DEFAULT NULL,
    p_user_id UUID DEFAULT NULL,
    p_user_email VARCHAR(255) DEFAULT NULL,
    p_session_token VARCHAR(255) DEFAULT NULL,
    p_survey_instance_id UUID DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_url TEXT DEFAULT NULL,
    p_http_method VARCHAR(10) DEFAULT NULL,
    p_browser_info JSONB DEFAULT NULL,
    p_screen_resolution VARCHAR(50) DEFAULT NULL,
    p_viewport_size VARCHAR(50) DEFAULT NULL,
    p_error_boundary BOOLEAN DEFAULT false,
    p_is_handled BOOLEAN DEFAULT false,
    p_additional_context JSONB DEFAULT NULL,
    p_tags TEXT[] DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_error_hash VARCHAR(64);
    v_log_id UUID;
    v_existing_count INTEGER;
BEGIN
    -- Generate error hash for deduplication (based on message, component, file, line)
    v_error_hash := encode(
        digest(
            CONCAT(
                COALESCE(p_error_message, ''),
                '|',
                COALESCE(p_component_name, ''),
                '|', 
                COALESCE(p_file_path, ''),
                '|',
                COALESCE(p_line_number::text, '')
            ), 'sha256'
        ), 'hex'
    );
    
    -- Check if this error has occurred recently (within last hour)
    SELECT COUNT(*), MAX(id) INTO v_existing_count, v_log_id
    FROM error_logs 
    WHERE error_hash = v_error_hash 
    AND occurred_at > NOW() - INTERVAL '1 hour';
    
    IF v_existing_count > 0 THEN
        -- Update existing error with incremented count
        UPDATE error_logs 
        SET 
            occurrence_count = occurrence_count + 1,
            occurred_at = NOW(),
            updated_at = NOW(),
            -- Update context if provided
            additional_context = CASE 
                WHEN p_additional_context IS NOT NULL THEN 
                    COALESCE(additional_context, '{}'::jsonb) || p_additional_context
                ELSE additional_context
            END
        WHERE id = v_log_id;
        
        RETURN v_log_id;
    ELSE
        -- Insert new error log
        INSERT INTO error_logs (
            severity, error_message, error_code, stack_trace,
            component_name, file_path, line_number, function_name, user_action,
            user_id, user_email, session_token, survey_instance_id,
            user_agent, ip_address, url, http_method,
            browser_info, screen_resolution, viewport_size,
            error_boundary, is_handled, error_hash,
            additional_context, tags
        ) VALUES (
            p_severity, p_error_message, p_error_code, p_stack_trace,
            p_component_name, p_file_path, p_line_number, p_function_name, p_user_action,
            p_user_id, p_user_email, p_session_token, p_survey_instance_id,
            p_user_agent, p_ip_address, p_url, p_http_method,
            p_browser_info, p_screen_resolution, p_viewport_size,
            p_error_boundary, p_is_handled, v_error_hash,
            p_additional_context, p_tags
        ) RETURNING id INTO v_log_id;
        
        RETURN v_log_id;
    END IF;
END;
$$;

-- Function to get error statistics
CREATE OR REPLACE FUNCTION get_error_statistics(
    p_hours_back INTEGER DEFAULT 24,
    p_component_name VARCHAR(255) DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_result JSON;
    v_cutoff_time TIMESTAMP WITH TIME ZONE;
BEGIN
    v_cutoff_time := NOW() - (p_hours_back || ' hours')::INTERVAL;
    
    WITH error_stats AS (
        SELECT 
            COUNT(*) as total_errors,
            SUM(occurrence_count) as total_occurrences,
            COUNT(*) FILTER (WHERE severity = 'critical') as critical_errors,
            COUNT(*) FILTER (WHERE severity = 'high') as high_errors,
            COUNT(*) FILTER (WHERE severity = 'medium') as medium_errors,
            COUNT(*) FILTER (WHERE severity = 'low') as low_errors,
            COUNT(*) FILTER (WHERE status = 'open') as open_errors,
            COUNT(*) FILTER (WHERE status = 'investigating') as investigating_errors,
            COUNT(*) FILTER (WHERE status = 'resolved') as resolved_errors,
            COUNT(DISTINCT component_name) as affected_components,
            COUNT(DISTINCT user_email) FILTER (WHERE user_email IS NOT NULL) as affected_users
        FROM error_logs 
        WHERE 
            occurred_at >= v_cutoff_time
            AND (p_component_name IS NULL OR component_name = p_component_name)
    )
    SELECT json_build_object(
        'timestamp', NOW(),
        'hours_back', p_hours_back,
        'component_filter', p_component_name,
        'stats', row_to_json(error_stats)
    ) INTO v_result
    FROM error_stats;
    
    RETURN v_result;
END;
$$;

-- Function to cleanup old error logs (keep last 30 days by default)
CREATE OR REPLACE FUNCTION cleanup_error_logs(p_days_to_keep INTEGER DEFAULT 30)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_deleted_count INTEGER;
    v_cutoff_date TIMESTAMP WITH TIME ZONE;
BEGIN
    v_cutoff_date := NOW() - (p_days_to_keep || ' days')::INTERVAL;
    
    -- Delete old error logs (except critical errors which we keep longer)
    DELETE FROM error_logs 
    WHERE 
        occurred_at < v_cutoff_date 
        AND severity != 'critical'
        AND status IN ('resolved', 'ignored');
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    RETURN json_build_object(
        'deleted_count', v_deleted_count,
        'cutoff_date', v_cutoff_date,
        'days_kept', p_days_to_keep,
        'timestamp', NOW(),
        'success', true
    );
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM,
        'timestamp', NOW()
    );
END;
$$;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_error_logs_updated_at ON error_logs;
CREATE TRIGGER update_error_logs_updated_at 
    BEFORE UPDATE ON error_logs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================================
-- ROW LEVEL SECURITY
-- ===================================

-- Enable RLS
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Admin policy - full access
CREATE POLICY "error_logs_admin_all" ON error_logs
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Function execution permissions
GRANT EXECUTE ON FUNCTION log_error TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_error_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_error_logs TO authenticated;

-- Table permissions
GRANT ALL ON error_logs TO authenticated;
GRANT INSERT ON error_logs TO anon; -- Allow anonymous users to log errors

-- ===================================
-- INITIAL SETUP
-- ===================================

-- Create some sample data for testing (optional - remove in production)
/*
-- Insert test error log directly into table
INSERT INTO error_logs (
    severity, error_message, error_code, stack_trace,
    component_name, file_path, line_number, function_name, user_action,
    user_email, user_agent, ip_address, url, http_method,
    browser_info, screen_resolution, viewport_size,
    error_boundary, is_handled, additional_context, tags
) VALUES (
    'medium',
    'Sample error for testing error logging system',
    'TEST_001',
    'Error: Test error\n  at testFunction (test.js:10:5)',
    'TestComponent',
    'src/components/test.tsx',
    10,
    'testFunction',
    'User clicked submit button',
    'test@example.com',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    '192.168.1.100'::inet,
    '/admin/test',
    'POST',
    '{"browser": "Chrome", "version": "120.0.0"}'::jsonb,
    '1920x1080',
    '1200x800',
    true,
    true,
    '{"testData": "sample"}'::jsonb,
    ARRAY['test', 'sample']
);

-- Query the test data
SELECT * FROM error_logs ORDER BY occurred_at DESC LIMIT 5;
*/

-- Enable realtime for error logs (so admin can see errors in real-time)
ALTER PUBLICATION supabase_realtime ADD TABLE error_logs;