-- Session Status Automation Migration
-- This migration adds database-side session status management with triggers and scheduled cleanup
-- to handle cases where client-side JavaScript doesn't run (page closed, network issues, etc.)

-- ===================================
-- SESSION STATUS MANAGEMENT FUNCTIONS
-- ===================================

-- Function to automatically update session status based on activity
CREATE OR REPLACE FUNCTION update_session_status()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    session_timeout_minutes INTEGER := 30;  -- 30 minutes for abandoned
    session_expire_hours INTEGER := 1;  -- 1 hour for expired
    updated_count INTEGER := 0;
BEGIN
    -- Update sessions from 'started' or 'in_progress' to 'abandoned' after 30 minutes of inactivity
    WITH abandoned_sessions AS (
        UPDATE survey_sessions 
        SET 
            status = 'abandoned',
            updated_at = NOW(),
            metadata = metadata || jsonb_build_object(
                'auto_abandoned_at', NOW()::text,
                'previous_status', status,
                'reason', 'inactivity_timeout_30min'
            )
        WHERE 
            status IN ('started', 'in_progress') 
            AND last_activity_at < (NOW() - INTERVAL '30 minutes')
            AND created_at < (NOW() - INTERVAL '30 minutes')  -- Don't abandon very new sessions
        RETURNING id
    )
    SELECT COUNT(*) INTO updated_count FROM abandoned_sessions;
    
    IF updated_count > 0 THEN
        RAISE NOTICE 'Marked % sessions as abandoned due to 30min inactivity', updated_count;
    END IF;
    
    -- Update sessions from 'abandoned' to 'expired' after 1 hour total
    WITH expired_sessions AS (
        UPDATE survey_sessions 
        SET 
            status = 'expired',
            updated_at = NOW(),
            metadata = metadata || jsonb_build_object(
                'auto_expired_at', NOW()::text,
                'previous_status', status,
                'reason', 'total_timeout_1h'
            )
        WHERE 
            status IN ('started', 'in_progress', 'abandoned')
            AND created_at < (NOW() - INTERVAL '1 hour')
        RETURNING id
    )
    SELECT COUNT(*) INTO updated_count FROM expired_sessions;
    
    IF updated_count > 0 THEN
        RAISE NOTICE 'Marked % sessions as expired due to 1h total timeout', updated_count;
    END IF;
    
END;
$$;

-- Function to update session status on activity
CREATE OR REPLACE FUNCTION check_session_status_on_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    -- If last_activity_at is being updated, check if we should update status
    IF NEW.last_activity_at IS DISTINCT FROM OLD.last_activity_at THEN
        -- If session was started and now has activity, mark as in_progress
        IF OLD.status = 'started' AND NEW.current_section > 0 THEN
            NEW.status = 'in_progress';
            NEW.metadata = COALESCE(NEW.metadata, '{}'::jsonb) || jsonb_build_object(
                'progressed_at', NEW.last_activity_at::text,
                'progressed_from', 'started'
            );
        END IF;
        
        -- Update the updated_at timestamp
        NEW.updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$;

-- ===================================
-- TRIGGERS
-- ===================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_session_status_update ON survey_sessions;

-- Create trigger for automatic status updates on session changes
CREATE TRIGGER trigger_session_status_update
    BEFORE UPDATE ON survey_sessions
    FOR EACH ROW
    EXECUTE FUNCTION check_session_status_on_update();

-- ===================================
-- SCHEDULED CLEANUP JOB SETUP
-- ===================================

-- Note: This requires pg_cron extension which may not be available on all Supabase plans
-- For Supabase, we'll create a function that can be called via Edge Functions or cron jobs

-- Function that can be called by external schedulers (like Supabase Edge Functions)
CREATE OR REPLACE FUNCTION cleanup_survey_sessions()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    abandoned_count INTEGER := 0;
    expired_count INTEGER := 0;
    result json;
BEGIN
    -- Perform the status updates
    PERFORM update_session_status();
    
    -- Get counts of what was updated
    GET DIAGNOSTICS abandoned_count = ROW_COUNT;
    
    -- Return summary
    result := json_build_object(
        'timestamp', NOW()::text,
        'abandoned_sessions', abandoned_count,
        'expired_sessions', expired_count,
        'success', true,
        'message', 'Session cleanup completed successfully'
    );
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'timestamp', NOW()::text,
        'success', false,
        'error', SQLERRM,
        'message', 'Session cleanup failed'
    );
