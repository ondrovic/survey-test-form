/**
 * Error Logging Service
 * 
 * Comprehensive error logging service that captures and stores critical errors
 * to the database with contextual information for debugging and monitoring.
 */

import { SupabaseClientService } from './supabase-client.service';

export interface ErrorLogData {
  // Error details
  severity: 'low' | 'medium' | 'high' | 'critical';
  errorMessage: string;
  errorCode?: string;
  stackTrace?: string;
  
  // Context information
  componentName?: string;
  filePath?: string;
  lineNumber?: number;
  functionName?: string;
  userAction?: string;
  
  // User and session context
  userId?: string;
  userEmail?: string;
  sessionToken?: string;
  surveyInstanceId?: string;
  
  // System information
  userAgent?: string;
  ipAddress?: string;
  url?: string;
  httpMethod?: string;
  
  // Browser/Client info
  browserInfo?: Record<string, any>;
  screenResolution?: string;
  viewportSize?: string;
  
  // Error metadata
  errorBoundary?: boolean;
  isHandled?: boolean;
  additionalContext?: Record<string, any>;
  tags?: string[];
}

export interface ErrorStatistics {
  totalErrors: number;
  totalOccurrences: number;
  criticalErrors: number;
  highErrors: number;
  mediumErrors: number;
  lowErrors: number;
  openErrors: number;
  investigatingErrors: number;
  resolvedErrors: number;
  affectedComponents: number;
  affectedUsers: number;
}

export class ErrorLoggingService {
  private static isLoggingError = false;
  
  /**
   * Log an error to the database
   */
  static async logError(errorData: ErrorLogData): Promise<string | null> {
    // Prevent recursive error logging
    if (this.isLoggingError) {
      console.warn('Recursive error logging detected, skipping');
      return null;
    }
    
    this.isLoggingError = true;
    
    try {
      // Get browser information if not provided
      const browserInfo = errorData.browserInfo || this.getBrowserInfo();
      const screenResolution = errorData.screenResolution || this.getScreenResolution();
      const viewportSize = errorData.viewportSize || this.getViewportSize();
      const url = errorData.url || window.location.href;
      const userAgent = errorData.userAgent || navigator.userAgent;
      
      // Try using the database function first, fall back to direct insertion
      const client = SupabaseClientService.getInstance().getClientSafe();
      if (!client) {
        console.warn('Error logging service: Supabase client not initialized, skipping database logging');
        return null;
      }
      
      try {
        // First try using the log_error function
        const { data, error } = await client.rpc('log_error', {
          p_severity: errorData.severity,
          p_error_message: errorData.errorMessage,
          p_error_code: errorData.errorCode,
          p_stack_trace: errorData.stackTrace,
          p_component_name: errorData.componentName,
          p_file_path: errorData.filePath,
          p_line_number: errorData.lineNumber,
          p_function_name: errorData.functionName,
          p_user_action: errorData.userAction,
          p_user_id: errorData.userId,
          p_user_email: errorData.userEmail,
          p_session_token: errorData.sessionToken,
          p_survey_instance_id: errorData.surveyInstanceId,
          p_user_agent: userAgent,
          p_ip_address: errorData.ipAddress,
          p_url: url,
          p_http_method: errorData.httpMethod,
          p_browser_info: browserInfo,
          p_screen_resolution: screenResolution,
          p_viewport_size: viewportSize,
          p_error_boundary: errorData.errorBoundary || false,
          p_is_handled: errorData.isHandled || true,
          p_additional_context: errorData.additionalContext,
          p_tags: errorData.tags
        });

        if (error) {
          throw error;
        }

        return data as string;
      } catch (functionError) {
        console.warn('log_error function failed, falling back to direct insertion:', functionError);
        
        // Fallback: Direct table insertion with elevated privileges
        const clientService = SupabaseClientService.getInstance();
        
        return await clientService.withClient(async (adminClient) => {
          const { data: insertData, error: insertError } = await adminClient
            .from('error_logs')
            .insert({
              severity: errorData.severity,
              error_message: errorData.errorMessage,
              error_code: errorData.errorCode,
              stack_trace: errorData.stackTrace,
              component_name: errorData.componentName,
              file_path: errorData.filePath,
              line_number: errorData.lineNumber,
              function_name: errorData.functionName,
              user_action: errorData.userAction,
              user_id: errorData.userId,
              user_email: errorData.userEmail,
              session_token: errorData.sessionToken,
              survey_instance_id: errorData.surveyInstanceId,
              user_agent: userAgent,
              ip_address: errorData.ipAddress,
              url: url,
              http_method: errorData.httpMethod,
              browser_info: browserInfo,
              screen_resolution: screenResolution,
              viewport_size: viewportSize,
              error_boundary: errorData.errorBoundary || false,
              is_handled: errorData.isHandled || true,
              additional_context: errorData.additionalContext,
              tags: errorData.tags,
              occurred_at: new Date().toISOString()
            })
            .select('id')
            .single();

          if (insertError) {
            console.error('Failed to insert error directly:', insertError);
            return null;
          }

          return insertData?.id || null;
        });
      }
    } catch (err) {
      // Fallback logging to prevent infinite loops
      console.error('Error logging service failed:', err);
      return null;
    } finally {
      this.isLoggingError = false;
    }
  }

