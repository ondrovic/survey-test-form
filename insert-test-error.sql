-- Direct INSERT script to test error logging table
-- Run this in your Supabase SQL editor

-- First, let's see the current state
SELECT COUNT(*) as current_error_count FROM error_logs;

-- Insert a test error directly
INSERT INTO error_logs (
  severity,
  error_message,
  error_code,
  stack_trace,
  component_name,
  file_path,
  line_number,
  function_name,
  user_action,
  user_email,
  user_agent,
  ip_address,
  url,
  http_method,
  browser_info,
  screen_resolution,
  viewport_size,
  error_boundary,
  is_handled,
  additional_context,
  tags,
  status,
  occurred_at
) VALUES (
  'high',
  'Test error inserted via SQL - Database connection failed',
  'DB_CONNECTION_ERROR',
  'Error: Connection timeout
    at DatabaseService.connect (database.service.ts:45:12)
    at ErrorLoggingService.logError (error-logging.service.ts:78:5)',
  'DatabaseService',
  'services/database.service.ts',
  45,
  'connect',
  'attempting to save survey response',
  'testuser@example.com',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  '127.0.0.1',
  'http://localhost:30021/survey-test-form/',
  'POST',
  '{"language": "en-US", "platform": "Win32", "cookieEnabled": true, "onLine": true}',
  '1920x1080',
  '1366x768',
  false,
  true,
  '{"timestamp": "2025-08-27T13:30:00Z", "attemptNumber": 3, "timeout": 5000}',
  ARRAY['database', 'connection', 'test'],
  'open',
  NOW()
);

-- Verify the insert worked
SELECT 
  id,
  severity,
  error_message,
  component_name,
  file_path,
  line_number,
  user_email,
  tags,
  status,
  occurred_at
FROM error_logs 
ORDER BY occurred_at DESC 
LIMIT 3;

-- Check total count after insert
SELECT COUNT(*) as total_error_count FROM error_logs;