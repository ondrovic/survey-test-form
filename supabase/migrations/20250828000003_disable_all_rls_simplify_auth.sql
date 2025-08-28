-- Disable all RLS and simplify authentication
-- This eliminates realtime subscription issues and multiple client warnings
-- Security is maintained through application-level authentication (admin password)

-- Drop all existing RLS policies
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on all tables in public schema
    FOR r IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      r.policyname, r.schemaname, r.tablename);
    END LOOP;
    
    RAISE NOTICE 'All RLS policies dropped successfully';
END $$;

-- Disable RLS on all public tables
ALTER TABLE IF EXISTS survey_configs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS survey_instances DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS survey_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS survey_responses DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS survey_instance_status_changes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS error_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS rating_scales DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS radio_option_sets DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS multi_select_option_sets DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS select_option_sets DISABLE ROW LEVEL SECURITY;

-- Drop any unused RLS-related functions
DROP FUNCTION IF EXISTS is_admin();
DROP FUNCTION IF EXISTS is_authenticated_user();

-- Add table comments explaining the security model
COMMENT ON TABLE survey_configs IS 
'Survey configuration data. Security: Application-level authentication via admin password.';

COMMENT ON TABLE survey_instances IS 
'Survey instances. Security: Application-level authentication via admin password.';

COMMENT ON TABLE survey_sessions IS 
'Survey user sessions. Security: Anonymous access for surveys, admin auth for management.';

COMMENT ON TABLE survey_responses IS 
'Survey response data. Security: Anonymous submission, admin auth for viewing.';

COMMENT ON TABLE error_logs IS 
'Application error logs. Security: Application-level authentication via admin password. RLS disabled to enable real-time subscriptions.';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔓 RLS DISABLED SUCCESSFULLY';
    RAISE NOTICE '   ✅ All RLS policies removed';
    RAISE NOTICE '   ✅ All public tables now use application-level security';
    RAISE NOTICE '   ✅ Real-time subscriptions will work without issues';
    RAISE NOTICE '   ✅ Single client architecture enabled';
    RAISE NOTICE '';
    RAISE NOTICE '🔒 SECURITY MODEL:';
    RAISE NOTICE '   - Admin pages: Password + cookie authentication';
    RAISE NOTICE '   - Survey access: Anonymous (as intended)';
    RAISE NOTICE '   - Database access: Controlled at application level';
    RAISE NOTICE '';
END $$;