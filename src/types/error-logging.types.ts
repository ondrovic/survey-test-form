/**
 * Error Logging Type Definitions
 * 
 * Centralized types for error logging system including error log entities,
 * filter configurations, hook interfaces, and utility options.
 */

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ErrorStatus = 'open' | 'investigating' | 'resolved' | 'ignored';

/**
 * Error log filters configuration
 */
export interface ErrorLogFilters {
  search: string;
  severity: ErrorSeverity[];
  status: ErrorStatus[];
  componentName: string;
  assignedTo: string;
  dateRange: {
    start: string;
    end: string;
  };
  tags: string[];
}

/**
 * Props for ErrorLogFilters component
 */
export interface ErrorLogFiltersProps {
  filters: ErrorLogFilters;
  onFiltersChange: (filters: Partial<ErrorLogFilters>) => void;
  onReset: () => void;
  availableComponents: string[];
  availableAssignees: string[];
  availableTags: string[];
}

/**
 * Simple error log interface for display components
 */
export interface SimpleErrorLog {
  id: string;
  occurred_at: string;
  severity: ErrorSeverity;
  error_message: string;
  component_name?: string;
  file_path?: string;
  user_email?: string;
  stack_trace?: string;
}

/**
 * Filter form data structure for error log filtering
 */
export interface FilterFormData {
  search: string;
  severity: ErrorSeverity[];
  status: ErrorStatus[];
  componentName: string;
  assignedTo: string;
  dateStart: string;
  dateEnd: string;
  tags: string;
}

/**
 * Configuration options for error logging utilities
 */
export interface LogErrorOptions {
  severity?: ErrorSeverity;
  componentName?: string;
  userAction?: string;
  additionalContext?: Record<string, any>;
  tags?: string[];
}

/**
 * Return type interface for useErrorLogging hook
 */
export interface UseErrorLoggingReturn {
  logError: (
    message: string, 
    error?: Error, 
    severity?: ErrorSeverity,
    userAction?: string
  ) => Promise<void>;
  
  logCriticalError: (
    message: string,
    error?: Error,
    userAction?: string
  ) => Promise<void>;
  
  logApiError: (
    endpoint: string,
    method: string,
    statusCode: number,
    errorMessage: string,
    response?: any
  ) => Promise<void>;
  
  logDatabaseError: (
    operation: string,
    table: string,
    error: Error,
    additionalData?: Record<string, any>
  ) => Promise<void>;
  
  logValidationError: (
    formName: string,
    fieldErrors: Record<string, string>
  ) => Promise<void>;
  
  logUserActionError: (
    action: string,
    error: Error,
    element?: string
  ) => Promise<void>;
}