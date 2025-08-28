-- Check if RLS is blocking real-time subscriptions
-- RLS policies can prevent realtime events from being sent to the client

-- Check if RLS is enabled on error_logs
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as rls_enabled,
  CASE WHEN rowsecurity THEN 'RLS IS ENABLED' ELSE 'RLS IS DISABLED' END as status
FROM pg_tables 
WHERE tablename = 'error_logs';

-- Check RLS policies on error_logs table
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'error_logs';

-- TEMPORARILY DISABLE RLS to test if that's the issue
-- WARNING: This removes security - only for testing!
ALTER TABLE error_logs DISABLE ROW LEVEL SECURITY;

-- Test insert after disabling RLS
INSERT INTO error_logs (severity, error_message, error_code) 
VALUES ('critical', 'RLS TEST: This should trigger real-time after disabling RLS', 'RLS_TEST');

-- Show what we inserted
SELECT id, severity, error_message, error_code, occurred_at
FROM error_logs 
WHERE error_code = 'RLS_TEST'
ORDER BY occurred_at DESC
LIMIT 1;

-- Instructions
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔍 RLS Check Complete:';
    RAISE NOTICE '   1. RLS has been TEMPORARILY DISABLED on error_logs';
    RAISE NOTICE '   2. Test insert added - watch for real-time event';
    RAISE NOTICE '   3. If real-time works now, RLS was blocking it';
    RAISE NOTICE '   4. We will re-enable RLS with proper policies after testing';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  SECURITY WARNING: RLS is currently DISABLED';
    RAISE NOTICE '';
END $$;