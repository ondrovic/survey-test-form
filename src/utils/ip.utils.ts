/**
 * Utility functions for IP address detection
 */

/**
 * Get the client's IP address using a third-party service
 * @returns Promise<string> - The client's IP address
 */
export async function getClientIPAddress(): Promise<string | null> {
  try {
    // Use a reliable IP detection service
    const response = await fetch("https://api.ipify.org?format=json");

    if (!response.ok) {
      console.warn(
        "Failed to get IP address from ipify.org, trying fallback..."
      );

      // Fallback to another service
      const fallbackResponse = await fetch(
        "https://api64.ipify.org?format=json"
      );
      if (!fallbackResponse.ok) {
        console.warn("Failed to get IP address from fallback service");
        return null;
      }

      const fallbackData = await fallbackResponse.json();
      return fallbackData.ip || null;
    }

    const data = await response.json();
    return data.ip || null;
  } catch (error) {
    console.warn("Error getting IP address:", error);
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
    console.warn("Error getting IP address with timeout:", error);
    return null;
  }
}
