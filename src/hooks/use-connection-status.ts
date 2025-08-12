import { useAuth } from '@/contexts/auth-context';
import { db } from '@/config/firebase';
import { collection, getDocs, limit, query } from 'firebase/firestore';
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
 * Hook to monitor Firebase connection status and authentication state
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
      
      // Try a simple Firebase operation to test connection
      const testQuery = query(collection(db, 'survey-configs'), limit(1));
      await getDocs(testQuery);
      
      setConnected(true);
    } catch (err) {
      console.error('Firebase connection test failed:', err);
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
      checkConnection();
    }, POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [authLoading, isAuthenticated]);

  // Re-check on window focus for responsiveness
  useEffect(() => {
    if (authLoading) return;

    const handleFocus = () => {
      // Avoid spamming if already checking
      if (!loading) {
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