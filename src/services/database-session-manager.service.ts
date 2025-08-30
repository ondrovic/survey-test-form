import { databaseHelpers } from '@/config/database';
import { ErrorLoggingService } from './error-logging.service';

/**
 * Database-driven session manager that works in conjunction with database triggers
 * and scheduled cleanup jobs for reliable session status management.
 */
export class DatabaseSessionManagerService {
  private static instance: DatabaseSessionManagerService | null = null;

  // Configuration
  private readonly CLEANUP_CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes
  private readonly FORCE_CLEANUP_INTERVAL = 30 * 60 * 1000; // Force cleanup every 30 minutes
  
  private checkInterval: NodeJS.Timeout | null = null;
  private forceCleanupInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  private constructor() {}

  static getInstance(): DatabaseSessionManagerService {
    if (!DatabaseSessionManagerService.instance) {
      DatabaseSessionManagerService.instance = new DatabaseSessionManagerService();
    }
    return DatabaseSessionManagerService.instance;
  }

  /**
   * Start the session manager
   */
  start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    // Periodic light checks - just call the database function
    this.checkInterval = setInterval(() => {
      this.performLightCleanup().catch(error => {
        // Log the error using ErrorLoggingService
        ErrorLoggingService.logError({
          severity: 'high',
          errorMessage: error instanceof Error ? error.message : 'Light session cleanup failed',
          stackTrace: error instanceof Error ? error.stack : String(error),
          componentName: 'DatabaseSessionManagerService',
          functionName: 'start.checkInterval',
          userAction: 'Automatic session cleanup',
          additionalContext: {
            cleanupType: 'light',
            interval: this.CLEANUP_CHECK_INTERVAL,
            errorType: 'session_cleanup_failure'
          },
          tags: ['database', 'session-manager', 'service', 'cleanup']
        });
      });
    }, this.CLEANUP_CHECK_INTERVAL);

    // Periodic full cleanup via Edge Function (if available)
    this.forceCleanupInterval = setInterval(() => {
      this.performFullCleanup().catch(error => {
        // Log the error using ErrorLoggingService
        ErrorLoggingService.logError({
          severity: 'high',
          errorMessage: error instanceof Error ? error.message : 'Full session cleanup failed',
          stackTrace: error instanceof Error ? error.stack : String(error),
          componentName: 'DatabaseSessionManagerService',
          functionName: 'start.forceCleanupInterval',
          userAction: 'Automatic full session cleanup',
          additionalContext: {
            cleanupType: 'full',
            interval: this.FORCE_CLEANUP_INTERVAL,
            errorType: 'session_cleanup_failure'
          },
          tags: ['database', 'session-manager', 'service', 'cleanup']
        });
      });
    }, this.FORCE_CLEANUP_INTERVAL);

