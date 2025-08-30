import { ReCaptchaVerificationResponse } from '@/types';
import { ErrorLoggingService } from '@/services/error-logging.service';

/**
 * reCAPTCHA utility functions for token verification
 */

/**
 * Verify reCAPTCHA token with Google's verification API
 * @param token - The reCAPTCHA token from the frontend
 * @param secretKey - The reCAPTCHA secret key (should be stored securely)
 * @returns Promise<boolean> - Whether the token is valid
 */
export async function verifyReCaptchaToken(
  token: string,
  secretKey: string
): Promise<boolean> {
  try {
    const response = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          secret: secretKey,
          response: token,
        }),
      }
    );

    if (!response.ok) {
      // Log the error using ErrorLoggingService
      ErrorLoggingService.logError({
        severity: 'medium',
        errorMessage: `reCAPTCHA verification request failed: ${response.statusText}`,
        stackTrace: `HTTP ${response.status}: ${response.statusText}`,
        componentName: 'ReCaptchaUtils',
        functionName: 'verifyReCaptchaToken',
        userAction: 'Verifying reCAPTCHA token',
        additionalContext: {
          statusCode: response.status,
          statusText: response.statusText,
          errorType: 'recaptcha_verification_request'
        },
        tags: ['utils', 'recaptcha', 'security']
      });
      
      return false;
    }

    const data: ReCaptchaVerificationResponse = await response.json();

    if (!data.success) {
      // Log the error using ErrorLoggingService
      ErrorLoggingService.logError({
        severity: 'medium',
        errorMessage: `reCAPTCHA verification failed: ${data["error-codes"]?.join(', ') || 'Unknown error'}`,
        stackTrace: JSON.stringify(data),
        componentName: 'ReCaptchaUtils',
        functionName: 'verifyReCaptchaToken',
        userAction: 'Verifying reCAPTCHA token',
        additionalContext: {
          errorCodes: data["error-codes"],
          errorType: 'recaptcha_verification_failed'
        },
        tags: ['utils', 'recaptcha', 'security']
      });
      
      return false;
    }

    return true;
  } catch (error) {
    // Log the error using ErrorLoggingService
    ErrorLoggingService.logError({
      severity: 'medium',
      errorMessage: error instanceof Error ? error.message : 'Error verifying reCAPTCHA token',
      stackTrace: error instanceof Error ? error.stack : String(error),
      componentName: 'ReCaptchaUtils',
      functionName: 'verifyReCaptchaToken',
      userAction: 'Verifying reCAPTCHA token',
      additionalContext: {
        errorType: 'recaptcha_verification_exception',
        hasSecretKey: !!secretKey,
        hasToken: !!token
      },
      tags: ['utils', 'recaptcha', 'security']
    });
    
    return false;
  }
}

/**
 * Simple client-side reCAPTCHA verification (for when secret key is not available)
 * Note: For production use, implement server-side verification
 * @param token - The reCAPTCHA token from the frontend
 * @returns Promise<boolean> - Whether the token is valid
 */
export async function verifyReCaptchaTokenClientSide(
  token: string
): Promise<boolean> {
  // For now, just check if token exists
  // In production, you should implement proper server-side verification
  // using Supabase Edge Functions or similar server-side solution
  if (!token || token.trim() === '') {
    // Log the error using ErrorLoggingService
    ErrorLoggingService.logError({
      severity: 'medium',
      errorMessage: 'reCAPTCHA token is empty',
      stackTrace: 'Empty token validation',
      componentName: 'ReCaptchaUtils',
      functionName: 'verifyReCaptchaTokenClientSide',
      userAction: 'Client-side reCAPTCHA token validation',
      additionalContext: {
        errorType: 'recaptcha_empty_token',
        tokenProvided: !!token
      },
      tags: ['utils', 'recaptcha', 'security', 'client-side']
    });
    
    return false;
  }
  
  // Basic token format validation
  if (token.length < 20) {
    // Log the error using ErrorLoggingService
    ErrorLoggingService.logError({
      severity: 'medium',
      errorMessage: 'reCAPTCHA token appears to be invalid (too short)',
      stackTrace: 'Token format validation',
      componentName: 'ReCaptchaUtils',
      functionName: 'verifyReCaptchaTokenClientSide',
      userAction: 'Client-side reCAPTCHA token validation',
      additionalContext: {
        errorType: 'recaptcha_invalid_token_format',
        tokenLength: token.length,
        expectedMinLength: 20
      },
      tags: ['utils', 'recaptcha', 'security', 'client-side']
    });
    
    return false;
  }
  
  // Server-side verification with ReCaptcha API
  try {
    const response = await fetch('/api/verify-recaptcha', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token })
    });

    if (!response.ok) {
      ErrorLoggingService.logError({
        severity: 'high',
        errorMessage: 'ReCaptcha verification API request failed',
        stackTrace: `HTTP ${response.status}: ${response.statusText}`,
        componentName: 'ReCaptchaUtils',
        functionName: 'verifyReCaptchaTokenClientSide',
        userAction: 'Server-side reCAPTCHA verification',
        additionalContext: {
          errorType: 'recaptcha_api_request_failed',
          status: response.status,
          statusText: response.statusText
        },
        tags: ['utils', 'recaptcha', 'security', 'server-side']
      });
      return false;
    }

    const data = await response.json();
    
    if (data.success) {
      return true;
    } else {
      ErrorLoggingService.logError({
        severity: 'medium',
        errorMessage: 'ReCaptcha token verification failed',
        stackTrace: 'Server-side token verification',
        componentName: 'ReCaptchaUtils',
        functionName: 'verifyReCaptchaTokenClientSide',
        userAction: 'Server-side reCAPTCHA verification',
        additionalContext: {
          errorType: 'recaptcha_verification_failed',
          errorCodes: data['error-codes'] || [],
          score: data.score
        },
        tags: ['utils', 'recaptcha', 'security', 'server-side']
      });
      return false;
    }
  } catch (error) {
    ErrorLoggingService.logError({
      severity: 'high',
      errorMessage: 'ReCaptcha verification request failed',
      stackTrace: error instanceof Error ? error.stack : String(error),
      componentName: 'ReCaptchaUtils',
      functionName: 'verifyReCaptchaTokenClientSide',
      userAction: 'Server-side reCAPTCHA verification',
      additionalContext: {
        errorType: 'recaptcha_request_error'
      },
      tags: ['utils', 'recaptcha', 'security', 'server-side']
    });
    
    // In case of server error, fall back to allowing the request
    // This prevents ReCaptcha issues from completely blocking users
    return true;
  }
}

/**
 * Get reCAPTCHA site key from environment variables
 * @returns string | undefined - The site key or undefined if not configured
 */
export const getReCaptchaSiteKey = (): string | undefined => {
  return import.meta.env.VITE_RECAPTCHA_SITE_KEY;
}

/**
 * Check if reCAPTCHA is properly configured
 * @returns boolean - Whether reCAPTCHA is configured
 */
export const isReCaptchaConfigured = (): boolean => {
  return !!getReCaptchaSiteKey();
}