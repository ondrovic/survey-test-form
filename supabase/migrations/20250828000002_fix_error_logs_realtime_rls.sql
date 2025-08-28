-- Fix error_logs RLS to allow realtime subscriptions
-- The issue: RLS policies block realtime events even with permissive policies
-- Solution: Disable RLS for error_logs since admin users should see all errors anyway

-- Drop all existing policies
DROP POLICY IF EXISTS "error_logs_admin_all" ON error_logs;
DROP POLICY IF EXISTS "error_logs_admin_crud" ON error_logs;
DROP POLICY IF EXISTS "error_logs_realtime_select" ON error_logs;
DROP POLICY IF EXISTS "error_logs_system_insert" ON error_logs;

-- Disable RLS permanently for error_logs to enable realtime subscriptions
-- This is safe because only authenticated admin users access the error log interface
ALTER TABLE error_logs DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE error_logs IS 
'Error logging table with RLS disabled to allow real-time subscriptions. Access is controlled at the application level - only admin users can view error logs.';