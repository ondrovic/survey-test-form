-- Disable RLS on all tables to allow unrestricted access
-- This simplifies development by removing Row Level Security restrictions

-- Survey configuration tables
ALTER TABLE public.survey_configs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_instances DISABLE ROW LEVEL SECURITY;

-- Option sets tables
ALTER TABLE public.radio_option_sets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.multi_select_option_sets DISABLE ROW LEVEL SECURITY;

-- Response tables
ALTER TABLE public.survey_responses DISABLE ROW LEVEL SECURITY;

-- Drop any existing RLS policies if they exist
DROP POLICY IF EXISTS "survey_configs_select" ON public.survey_configs;
DROP POLICY IF EXISTS "survey_configs_insert" ON public.survey_configs;
DROP POLICY IF EXISTS "survey_configs_update" ON public.survey_configs;
DROP POLICY IF EXISTS "survey_configs_delete" ON public.survey_configs;

DROP POLICY IF EXISTS "survey_instances_select" ON public.survey_instances;
DROP POLICY IF EXISTS "survey_instances_insert" ON public.survey_instances;
DROP POLICY IF EXISTS "survey_instances_update" ON public.survey_instances;
DROP POLICY IF EXISTS "survey_instances_delete" ON public.survey_instances;

DROP POLICY IF EXISTS "radio_option_sets_select" ON public.radio_option_sets;
DROP POLICY IF EXISTS "radio_option_sets_insert" ON public.radio_option_sets;
DROP POLICY IF EXISTS "radio_option_sets_update" ON public.radio_option_sets;
DROP POLICY IF EXISTS "radio_option_sets_delete" ON public.radio_option_sets;

DROP POLICY IF EXISTS "multi_select_option_sets_select" ON public.multi_select_option_sets;
DROP POLICY IF EXISTS "multi_select_option_sets_insert" ON public.multi_select_option_sets;
DROP POLICY IF EXISTS "multi_select_option_sets_update" ON public.multi_select_option_sets;
DROP POLICY IF EXISTS "multi_select_option_sets_delete" ON public.multi_select_option_sets;

DROP POLICY IF EXISTS "survey_responses_select" ON public.survey_responses;
DROP POLICY IF EXISTS "survey_responses_insert" ON public.survey_responses;
DROP POLICY IF EXISTS "survey_responses_update" ON public.survey_responses;
DROP POLICY IF EXISTS "survey_responses_delete" ON public.survey_responses;

-- Note: With RLS disabled, all operations will work with the anonymous key
-- This is simpler for development but less secure for production