import { useAuth } from '@/contexts/auth-context';
import { databaseHelpers, getDatabaseProviderInfo } from '@/config/database';
import { ErrorLoggingService } from '@/services/error-logging.service';
import { useCallback, useEffect, useState } from 'react';
import { ConnectionStatus } from '@/types';

/**
 * Hook to monitor database connection status and authentication state
 * Works with any configured database provider (Firebase, Supabase, PostgreSQL)
 */
export const useConnectionStatus = (): ConnectionStatus => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);
  // Track only when the last check completed (success or failure)

  const checkConnection = useCallback(async () => {
    try {
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
      setLoading(false);
      setLastCheckedAt(new Date());
    }
  }, []);

  const retry = () => {
    checkConnection();
  };

  useEffect(() => {
    // Only check connection if auth is not loading
    if (!authLoading) {
      checkConnection();
    }
  }, [authLoading, checkConnection]);

  // Poll periodically to keep status fresh
  useEffect(() => {
    if (authLoading || !isAuthenticated) return;

    const POLL_INTERVAL_MS = 60_000; // 1 minute
    const intervalId = setInterval(() => {
      const dbInfo = getDatabaseProviderInfo();
      if (dbInfo.isInitialized) {
        checkConnection();
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [authLoading, isAuthenticated, checkConnection]);

  // Re-check on window focus for responsiveness
  useEffect(() => {
    if (authLoading) return;

    const handleFocus = () => {
      // Avoid spamming if already checking or if database isn't ready
      const dbInfo = getDatabaseProviderInfo();
      if (!loading && dbInfo.isInitialized) {
        checkConnection();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [authLoading, loading, checkConnection]);

  return {
    connected,
    loading: loading || authLoading,
    error,
    isAuthenticated,
    retry,
    lastCheckedAt,
  };
};