  /**
   * Log a critical error (shorthand method)
   */
  static async logCriticalError(
    message: string, 
    error?: Error, 
    context?: Partial<ErrorLogData>
  ): Promise<string | null> {
    const errorData: ErrorLogData = {
      severity: 'critical',
      errorMessage: message,
      stackTrace: error?.stack,
      errorCode: error?.name,
      componentName: this.getComponentFromStack(error?.stack),
      filePath: this.getFileFromStack(error?.stack),
      lineNumber: this.getLineFromStack(error?.stack),
      functionName: this.getFunctionFromStack(error?.stack),
      isHandled: true,
      ...context
    };

    return this.logError(errorData);
  }

  /**
   * Log an unhandled error (from error boundaries or global handlers)
   */
  static async logUnhandledError(
    error: Error,
    errorInfo?: { componentStack?: string },
    context?: Partial<ErrorLogData>
  ): Promise<string | null> {
    // Determine severity based on error type and context
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    
    if (error.name === 'ChunkLoadError' || error.message.includes('Loading chunk')) {
      severity = 'low'; // Network/chunk loading errors are usually not critical
    } else if (error.name === 'TypeError' || error.name === 'ReferenceError') {
      severity = 'high'; // Code errors are more serious
    } else if (error.message.includes('Network Error') || error.message.includes('Failed to fetch')) {
      severity = 'medium'; // Network errors are moderate
    } else if (errorInfo?.componentStack && errorInfo.componentStack.includes('ErrorBoundary')) {
      severity = 'high'; // Component crashes are serious
    }
    
    // Allow context to override
    if (context?.severity) {
      severity = context.severity;
    }

    const errorData: ErrorLogData = {
      severity,
      errorMessage: error.message,
      stackTrace: error.stack || errorInfo?.componentStack,
      errorCode: error.name,
      componentName: this.getComponentFromStack(error.stack || errorInfo?.componentStack),
      filePath: this.getFileFromStack(error.stack),
      lineNumber: this.getLineFromStack(error.stack),
      functionName: this.getFunctionFromStack(error.stack),
      errorBoundary: !!errorInfo,
      isHandled: false,
      ...context
    };

    return this.logError(errorData);
  }

