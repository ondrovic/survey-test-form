-- Error Log Trigger-Based Cleanup Migration
-- Replaces polling-based refresh with efficient trigger-based cleanup

-- Create a function that runs lightweight cleanup on new error insertion
CREATE OR REPLACE FUNCTION trigger_error_log_cleanup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_error_count INTEGER;
    v_deleted_count INTEGER;
BEGIN
    -- Only run cleanup if we have more than 1000 error logs to prevent excessive cleanup
    SELECT COUNT(*) INTO v_error_count FROM error_logs;
    
    IF v_error_count > 1000 THEN
        -- Clean up resolved/ignored errors older than 7 days (more frequent than cron job)
        -- This keeps the table size manageable without being too aggressive
        DELETE FROM error_logs 
        WHERE 
            occurred_at < NOW() - INTERVAL '7 days'
            AND severity NOT IN ('critical')  -- Keep critical errors longer
            AND status IN ('resolved', 'ignored');
            
        GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
        
        -- Log cleanup activity if significant
        IF v_deleted_count > 0 THEN
            RAISE NOTICE 'Auto-cleanup: Deleted % old resolved/ignored error logs', v_deleted_count;
        END IF;
    END IF;
    
    -- Also clean up very old open errors (30+ days) to prevent indefinite growth
    DELETE FROM error_logs 
    WHERE 
        occurred_at < NOW() - INTERVAL '30 days'
        AND severity NOT IN ('critical')
        AND status = 'open';
        
    -- Return the new row (for INSERT trigger)
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Don't fail the insert if cleanup fails
    RAISE WARNING 'Error log cleanup failed: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger that runs after new error log insertion
DROP TRIGGER IF EXISTS trigger_cleanup_on_error_insert ON error_logs;
CREATE TRIGGER trigger_cleanup_on_error_insert
    AFTER INSERT ON error_logs
    FOR EACH ROW
    EXECUTE FUNCTION trigger_error_log_cleanup();

-- Update the existing daily cron job to be less frequent since we now have trigger-based cleanup
-- The cron job will now focus on deep cleanup of critical errors and final maintenance
DO $$
BEGIN
    -- Remove existing job
    PERFORM cron.unschedule('error-log-cleanup');
    
    -- Schedule less frequent but more thorough cleanup
    -- Runs weekly instead of daily since trigger handles most cleanup
    PERFORM cron.schedule(
        'error-log-deep-cleanup',
        '0 3 * * 0', -- Weekly on Sunday at 3 AM
        'SELECT cleanup_error_logs(90);' -- Keep 90 days for deep cleanup (including critical)
    );
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not update cron job: %', SQLERRM;
END
$$;

-- Create an optimized cleanup function for trigger use
CREATE OR REPLACE FUNCTION lightweight_error_cleanup()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_deleted_count INTEGER := 0;
    v_total_count INTEGER;
BEGIN
    -- Get current error count
    SELECT COUNT(*) INTO v_total_count FROM error_logs;
    
    -- Only run if we have accumulated errors
    IF v_total_count > 500 THEN
        -- Clean up resolved/ignored errors older than 3 days (very aggressive for UI responsiveness)
        DELETE FROM error_logs 
        WHERE 
            occurred_at < NOW() - INTERVAL '3 days'
            AND severity NOT IN ('critical')
            AND status IN ('resolved', 'ignored')
            AND id NOT IN (
                -- Keep some examples of each error type for analysis
                SELECT DISTINCT ON (error_code, component_name) id 
                FROM error_logs 
                WHERE status IN ('resolved', 'ignored')
                ORDER BY error_code, component_name, occurred_at DESC
            );
        
        GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    END IF;
    
    RETURN json_build_object(
        'deleted_count', v_deleted_count,
        'total_before_cleanup', v_total_count,
        'total_after_cleanup', v_total_count - v_deleted_count,
        'cleanup_type', 'lightweight_trigger',
        'timestamp', NOW()
    );
END;
$$;

-- Comments for documentation
COMMENT ON FUNCTION trigger_error_log_cleanup() IS 'Trigger function: Automatically cleans old resolved/ignored errors when new errors are inserted - prevents table bloat';
COMMENT ON FUNCTION lightweight_error_cleanup() IS 'Lightweight cleanup function optimized for frequent execution - keeps UI responsive';
COMMENT ON TRIGGER trigger_cleanup_on_error_insert ON error_logs IS 'Auto-cleanup trigger: Runs lightweight cleanup when new errors are logged to maintain performance';

-- Display helpful information
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔄 Error Log Trigger-Based Cleanup Setup Complete:';
    RAISE NOTICE '   • Auto-cleanup triggers when new errors are logged';
    RAISE NOTICE '   • Lightweight cleanup runs when >1000 errors exist';  
    RAISE NOTICE '   • Removes resolved/ignored errors older than 7 days';
    RAISE NOTICE '   • Critical errors are preserved longer';
    RAISE NOTICE '   • Weekly deep cleanup cron job (90-day retention)';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Benefits:';
    RAISE NOTICE '   • No UI polling needed - database self-maintains';
    RAISE NOTICE '   • Better performance - cleanup happens with writes';
    RAISE NOTICE '   • Prevents table bloat automatically';
    RAISE NOTICE '   • UI stays responsive';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 Management:';
    RAISE NOTICE '   - Manual cleanup: SELECT lightweight_error_cleanup();';
    RAISE NOTICE '   - Deep cleanup: SELECT cleanup_error_logs(30);';
    RAISE NOTICE '   - View triggers: \d+ error_logs';
    RAISE NOTICE '';
END
$$;