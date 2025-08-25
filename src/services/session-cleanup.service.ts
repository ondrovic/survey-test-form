import { databaseHelpers } from '@/config/database';

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
      console.log('📅 Session cleanup service already running');
      return;
    }

    this.isRunning = true;
    console.log('📅 Starting session cleanup service...');

    // Run immediately
    this.performCleanup().catch(error => {
      console.error('❌ Initial session cleanup failed:', error);
    });

    // Schedule periodic cleanup
    this.cleanupInterval = setInterval(() => {
      this.performCleanup().catch(error => {
        console.error('❌ Scheduled session cleanup failed:', error);
      });
    }, this.CLEANUP_INTERVAL_MS);

    console.log(`📅 Session cleanup service started (running every ${this.CLEANUP_INTERVAL_MS / 1000 / 60}min)`);
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
    console.log('📅 Session cleanup service stopped');
  }

  /**
   * Perform cleanup of old sessions
   */
  private async performCleanup(): Promise<void> {
    try {
      console.log('🧹 Starting session cleanup...');
      
      const cutoffTime = new Date(Date.now() - this.SESSION_TIMEOUT_MS);
      const cutoffISO = cutoffTime.toISOString();

      // Get all sessions that need cleanup
      const expiredSessions = await this.getExpiredSessions(cutoffISO);
      
      if (expiredSessions.length === 0) {
        console.log('🧹 No expired sessions found');
        return;
      }

      console.log(`🧹 Found ${expiredSessions.length} expired sessions`);

      // Process in batches
      const batches = this.chunkArray(expiredSessions, this.MAX_SESSIONS_PER_CLEANUP);
      let totalProcessed = 0;

      for (const batch of batches) {
        await this.processBatch(batch);
        totalProcessed += batch.length;
      }

      console.log(`✅ Session cleanup completed: ${totalProcessed} sessions marked as expired`);
    } catch (error) {
      console.error('❌ Session cleanup failed:', error);
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
      console.error('❌ Failed to get expired sessions:', error);
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

      console.log(`⏰ Session ${sessionId} marked as expired (was: ${session.status})`);
    } catch (error) {
      console.error(`❌ Failed to mark session ${sessionId} as expired:`, error);
    }
  }

  /**
   * Manually trigger cleanup (useful for testing or forced cleanup)
   */
  async manualCleanup(): Promise<number> {
    console.log('🧹 Manual session cleanup triggered...');
    
    const cutoffTime = new Date(Date.now() - this.SESSION_TIMEOUT_MS);
    const expiredSessions = await this.getExpiredSessions(cutoffTime.toISOString());
    
    if (expiredSessions.length > 0) {
      await this.processBatch(expiredSessions);
    }

    console.log(`✅ Manual cleanup completed: ${expiredSessions.length} sessions processed`);
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