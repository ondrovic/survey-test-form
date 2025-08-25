import { useEffect, useRef } from 'react';
import { SessionCleanupService } from '../services/session-cleanup.service';

/**
 * Hook to manage the session cleanup service lifecycle
 */
export const useSessionCleanup = (enabled: boolean = true) => {
  const cleanupServiceRef = useRef<SessionCleanupService | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // Get singleton instance
    const cleanupService = SessionCleanupService.getInstance();
    cleanupServiceRef.current = cleanupService;

    // Start the service
    cleanupService.start();

    // Cleanup on unmount
    return () => {
      cleanupService.stop();
    };
  }, [enabled]);

  // Return service methods for manual control if needed
  return {
    manualCleanup: async () => {
      if (cleanupServiceRef.current) {
        return await cleanupServiceRef.current.manualCleanup();
      }
      return 0;
    },
    getStats: () => {
      if (cleanupServiceRef.current) {
        return cleanupServiceRef.current.getStats();
      }
      return null;
    },
    isRunning: cleanupServiceRef.current?.getStats().isRunning || false
  };
};