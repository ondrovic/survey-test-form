-- ===================================
-- Functions Migration: 00000000000003
-- Description: Add custom functions
-- ===================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql' SECURITY DEFINER SET search_path = public;

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

-- Function that can be called by external schedulers for cleanup
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

SELECT cleanup_survey_sessions();

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