  /**
   * Log API/Network errors
   */
  static async logApiError(
    message: string,
    url: string,
    method: string,
    statusCode?: number,
    response?: any,
    context?: Partial<ErrorLogData>
  ): Promise<string | null> {
    const errorData: ErrorLogData = {
      severity: statusCode && statusCode >= 500 ? 'high' : 'medium',
      errorMessage: message,
      errorCode: statusCode ? `HTTP_${statusCode}` : 'NETWORK_ERROR',
      url,
      httpMethod: method,
      additionalContext: {
        statusCode,
        response,
        timestamp: new Date().toISOString()
      },
      tags: ['api', 'network'],
      isHandled: true,
      ...context
    };

    return this.logError(errorData);
  }

  /**
   * Get error statistics
   */
  static async getErrorStatistics(
    hoursBack: number = 24,
    componentName?: string
  ): Promise<ErrorStatistics | null> {
    try {
      const clientService = SupabaseClientService.getInstance();
      
      // Use elevated privileges for admin operations
      return await clientService.withClient(async (adminClient) => {
        const cutoffTime = new Date();
        cutoffTime.setHours(cutoffTime.getHours() - hoursBack);
        const cutoffISO = cutoffTime.toISOString();

        let query = adminClient
          .from('error_logs')
          .select('severity, status, occurrence_count')
          .gte('occurred_at', cutoffISO);

        if (componentName) {
          query = query.eq('component_name', componentName);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Failed to get error statistics:', error);
          return null;
        }

        // Calculate statistics from the data
        const stats: ErrorStatistics = {
          totalErrors: data?.length || 0,
          totalOccurrences: data?.reduce((sum, log) => sum + (log.occurrence_count || 1), 0) || 0,
          criticalErrors: data?.filter(log => log.severity === 'critical').length || 0,
          highErrors: data?.filter(log => log.severity === 'high').length || 0,
          mediumErrors: data?.filter(log => log.severity === 'medium').length || 0,
          lowErrors: data?.filter(log => log.severity === 'low').length || 0,
          openErrors: data?.filter(log => log.status === 'open').length || 0,
          investigatingErrors: data?.filter(log => log.status === 'investigating').length || 0,
          resolvedErrors: data?.filter(log => log.status === 'resolved').length || 0,
          affectedComponents: new Set(data?.map(log => (log as any).component_name).filter(Boolean)).size || 0,
          affectedUsers: new Set(data?.map(log => (log as any).user_email).filter(Boolean)).size || 0,
        };

        return stats;
      });
    } catch (err) {
      console.error('Error statistics service failed:', err);
      return null;
    }
  }

  /**
   * Get recent errors
   */
  static async getRecentErrors(
    limit: number = 50,
    severity?: string,
    componentName?: string
  ): Promise<any[] | null> {
    try {
      const clientService = SupabaseClientService.getInstance();
      
      // Use elevated privileges for admin operations
      return await clientService.withClient(async (adminClient) => {
        let query = adminClient
          .from('error_logs')
          .select('*')
          .order('occurred_at', { ascending: false })
          .limit(limit);

        if (severity) {
          query = query.eq('severity', severity);
        }

        if (componentName) {
          query = query.eq('component_name', componentName);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Failed to get recent errors:', error);
          return null;
        }

        return data;
      });
    } catch (err) {
      console.error('Recent errors service failed:', err);
      return null;
    }
  }

  /**
   * Clear all error logs (admin function)
   */
  static async clearAllErrorLogs(): Promise<boolean> {
    try {
      const clientService = SupabaseClientService.getInstance();
      
      // Use elevated privileges for admin operations
      return await clientService.withClient(async (adminClient) => {
        const { error } = await adminClient
          .from('error_logs')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
        
        if (error) {
          console.error('Failed to clear error logs:', error);
          return false;
        }
        
        return true;
      });
    } catch (err) {
      console.error('Clear error logs failed:', err);
      return false;
    }
  }

  /**
   * Update error status (for admin resolution tracking)
   */
  static async updateErrorStatus(
    errorId: string,
    status: 'open' | 'investigating' | 'resolved' | 'ignored',
    assignedTo?: string,
    resolutionNotes?: string
  ): Promise<boolean> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (assignedTo) updateData.assigned_to = assignedTo;
      if (resolutionNotes) updateData.resolution_notes = resolutionNotes;
      if (status === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
        updateData.resolved_by = assignedTo;
      }

