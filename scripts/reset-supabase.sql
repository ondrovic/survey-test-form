-- Supabase Database Reset Script
-- Run this in your Supabase SQL Editor to completely reset the database
-- WARNING: This will delete ALL data and tables!

-- Drop all triggers first
DROP TRIGGER IF EXISTS update_survey_configs_updated_at ON survey_configs;
DROP TRIGGER IF EXISTS update_survey_instances_updated_at ON survey_instances;
DROP TRIGGER IF EXISTS update_rating_scales_updated_at ON rating_scales;
DROP TRIGGER IF EXISTS update_radio_option_sets_updated_at ON radio_option_sets;
DROP TRIGGER IF EXISTS update_multi_select_option_sets_updated_at ON multi_select_option_sets;
DROP TRIGGER IF EXISTS update_select_option_sets_updated_at ON select_option_sets;

-- Drop all indexes
DROP INDEX IF EXISTS idx_survey_configs_is_active;
DROP INDEX IF EXISTS idx_survey_instances_config_id;
DROP INDEX IF EXISTS idx_survey_instances_is_active;
DROP INDEX IF EXISTS idx_survey_responses_survey_instance_id;
DROP INDEX IF EXISTS idx_survey_responses_submitted_at;
DROP INDEX IF EXISTS idx_rating_scales_is_active;
DROP INDEX IF EXISTS idx_radio_option_sets_is_active;
DROP INDEX IF EXISTS idx_multi_select_option_sets_is_active;
DROP INDEX IF EXISTS idx_select_option_sets_is_active;

-- Drop all tables (in order that respects foreign key constraints)
DROP TABLE IF EXISTS survey_responses CASCADE;
DROP TABLE IF EXISTS survey_instances CASCADE;
DROP TABLE IF EXISTS survey_configs CASCADE;
DROP TABLE IF EXISTS rating_scales CASCADE;
DROP TABLE IF EXISTS radio_option_sets CASCADE;
DROP TABLE IF EXISTS multi_select_option_sets CASCADE;
DROP TABLE IF EXISTS select_option_sets CASCADE;
DROP TABLE IF EXISTS surveys CASCADE;

-- Drop the update function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Print completion message
DO $$
BEGIN
    RAISE NOTICE 'Database reset completed successfully!';
    RAISE NOTICE 'All tables, indexes, triggers, and functions have been removed.';
    RAISE NOTICE 'You can now run setup-supabase.sql to recreate the database schema.';
END $$;