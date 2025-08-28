-- Check if error_logs table exists and its configuration

-- Check if error_logs table exists
SELECT 'Table existence check' as test,
       CASE WHEN EXISTS (
         SELECT 1 FROM information_schema.tables 
         WHERE table_schema = 'public' 
         AND table_name = 'error_logs'
       ) THEN 'EXISTS' ELSE 'MISSING' END as status;

-- If table exists, check RLS status specifically for error_logs
SELECT 'error_logs RLS status' as test,
       schemaname, 
       tablename, 
       rowsecurity as rls_enabled,
       CASE WHEN rowsecurity THEN 'RLS ENABLED' ELSE 'RLS DISABLED' END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'error_logs';

-- Check if error_logs is in realtime publication
SELECT 'error_logs realtime status' as test,
       CASE WHEN EXISTS (
         SELECT 1 FROM pg_publication_tables 
         WHERE pubname = 'supabase_realtime' 
         AND schemaname = 'public'
         AND tablename = 'error_logs'
       ) THEN 'REALTIME ENABLED' ELSE 'REALTIME DISABLED' END as status;

-- List all tables in public schema to see what exists
SELECT 'public schema tables' as info, 
       string_agg(table_name, ', ') as tables
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE';

-- Show all realtime-enabled tables
SELECT 'realtime tables' as info,
       string_agg(schemaname || '.' || tablename, ', ') as tables
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';

-- Test simple insert if table exists
DO $$
BEGIN
    -- Check if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'error_logs') THEN
        -- Try to insert
        INSERT INTO error_logs (severity, error_message, error_code) 
        VALUES ('high', 'Table exists test - should trigger realtime', 'TABLE_EXISTS_TEST');
        
        RAISE NOTICE 'SUCCESS: error_logs table exists and insert succeeded';
        RAISE NOTICE 'Watch browser console for realtime event';
    ELSE
        RAISE NOTICE 'ERROR: error_logs table does NOT exist!';
        RAISE NOTICE 'You need to run: yarn db:reset';
    END IF;
END $$;