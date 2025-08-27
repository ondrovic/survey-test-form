/**
 * React Hook for Error Logging
 * 
 * Provides convenient methods for logging errors within React components
 */

import { useCallback } from 'react';
import { 
  logError, 
  logCriticalError, 
  logApiError, 
  logDatabaseError, 
  logValidationError,
  logUserActionError
} from '@/utils/error-logging.utils';
import { UseErrorLoggingReturn } from '@/types';

/**
 * Custom hook for error logging with automatic component context
 */
export const useErrorLogging = (componentName?: string): UseErrorLoggingReturn => {
  
  const logErrorWithContext = useCallback(async (
    message: string, 
    error?: Error, 
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    userAction?: string
  ) => {
    await logError(message, error, {
      severity,
      componentName,
      userAction
    });
  }, [componentName]);

  const logCriticalErrorWithContext = useCallback(async (
    message: string,
    error?: Error,
    userAction?: string
  ) => {
    await logCriticalError(message, error, componentName, userAction);
  }, [componentName]);

  const logApiErrorWithContext = useCallback(async (
    endpoint: string,
    method: string,
    statusCode: number,
    errorMessage: string,
    response?: any
  ) => {
    await logApiError(endpoint, method, statusCode, errorMessage, response, componentName);
  }, [componentName]);

  const logDatabaseErrorWithContext = useCallback(async (
    operation: string,
    table: string,
    error: Error,
    additionalData?: Record<string, any>
  ) => {
    await logDatabaseError(operation, table, error, componentName, additionalData);
  }, [componentName]);

  const logValidationErrorWithContext = useCallback(async (
    formName: string,
    fieldErrors: Record<string, string>
  ) => {
    await logValidationError(formName, fieldErrors, componentName);
  }, [componentName]);

  const logUserActionErrorWithContext = useCallback(async (
    action: string,
    error: Error,
    element?: string
  ) => {
    await logUserActionError(action, error, componentName, element);
  }, [componentName]);

  return {
    logError: logErrorWithContext,
    logCriticalError: logCriticalErrorWithContext,
    logApiError: logApiErrorWithContext,
    logDatabaseError: logDatabaseErrorWithContext,
    logValidationError: logValidationErrorWithContext,
    logUserActionError: logUserActionErrorWithContext
  };
};