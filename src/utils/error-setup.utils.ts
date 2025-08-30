/**
 * Global Error Setup
 * 
 * Sets up global error handlers and initializes error logging system
 */

import { setupGlobalErrorHandlers, ErrorLoggingService } from '@/services/error-logging.service';

let isSetup = false;

/**
 * Initialize global error logging system
 * Should be called once at app startup
 */
export const initializeErrorLogging = () => {
  if (isSetup) {
    return; // Already initialized
  }

  try {
    // Setup global error handlers
    setupGlobalErrorHandlers();
    
    // Add additional performance monitoring
    setupPerformanceMonitoring();
    
    isSetup = true;
  } catch (error) {
    // Fallback logging since error service may not be available yet
    ErrorLoggingService.logCriticalError(
      'Failed to initialize error logging system',
      error instanceof Error ? error : new Error(String(error)),
      {
        componentName: 'ErrorSetupUtils',
        functionName: 'initializeErrorLogging'
      }
    );
  }
};


// QUESTION: do we need this at all?
/**
 * Setup performance monitoring
 */
const setupPerformanceMonitoring = () => {
  // Monitor long tasks
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.duration > 50) { // Tasks longer than 50m            
            // You could log this as a performance issue
            // LogPerformanceIssue('Long Task', entry.duration, 50);
          }
        });
      });
      
      observer.observe({ entryTypes: ['longtask'] });
    } catch (error) {
      // Log performance observer setup error
      ErrorLoggingService.logError({
        severity: 'low',
        errorMessage: 'Failed to setup performance monitoring',
        stackTrace: error instanceof Error ? error.stack : String(error),
        componentName: 'ErrorSetupUtils',
        functionName: 'setupPerformanceMonitoring',
        additionalContext: { errorType: 'performance_setup_error' }
      });
    }
  }

  // Monitor network errors in fetch
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    try {
      const response = await originalFetch(...args);
      const url = args[0]?.toString() || 'unknown';
      
      // Log API errors
      if (!response.ok) {
        ErrorLoggingService.logApiError(
          `HTTP ${response.status}: ${response.statusText}`,
          url,
          args[1]?.method || 'GET',
          response.status,
          undefined,
          {
            componentName: 'ErrorSetupUtils',
            functionName: 'enhancedFetch'
          }
        );
      }
      
      return response;
    } catch (error) {
      const url = args[0]?.toString() || 'unknown';
      // Log the error using ErrorLoggingService if available
      try {
        ErrorLoggingService.logError({
          severity: 'medium',
          errorMessage: error instanceof Error ? error.message : 'Network request failed',
          stackTrace: error instanceof Error ? error.stack : String(error),
          componentName: 'ErrorSetupUtils',
          functionName: 'enhancedFetch',
          userAction: 'Making network request',
          additionalContext: {
            url,
            errorType: 'network_error'
          },
          tags: ['utils', 'error-setup', 'network']
        });
      } catch {
        // Silently fail if error logging is not available
      }
      
      throw error;
    }
  };
};