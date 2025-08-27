/**
 * Session Management Type Definitions
 * 
 * Types for survey session tracking, connection status monitoring,
 * and session lifecycle management.
 */

export type SessionStatus = 'started' | 'in_progress' | 'completed' | 'abandoned' | 'expired';

/**
 * Session metrics and tracking data
 */
export interface SessionMetrics {
  sessionId: string | null;
  startedAt: Date | null;
  lastActivityAt: Date | null;
  currentSection: number;
  status: SessionStatus;
  savedAnswers?: Record<string, any>; // Store survey answers for persistence
}

/**
 * Configuration options for survey session hook
 */
export interface UseSurveySessionOptions {
  surveyInstanceId: string;
  totalSections?: number;
  activityTimeoutMs?: number; // How long to wait before considering session abandoned
}

/**
 * Connection status interface for database monitoring
 */
export interface ConnectionStatus {
  connected: boolean;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  retry: () => void;
  lastCheckedAt: Date | null;
}

/**
 * Singleton class for tracking session creation across components
 * Prevents duplicate session creation in React StrictMode
 */
export class SessionCreationTracker {
  private static instance: SessionCreationTracker;
  private creatingInstances = new Set<string>();
  private createdSessions = new Map<string, string>(); // surveyInstanceId -> sessionId
  
  static getInstance(): SessionCreationTracker {
    if (!SessionCreationTracker.instance) {
      SessionCreationTracker.instance = new SessionCreationTracker();
    }
    return SessionCreationTracker.instance;
  }
  
  isCreating(surveyInstanceId: string): boolean {
    return this.creatingInstances.has(surveyInstanceId);
  }
  
  startCreating(surveyInstanceId: string): void {
    this.creatingInstances.add(surveyInstanceId);
  }
  
  finishCreating(surveyInstanceId: string, sessionId?: string): void {
    this.creatingInstances.delete(surveyInstanceId);
    if (sessionId) {
      this.createdSessions.set(surveyInstanceId, sessionId);
    }
  }
  
  getExistingSession(surveyInstanceId: string): string | undefined {
    return this.createdSessions.get(surveyInstanceId);
  }
  
  clearSession(surveyInstanceId: string): void {
    this.createdSessions.delete(surveyInstanceId);
  }
}