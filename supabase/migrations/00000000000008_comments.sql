-- ===================================
-- Comments Migration: 00000000000008
-- Description: Add comments to tables, columns, and functions
-- ===================================

COMMENT ON FUNCTION update_session_status() IS 'Automatically updates session statuses based on inactivity periods - Automated via pg_cron every 15 minutes';
COMMENT ON FUNCTION check_session_status_on_update() IS 'Trigger function to update session status when activity occurs';
COMMENT ON FUNCTION cleanup_survey_sessions() IS 'Main cleanup function called by pg_cron every 15 minutes - can also be called manually';
COMMENT ON FUNCTION get_session_analytics(UUID, INTEGER) IS 'Returns analytics data for survey sessions';