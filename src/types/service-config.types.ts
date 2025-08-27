/**
 * Service Configuration Type Definitions
 * 
 * Configuration interfaces for external services including Supabase,
 * reCAPTCHA, and other third-party service integrations.
 */

/**
 * Supabase client configuration
 */
export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}

/**
 * Response structure from Google's reCAPTCHA verification API
 */
export interface ReCaptchaVerificationResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
}