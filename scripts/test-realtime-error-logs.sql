-- Test Script for Real-time Error Log Updates
-- Run this in your Supabase SQL Editor while viewing the Error Logs admin page
-- You should see the new errors appear instantly in the UI without refreshing

-- Test 1: Insert a new medium severity error
SELECT log_error(
  p_severity := 'medium',
  p_error_message := 'Real-time test error - Medium severity',
  p_error_code := 'REALTIME_TEST',
  p_component_name := 'TestComponent',
  p_file_path := 'components/test.tsx',
  p_line_number := 123,
  p_function_name := 'testRealtime',
  p_user_action := 'testing real-time updates',
  p_user_email := 'realtime-test@example.com',
  p_url := 'http://localhost:30021/admin/error-logs',
  p_tags := ARRAY['realtime', 'test', 'ui-update']
) AS medium_error_id;

-- Wait a moment, then test a high severity error
SELECT pg_sleep(2);

SELECT log_error(
  p_severity := 'high',
  p_error_message := 'Real-time test error - High severity (should show instantly)',
  p_error_code := 'REALTIME_HIGH_TEST',
  p_component_name := 'CriticalTestComponent',
  p_file_path := 'services/critical-test.ts',
  p_line_number := 456,
  p_function_name := 'criticalTest',
  p_user_action := 'testing high severity real-time',
  p_user_email := 'realtime-high@example.com',
  p_url := 'http://localhost:30021/admin/error-logs',
  p_tags := ARRAY['realtime', 'high', 'instant-update']
) AS high_error_id;

-- Test 2: Update an existing error status (should update in real-time)
DO $$
DECLARE
    test_error_id UUID;
BEGIN
    -- Get the ID of one of our test errors
    SELECT id INTO test_error_id 
    FROM error_logs 
    WHERE tags @> ARRAY['realtime'] 
    ORDER BY occurred_at DESC 
    LIMIT 1;
    
    IF test_error_id IS NOT NULL THEN
        -- Update the status (should trigger real-time update)
        UPDATE error_logs 
        SET 
            status = 'investigating',
            assigned_to = 'Real-time Tester',
            resolution_notes = 'Testing real-time status update functionality'
        WHERE id = test_error_id;
        
        RAISE NOTICE 'Updated error % status to "investigating" - check UI for instant update', test_error_id;
    ELSE
        RAISE NOTICE 'No test errors found to update';
    END IF;
END $$;

-- Test 3: Insert a critical error (should show toast notification)
SELECT pg_sleep(1);

SELECT log_error(
  p_severity := 'critical',
  p_error_message := 'CRITICAL: Real-time test error - Should show toast notification!',
  p_error_code := 'REALTIME_CRITICAL',
  p_component_name := 'CriticalAlertComponent',
  p_file_path := 'services/critical-alert.ts',
  p_line_number := 789,
  p_function_name := 'triggerCriticalAlert',
  p_user_action := 'testing critical error real-time + toast',
  p_user_email := 'critical@example.com',
  p_url := 'http://localhost:30021/admin/error-logs',
  p_tags := ARRAY['realtime', 'critical', 'toast-test']
) AS critical_error_id;

-- Show what we just created
SELECT 
  id,
  severity,
  error_message,
  component_name,
  status,
  tags,
  occurred_at
FROM error_logs 
WHERE tags @> ARRAY['realtime']
ORDER BY occurred_at DESC;

-- Instructions for testing
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🧪 Real-time Error Log Testing Complete!';
    RAISE NOTICE '';
    RAISE NOTICE '✅ What should have happened in the UI:';
    RAISE NOTICE '   1. Medium severity error appeared instantly';
    RAISE NOTICE '   2. High severity error appeared 2 seconds later';
    RAISE NOTICE '   3. First error status updated to "investigating"';
    RAISE NOTICE '   4. Critical error appeared with toast notification';
    RAISE NOTICE '';
    RAISE NOTICE '🔍 Check the browser console for:';
    RAISE NOTICE '   - "📡 Realtime subscription status: SUBSCRIBED"';
    RAISE NOTICE '   - "🔔 New error log detected:" messages';
    RAISE NOTICE '   - "🔄 Error log updated:" message';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Expected UI behavior:';
    RAISE NOTICE '   - Green dot showing "Live updates"';
    RAISE NOTICE '   - Errors appear without page refresh';
    RAISE NOTICE '   - Status changes update instantly';
    RAISE NOTICE '   - Critical error shows toast notification';
    RAISE NOTICE '';
END $$;