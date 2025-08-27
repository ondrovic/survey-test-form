-- Test Error Logging Script
-- Run this in your Supabase SQL editor to simulate adding an error

-- First, let's see the current state of error logs
SELECT 
  id,
  severity,
  error_message,
  component_name,
  occurred_at,
  status
FROM error_logs 
ORDER BY occurred_at DESC 
LIMIT 5;

-- Add a test error using the log_error function
SELECT log_error(
  p_severity := 'medium',
  p_error_message := 'Test error from SQL - Button click failed',
  p_error_code := 'CLICK_ERROR',
  p_stack_trace := 'at handleClick (button.tsx:42:12)\nat onClick (app.tsx:123:5)',
  p_component_name := 'TestButton',
  p_file_path := 'components/test-button.tsx',
  p_line_number := 42,
  p_function_name := 'handleClick',
  p_user_action := 'clicked submit button',
  p_user_id := null,
  p_user_email := 'test@example.com',
  p_session_token := null,
  p_survey_instance_id := null,
  p_user_agent := 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  p_ip_address := '127.0.0.1',
  p_url := 'http://localhost:30021/survey-test-form/',
  p_http_method := 'GET',
  p_browser_info := '{"language": "en-US", "platform": "Win32", "cookieEnabled": true}',
  p_screen_resolution := '1920x1080',
  p_viewport_size := '1366x768',
  p_error_boundary := false,
  p_is_handled := true,
  p_additional_context := '{"timestamp": "2025-08-27T13:30:00Z", "formData": {"field1": "value1"}}',
  p_tags := ARRAY['test', 'manual', 'sql']
) AS error_id;

-- Check if the error was added successfully
SELECT 
  id,
  severity,
  error_message,
  component_name,
  file_path,
  line_number,
  function_name,
  user_email,
  url,
  tags,
  occurred_at,
  status
FROM error_logs 
WHERE tags @> ARRAY['test']
ORDER BY occurred_at DESC 
LIMIT 1;

-- Get error statistics to see the counts
SELECT * FROM get_error_statistics(24, null);