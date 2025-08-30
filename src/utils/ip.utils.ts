/**
 * Utility functions for IP address detection
 */

import { ErrorLoggingService } from '@/services/error-logging.service';

/**
 * Get the client's IP address using a third-party service
 * @returns Promise<string> - The client's IP address
 */
export async function getClientIPAddress(): Promise<string | null> {
  try {
    // Use a reliable IP detection service
    const response = await fetch("https://api.ipify.org?format=json");

    if (!response.ok) {
      // Fallback to another service
      const fallbackResponse = await fetch(
        "https://api64.ipify.org?format=json"
      );
      if (!fallbackResponse.ok) {
        return null;
      }

      const fallbackData = await fallbackResponse.json();
      return fallbackData.ip || null;
    }

    const data = await response.json();
    return data.ip || null;
  } catch (error) {
    // Log the error using ErrorLoggingService
    ErrorLoggingService.logError({
      severity: 'low',
      errorMessage: error instanceof Error ? error.message : 'Error getting IP address',
      stackTrace: error instanceof Error ? error.stack : String(error),
      componentName: 'IpUtils',
      functionName: 'getClientIPAddress',
      userAction: 'Getting client IP address from external service',
      additionalContext: {
        errorType: 'ip_detection',
        primaryService: 'ipify.org',
        fallbackService: 'api64.ipify.org'
      },
      tags: ['utils', 'ip', 'network']
    });
    
    return null;
  }
}

/**
 * Get the client's IP address with timeout
 * @param timeout - Timeout in milliseconds (default: 5000ms)
 * @returns Promise<string | null> - The client's IP address or null if failed
 */
export async function getClientIPAddressWithTimeout(
  timeout: number = 5000
): Promise<string | null> {
  try {
    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), timeout);
    });

    const ipPromise = getClientIPAddress();

    const result = await Promise.race([ipPromise, timeoutPromise]);
    return result;
  } catch (error) {
    // Log the error using ErrorLoggingService
    ErrorLoggingService.logError({
      severity: 'low',
      errorMessage: error instanceof Error ? error.message : 'Error getting IP address with timeout',
      stackTrace: error instanceof Error ? error.stack : String(error),
      componentName: 'IpUtils',
      functionName: 'getClientIPAddressWithTimeout',
      userAction: 'Getting client IP address with timeout',
      additionalContext: {
        timeout,
        errorType: 'ip_detection_timeout'
      },
      tags: ['utils', 'ip', 'network', 'timeout']
    });
    
    return null;
  }
}
