-- Error Log Cleanup Cron Job Migration
-- Adds automated cleanup of old error logs

-- First, ensure pg_cron extension is available
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove any existing error log cleanup jobs
DO $$
BEGIN
    -- Try to unschedule existing job (ignore if doesn't exist)
    PERFORM cron.unschedule('error-log-cleanup');
EXCEPTION
    WHEN OTHERS THEN
        -- Job doesn't exist, that's fine
        NULL;
END
$$;

-- Schedule error log cleanup to run daily at 2 AM
-- This will keep error logs for 30 days (except critical errors which are kept longer)
SELECT cron.schedule(
    'error-log-cleanup',
    '0 2 * * *', -- Daily at 2 AM
    'SELECT cleanup_error_logs(30);' -- Keep 30 days of logs
);

-- Verify the cron job was created
DO $$
DECLARE
    job_count INTEGER;
    job_record RECORD;
BEGIN
    -- Check if our job exists
    SELECT COUNT(*) INTO job_count
    FROM cron.job 
    WHERE jobname = 'error-log-cleanup';
    
    IF job_count > 0 THEN
        -- Display job details
        FOR job_record IN
            SELECT jobid, jobname, schedule, command, active
            FROM cron.job 
            WHERE jobname = 'error-log-cleanup'
        LOOP
            RAISE NOTICE '✅ Error log cleanup cron job created successfully:';
            RAISE NOTICE '   Job ID: %', job_record.jobid;
            RAISE NOTICE '   Job Name: %', job_record.jobname;
            RAISE NOTICE '   Schedule: % (cron format)', job_record.schedule;
            RAISE NOTICE '   Command: %', job_record.command;
            RAISE NOTICE '   Active: %', job_record.active;
        END LOOP;
    ELSE
        RAISE NOTICE '⚠️  Error log cleanup cron job was not created. Check if pg_cron extension is properly enabled.';
    END IF;
END
$$;

-- Add helpful comments
COMMENT ON FUNCTION cleanup_error_logs(INTEGER) IS 'Automated via pg_cron: Cleans up old error logs (keeping 30 days) - runs daily at 2 AM';

-- Display helpful information
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '📋 Error Log Cleanup Cron Job Information:';
  RAISE NOTICE '   • Runs daily at 2:00 AM';
  RAISE NOTICE '   • Keeps error logs for 30 days';
  RAISE NOTICE '   • Critical errors are kept longer';
  RAISE NOTICE '   • Only deletes resolved/ignored errors';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 Management Commands:';
  RAISE NOTICE '   - View jobs: SELECT * FROM cron.job;';
  RAISE NOTICE '   - View job history: SELECT * FROM cron.job_run_details WHERE jobname = ''error-log-cleanup'' ORDER BY start_time DESC;';
  RAISE NOTICE '   - Manual cleanup: SELECT cleanup_error_logs(30);';
  RAISE NOTICE '   - Remove job: SELECT cron.unschedule(''error-log-cleanup'');';
  RAISE NOTICE '';
END
$$;