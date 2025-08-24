-- Disable RLS on all tables to allow unrestricted access
-- This simplifies development by removing Row Level Security restrictions

-- Survey configuration tables
ALTER TABLE public.survey_configs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_instances DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_sessions DISABLE ROW LEVEL SECURITY;

-- Response tables
ALTER TABLE public.survey_responses DISABLE ROW LEVEL SECURITY;

-- Option sets tables
ALTER TABLE public.rating_scales DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.radio_option_sets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.multi_select_option_sets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.select_option_sets DISABLE ROW LEVEL SECURITY;

-- Audit tables
ALTER TABLE public.survey_instance_status_changes DISABLE ROW LEVEL SECURITY;

-- Drop any existing RLS policies if they exist
DROP POLICY IF EXISTS "survey_configs_admin_all" ON public.survey_configs;
DROP POLICY IF EXISTS "survey_configs_anonymous_read" ON public.survey_configs;

DROP POLICY IF EXISTS "survey_instances_admin_all" ON public.survey_instances;
DROP POLICY IF EXISTS "survey_instances_anonymous_read" ON public.survey_instances;

DROP POLICY IF EXISTS "survey_sessions_admin_all" ON public.survey_sessions;
DROP POLICY IF EXISTS "survey_sessions_anonymous_insert" ON public.survey_sessions;
DROP POLICY IF EXISTS "survey_sessions_anonymous_update" ON public.survey_sessions;

DROP POLICY IF EXISTS "survey_responses_admin_read_update" ON public.survey_responses;
DROP POLICY IF EXISTS "survey_responses_admin_update" ON public.survey_responses;
DROP POLICY IF EXISTS "survey_responses_anonymous_insert" ON public.survey_responses;

DROP POLICY IF EXISTS "rating_scales_admin_all" ON public.rating_scales;
DROP POLICY IF EXISTS "rating_scales_anonymous_read" ON public.rating_scales;

DROP POLICY IF EXISTS "radio_option_sets_admin_all" ON public.radio_option_sets;
DROP POLICY IF EXISTS "radio_option_sets_anonymous_read" ON public.radio_option_sets;

DROP POLICY IF EXISTS "multi_select_option_sets_admin_all" ON public.multi_select_option_sets;
DROP POLICY IF EXISTS "multi_select_option_sets_anonymous_read" ON public.multi_select_option_sets;

DROP POLICY IF EXISTS "select_option_sets_admin_all" ON public.select_option_sets;
DROP POLICY IF EXISTS "select_option_sets_anonymous_read" ON public.select_option_sets;

DROP POLICY IF EXISTS "survey_instance_status_changes_admin_read" ON public.survey_instance_status_changes;
DROP POLICY IF EXISTS "survey_instance_status_changes_system_insert" ON public.survey_instance_status_changes;

-- Note: With RLS disabled, all operations will work with the anonymous key
-- This is simpler for development but less secure for production