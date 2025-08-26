import { SupabaseClientService } from "./supabase-client.service";

export interface SendSurveyEmailRequest {
  surveyInstanceId: string;
  sessionId: string;
  recipientEmail: string;
  surveyResponses: Record<string, any>;
  surveyTitle?: string;
}

export interface SendSurveyEmailResponse {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Service for sending survey-related emails via Supabase Edge Functions
 */
export class EmailService {
  private static instance: EmailService;
  private clientService: SupabaseClientService;

  private constructor() {
    this.clientService = SupabaseClientService.getInstance();
  }

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  /**
   * Send survey completion email via Supabase Edge Function
   */
  async sendSurveyCompletionEmail(request: SendSurveyEmailRequest): Promise<SendSurveyEmailResponse> {
    try {
      const client = this.clientService.getCurrentClient();
      
      const { data, error } = await client.functions.invoke('send-survey-email', {
        body: request
      });

      if (error) {
        console.error('Error invoking send-survey-email function:', error);
        throw new Error(`Email function error: ${error.message}`);
      }

      if (data && !data.success) {
        console.error('Email function returned error:', data.error);
        throw new Error(data.error || 'Email sending failed');
      }

      console.log('✅ Survey completion email sent successfully:', data?.message);
      return data as SendSurveyEmailResponse;

    } catch (error) {
      console.error('❌ Failed to send survey completion email:', error);
      
      // Return error response instead of throwing to prevent breaking the survey completion flow
      return {
        success: false,
        message: 'Failed to send email notification',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export singleton instance
export const emailService = EmailService.getInstance();