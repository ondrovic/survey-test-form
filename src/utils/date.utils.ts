export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatDateShort = (date: Date | string): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const getCurrentTimestamp = (): string => {
  return new Date().toISOString();
};

export const isRecent = (date: Date | string, hours: number = 24): boolean => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffInHours = (now.getTime() - dateObj.getTime()) / (1000 * 60 * 60);
  return diffInHours <= hours;
};

export const getTimeAgo = (date: Date | string): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`;
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
  }

  return formatDateShort(dateObj);
};

// Utility functions for consistent date range handling
export const createDateRangeISOStrings = (
  startDate: string,
  endDate: string
) => {
  return {
    startDate: startDate + "T00:00:00.000Z", // Start at 12:00:00 AM UTC
    endDate: endDate + "T23:59:59.999Z", // End at 11:59:59 PM UTC
  };
};

export const parseDateFromISOString = (isoString: string): string => {
  // Ensure the date string has a timezone indicator to prevent timezone shifts
  const dateString = isoString.endsWith("Z") ? isoString : isoString + "Z";
  return new Date(dateString).toISOString().slice(0, 10);
};

export const formatDateRangeForDisplay = (
  startDate: string,
  endDate: string
): string => {
  return `${startDate} to ${endDate}`;
};

// Function to normalize existing dates that may have timezone issues
export const normalizeExistingDate = (isoString: string): string => {
  try {
    // Parse the date and extract just the date part (YYYY-MM-DD)
    const date = new Date(isoString);

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.warn("Invalid date string:", isoString);
      return isoString; // Return original if invalid
    }

    // Extract the date part and create a new UTC date
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");

    // Return the normalized date string
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error(
      "Error normalizing date:",
      error,
      "Original string:",
      isoString
    );
    return isoString; // Return original if error
  }
};

// Function to get display date from potentially problematic ISO strings
export const getDisplayDate = (isoString: string): string => {
  try {
    // First try to normalize the existing date
    const normalizedDate = normalizeExistingDate(isoString);

    // Split manually if it's in yyyy-mm-dd format
    const parts = normalizedDate.split("-");
    if (parts.length === 3) {
      const [year, month, day] = parts.map(Number);

      // Construct the display format mm/dd/yyyy without timezone shifting
      return `${String(month).padStart(2, "0")}/${String(day).padStart(
        2,
        "0"
      )}/${year}`;
    }

    // Otherwise, fallback to Date parsing (for full ISO timestamps)
    const date = new Date(normalizedDate);

    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();

    return `${month}/${day}/${year}`;
  } catch (error) {
    console.error(
      "Error getting display date:",
      error,
      "Original string:",
      isoString
    );
    return isoString; // Return original if error
  }
};

