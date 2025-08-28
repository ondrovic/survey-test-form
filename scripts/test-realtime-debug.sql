-- Test Real-time Subscription Debug
-- This will help us figure out why INSERT events aren't being received

-- First, verify realtime is properly configured
SELECT 'realtime_check' as test, 
       CASE WHEN EXISTS (
         SELECT 1 FROM pg_publication_tables 
         WHERE pubname = 'supabase_realtime' 
         AND tablename = 'error_logs'
       ) THEN 'ENABLED' ELSE 'DISABLED' END as status;

-- Check what tables are in realtime
SELECT 'realtime_tables' as test, string_agg(tablename, ', ') as tables
FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- Test with a very simple insert using the log_error function
SELECT 'function_insert_test' as test, log_error(
  p_severity := 'medium',
  p_error_message := 'REALTIME TEST: Function insert - should trigger subscription',
  p_error_code := 'FUNCTION_INSERT_TEST'
) as error_id;

-- Test with direct INSERT (this might be the issue)
INSERT INTO error_logs (severity, error_message, error_code, component_name)
VALUES ('high', 'REALTIME TEST: Direct insert - should trigger subscription', 'DIRECT_INSERT_TEST', 'TestComponent');

-- Show what we inserted
SELECT id, severity, error_message, error_code, occurred_at
FROM error_logs 
WHERE error_code IN ('FUNCTION_INSERT_TEST', 'DIRECT_INSERT_TEST')
ORDER BY occurred_at DESC;

-- Check if there are any RLS policies blocking realtime
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual
FROM pg_policies 
WHERE tablename = 'error_logs';

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔍 Realtime Debug Complete';
    RAISE NOTICE '   1. Check if realtime is ENABLED above';
    RAISE NOTICE '   2. Watch browser console for INSERT events';
    RAISE NOTICE '   3. Both function and direct inserts should trigger real-time';
    RAISE NOTICE '';
END $$;