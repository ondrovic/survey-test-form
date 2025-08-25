import { useState, useCallback, useEffect, useRef } from 'react';
import { databaseHelpers } from '@/config/database';
import { getClientIPAddressWithTimeout } from '../utils/ip.utils';

// Global session creation tracker to prevent duplicates across React StrictMode
class SessionCreationTracker {
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

interface SessionMetrics {
  sessionId: string | null;
  startedAt: Date | null;
  lastActivityAt: Date | null;
  currentSection: number;
  status: 'started' | 'in_progress' | 'completed' | 'abandoned' | 'expired';
}

interface UseSurveySessionOptions {
  surveyInstanceId: string;
  totalSections?: number;
  activityTimeoutMs?: number; // How long to wait before considering session abandoned
}

export const useSurveySession = ({ 
  surveyInstanceId, 
  totalSections = 1,
  activityTimeoutMs = 30 * 60 * 1000 // 30 minutes default timeout
}: UseSurveySessionOptions) => {
  const [session, setSession] = useState<SessionMetrics>({
    sessionId: null,
    startedAt: null,
    lastActivityAt: null,
    currentSection: 0,
    status: 'started'
  });
  
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const sessionTokenRef = useRef<string | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const abandonCheckRef = useRef<NodeJS.Timeout>();
  const sessionTracker = SessionCreationTracker.getInstance();

  // Generate a unique session token
  const generateSessionToken = useCallback(() => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Create a new survey session
  const createSession = useCallback(async (): Promise<string | null> => {
    console.log('🔍 createSession called:', {
      isCreatingSession,
      surveyInstanceId,
      trackerIsCreating: sessionTracker.isCreating(surveyInstanceId),
      trackerHasExisting: !!sessionTracker.getExistingSession(surveyInstanceId)
    });

    // Check global tracker first
    if (sessionTracker.isCreating(surveyInstanceId)) {
      console.log('🔍 Skipping session creation - already creating globally');
      return null;
    }

    const existingSessionId = sessionTracker.getExistingSession(surveyInstanceId);
    if (existingSessionId) {
      console.log('🔍 Using existing session from global tracker:', existingSessionId);
      return existingSessionId;
    }

    if (isCreatingSession) {
      console.log('🔍 Skipping session creation - already in progress locally');
      return null;
    }

    // Mark as creating globally and locally
    sessionTracker.startCreating(surveyInstanceId);
    setIsCreatingSession(true);
    try {
      const sessionToken = generateSessionToken();
      const now = new Date();
      
      // Get client IP address with timeout
      const clientIP = await getClientIPAddressWithTimeout(3000);
      
      const sessionData = {
        surveyInstanceId,
        sessionToken,
        startedAt: now.toISOString(),
        lastActivityAt: now.toISOString(),
        currentSection: 0,
        totalSections,
        status: 'started' as const,
        userAgent: navigator.userAgent,
        ipAddress: clientIP || '127.0.0.1',
        metadata: {
          createdBy: 'survey-form',
          sessionStart: now.toISOString(),
          ipDetected: !!clientIP,
          browser: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language
        }
      };

      console.log('🚀 Creating survey session with data:', sessionData);
      const savedSession = await databaseHelpers.addSurveySession(sessionData);
      
      console.log('🔍 Database response from addSurveySession:', savedSession);
      
      if (savedSession?.id) {
        sessionTokenRef.current = sessionToken;
        localStorage.setItem(`survey_session_${surveyInstanceId}`, sessionToken);
        
        setSession({
          sessionId: savedSession.id,
          startedAt: now,
          lastActivityAt: now,
          currentSection: 0,
          status: 'started'
        });

        console.log('✅ Survey session created successfully:', {
          sessionId: savedSession.id,
          sessionToken,
          surveyInstanceId
        });

        // Mark as finished in global tracker
        sessionTracker.finishCreating(surveyInstanceId, savedSession.id);
        return savedSession.id;
      } else {
        console.log('❌ No session ID returned from database');
        sessionTracker.finishCreating(surveyInstanceId); // Mark as finished even if failed
        return null;
      }
    } catch (error) {
      console.error('❌ Failed to create survey session:', error);
      sessionTracker.finishCreating(surveyInstanceId); // Mark as finished even if failed
      return null;
    } finally {
      setIsCreatingSession(false);
    }
  }, [surveyInstanceId, totalSections, generateSessionToken, sessionTracker]);

  // Mark session as abandoned
  const abandonSession = useCallback(async () => {
    if (!session.sessionId || session.status === 'completed' || session.status === 'abandoned') return;

    try {
      await databaseHelpers.updateSurveySession(session.sessionId, {
        status: 'abandoned',
        lastActivityAt: new Date().toISOString()
      });

      setSession(prev => ({
        ...prev,
        status: 'abandoned',
        lastActivityAt: new Date()
      }));

      console.log('⏰ Session marked as abandoned:', session.sessionId);
    } catch (error) {
      console.error('❌ Failed to mark session as abandoned:', error);
    }
  }, [session.sessionId, session.status]);

  // Start abandon detection timer
  const startAbandonTimer = useCallback(() => {
    if (!session.sessionId || session.status === 'completed' || session.status === 'abandoned') return;

    // Clear any existing timer
    if (abandonCheckRef.current) {
      clearTimeout(abandonCheckRef.current);
    }

    // Set new timer
    abandonCheckRef.current = setTimeout(() => {
      console.log('⏰ Session timeout reached, marking as abandoned...');
      abandonSession();
    }, activityTimeoutMs);

    console.log(`⏰ Abandon timer started: ${activityTimeoutMs / 1000}s`);
  }, [session.sessionId, session.status, abandonSession, activityTimeoutMs]);

  // Reset abandon detection timer on activity
  const resetAbandonTimer = useCallback(() => {
    if (session.status === 'completed' || session.status === 'abandoned') return;
    startAbandonTimer();
  }, [startAbandonTimer, session.status]);

  // Update session activity (debounced)
  const updateActivity = useCallback((newSection?: number) => {
    if (!session.sessionId || session.status === 'completed' || session.status === 'abandoned') return;

    // Reset abandon timer on activity
    resetAbandonTimer();

    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Debounce activity updates to avoid excessive database writes
    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        const now = new Date();
        const updatedStatus = newSection !== undefined && newSection > 0 ? 'in_progress' as const : session.status;
        
        await databaseHelpers.updateSurveySession(session.sessionId!, {
          lastActivityAt: now.toISOString(),
          currentSection: newSection !== undefined ? newSection : session.currentSection,
          status: updatedStatus
        });

        setSession(prev => ({
          ...prev,
          lastActivityAt: now,
          currentSection: newSection !== undefined ? newSection : prev.currentSection,
          status: updatedStatus
        }));

        console.log('📊 Session activity updated:', {
          sessionId: session.sessionId,
          section: newSection !== undefined ? newSection : session.currentSection,
          status: updatedStatus
        });
      } catch (error) {
        console.error('❌ Failed to update session activity:', error);
      }
    }, 2000); // 2 second debounce
  }, [session.sessionId, session.status, session.currentSection, resetAbandonTimer]);

  // Complete the session
  const completeSession = useCallback(async () => {
    if (!session.sessionId) return;

    try {
      // Clear any pending abandon check
      if (abandonCheckRef.current) {
        clearTimeout(abandonCheckRef.current);
      }

      await databaseHelpers.updateSurveySession(session.sessionId, {
        status: 'completed',
        lastActivityAt: new Date().toISOString()
      });

      setSession(prev => ({
        ...prev,
        status: 'completed',
        lastActivityAt: new Date()
      }));

      // Clean up localStorage and global tracker
      localStorage.removeItem(`survey_session_${surveyInstanceId}`);
      sessionTracker.clearSession(surveyInstanceId);
      
      console.log('✅ Session completed:', session.sessionId);
    } catch (error) {
      console.error('❌ Failed to complete session:', error);
    }
  }, [session.sessionId, surveyInstanceId, sessionTracker]);

  // Initialize session on mount or resume existing session
  useEffect(() => {
    if (session.sessionId) {
      return; // Already have a session, don't initialize again
    }

    const initializeSession = async () => {
      console.log('🔍 Initializing session for:', {
        surveyInstanceId,
        hasExistingSessionId: !!session.sessionId
      });

      // Check for existing session token in localStorage
      const storedToken = localStorage.getItem(`survey_session_${surveyInstanceId}`);
      
      console.log('🔍 Found stored token:', storedToken ? 'YES' : 'NO');
      
      if (storedToken) {
        try {
          // Try to resume existing session
          const existingSession = await databaseHelpers.getSurveySessionByToken(storedToken);
          
          if (existingSession && existingSession.status !== 'completed' && existingSession.status !== 'abandoned') {
            // Resume session - convert snake_case to camelCase
            setSession({
              sessionId: existingSession.id,
              startedAt: new Date(existingSession.started_at),
              lastActivityAt: new Date(existingSession.last_activity_at),
              currentSection: existingSession.current_section || 0,
              status: existingSession.status
            });
            sessionTokenRef.current = storedToken;
            
            console.log('🔄 Resumed existing session:', existingSession.id);
            
            // Update activity to mark as active again and start abandon timer
            setTimeout(() => {
              if (existingSession.id) {
                updateActivity();
                startAbandonTimer();
              }
            }, 100);
            return;
          } else {
            // Clean up invalid session
            localStorage.removeItem(`survey_session_${surveyInstanceId}`);
          }
        } catch (error) {
          console.error('❌ Error resuming session:', error);
          localStorage.removeItem(`survey_session_${surveyInstanceId}`);
        }
      }

      // Create new session if no valid session exists
      console.log('🔍 No existing session found, creating new one...');
      const sessionId = await createSession();
      if (sessionId) {
        setTimeout(() => startAbandonTimer(), 100);
      }
    };

    initializeSession();
  }, [surveyInstanceId]); // Remove unstable dependencies

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (abandonCheckRef.current) {
        clearTimeout(abandonCheckRef.current);
      }
    };
  }, []);

  return {
    session,
    isCreatingSession,
    createSession,
    updateActivity,
    completeSession,
    abandonSession,
    // Helper functions
    getSessionDuration: useCallback(() => {
      if (!session.startedAt) return 0;
      return Math.floor((Date.now() - session.startedAt.getTime()) / 1000);
    }, [session.startedAt]),
    
    isSessionActive: useCallback(() => {
      return session.sessionId && session.status !== 'completed' && session.status !== 'abandoned';
    }, [session.sessionId, session.status]),

    // Abandon timer control
    resetAbandonTimer,
    startAbandonTimer
  };
};