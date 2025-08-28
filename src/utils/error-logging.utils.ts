/**
 * Error Logging Utilities
 * 
 * Helper functions for consistent error logging throughout the application
 */

import { ErrorLoggingService } from '@/services/error-logging.service';
import { getCurrentUser } from '@/utils/user.utils';
import { LogErrorOptions } from '@/types';

/**
 * Log a general application error
 */
export const logError = async (
  message: string, 
  error?: Error, 
  options: LogErrorOptions = {}
): Promise<void> => {
  try {
    const user = await getCurrentUser();
    
    await ErrorLoggingService.logError({
      severity: options.severity || 'medium',
      errorMessage: message,
      stackTrace: error?.stack,
      errorCode: error?.name,
      componentName: options.componentName,
      userAction: options.userAction,
      userId: user?.id,
      userEmail: user?.email,
      additionalContext: {
        timestamp: new Date().toISOString(),
        ...options.additionalContext
      },
      tags: options.tags,
      isHandled: true
    });
  } catch (logErr) {
    // Fallback to console logging if error logging fails
    console.error('Failed to log error:', logErr);
    console.error('Original error:', message, error);
  }
};

/**
 * Log a critical error that requires immediate attention
 */
export const logCriticalError = async (
  message: string,
  error?: Error,
  componentName?: string,
  userAction?: string
): Promise<void> => {
  await logError(message, error, {
    severity: 'critical',
    componentName,
    userAction,
    tags: ['critical', 'urgent']
  });
};

/**
 * Log API/Network related errors
 */
export const logApiError = async (
  endpoint: string,
  method: string,
  statusCode: number,
  errorMessage: string,
  response?: any,
  componentName?: string
): Promise<void> => {
  try {
    const user = await getCurrentUser();
    
    await ErrorLoggingService.logApiError(
      errorMessage,
      endpoint,
      method,
      statusCode,
      response,
      {
        userId: user?.id,
        userEmail: user?.email,
        componentName,
        additionalContext: {
          endpoint,
          timestamp: new Date().toISOString()
        }
      }
    );
  } catch (logErr) {
    console.error('Failed to log API error:', logErr);
    console.error('Original API error:', { endpoint, method, statusCode, errorMessage });
  }
};

/**
 * Log database operation errors
 */
export const logDatabaseError = async (
  operation: string,
  table: string,
  error: Error,
  componentName?: string,
  additionalData?: Record<string, any>
): Promise<void> => {
  // Determine severity based on operation type and error
  let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
  
  if (operation.toLowerCase().includes('delete') || operation.toLowerCase().includes('update')) {
    severity = 'high'; // Data modification failures are more serious
  } else if (operation.toLowerCase().includes('insert')) {
    severity = 'high'; // Insert failures can indicate data loss
  } else if (operation.toLowerCase().includes('select') || operation.toLowerCase().includes('read')) {
    severity = 'medium'; // Read failures are less critical
  } else if (error.message.includes('permission') || error.message.includes('access')) {
    severity = 'high'; // Permission errors are serious
  } else if (error.message.includes('timeout') || error.message.includes('connection')) {
    severity = 'medium'; // Network/timeout errors are moderate
  }
  
  await logError(
    `Database ${operation} failed on ${table}: ${error.message}`,
    error,
    {
      severity,
      componentName,
      tags: ['database', 'supabase', operation.toLowerCase()],
      additionalContext: {
        operation,
        table,
        ...additionalData
      }
    }
  );
};

/**
 * Log form validation errors (for tracking user experience issues)
 */
export const logValidationError = async (
  formName: string,
  fieldErrors: Record<string, string>,
  componentName?: string
): Promise<void> => {
  await logError(
    `Form validation failed in ${formName}`,
    undefined,
    {
      severity: 'low',
      componentName,
      userAction: 'Form submission',
      tags: ['validation', 'form', 'user-experience'],
      additionalContext: {
        formName,
        fieldErrors,
        errorCount: Object.keys(fieldErrors).length
      }
    }
  );
};

/**
 * Log authentication/authorization errors
 */
export const logAuthError = async (
  operation: string,
  error: Error,
  componentName?: string
): Promise<void> => {
  await logError(
    `Authentication ${operation} failed: ${error.message}`,
    error,
    {
      severity: 'high',
      componentName,
      tags: ['auth', 'security'],
      additionalContext: {
        operation
      }
    }
  );
};

/**
 * Log permission/access denied errors
 */
export const logPermissionError = async (
  resource: string,
  action: string,
  componentName?: string
): Promise<void> => {
  try {
    const user = await getCurrentUser();
    
    await logError(
      `Access denied: User ${user?.email || 'anonymous'} attempted ${action} on ${resource}`,
      undefined,
      {
        severity: 'medium',
        componentName,
        tags: ['permission', 'security', 'access-control'],
        additionalContext: {
          resource,
          action,
          userId: user?.id,
          userEmail: user?.email
        }
      }
    );
  } catch (logErr) {
    console.error('Failed to log permission error:', logErr);
  }
};

/**
 * Log performance issues
 */
export const logPerformanceIssue = async (
  operation: string,
  duration: number,
  threshold: number,
  componentName?: string,
  additionalData?: Record<string, any>
): Promise<void> => {
  await logError(
    `Performance issue: ${operation} took ${duration}ms (threshold: ${threshold}ms)`,
    undefined,
    {
      severity: duration > threshold * 2 ? 'high' : 'medium',
      componentName,
      tags: ['performance', 'slow-operation'],
      additionalContext: {
        operation,
        duration,
        threshold,
        exceedsThresholdBy: duration - threshold,
        ...additionalData
      }
    }
  );
};

/**
 * Log user action errors (for UX improvement tracking)
 */
export const logUserActionError = async (
  action: string,
  error: Error,
  componentName?: string,
  element?: string
): Promise<void> => {
  await logError(
    `User action failed: ${action} - ${error.message}`,
    error,
    {
      severity: 'low',
      componentName,
      userAction: action,
      tags: ['user-action', 'ux', 'interaction'],
      additionalContext: {
        action,
        element,
        userAgent: navigator.userAgent
      }
    }
  );
};

/**
 * Create a wrapper function for async operations that automatically logs errors
 */
export const withErrorLogging = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  options: {
    operation: string;
    componentName?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    tags?: string[];
  }
) => {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      await logError(
        `${options.operation} failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : new Error(String(error)),
        {
          severity: options.severity || 'medium',
          componentName: options.componentName,
          userAction: options.operation,
          tags: options.tags
        }
      );
      throw error; // Re-throw the original error
    }
  };
};

/**
 * Performance monitoring wrapper
 */
export const withPerformanceMonitoring = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  options: {
    operation: string;
    threshold: number; // milliseconds
    componentName?: string;
  }
) => {
  return async (...args: T): Promise<R> => {
    const startTime = performance.now();
    try {
      const result = await fn(...args);
      const duration = performance.now() - startTime;
      
      if (duration > options.threshold) {
        await logPerformanceIssue(
          options.operation,
          duration,
          options.threshold,
          options.componentName
        );
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      await logError(
        `${options.operation} failed after ${duration}ms: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : new Error(String(error)),
        {
          severity: 'high',
          componentName: options.componentName,
          userAction: options.operation,
          tags: ['performance', 'error'],
          additionalContext: {
            duration,
            threshold: options.threshold
          }
        }
      );
      
      throw error;
    }
  };
};