END;
$$;

-- ===================================
-- HELPER FUNCTIONS FOR ANALYTICS
-- ===================================

-- Function to get session analytics
CREATE OR REPLACE FUNCTION get_session_analytics(
    instance_id UUID DEFAULT NULL,
    hours_back INTEGER DEFAULT 24
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    result json;
    cutoff_time timestamp;
BEGIN
    cutoff_time := NOW() - (hours_back || ' hours')::interval;
    
    WITH session_stats AS (
        SELECT 
            COUNT(*) as total_sessions,
            COUNT(*) FILTER (WHERE status = 'started') as started_sessions,
            COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_sessions,
            COUNT(*) FILTER (WHERE status = 'completed') as completed_sessions,
            COUNT(*) FILTER (WHERE status = 'abandoned') as abandoned_sessions,
            COUNT(*) FILTER (WHERE status = 'expired') as expired_sessions,
            AVG(EXTRACT(EPOCH FROM (
                COALESCE(
                    CASE WHEN status = 'completed' THEN last_activity_at END,
                    CASE WHEN status = 'abandoned' THEN last_activity_at END,
                    NOW()
                ) - started_at
            ))) as avg_session_duration_seconds,
            ROUND(
                (COUNT(*) FILTER (WHERE status = 'completed')::numeric / 
                NULLIF(COUNT(*) FILTER (WHERE status IN ('completed', 'abandoned', 'expired')), 0) * 100), 2
            ) as completion_rate_percent
        FROM survey_sessions 
        WHERE 
            created_at >= cutoff_time
            AND (instance_id IS NULL OR survey_instance_id = instance_id)
    )
    SELECT json_build_object(
        'timestamp', NOW()::text,
        'hours_back', hours_back,
        'instance_id', instance_id,
        'stats', row_to_json(session_stats)
    ) INTO result
    FROM session_stats;
    
    RETURN result;
END;
$$;

-- ===================================
-- INITIAL CLEANUP
-- ===================================

-- Run initial cleanup on existing sessions
SELECT cleanup_survey_sessions();

-- ===================================
-- AUTOMATED CRON JOBS SETUP
-- ===================================

-- Enable the pg_cron extension for automated tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove any existing jobs to avoid duplicates
DO $$
BEGIN
  BEGIN
    PERFORM cron.unschedule('survey-instance-status-updates');
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  BEGIN
    PERFORM cron.unschedule('session-cleanup');
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;

-- Schedule survey instance status updates every 30 minutes
-- Handles activation/deactivation based on date ranges
SELECT cron.schedule(
  'survey-instance-status-updates',
  '*/30 * * * *',
  'SELECT update_survey_instance_statuses();'
);

-- Schedule session cleanup every 15 minutes
-- Handles abandoned (30min) and expired (1h) session transitions
SELECT cron.schedule(
  'session-cleanup',
  '*/15 * * * *',
  'SELECT cleanup_survey_sessions();'
);

-- ===================================
-- COMMENTS AND DOCUMENTATION
-- ===================================

COMMENT ON FUNCTION update_session_status() IS 'Automatically updates session statuses based on inactivity periods - Automated via pg_cron every 15 minutes';
COMMENT ON FUNCTION check_session_status_on_update() IS 'Trigger function to update session status when activity occurs';
COMMENT ON FUNCTION cleanup_survey_sessions() IS 'Main cleanup function called by pg_cron every 15 minutes - can also be called manually';
COMMENT ON FUNCTION get_session_analytics(UUID, INTEGER) IS 'Returns analytics data for survey sessions';

-- Add indexes for better performance on session status queries
CREATE INDEX IF NOT EXISTS idx_survey_sessions_status_activity 
    ON survey_sessions(status, last_activity_at, created_at);
    
CREATE INDEX IF NOT EXISTS idx_survey_sessions_instance_status 
    ON survey_sessions(survey_instance_id, status, created_at);