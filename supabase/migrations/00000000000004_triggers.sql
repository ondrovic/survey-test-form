-- ===================================
-- Triggers Migration: 00000000000004
-- Description: Triggers
-- ===================================

DROP TRIGGER IF EXISTS trigger_session_status_update ON survey_sessions;
CREATE TRIGGER trigger_session_status_update
    BEFORE UPDATE ON survey_sessions
    FOR EACH ROW
    EXECUTE FUNCTION check_session_status_on_update();

DROP TRIGGER IF EXISTS update_error_logs_updated_at ON error_logs;
CREATE TRIGGER update_error_logs_updated_at 
    BEFORE UPDATE ON error_logs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

/* DROP TRIGGER IF EXISTS trigger_cleanup_on_error_insert ON error_logs;
CREATE TRIGGER trigger_cleanup_on_error_insert
    AFTER INSERT ON error_logs
    FOR EACH ROW
    EXECUTE FUNCTION trigger_error_log_cleanup(); */

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

DROP TRIGGER IF EXISTS update_multi_select_option_sets_updated_at ON checkbox_option_sets;
CREATE TRIGGER update_multi_select_option_sets_updated_at 
    BEFORE UPDATE ON checkbox_option_sets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_select_option_sets_updated_at ON dropdown_option_sets;
CREATE TRIGGER update_select_option_sets_updated_at 
    BEFORE UPDATE ON dropdown_option_sets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_survey_sessions_updated_at ON survey_sessions;
CREATE TRIGGER update_survey_sessions_updated_at 
    BEFORE UPDATE ON survey_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS calculate_completion_time_trigger ON survey_responses;
CREATE TRIGGER calculate_completion_time_trigger
    BEFORE INSERT OR UPDATE ON survey_responses
    FOR EACH ROW EXECUTE FUNCTION calculate_survey_completion_time();

DROP TRIGGER IF EXISTS survey_instance_status_change_audit ON survey_instances;
CREATE TRIGGER survey_instance_status_change_audit
    AFTER INSERT OR UPDATE ON survey_instances
    FOR EACH ROW EXECUTE FUNCTION log_survey_instance_status_change();

DROP TRIGGER IF EXISTS trigger_session_status_update ON survey_sessions;
CREATE TRIGGER trigger_session_status_update
    BEFORE UPDATE ON survey_sessions
    FOR EACH ROW
    EXECUTE FUNCTION check_session_status_on_update();