    // Run initial light cleanup
    this.performLightCleanup().catch(error => {
      // Log the error using ErrorLoggingService
      ErrorLoggingService.logError({
        severity: 'high',
        errorMessage: error instanceof Error ? error.message : 'Initial session cleanup failed',
        stackTrace: error instanceof Error ? error.stack : String(error),
        componentName: 'DatabaseSessionManagerService',
        functionName: 'start.initialCleanup',
        userAction: 'Initial session manager startup cleanup',
        additionalContext: {
          cleanupType: 'initial',
          errorType: 'session_cleanup_failure'
        },
        tags: ['database', 'session-manager', 'service', 'startup']
      });
    });
  }

  /**
   * Stop the session manager
   */
  stop(): void {
    if (!this.isRunning) return;

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    if (this.forceCleanupInterval) {
      clearInterval(this.forceCleanupInterval);
      this.forceCleanupInterval = null;
    }

    this.isRunning = false;
  }

  /**
   * Perform light cleanup using database function
   */
  private async performLightCleanup(): Promise<void> {
    try {
      // Call the database function directly
      const result = await this.callCleanupFunction();
      
      if (result && result.success) {
        const stats = result as any;
        if (stats.abandoned_sessions > 0 || stats.expired_sessions > 0) {
          // QUESTION: should we do something here? log to database?    
        }
      }
    } catch (error) {
      // Log the error using ErrorLoggingService
      ErrorLoggingService.logError({
        severity: 'high',
        errorMessage: error instanceof Error ? error.message : 'Light cleanup failed',
        stackTrace: error instanceof Error ? error.stack : String(error),
        componentName: 'DatabaseSessionManagerService',
        functionName: 'performLightCleanup',
        userAction: 'Performing light session cleanup',
        additionalContext: {
          cleanupType: 'light',
          errorType: 'session_cleanup_execution'
        },
        tags: ['database', 'session-manager', 'service', 'cleanup']
      });
    }
  }

  /**
   * Perform full cleanup via Edge Function (if available)
   */
  private async performFullCleanup(): Promise<void> {
    try {
      // Try to call the Edge Function if it's available
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (supabaseUrl && supabaseAnonKey) {
        const response = await fetch(`${supabaseUrl}/functions/v1/session-cleanup`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          await response.json(); // Consume response but don't use result
          // QUESTION - should we do something with the result? other than log to console?
        } else {
          // Fall back to database function
          await this.performLightCleanup();
        }
      } else {
        // Fall back to database function
        await this.performLightCleanup();
      }
    } catch (error) {
      // Log the error using ErrorLoggingService
      ErrorLoggingService.logError({
        severity: 'high',
        errorMessage: error instanceof Error ? error.message : 'Full cleanup failed',
        stackTrace: error instanceof Error ? error.stack : String(error),
        componentName: 'DatabaseSessionManagerService',
        functionName: 'performFullCleanup',
        userAction: 'Performing full session cleanup',
        additionalContext: {
          cleanupType: 'full',
          errorType: 'session_cleanup_execution',
          fallbackAttempted: true
        },
        tags: ['database', 'session-manager', 'service', 'cleanup']
      });
      
      // Fall back to light cleanup
      await this.performLightCleanup();
    }
  }

  /**
   * Call the database cleanup function directly
   */
  private async callCleanupFunction(): Promise<any> {
    try {
      // This needs to be implemented in the database helpers
      // For now, we'll use a direct approach
      return await this.executeCleanupDirectly();
    } catch (error) {
      // Log the error using ErrorLoggingService
      ErrorLoggingService.logError({
        severity: 'high',
        errorMessage: error instanceof Error ? error.message : 'Database cleanup function failed',
        stackTrace: error instanceof Error ? error.stack : String(error),
        componentName: 'DatabaseSessionManagerService',
        functionName: 'callCleanupFunction',
        userAction: 'Calling database cleanup function',
        additionalContext: {
          errorType: 'database_function_call',
          cleanupType: 'database'
        },
        tags: ['database', 'session-manager', 'service']
      });
      
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Execute cleanup directly using existing session service
   */
  private async executeCleanupDirectly(): Promise<any> {
    try {
      const cutoffTime = new Date(Date.now() - (2 * 60 * 60 * 1000)); // 2 hours ago
      const allSessions = await databaseHelpers.getSurveySessions();
      
      let abandonedCount = 0;
      let expiredCount = 0;
      
      const updatePromises = allSessions.map(async (session) => {
        const lastActivity = new Date(session.last_activity_at || session.started_at || session.created_at);
        const sessionAge = new Date(session.created_at);
        const now = new Date();
        
        // Skip already processed sessions
        if (['completed', 'abandoned', 'expired'].includes(session.status)) {
          return;
        }
        
        // Mark as abandoned after 2 hours of inactivity (but not too new sessions)
        if (session.status === 'started' || session.status === 'in_progress') {
          if (lastActivity < cutoffTime && sessionAge < new Date(now.getTime() - (2 * 60 * 60 * 1000))) {
            await databaseHelpers.updateSurveySession(session.id, {
              status: 'abandoned',
              lastActivityAt: new Date().toISOString(),
              metadata: {
                ...session.metadata,
                auto_abandoned_at: new Date().toISOString(),
                previous_status: session.status,
                reason: 'inactivity_timeout_2h'
              }
            });
            abandonedCount++;
            return;
          }
        }
        
        // Mark as expired after 24 hours total
        const expireCutoff = new Date(now.getTime() - (24 * 60 * 60 * 1000));
        if (sessionAge < expireCutoff) {
          await databaseHelpers.updateSurveySession(session.id, {
            status: 'expired',
            lastActivityAt: new Date().toISOString(),
            metadata: {
              ...session.metadata,
              auto_expired_at: new Date().toISOString(),
              previous_status: session.status,
              reason: 'total_timeout_24h'
            }
          });
          expiredCount++;
        }
      });
      
      await Promise.allSettled(updatePromises);
      
      return {
        success: true,
        timestamp: new Date().toISOString(),
        abandoned_sessions: abandonedCount,
        expired_sessions: expiredCount,
        message: `Processed ${abandonedCount} abandoned and ${expiredCount} expired sessions`
      };
      
    } catch (error) {
      return {
        success: false,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Direct cleanup execution failed'
      };
    }
  }

  /**
   * Manually trigger cleanup
   */
  async manualCleanup(): Promise<any> {
    return await this.performLightCleanup();
  }

  /**
   * Get manager statistics
   */
  getStats() {
    return {
      isRunning: this.isRunning,
      checkIntervalMinutes: this.CLEANUP_CHECK_INTERVAL / (60 * 1000),
      fullCleanupIntervalMinutes: this.FORCE_CLEANUP_INTERVAL / (60 * 1000)
    };
  }
}