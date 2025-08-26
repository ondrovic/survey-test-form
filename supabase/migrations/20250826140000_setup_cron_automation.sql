-- Setup Cron Jobs for Automated Survey Management
-- This migration sets up pg_cron jobs for automatic survey instance activation/deactivation
-- and session cleanup, replacing GitHub Actions with reliable database-level automation

-- ===================================
-- ENABLE PG_CRON EXTENSION
-- ===================================

-- Enable the pg_cron extension (requires superuser, should work in Supabase)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ===================================
-- CLEANUP EXISTING CRON JOBS
-- ===================================

-- Remove any existing jobs with the same names to avoid duplicates
-- Note: This will not fail if jobs don't exist
DO $$
BEGIN
  -- Remove survey instance status job if it exists
  BEGIN
    PERFORM cron.unschedule('survey-instance-status-updates');
  EXCEPTION WHEN OTHERS THEN
    -- Job doesn't exist, continue
    NULL;
  END;
  
  -- Remove session cleanup job if it exists
  BEGIN
    PERFORM cron.unschedule('session-cleanup');
  EXCEPTION WHEN OTHERS THEN
    -- Job doesn't exist, continue
    NULL;
  END;
END $$;

-- ===================================
-- SURVEY INSTANCE STATUS AUTOMATION
-- ===================================

-- Schedule survey instance status updates to run every 30 minutes
-- This handles activation/deactivation based on date ranges
SELECT cron.schedule(
  'survey-instance-status-updates',        -- Job name
  '*/30 * * * *',                         -- Every 30 minutes
  'SELECT update_survey_instance_statuses();' -- Function to call
);

-- ===================================
-- SESSION STATUS AUTOMATION
-- ===================================

-- Schedule session cleanup to run every 15 minutes
-- This handles abandoned (30min) and expired (1h) session transitions
SELECT cron.schedule(
  'session-cleanup',                       -- Job name
  '*/15 * * * *',                         -- Every 15 minutes
  'SELECT cleanup_survey_sessions();'     -- Function to call
);

-- ===================================
-- VERIFICATION AND DOCUMENTATION
-- ===================================

-- Display scheduled jobs for verification
DO $$
DECLARE
  job_record RECORD;
  job_count INTEGER := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '📅 Scheduled Cron Jobs:';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  
  FOR job_record IN 
    SELECT jobid, jobname, schedule, command, active
    FROM cron.job 
    WHERE jobname IN ('survey-instance-status-updates', 'session-cleanup')
    ORDER BY jobname
  LOOP
    job_count := job_count + 1;
    RAISE NOTICE '🔄 Job: % (ID: %)', job_record.jobname, job_record.jobid;
    RAISE NOTICE '   Schedule: % (cron format)', job_record.schedule;
    RAISE NOTICE '   Command: %', job_record.command;
    RAISE NOTICE '   Status: %', CASE WHEN job_record.active THEN '✅ Active' ELSE '❌ Inactive' END;
    RAISE NOTICE '';
  END LOOP;
  
  IF job_count = 0 THEN
    RAISE NOTICE '⚠️  No cron jobs found. Check if pg_cron extension is properly enabled.';
  ELSE
    RAISE NOTICE '✅ Successfully scheduled % cron job(s)', job_count;
  END IF;
  
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;

-- ===================================
-- COMMENTS AND METADATA
-- ===================================

COMMENT ON EXTENSION pg_cron IS 'Job scheduler for automated survey management tasks';

-- Add comments to document the automation functions
COMMENT ON FUNCTION update_survey_instance_statuses() IS 'Automated via pg_cron: Activates/deactivates survey instances based on date ranges - runs every 30 minutes';
COMMENT ON FUNCTION cleanup_survey_sessions() IS 'Automated via pg_cron: Cleans up abandoned (30min) and expired (1h) sessions - runs every 15 minutes';

-- ===================================
-- INITIAL EXECUTION
-- ===================================

-- Run both functions once immediately to clean up any existing data
-- This ensures we start with a clean state
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🧹 Running initial cleanup...';
END $$;

-- Run survey instance status updates
DO $$
DECLARE
  instance_result json;
BEGIN
  SELECT update_survey_instance_statuses() INTO instance_result;
  RAISE NOTICE '📊 Survey Instance Status Update: %', instance_result->>'message';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING '⚠️  Initial survey instance status update failed: %', SQLERRM;
END $$;

-- Run session cleanup
DO $$
DECLARE
  session_result json;
BEGIN
  SELECT cleanup_survey_sessions() INTO session_result;
  RAISE NOTICE '🔄 Session Cleanup: %', session_result->>'message';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING '⚠️  Initial session cleanup failed: %', SQLERRM;
END $$;

-- ===================================
-- SUCCESS MESSAGE
-- ===================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Cron Job Automation Setup Complete!';
  RAISE NOTICE '';
  RAISE NOTICE '🤖 Automated Tasks:';
  RAISE NOTICE '   1. Survey Instance Activation/Deactivation: Every 30 minutes';
  RAISE NOTICE '      - Activates instances when date range starts';
  RAISE NOTICE '      - Deactivates instances when date range ends';
  RAISE NOTICE '';
  RAISE NOTICE '   2. Session Status Management: Every 15 minutes';
  RAISE NOTICE '      - Marks sessions as abandoned after 30 minutes of inactivity';
  RAISE NOTICE '      - Marks sessions as expired after 1 hour total time';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Management Commands:';
  RAISE NOTICE '   - View jobs: SELECT * FROM cron.job;';
  RAISE NOTICE '   - View job history: SELECT * FROM cron.job_run_details ORDER BY start_time DESC;';
  RAISE NOTICE '   - Remove job: SELECT cron.unschedule(''job-name'');';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 Manual execution (for testing):';
  RAISE NOTICE '   - Instance status: SELECT update_survey_instance_statuses();';
  RAISE NOTICE '   - Session cleanup: SELECT cleanup_survey_sessions();';
  RAISE NOTICE '';
  RAISE NOTICE '✨ Your surveys now have fully automated lifecycle management!';
END $$;