# Simple Supabase Setup (No RLS)

## Quick Fix for RLS Issues

Instead of dealing with complex Row Level Security policies and service role keys, we're disabling RLS entirely for simpler development.

## Step 1: Disable RLS Policies

Run this SQL script in your Supabase SQL Editor:

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project: `gmzoqgdzdpuwsoqluoen`
3. Go to **SQL Editor**
4. Run the script from `scripts/disable-rls.sql`

Or copy/paste this SQL:

```sql
-- Disable RLS on all tables to allow unrestricted access
ALTER TABLE public.survey_configs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_instances DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.radio_option_sets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.multi_select_option_sets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_responses DISABLE ROW LEVEL SECURITY;

-- Drop any existing RLS policies
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
```

## Step 2: Update Environment (Optional)

You can remove the service role key from your environment since it's no longer needed:

```env
# Only need these two now:
VITE_SUPABASE_URL=https://gmzoqgdzdpuwsoqluoen.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# This is no longer required:
# VITE_SUPABASE_SERVICE_ROLE_KEY=...
```

## What This Does

- ✅ **Removes all security restrictions** on database operations
- ✅ **Uses only the anonymous key** for all operations  
- ✅ **Eliminates RLS policy errors** completely
- ✅ **Simplifies deployment** - no secret keys needed
- ✅ **Single client** handles everything

## Security Note

⚠️ **This approach removes database security entirely**. It's fine for:
- Development environments
- Internal tools
- Trusted user bases
- MVP/prototype applications

For production applications with public access, you'd want to implement proper authentication and RLS policies.

## Testing

After running the SQL script, restart your application and try:
- ✅ Adding survey configurations
- ✅ Creating survey instances  
- ✅ Adding option sets
- ✅ All admin operations should work without any service role key

The application will automatically fall back to using the regular anonymous client for all operations.