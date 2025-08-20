import { useAuth } from '@/contexts/auth-context';
import { databaseHelpers, getDatabaseProviderInfo } from '@/config/database';
import { useEffect, useState } from 'react';

interface ConnectionStatus {
  connected: boolean;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  retry: () => void;
  lastCheckedAt: Date | null;
}

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

  const checkConnection = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if database is initialized
      const dbInfo = getDatabaseProviderInfo();
      if (!dbInfo.isInitialized) {
        console.log('⏳ Connection status - Database not ready yet, skipping connection check...');
        setConnected(false);
        setError('Database service initializing...');
        setLoading(false);
        setLastCheckedAt(new Date());
        // Don't create infinite retry loops - let the auth context handle database initialization
        return;
      }
      
      // Try a simple database operation to test connection
      // This works with any provider (Firebase, Supabase, PostgreSQL)
      await databaseHelpers.getSurveyConfigs();
      
      setConnected(true);
      setError(null);
    } catch (err) {
      console.error('Database connection test failed:', err);
      setConnected(false);
      setError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setLoading(false);
      setLastCheckedAt(new Date());
    }
  };

  const retry = () => {
    checkConnection();
  };

  useEffect(() => {
    // Only check connection if auth is not loading
    if (!authLoading) {
      checkConnection();
    }
  }, [authLoading]);

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
  }, [authLoading, isAuthenticated]);

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
  }, [authLoading, loading]);

  return {
    connected,
    loading: loading || authLoading,
    error,
    isAuthenticated,
    retry,
    lastCheckedAt,
  };
};