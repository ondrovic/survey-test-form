-- Fix Function Security: Add search_path protection
-- This migration fixes the function_search_path_mutable security warnings
-- by adding "SET search_path = public" to database functions

-- Fix update_session_status function
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

-- Fix check_session_status_on_update function
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

-- Fix cleanup_survey_sessions function
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

-- Fix get_session_analytics function
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

-- Add comments
COMMENT ON FUNCTION update_session_status() IS 'Automatically updates session statuses based on inactivity periods - SECURITY: search_path protected';
COMMENT ON FUNCTION check_session_status_on_update() IS 'Trigger function to update session status when activity occurs - SECURITY: search_path protected';
COMMENT ON FUNCTION cleanup_survey_sessions() IS 'Main cleanup function that can be called by external schedulers - SECURITY: search_path protected';
COMMENT ON FUNCTION get_session_analytics(UUID, INTEGER) IS 'Returns analytics data for survey sessions - SECURITY: search_path protected';