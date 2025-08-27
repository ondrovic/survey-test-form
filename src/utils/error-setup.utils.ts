/**
 * Global Error Setup
 * 
 * Sets up global error handlers and initializes error logging system
 */

import { setupGlobalErrorHandlers } from '@/services/error-logging.service';

let isSetup = false;

/**
 * Initialize global error logging system
 * Should be called once at app startup
 */
export const initializeErrorLogging = () => {
  if (isSetup) {
    return; // Already initialized
  }

  console.log('🛡️ Initializing global error logging system...');

  try {
    // Setup global error handlers
    setupGlobalErrorHandlers();
    
    // Add additional performance monitoring
    setupPerformanceMonitoring();
    
    isSetup = true;
    console.log('✅ Error logging system initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize error logging system:', error);
  }
};

/**
 * Setup performance monitoring
 */
const setupPerformanceMonitoring = () => {
  // Monitor long tasks
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.duration > 50) { // Tasks longer than 50ms
            console.warn('⚠️ Long task detected:', {
              duration: entry.duration,
              startTime: entry.startTime,
              name: entry.name
            });
            
            // You could log this as a performance issue
            // LogPerformanceIssue('Long Task', entry.duration, 50);
          }
        });
      });
      
      observer.observe({ entryTypes: ['longtask'] });
    } catch (error) {
      console.warn('Performance monitoring not available:', error);
    }
  }

  // Monitor network errors in fetch
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    try {
      const response = await originalFetch(...args);
      
      // Log API errors
      if (!response.ok) {
        const url = args[0]?.toString() || 'unknown';
        console.warn('🌐 API Error:', {
          url,
          status: response.status,
          statusText: response.statusText
        });
        
        // You could log this as an API error
        // LogApiError(url, 'GET', response.status, response.statusText);
      }
      
      return response;
    } catch (error) {
      const url = args[0]?.toString() || 'unknown';
      console.error('🌐 Network Error:', { url, error });
      
      // You could log this as a network error
      // LogApiError(url, 'GET', 0, error.message);
      
      throw error;
    }
  };
};