      const client = SupabaseClientService.getInstance().getClientSafe();
      if (!client) {
        console.warn('Update error status service: Supabase client not initialized');
        return false;
      }
      
      const { error } = await client
        .from('error_logs')
        .update(updateData)
        .eq('id', errorId);

      if (error) {
        console.error('Failed to update error status:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Update error status failed:', err);
      return false;
    }
  }

  // Private utility methods
  private static getBrowserInfo(): Record<string, any> {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine
    };
  }

  private static getScreenResolution(): string {
    return `${screen.width}x${screen.height}`;
  }

  private static getViewportSize(): string {
    return `${window.innerWidth}x${window.innerHeight}`;
  }

  private static getComponentFromStack(stack?: string): string | undefined {
    if (!stack) return undefined;
    
    // Look for React component names in stack trace
    const componentMatch = stack.match(/at (\w+(?:Component|Hook))/);
    return componentMatch ? componentMatch[1] : undefined;
  }

  private static getFileFromStack(stack?: string): string | undefined {
    if (!stack) return undefined;
    
    // Extract file path from stack trace
    const fileMatch = stack.match(/at.*?([^/\\]+\.(tsx?|jsx?)):(\d+):(\d+)/);
    return fileMatch ? fileMatch[1] : undefined;
  }

  private static getLineFromStack(stack?: string): number | undefined {
    if (!stack) return undefined;
    
    // Extract line number from stack trace
    const lineMatch = stack.match(/:(\d+):\d+\)?$/m);
    return lineMatch ? parseInt(lineMatch[1]) : undefined;
  }

  private static getFunctionFromStack(stack?: string): string | undefined {
    if (!stack) return undefined;
    
    // Extract function name from stack trace
    const functionMatch = stack.match(/at (?:Object\.)?(\w+)/);
    return functionMatch ? functionMatch[1] : undefined;
  }
}

// Global error handlers setup
export const setupGlobalErrorHandlers = () => {
  // Filter out known browser extension errors
  const isExtensionError = (error: Error | string, source?: string): boolean => {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorSource = source || '';
    
    // Known browser extension patterns
    const extensionPatterns = [
      'injected.js',
      'hide-notification',
      'chrome-extension://',
      'moz-extension://',
      'safari-extension://',
      'extension_',
      'content-script',
      'Non-Error promise rejection captured',
      'Script error.'
    ];
    
    return extensionPatterns.some(pattern => 
      errorMessage.includes(pattern) || errorSource.includes(pattern)
    );
  };
  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const errorMessage = event.reason?.message || 'Unhandled Promise Rejection';
    
    // Skip browser extension errors
    if (isExtensionError(errorMessage)) {
      console.debug('Skipping browser extension error:', errorMessage);
      return;
    }
    
    ErrorLoggingService.logUnhandledError(
      new Error(errorMessage),
      undefined,
      {
        severity: 'medium', // Promise rejections are often network/API issues
        tags: ['unhandled', 'promise'],
        additionalContext: {
          reason: event.reason,
          type: 'unhandledrejection'
        }
      }
    );
  });

  // Global error handler
  window.addEventListener('error', (event) => {
    const error = event.error || new Error(event.message);
    
    // Skip browser extension errors
    if (isExtensionError(error, event.filename)) {
      console.debug('Skipping browser extension error:', error.message, event.filename);
      return;
    }
    
    ErrorLoggingService.logUnhandledError(
      error,
      undefined,
      {
        severity: 'medium', // Will be auto-determined based on error type
        tags: ['unhandled', 'javascript'],
        filePath: event.filename,
        lineNumber: event.lineno,
        additionalContext: {
          colno: event.colno,
          type: 'error'
        }
      }
    );
  });
};

// Export default instance
export default ErrorLoggingService;