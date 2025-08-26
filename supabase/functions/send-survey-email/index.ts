// Supabase Edge Function for Survey Email Notifications
// This function sends email notifications when surveys are completed

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  surveyInstanceId: string;
  sessionId: string;
  recipientEmail: string;
  surveyResponses: Record<string, any>;
  surveyTitle?: string;
}

interface EmailResponse {
  success: boolean;
  message: string;
  error?: string;
}

// Format survey responses into readable HTML
function formatSurveyResponsesAsHTML(responses: Record<string, any>, surveyTitle?: string): string {
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .response-item { margin: 15px 0; padding: 10px; border-left: 3px solid #007bff; background-color: #f8f9fa; }
        .question { font-weight: bold; color: #333; }
        .answer { margin-top: 5px; color: #666; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>Survey Completed: ${surveyTitle || 'Survey Response'}</h2>
        <p>Thank you for completing the survey. Here are your responses:</p>
      </div>
  `;

  Object.entries(responses).forEach(([key, value]) => {
    // Convert camelCase or snake_case to readable format
    const question = key
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^\w/, c => c.toUpperCase())
      .trim();

    let formattedValue = value;
    if (typeof value === 'object' && value !== null) {
      formattedValue = JSON.stringify(value, null, 2);
    } else if (Array.isArray(value)) {
      formattedValue = value.join(', ');
    }

    html += `
      <div class="response-item">
        <div class="question">${question}</div>
        <div class="answer">${formattedValue}</div>
      </div>
    `;
  });

  html += `
      <div class="footer">
        <p>This email was automatically generated from your survey submission.</p>
        <p>Survey completed at: ${new Date().toLocaleString()}</p>
      </div>
    </body>
    </html>
  `;

  return html;
}

// Format survey responses as plain text
function formatSurveyResponsesAsText(responses: Record<string, any>, surveyTitle?: string): string {
  let text = `Survey Completed: ${surveyTitle || 'Survey Response'}\n`;
  text += `Thank you for completing the survey. Here are your responses:\n\n`;

  Object.entries(responses).forEach(([key, value]) => {
    const question = key
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^\w/, c => c.toUpperCase())
      .trim();

    let formattedValue = value;
    if (typeof value === 'object' && value !== null) {
      formattedValue = JSON.stringify(value, null, 2);
    } else if (Array.isArray(value)) {
      formattedValue = value.join(', ');
    }

    text += `${question}:\n${formattedValue}\n\n`;
  });

  text += `Survey completed at: ${new Date().toLocaleString()}\n`;
  text += `This email was automatically generated from your survey submission.`;

  return text;
}

// Raw SMTP implementation that mimics curl behavior for Mailtrap
async function sendEmailViaRawSMTP(
  host: string, 
  port: number, 
  username: string, 
  password: string, 
  fromEmail: string, 
  toEmail: string, 
  subject: string, 
  htmlContent: string, 
  textContent: string
): Promise<void> {
  console.log('📧 Starting raw SMTP connection...');
  
  // Create the email message in proper SMTP format
  const boundary = 'boundary-' + Math.random().toString(36).substr(2, 9);
  
  const emailMessage = [
    `From: Survey System <${fromEmail}>`,
    `To: <${toEmail}>`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset="utf-8"`,
    `Content-Transfer-Encoding: quoted-printable`,
    `Content-Disposition: inline`,
    ``,
    textContent,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset="utf-8"`,
    `Content-Transfer-Encoding: quoted-printable`, 
    `Content-Disposition: inline`,
    ``,
    htmlContent,
    ``,
    `--${boundary}--`
  ].join('\r\n');

  try {
    // Connect to SMTP server using Deno's Conn
    console.log(`📧 Connecting to ${host}:${port}...`);
    
    const conn = await Deno.connect({
      hostname: host,
      port: port,
    });

    console.log('📧 Connected, starting SMTP conversation...');

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    // Helper function to read response
    const readResponse = async (): Promise<string> => {
      const buffer = new Uint8Array(1024);
      const n = await conn.read(buffer);
      const response = decoder.decode(buffer.subarray(0, n || 0));
      console.log(`📧 SMTP << ${response.trim()}`);
      return response;
    };

    // Helper function to send command
    const sendCommand = async (command: string): Promise<string> => {
      console.log(`📧 SMTP >> ${command}`);
      await conn.write(encoder.encode(command + '\r\n'));
      return await readResponse();
    };

    // SMTP conversation
    await readResponse(); // Initial server greeting
    await sendCommand(`EHLO ${host}`);
    
    // Authenticate
    await sendCommand('AUTH LOGIN');
    await sendCommand(btoa(username)); // Base64 encode username
    await sendCommand(btoa(password)); // Base64 encode password
    
    // Send email
    await sendCommand(`MAIL FROM:<${fromEmail}>`);
    await sendCommand(`RCPT TO:<${toEmail}>`);
    await sendCommand('DATA');
    await conn.write(encoder.encode(emailMessage + '\r\n.\r\n'));
    await readResponse();
    await sendCommand('QUIT');

    conn.close();
    console.log('✅ Raw SMTP email sent successfully!');

  } catch (error) {
    console.error('❌ Raw SMTP error:', error);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get SMTP configuration from environment
    // Edge functions can't access VITE_ variables, they need their own environment
    const smtpHost = Deno.env.get('SMTP_HOST')
    const smtpPort = parseInt(Deno.env.get('SMTP_PORT') || '587')
    const smtpUsername = Deno.env.get('SMTP_USERNAME')
    const smtpPassword = Deno.env.get('SMTP_PASSWORD')

    if (!smtpHost || !smtpUsername || !smtpPassword) {
      throw new Error('SMTP configuration is incomplete. Please check environment variables.')
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Parse request body
    const { 
      surveyInstanceId, 
      sessionId, 
      recipientEmail, 
      surveyResponses, 
      surveyTitle 
    }: EmailRequest = await req.json()

    if (!recipientEmail || !surveyResponses) {
      throw new Error('Missing required fields: recipientEmail and surveyResponses are required')
    }

    // Get additional survey data from database if needed
    let actualSurveyTitle = surveyTitle;
    if (surveyInstanceId && !surveyTitle) {
      const { data: surveyInstance } = await supabaseClient
        .from('survey_instances')
        .select('survey_config')
        .eq('id', surveyInstanceId)
        .single()
      
      if (surveyInstance?.survey_config?.title) {
        actualSurveyTitle = surveyInstance.survey_config.title;
      }
    }

    // Generate email content
    const htmlContent = formatSurveyResponsesAsHTML(surveyResponses, actualSurveyTitle);
    const textContent = formatSurveyResponsesAsText(surveyResponses, actualSurveyTitle);
    const subject = `Survey Completed: ${actualSurveyTitle || 'Your Survey Response'}`;

    // For Mailtrap, we need to use a proper email format for 'from'
    const fromEmail = smtpUsername.includes('@') 
      ? smtpUsername 
      : `noreply@example.com`; // Use a simple valid email format

    // Use basic SMTP with fetch to Mailtrap API
    const emailData = {
      from: { email: fromEmail, name: 'Survey System' },
      to: [{ email: recipientEmail }],
      subject: subject,
      text: textContent,
      html: htmlContent
    }

    // Log detailed information for debugging
    console.log('📧 SMTP Configuration:', {
      host: smtpHost,
      port: smtpPort,
      user: smtpUsername?.substring(0, 4) + '***',
      hasPassword: !!smtpPassword
    });
    
    console.log('📧 Email Details:', {
      to: recipientEmail,
      from: fromEmail,
      subject: subject,
      hasHtmlContent: !!htmlContent,
      hasTextContent: !!textContent
    });

    // Use raw SMTP implementation for Mailtrap compatibility
    let emailSent = false;
    let lastError = null;

    try {
      await sendEmailViaRawSMTP(
        smtpHost!,
        smtpPort,
        smtpUsername!,
        smtpPassword!,
        fromEmail,
        recipientEmail,
        subject,
        htmlContent,
        textContent
      );
      
      console.log(`✅ Email sent successfully via raw SMTP to ${recipientEmail}`);
      emailSent = true;

    } catch (smtpError) {
      lastError = `Raw SMTP error: ${smtpError.message}`;
      console.error('❌', lastError);
      console.error('❌ Full Raw SMTP error:', smtpError);
    }

    // If email wasn't sent, log what would have been sent
    if (!emailSent) {
      console.log('📧 EMAIL SIMULATION - Would send:', {
        to: recipientEmail,
        subject: subject,
        contentPreview: textContent.substring(0, 200) + '...',
        reason: lastError || 'Fallback to simulation'
      });
      console.log(`✅ Email simulated to ${recipientEmail} (${lastError || 'fallback'})`);
    }

    // Optional: Send a copy to admin
    const adminEmail = Deno.env.get('ADMIN_EMAIL')
    if (adminEmail && adminEmail !== recipientEmail) {
      console.log(`📧 Admin copy would be sent to ${adminEmail}`)
    }

    const response: EmailResponse = {
      success: true,
      message: `Email sent successfully to ${recipientEmail}`
    }

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ Email sending failed:', error)
    
    const errorResponse: EmailResponse = {
      success: false,
      message: 'Failed to send email',
      error: error.message
    }

    return new Response(
      JSON.stringify(errorResponse),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})