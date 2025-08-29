import { SupabaseClientService } from "./supabase-client.service";
import { ErrorLoggingService } from './error-logging.service';

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
    try {
      this.clientService = SupabaseClientService.getInstance();
    } catch (error) {
      console.error('❌ Failed to initialize EmailService:', error);
      
      // Log critical error for service initialization failure
      ErrorLoggingService.logError({
        severity: 'critical',
        errorMessage: `EmailService initialization failed: ${error instanceof Error ? error.message : 'Unknown initialization error'}`,
        stackTrace: error instanceof Error ? error.stack : String(error),
        componentName: 'EmailService',
        functionName: 'constructor',
        userAction: 'initializing email service',
        additionalContext: {
          errorType: error?.constructor?.name || 'Unknown',
          timestamp: new Date().toISOString(),
          serviceName: 'EmailService'
        },
        tags: ['email', 'service', 'initialization', 'critical', 'constructor']
      }).catch(logError => {
        console.error('Failed to log EmailService initialization error:', logError);
      });
      
      throw error; // Re-throw to prevent broken service instance
    }
  }

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      try {
        EmailService.instance = new EmailService();
      } catch (error) {
        console.error('❌ Failed to create EmailService instance:', error);
        
        // Log critical error for service instance creation failure
        ErrorLoggingService.logError({
          severity: 'critical',
          errorMessage: `EmailService instance creation failed: ${error instanceof Error ? error.message : 'Unknown instance creation error'}`,
          stackTrace: error instanceof Error ? error.stack : String(error),
          componentName: 'EmailService',
          functionName: 'getInstance',
          userAction: 'creating email service singleton instance',
          additionalContext: {
            errorType: error?.constructor?.name || 'Unknown',
            timestamp: new Date().toISOString(),
            serviceName: 'EmailService',
            methodType: 'static'
          },
          tags: ['email', 'service', 'initialization', 'critical', 'singleton']
        }).catch(logError => {
          console.error('Failed to log EmailService getInstance error:', logError);
        });
        
        throw error; // Re-throw to prevent broken service usage
      }
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
        
        // Log to database with high severity for email function invocation failure
        await ErrorLoggingService.logError({
          severity: 'high',
          errorMessage: `Failed to invoke send-survey-email Edge Function: ${error.message}`,
          stackTrace: error instanceof Error ? error.stack : String(error),
          componentName: 'EmailService',
          functionName: 'sendSurveyCompletionEmail',
          userAction: 'sending survey completion notification email',
          additionalContext: {
            surveyInstanceId: request.surveyInstanceId,
            sessionId: request.sessionId,
            surveyTitle: request.surveyTitle,
            recipientEmailDomain: request.recipientEmail?.split('@')[1], // Only log domain for privacy
            functionName: 'send-survey-email',
            errorDetails: error
          },
          tags: ['email', 'service', 'notification', 'edge-function', 'survey-completion']
        });
        
        throw new Error(`Email function error: ${error.message}`);
      }

      if (data && !data.success) {
        console.error('Email function returned error:', data.error);
        
        // Log to database with high severity for email sending failure
        await ErrorLoggingService.logError({
          severity: 'high',
          errorMessage: `Survey completion email sending failed: ${data.error || 'Unknown email service error'}`,
          stackTrace: data.error ? String(data.error) : 'No stack trace available',
          componentName: 'EmailService',
          functionName: 'sendSurveyCompletionEmail',
          userAction: 'sending survey completion notification email',
          additionalContext: {
            surveyInstanceId: request.surveyInstanceId,
            sessionId: request.sessionId,
            surveyTitle: request.surveyTitle,
            recipientEmailDomain: request.recipientEmail?.split('@')[1], // Only log domain for privacy
            functionResponse: data,
            functionName: 'send-survey-email'
          },
          tags: ['email', 'service', 'notification', 'survey-completion', 'sending-failed']
        });
        
        throw new Error(data.error || 'Email sending failed');
      }

      console.log('✅ Survey completion email sent successfully:', data?.message);
      return data as SendSurveyEmailResponse;

    } catch (error) {
      console.error('❌ Failed to send survey completion email:', error);
      
      // Log to database with high severity for survey completion email failure
      await ErrorLoggingService.logError({
        severity: 'high',
        errorMessage: `Critical failure in survey completion email process: ${error instanceof Error ? error.message : 'Unknown error'}`,
        stackTrace: error instanceof Error ? error.stack : String(error),
        componentName: 'EmailService',
        functionName: 'sendSurveyCompletionEmail',
        userAction: 'sending survey completion notification email',
        additionalContext: {
          surveyInstanceId: request.surveyInstanceId,
          sessionId: request.sessionId,
          surveyTitle: request.surveyTitle,
          recipientEmailDomain: request.recipientEmail?.split('@')[1], // Only log domain for privacy
          requestBody: {
            surveyInstanceId: request.surveyInstanceId,
            sessionId: request.sessionId,
            surveyTitle: request.surveyTitle,
            hasResponses: !!request.surveyResponses && Object.keys(request.surveyResponses).length > 0
          },
          errorType: error?.constructor?.name || 'Unknown',
          timestamp: new Date().toISOString()
        },
        tags: ['email', 'service', 'notification', 'survey-completion', 'critical-failure']
      });
      
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