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
}

/**
 * Hook to monitor Firebase connection status and authentication state
 */
export const useConnectionStatus = (): ConnectionStatus => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return {
    connected,
    loading: loading || authLoading,
    error,
    isAuthenticated,
    retry,
  };
};