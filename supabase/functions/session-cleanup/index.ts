import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CleanupResult {
  timestamp: string;
  abandoned_sessions?: number;
  expired_sessions?: number;
  success: boolean;
  message: string;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🧹 Starting session cleanup...')

    // Call the database function to perform cleanup
    const { data, error } = await supabaseClient
      .rpc('cleanup_survey_sessions')

    if (error) {
      console.error('❌ Database cleanup function failed:', error)
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
          message: 'Failed to execute cleanup function'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    const result: CleanupResult = data as CleanupResult
    console.log('✅ Cleanup completed:', result)

    // Optional: Log the cleanup results to a monitoring table
    if (result.success) {
      try {
        await supabaseClient
          .from('system_logs')
          .insert({
            event_type: 'session_cleanup',
            data: result,
            created_at: new Date().toISOString()
          })
      } catch (logError) {
        // Ignore logging errors - they shouldn't fail the cleanup
        console.warn('⚠️ Failed to log cleanup results:', logError)
      }
    }

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('❌ Session cleanup failed:', error)
    
    const errorResult: CleanupResult = {
      timestamp: new Date().toISOString(),
      success: false,
      message: 'Session cleanup failed with unexpected error',
      error: error.message
    }

    return new Response(
      JSON.stringify(errorResult),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})