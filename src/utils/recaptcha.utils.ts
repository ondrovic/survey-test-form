
/**
 * reCAPTCHA utility functions for token verification
 */

interface ReCaptchaVerificationResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
}

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
      console.error(
        "reCAPTCHA verification request failed:",
        response.statusText
      );
      return false;
    }

    const data: ReCaptchaVerificationResponse = await response.json();

    if (!data.success) {
      console.error("reCAPTCHA verification failed:", data["error-codes"]);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error verifying reCAPTCHA token:", error);
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
    console.error("reCAPTCHA token is empty");
    return false;
  }
  
  // Basic token format validation
  if (token.length < 20) {
    console.error("reCAPTCHA token appears to be invalid");
    return false;
  }
  
  // TODO: Implement proper server-side verification with Supabase Edge Functions
  console.log("reCAPTCHA token received and basic validation passed");
  return true;
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

// /**
//  * Simple client-side reCAPTCHA verification
//  * Note: For production use, implement server-side verification
//  * @param token - The reCAPTCHA token from the frontend
//  * @returns Promise<boolean> - Whether the token is valid
//  */
// export async function verifyReCaptchaToken(
//   token: string
// ): Promise<boolean> {
//   // For now, just check if token exists
//   // In production, you should implement proper server-side verification
//   // using Supabase Edge Functions or similar server-side solution
//   if (!token || token.trim() === '') {
//     console.error("reCAPTCHA token is empty");
//     return false;
//   }
  
//   // Basic token format validation
//   if (token.length < 20) {
//     console.error("reCAPTCHA token appears to be invalid");
//     return false;
//   }
  
//   // TODO: Implement proper server-side verification with Supabase Edge Functions
//   console.log("reCAPTCHA token received and basic validation passed");
//   return true;
// }
