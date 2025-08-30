import { ErrorLoggingService } from "../services/error-logging.service";

export const formatDate = (date: Date | string): string => {
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    
    // Check for invalid date
    if (isNaN(dateObj.getTime())) {
      throw new Error(`Invalid date: ${date}`);
    }
    
    return dateObj.toLocaleString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    // Log the error using ErrorLoggingService
    ErrorLoggingService.logError({
      severity: 'low',
      errorMessage: error instanceof Error ? error.message : 'Date formatting failed',
      stackTrace: error instanceof Error ? error.stack : String(error),
      componentName: 'DateUtils',
      functionName: 'formatDate',
      userAction: 'Formatting date for display',
      additionalContext: {
        inputDate: String(date),
        inputType: typeof date,
        errorType: 'date_formatting'
      },
      tags: ['utils', 'date', 'parsing']
    });
    
    // Return a fallback string
    return String(date);
  }
};

export const formatDateShort = (date: Date | string): string => {
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    
    // Check for invalid date
    if (isNaN(dateObj.getTime())) {
      throw new Error(`Invalid date: ${date}`);
    }
    
    return dateObj.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (error) {
    // Log the error using ErrorLoggingService
    ErrorLoggingService.logError({
      severity: 'low',
      errorMessage: error instanceof Error ? error.message : 'Date short formatting failed',
      stackTrace: error instanceof Error ? error.stack : String(error),
      componentName: 'DateUtils',
      functionName: 'formatDateShort',
      userAction: 'Formatting date for short display',
      additionalContext: {
        inputDate: String(date),
        inputType: typeof date,
        errorType: 'date_formatting'
      },
      tags: ['utils', 'date', 'parsing']
    });
    
    // Return a fallback string
    return String(date);
  }
};

export const getCurrentTimestamp = (): string => {
  return new Date().toISOString();
};

export const isRecent = (date: Date | string, hours: number = 24): boolean => {
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    
    // Check for invalid date
    if (isNaN(dateObj.getTime())) {
      throw new Error(`Invalid date: ${date}`);
    }
    
    const now = new Date();
    const diffInHours = (now.getTime() - dateObj.getTime()) / (1000 * 60 * 60);
    return diffInHours <= hours;
  } catch (error) {
    // Log the error using ErrorLoggingService
    ErrorLoggingService.logError({
      severity: 'low',
      errorMessage: error instanceof Error ? error.message : 'Date recency check failed',
      stackTrace: error instanceof Error ? error.stack : String(error),
      componentName: 'DateUtils',
      functionName: 'isRecent',
      userAction: 'Checking if date is recent',
      additionalContext: {
        inputDate: String(date),
        inputType: typeof date,
        hours,
        errorType: 'date_comparison'
      },
      tags: ['utils', 'date', 'parsing']
    });
    
    // Return false as fallback
    return false;
  }
};

export const getTimeAgo = (date: Date | string): string => {
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    
    // Check for invalid date
    if (isNaN(dateObj.getTime())) {
      throw new Error(`Invalid date: ${date}`);
    }
    
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
  } catch (error) {
    // Log the error using ErrorLoggingService
    ErrorLoggingService.logError({
      severity: 'low',
      errorMessage: error instanceof Error ? error.message : 'Time ago calculation failed',
      stackTrace: error instanceof Error ? error.stack : String(error),
      componentName: 'DateUtils',
      functionName: 'getTimeAgo',
      userAction: 'Calculating time ago string',
      additionalContext: {
        inputDate: String(date),
        inputType: typeof date,
        errorType: 'date_time_ago'
      },
      tags: ['utils', 'date', 'parsing']
    });
    
    // Return a fallback string
    return String(date);
  }
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
      return isoString; // Return original if invalid
    }

    // Extract the date part and create a new UTC date
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");

    // Return the normalized date string
    return `${year}-${month}-${day}`;
  } catch (error) {
    // Log the error using ErrorLoggingService
    ErrorLoggingService.logError({
      severity: 'low',
      errorMessage: error instanceof Error ? error.message : 'Error normalizing date',
      stackTrace: error instanceof Error ? error.stack : String(error),
      componentName: 'DateUtils',
      functionName: 'normalizeExistingDate',
      userAction: 'Normalizing existing date string',
      additionalContext: {
        isoString,
        errorType: 'date_normalization'
      },
      tags: ['utils', 'date', 'parsing']
    });
    
    return isoString; // Return original if error
  }
};

// Function to get display date from potentially problematic ISO strings
export const getDisplayDate = (isoString: string): string => {
  try {
    // First try to normalize the existing date
    const normalizedDate = normalizeExistingDate(isoString);

    // Create a Date object from the normalized date
    let date: Date;
    
    // If it's in yyyy-mm-dd format, parse it carefully to avoid timezone issues
    const parts = normalizedDate.split("-");
    if (parts.length === 3) {
      const [year, month, day] = parts.map(Number);
      // Create date at noon local time to avoid timezone shifting issues
      date = new Date(year, month - 1, day, 12, 0, 0);
    } else {
      // Otherwise, fallback to Date parsing (for full ISO timestamps)
      date = new Date(normalizedDate);
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date created from: ${normalizedDate}`);
    }

    // Use toLocaleString for proper locale formatting
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  } catch (error) {
    // Log the error using ErrorLoggingService
    ErrorLoggingService.logError({
      severity: 'low',
      errorMessage: error instanceof Error ? error.message : 'Error getting display date',
      stackTrace: error instanceof Error ? error.stack : String(error),
      componentName: 'DateUtils',
      functionName: 'getDisplayDate',
      userAction: 'Getting display date from ISO string',
      additionalContext: {
        isoString,
        errorType: 'date_display_formatting'
      },
      tags: ['utils', 'date', 'parsing']
    });
    
    return isoString; // Return original if error
  }
};

