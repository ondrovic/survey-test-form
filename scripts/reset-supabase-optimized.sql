-- Supabase Optimized Database Reset Script
-- WARNING: This will delete ALL data in your database
-- Run this in your Supabase SQL Editor to completely reset the database

-- ===================================
-- DISABLE TRIGGERS AND CONSTRAINTS
-- ===================================

-- Note: Supabase doesn't allow changing session_replication_role
-- We'll rely on CASCADE and proper ordering to handle dependencies

-- ===================================
-- DROP ALL TABLES (CASCADE handles dependencies automatically)
-- ===================================

-- Drop all tables with CASCADE to handle foreign key dependencies
-- The order doesn't matter as much with CASCADE, but we'll be systematic

-- Drop analytics and tracking tables  
DROP TABLE IF EXISTS survey_instance_status_changes CASCADE;

-- Drop main survey tables (these have the primary keys others reference)
DROP TABLE IF EXISTS survey_responses CASCADE;
DROP TABLE IF EXISTS survey_sessions CASCADE;
DROP TABLE IF EXISTS survey_instances CASCADE;
DROP TABLE IF EXISTS survey_configs CASCADE;

-- Drop option set tables (these are referenced by fields)
DROP TABLE IF EXISTS rating_scales CASCADE;
DROP TABLE IF EXISTS radio_option_sets CASCADE;
DROP TABLE IF EXISTS multi_select_option_sets CASCADE;
DROP TABLE IF EXISTS select_option_sets CASCADE;


-- ===================================
-- DROP FUNCTIONS
-- ===================================

DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS log_survey_instance_status_change() CASCADE;
DROP FUNCTION IF EXISTS update_survey_instance_statuses() CASCADE;
DROP FUNCTION IF EXISTS get_upcoming_status_changes(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS calculate_survey_completion_time() CASCADE;

-- Drop RLS helper functions
DROP FUNCTION IF EXISTS is_admin() CASCADE;
DROP FUNCTION IF EXISTS is_anonymous() CASCADE;
DROP FUNCTION IF EXISTS current_user_email() CASCADE;
DROP FUNCTION IF EXISTS is_survey_public(UUID) CASCADE;
DROP FUNCTION IF EXISTS bypass_rls_for_system_user() CASCADE;
DROP FUNCTION IF EXISTS enable_rls() CASCADE;


-- ===================================
-- DROP EXTENSIONS (if needed)
-- ===================================

-- Don't drop uuid-ossp as it might be used by other applications
-- DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;

-- ===================================
-- DROP CUSTOM TYPES (if any were created)
-- ===================================

-- Add any custom types here if they were created
-- DROP TYPE IF EXISTS custom_type_name CASCADE;

-- ===================================
-- CLEAN UP REALTIME SUBSCRIPTIONS
-- ===================================

-- Remove tables from realtime publication (ignore errors if tables don't exist)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE survey_configs;
  EXCEPTION WHEN OTHERS THEN
    NULL; -- Ignore error if table not in publication
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE survey_instances;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE survey_sessions;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE survey_responses;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE survey_instance_status_changes;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;

-- ===================================
-- CLEAN UP STORAGE (if using Supabase Storage)
-- ===================================

-- If you have any storage buckets related to surveys, clean them up
-- DELETE FROM storage.objects WHERE bucket_id = 'survey-attachments';
-- DROP POLICY IF EXISTS "Survey attachments policy" ON storage.objects;

-- ===================================
-- CLEAN UP AUTH (if using custom auth policies)
-- ===================================

-- Clean up any custom auth-related policies or roles
-- This is commented out as it might affect other parts of your application
-- DELETE FROM auth.users WHERE email LIKE '%test%';

-- ===================================
-- RESET SEQUENCES (if any were created)
-- ===================================

-- Reset any sequences to start from 1
-- ALTER SEQUENCE IF EXISTS custom_sequence_name RESTART WITH 1;

-- ===================================
-- CLEANUP COMPLETE
-- ===================================

-- No need to re-enable triggers in Supabase

-- ===================================
-- VACUUM AND ANALYZE
-- ===================================

-- Note: VACUUM cannot run in a transaction block (Supabase SQL Editor limitation)
-- Run these commands separately if needed:
-- VACUUM;
-- ANALYZE;

-- Instead, we'll just analyze statistics
-- ANALYZE; -- This also has transaction limitations in some cases

-- Supabase will automatically handle cleanup and statistics updates

-- ===================================
-- VERIFICATION
-- ===================================

-- Verify that all tables are dropped
DO $$
DECLARE
    table_count INTEGER;
    remaining_tables TEXT;
BEGIN
    -- Count remaining survey-related tables
    SELECT COUNT(*), STRING_AGG(tablename, ', ')
    INTO table_count, remaining_tables
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND (
        tablename LIKE 'survey%' 
        OR tablename IN ('rating_scales', 'radio_option_sets', 'multi_select_option_sets', 'select_option_sets')
    );
    
    IF table_count > 0 THEN
        RAISE WARNING 'Warning: % survey-related tables still exist: %', table_count, remaining_tables;
    ELSE
        RAISE NOTICE '✅ All survey-related tables have been successfully dropped';
    END IF;
    
    -- Check for remaining functions
    SELECT COUNT(*)
    INTO table_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND (
        p.proname LIKE '%survey%'
        OR p.proname LIKE '%migration%'
        OR p.proname IN ('update_updated_at_column', 'is_admin', 'is_anonymous')
    );
    
    IF table_count > 0 THEN
        RAISE WARNING 'Warning: % survey-related functions still exist', table_count;
    ELSE
        RAISE NOTICE '✅ All survey-related functions have been successfully dropped';
    END IF;
END $$;

-- ===================================
-- SUCCESS MESSAGE
-- ===================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🧹 Database reset completed successfully!';
    RAISE NOTICE '';
    RAISE NOTICE '🗑️  Removed:';
    RAISE NOTICE '   - All survey-related tables and data';
    RAISE NOTICE '   - All functions and triggers';
    RAISE NOTICE '   - All views and indexes';
    RAISE NOTICE '   - All RLS policies';
    RAISE NOTICE '   - Realtime subscriptions';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Next steps:';
    RAISE NOTICE '   1. Run setup-supabase-optimized.sql to recreate the optimized schema';
    RAISE NOTICE '   2. Deploy Edge Functions (optional - supabase functions deploy)';
    RAISE NOTICE '   3. Test your application with the new optimized database';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  Note: This reset does not affect:';
    RAISE NOTICE '   - Supabase Auth users';
    RAISE NOTICE '   - Storage buckets';
    RAISE NOTICE '   - Other application tables';
    RAISE NOTICE '   - Extensions (like uuid-ossp)';
END $$;