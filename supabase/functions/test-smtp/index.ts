import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { SmtpClient } from 'https://deno.land/x/smtp@v0.7.0/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const smtpHost = Deno.env.get('SMTP_HOST')
    const smtpPort = parseInt(Deno.env.get('SMTP_PORT') || '2525')
    const smtpUsername = Deno.env.get('SMTP_USERNAME')
    const smtpPassword = Deno.env.get('SMTP_PASSWORD')

    console.log('🔧 SMTP Test - Environment Variables:', {
      host: smtpHost,
      port: smtpPort,
      username: smtpUsername?.substring(0, 4) + '***',
      hasPassword: !!smtpPassword,
      passwordLength: smtpPassword?.length
    })

    if (!smtpHost || !smtpUsername || !smtpPassword) {
      throw new Error('Missing SMTP configuration')
    }

    console.log('📧 Testing SMTP connection...')
    
    const client = new SmtpClient()
    
    try {
      // Try non-TLS first for Mailtrap sandbox
      console.log('📧 Attempting non-TLS connection...')
      await client.connect({
        hostname: smtpHost,
        port: smtpPort,
        username: smtpUsername,
        password: smtpPassword,
      })

      console.log('✅ Non-TLS SMTP connection successful!')

      await client.send({
        from: 'test@example.com',
        to: 'ondrovic@gmail.com',
        subject: 'SMTP Test from Supabase Edge Function',
        content: 'This is a test email to verify SMTP connection is working.',
        html: '<h1>SMTP Test</h1><p>This is a test email to verify SMTP connection is working.</p>',
      })

      console.log('✅ Test email sent successfully!')
      await client.close()

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'SMTP test successful',
          connectionType: 'non-TLS'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } catch (nonTlsError) {
      console.log('❌ Non-TLS failed, trying TLS...', nonTlsError.message)
      
      try {
        await client.connectTLS({
          hostname: smtpHost,
          port: smtpPort,
          username: smtpUsername,
          password: smtpPassword,
        })

        console.log('✅ TLS SMTP connection successful!')

        await client.send({
          from: 'test@example.com',
          to: 'ondrovic@gmail.com',
          subject: 'SMTP Test from Supabase Edge Function (TLS)',
          content: 'This is a test email to verify TLS SMTP connection is working.',
          html: '<h1>SMTP Test (TLS)</h1><p>This is a test email to verify TLS SMTP connection is working.</p>',
        })

        console.log('✅ TLS test email sent successfully!')
        await client.close()

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'SMTP test successful',
            connectionType: 'TLS'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      } catch (tlsError) {
        console.error('❌ Both TLS and non-TLS failed')
        console.error('❌ Non-TLS error:', nonTlsError)
        console.error('❌ TLS error:', tlsError)
        throw new Error(`Both connection types failed: ${tlsError.message}`)
      }
    }

  } catch (error) {
    console.error('❌ SMTP Test failed:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        message: 'SMTP test failed',
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})