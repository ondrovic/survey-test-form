-- Debug Real-time Setup Script
-- Run this in Supabase SQL Editor to check if real-time is properly configured

-- Check if error_logs table exists
SELECT 'error_logs table exists' as check_name, 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'error_logs') 
            THEN '✅ EXISTS' 
            ELSE '❌ MISSING' 
       END as status;

-- Check if realtime is enabled for error_logs
SELECT 'realtime publication' as check_name,
       CASE WHEN EXISTS (
         SELECT 1 FROM pg_publication_tables 
         WHERE pubname = 'supabase_realtime' 
         AND tablename = 'error_logs'
       ) THEN '✅ ENABLED' 
         ELSE '❌ NOT ENABLED' 
       END as status;

-- Check current realtime tables
SELECT 'current realtime tables' as info, 
       string_agg(tablename, ', ') as tables
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';

-- Test inserting a record directly
INSERT INTO error_logs (
  severity,
  error_message,
  error_code,
  component_name,
  file_path,
  line_number,
  function_name,
  user_action,
  user_email,
  url,
  tags,
  status
) VALUES (
  'high',
  'DEBUG: Test real-time error - should appear in UI instantly',
  'REALTIME_DEBUG_TEST',
  'DebugTestComponent',
  'debug/test.tsx',
  123,
  'testRealtimeFunction',
  'debugging real-time subscription',
  'debug@test.com',
  'http://localhost:30021/admin/error-logs',
  ARRAY['debug', 'realtime', 'test'],
  'open'
);

-- Show the inserted record
SELECT 
  id,
  severity,
  error_message,
  component_name,
  occurred_at,
  status
FROM error_logs 
WHERE tags @> ARRAY['debug'] 
ORDER BY occurred_at DESC 
LIMIT 1;

-- Instructions
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔍 Real-time Debug Results:';
    RAISE NOTICE '   1. Check the results above';
    RAISE NOTICE '   2. If realtime is ❌ NOT ENABLED, run: yarn db:reset';
    RAISE NOTICE '   3. Watch browser console for subscription messages';
    RAISE NOTICE '   4. The test error should appear in UI instantly';
    RAISE NOTICE '';
END $$;