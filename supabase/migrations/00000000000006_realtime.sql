-- ===================================
-- Realtime Migration: 00000000000006
-- Description: Enable Realtime for specific tables
-- ===================================

ALTER PUBLICATION supabase_realtime ADD TABLE survey_configs;
ALTER PUBLICATION supabase_realtime ADD TABLE survey_instances;
ALTER PUBLICATION supabase_realtime ADD TABLE survey_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE survey_responses;
ALTER PUBLICATION supabase_realtime ADD TABLE survey_instance_status_changes;
ALTER PUBLICATION supabase_realtime ADD TABLE error_logs;