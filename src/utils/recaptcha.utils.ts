import { getFunctions, httpsCallable } from "firebase/functions";

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
 * Get reCAPTCHA site key from environment variables
 * @returns string | undefined - The site key or undefined if not configured
 */
export function getReCaptchaSiteKey(): string | undefined {
  return import.meta.env.VITE_RECAPTCHA_SITE_KEY;
}

/**
 * Check if reCAPTCHA is properly configured
 * @returns boolean - Whether reCAPTCHA is configured
 */
export function isReCaptchaConfigured(): boolean {
  return !!getReCaptchaSiteKey();
}

/**
 * Verify reCAPTCHA token using Firebase Cloud Function
 * @param token - The reCAPTCHA token from the frontend
 * @returns Promise<boolean> - Whether the token is valid
 */
export async function verifyReCaptchaTokenWithFirebase(
  token: string
): Promise<boolean> {
  try {
    const functions = getFunctions();
    const verifyRecaptcha = httpsCallable(functions, "verifyRecaptcha");

    const result = await verifyRecaptcha({ token });
    return (result.data as any).success;
  } catch (error) {
    console.error("Error verifying reCAPTCHA token:", error);
    return false;
  }
}
