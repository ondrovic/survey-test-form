import { databaseHelpers } from '@/config/database';
import { ErrorLoggingService } from '@/services/error-logging.service';

/**
 * Service for cleaning up old/expired survey sessions
 */
export class SessionCleanupService {
  private static instance: SessionCleanupService | null = null;
  private isRunning = false;
  private cleanupInterval: NodeJS.Timeout | null = null;

  // Configuration
  private readonly SESSION_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 hours
  private readonly CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // Run every hour
  private readonly MAX_SESSIONS_PER_CLEANUP = 100; // Batch size

  private constructor() {}

  static getInstance(): SessionCleanupService {
    if (!SessionCleanupService.instance) {
      SessionCleanupService.instance = new SessionCleanupService();
    }
    return SessionCleanupService.instance;
  }

  /**
   * Start the background cleanup service
   */
  start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    // Run immediately
    this.performCleanup().catch(error => {
      ErrorLoggingService.logError({
        severity: 'medium',
        errorMessage: 'Session cleanup failed during startup',
        stackTrace: error instanceof Error ? error.stack : String(error),
        componentName: 'SessionCleanupService',
        functionName: 'start'
      });
    });

    // Schedule periodic cleanup
    this.cleanupInterval = setInterval(() => {
      this.performCleanup().catch(error => {
        ErrorLoggingService.logError({
          severity: 'medium',
          errorMessage: 'Periodic session cleanup failed',
          stackTrace: error instanceof Error ? error.stack : String(error),
          componentName: 'SessionCleanupService',
          functionName: 'start-interval'
        });
      });
    }, this.CLEANUP_INTERVAL_MS);

  }

  /**
   * Stop the background cleanup service
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    this.isRunning = false;
  }

  /**
   * Perform cleanup of old sessions
   */
  private async performCleanup(): Promise<void> {
    try {
      const cutoffTime = new Date(Date.now() - this.SESSION_TIMEOUT_MS);
      const cutoffISO = cutoffTime.toISOString();

      // Get all sessions that need cleanup
      const expiredSessions = await this.getExpiredSessions(cutoffISO);
      
      if (expiredSessions.length === 0) {
        return;
      }

      // Process in batches
      const batches = this.chunkArray(expiredSessions, this.MAX_SESSIONS_PER_CLEANUP);
      let _totalProcessed = 0;

      for (const batch of batches) {
        await this.processBatch(batch);
        _totalProcessed += batch.length; // Keep track of total processed sessions
      }

      
    } catch (error) {
      // Log the error using ErrorLoggingService
      ErrorLoggingService.logError({
        severity: 'medium',
        errorMessage: error instanceof Error ? error.message : 'Session cleanup failed',
        stackTrace: error instanceof Error ? error.stack : String(error),
        componentName: 'SessionCleanupService',
        functionName: 'performCleanup',
        userAction: 'Performing automatic session cleanup',
        additionalContext: {
          sessionTimeoutMs: this.SESSION_TIMEOUT_MS,
          maxSessionsPerCleanup: this.MAX_SESSIONS_PER_CLEANUP,
          errorType: 'session_cleanup'
        },
        tags: ['service', 'session', 'cleanup', 'background']
      });
    }
  }

  /**
   * Get expired sessions that need cleanup
   */
  private async getExpiredSessions(cutoffISO: string): Promise<any[]> {
    try {
      // Get all sessions that are still active but haven't had activity within the timeout period
      const allSessions = await databaseHelpers.getSurveySessions();
      
      return allSessions.filter(session => {
        // Only process sessions that are not already completed, abandoned, or expired
        if (['completed', 'abandoned', 'expired'].includes(session.status)) {
          return false;
        }

        // Check if last activity is older than cutoff
        const lastActivity = new Date(session.last_activity_at || session.started_at || session.created_at);
        return lastActivity < new Date(cutoffISO);
      });
    } catch (error) {
      // Log the error using ErrorLoggingService
      ErrorLoggingService.logError({
        severity: 'low',
        errorMessage: error instanceof Error ? error.message : 'Failed to get expired sessions',
        stackTrace: error instanceof Error ? error.stack : String(error),
        componentName: 'SessionCleanupService',
        functionName: 'getExpiredSessions',
        userAction: 'Retrieving expired sessions for cleanup',
        additionalContext: {
          cutoffISO,
          errorType: 'session_retrieval'
        },
        tags: ['service', 'session', 'cleanup', 'database']
      });
      
      return [];
    }
  }

  /**
   * Process a batch of expired sessions
   */
  private async processBatch(sessions: any[]): Promise<void> {
    const updatePromises = sessions.map(session => 
      this.markSessionAsExpired(session.id, session)
    );

    await Promise.allSettled(updatePromises);
  }

  /**
   * Mark a single session as expired
   */
  private async markSessionAsExpired(sessionId: string, session: any): Promise<void> {
    try {
      await databaseHelpers.updateSurveySession(sessionId, {
        status: 'expired',
        lastActivityAt: new Date().toISOString(),
        metadata: {
          ...session.metadata,
          expiredAt: new Date().toISOString(),
          expiredBy: 'cleanup-service',
          previousStatus: session.status,
          reason: 'inactivity_timeout'
        }
      });
    } catch (error) {
      // Log the error using ErrorLoggingService
      ErrorLoggingService.logError({
        severity: 'low',
        errorMessage: error instanceof Error ? error.message : `Failed to mark session ${sessionId} as expired`,
        stackTrace: error instanceof Error ? error.stack : String(error),
        componentName: 'SessionCleanupService',
        functionName: 'markSessionAsExpired',
        userAction: 'Marking individual session as expired',
        additionalContext: {
          sessionId,
          previousStatus: session.status,
          errorType: 'session_update'
        },
        tags: ['service', 'session', 'cleanup', 'database']
      });
    }
  }

  /**
   * Manually trigger cleanup (useful for testing or forced cleanup)
   */
  async manualCleanup(): Promise<number> {
    const cutoffTime = new Date(Date.now() - this.SESSION_TIMEOUT_MS);
    const expiredSessions = await this.getExpiredSessions(cutoffTime.toISOString());
    
    if (expiredSessions.length > 0) {
      await this.processBatch(expiredSessions);
    }

    return expiredSessions.length;
  }

  /**
   * Get cleanup statistics
   */
  getStats(): {
    isRunning: boolean;
    sessionTimeoutHours: number;
    cleanupIntervalMinutes: number;
    maxSessionsPerCleanup: number;
  } {
    return {
      isRunning: this.isRunning,
      sessionTimeoutHours: this.SESSION_TIMEOUT_MS / (60 * 60 * 1000),
      cleanupIntervalMinutes: this.CLEANUP_INTERVAL_MS / (60 * 1000),
      maxSessionsPerCleanup: this.MAX_SESSIONS_PER_CLEANUP
    };
  }

  /**
   * Utility function to chunk array into smaller arrays
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}