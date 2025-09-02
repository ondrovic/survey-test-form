-- ===================================
-- Automation Migration: 00000000000005
-- Description: Setup pg_cron jobs for automation
-- ===================================

CREATE EXTENSION IF NOT EXISTS pg_cron;

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

SELECT cron.schedule(
  'survey-instance-status-updates',
  '*/30 * * * *',
  'SELECT update_survey_instance_statuses();'
);

SELECT cron.schedule(
  'session-cleanup',
  '*/15 * * * *',
  'SELECT cleanup_survey_sessions();'
);

DO $$
BEGIN
    PERFORM cron.unschedule('error-log-cleanup');
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END
$$;

SELECT cron.schedule(
    'error-log-cleanup',
    '0 3 * * *',
    'SELECT cleanup_error_logs(90);'
);