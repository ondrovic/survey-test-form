import { useAuth } from '@/contexts/auth-context';
import { databaseHelpers, getDatabaseProviderInfo } from '@/config/database';
import { ErrorLoggingService } from '@/services/error-logging.service';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ConnectionStatus } from '@/types';

/**
 * Hook to monitor database connection status and authentication state
 * Works with any configured database provider (Firebase, Supabase, PostgreSQL)
 * 
 * Connection checking triggers:
 * - Initial check when authentication is ready
 * - When user returns to browser tab (window focus)
 * - Manual retry via retry() function
 * 
 * No automatic polling for scalability - connection status is checked on-demand
 */
export const useConnectionStatus = (): ConnectionStatus => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);
  const loadingRef = useRef(false);
  // Track only when the last check completed (success or failure)

  const checkConnection = useCallback(async () => {
    try {
      loadingRef.current = true;
      setLoading(true);
      setError(null);
      
      // Check if database is initialized
      const dbInfo = getDatabaseProviderInfo();
      if (!dbInfo.isInitialized) {
        setConnected(false);
        setError('Database service initializing...');
        setLoading(false);
        setLastCheckedAt(new Date());
        return;
      }
      
      // Try a simple database operation to test connection
      await databaseHelpers.getSurveyConfigs();
      
      setConnected(true);
      setError(null);
    } catch (err) {
      // Log the error using ErrorLoggingService
      ErrorLoggingService.logError({
        severity: 'low',
        errorMessage: err instanceof Error ? err.message : 'Connection failed',
        stackTrace: err instanceof Error ? err.stack : String(err),
        componentName: 'useConnectionStatus',
        functionName: 'checkConnection',
        userAction: 'Testing database connection',
        additionalContext: {
          errorType: 'connection_test_failed',
          isAuthenticated,
          authLoading
        },
        tags: ['hooks', 'connection', 'network']
      });
      
      setConnected(false);
      setError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      loadingRef.current = false;
      setLoading(false);
      setLastCheckedAt(new Date());
    }
  }, [isAuthenticated, authLoading]);

  const retry = () => {
    checkConnection();
  };

  // Optimized effect for connection management - no automatic polling for scalability
  useEffect(() => {
    // Don't do anything if auth is still loading
    if (authLoading) return;

    // Initial connection check when auth is ready
    checkConnection();

    // Set up focus event handler - check when user returns to tab
    const handleFocus = () => {
      // Avoid spamming if already checking or if database isn't ready
      const dbInfo = getDatabaseProviderInfo();
      if (!loadingRef.current && dbInfo.isInitialized) {
        checkConnection();
      }
    };

    window.addEventListener('focus', handleFocus);

    // Cleanup function
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [authLoading, isAuthenticated, checkConnection]);

  return {
    connected,
    loading: loading || authLoading,
    error,
    isAuthenticated,
    retry,
    lastCheckedAt,
  };
};