import { useState, useCallback, useEffect, useRef } from 'react';
import { databaseHelpers } from '@/config/database';
import { getClientIPAddressWithTimeout } from '../utils/ip.utils';
import { emailService } from '../services/email.service';

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
  savedAnswers?: Record<string, any>; // Store survey answers for persistence
}

interface UseSurveySessionOptions {
  surveyInstanceId: string;
  totalSections?: number;
  activityTimeoutMs?: number; // How long to wait before considering session abandoned (now less critical due to DB triggers)
}

export const useSurveySession = (options: UseSurveySessionOptions | null) => {
  // Extract options or use defaults when null
  const surveyInstanceId = options?.surveyInstanceId;
  const totalSections = options?.totalSections || 1;
  const [session, setSession] = useState<SessionMetrics>({
    sessionId: null,
    startedAt: null,
    lastActivityAt: null,
    currentSection: 0,
    status: 'started',
    savedAnswers: {}
  });
  
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const sessionTokenRef = useRef<string | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const activityDebounceRef = useRef<NodeJS.Timeout>();
  const sessionTracker = SessionCreationTracker.getInstance();

  // Generate a unique session token
  const generateSessionToken = useCallback(() => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Create a new survey session
  const createSession = useCallback(async (): Promise<string | null> => {
    // Early return if no surveyInstanceId provided
    if (!surveyInstanceId) {
      return null;
    }

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

  // Mark session as abandoned (now mainly for immediate user actions)
  const abandonSession = useCallback(async () => {
    if (!session.sessionId || session.status === 'completed' || session.status === 'abandoned') return;

    try {
      await databaseHelpers.updateSurveySession(session.sessionId, {
        status: 'abandoned',
        lastActivityAt: new Date().toISOString(),
        metadata: {
          abandonedBy: 'user_action',
          abandonedAt: new Date().toISOString()
        }
      });

      setSession(prev => ({
        ...prev,
        status: 'abandoned',
        lastActivityAt: new Date()
      }));

      console.log('⏰ Session manually marked as abandoned:', session.sessionId);
    } catch (error) {
      console.error('❌ Failed to mark session as abandoned:', error);
    }
  }, [session.sessionId, session.status]);

  // Save survey answers to session (debounced to avoid excessive writes)
  const saveAnswersToSession = useCallback((answers: Record<string, any>) => {
    if (!session.sessionId || session.status === 'completed' || session.status === 'abandoned') return;

    // Update local state immediately for instant feedback
    setSession(prev => ({
      ...prev,
      savedAnswers: { ...answers }
    }));

    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Debounce the database save to avoid excessive writes
    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        // Update session metadata with answers
        const existingMetadata = await databaseHelpers.getSurveySession(session.sessionId!);
        const updatedMetadata = {
          ...existingMetadata?.metadata,
          savedAnswers: answers,
          lastAnswerSave: new Date().toISOString()
        };

        await databaseHelpers.updateSurveySession(session.sessionId!, {
          metadata: updatedMetadata,
          lastActivityAt: new Date().toISOString()
        });

        console.log('📊 Survey answers saved to session:', {
          sessionId: session.sessionId,
          answerCount: Object.keys(answers).length
        });
      } catch (error) {
        console.error('❌ Failed to save answers to session:', error);
      }
    }, 1000); // 1 second debounce for answer saving
  }, [session.sessionId, session.status]);

  // Update session activity (debounced, database triggers handle status updates)
  const updateActivity = useCallback((newSection?: number) => {
    if (!surveyInstanceId || !session.sessionId || session.status === 'completed' || session.status === 'abandoned') return;

    // Clear previous timeout
    if (activityDebounceRef.current) {
      clearTimeout(activityDebounceRef.current);
    }

    // Debounce activity updates to avoid excessive database writes
    activityDebounceRef.current = setTimeout(async () => {
      try {
        const now = new Date();
        
        await databaseHelpers.updateSurveySession(session.sessionId!, {
          lastActivityAt: now.toISOString(),
          currentSection: newSection !== undefined ? newSection : session.currentSection
          // Note: status will be updated by database triggers based on activity and section progress
        });

        setSession(prev => {
          // Determine status based on section progress (database trigger will also handle this)
          const newStatus = newSection !== undefined && newSection > 0 ? 'in_progress' as const : prev.status;
          return {
            ...prev,
            lastActivityAt: now,
            currentSection: newSection !== undefined ? newSection : prev.currentSection,
            status: newStatus
          };
        });

        console.log('📊 Session activity updated:', {
          sessionId: session.sessionId,
          section: newSection !== undefined ? newSection : session.currentSection,
          lastActivity: now.toISOString()
        });
      } catch (error) {
        console.error('❌ Failed to update session activity:', error);
      }
    }, 1500); // Reduced debounce time since we're not managing abandonment client-side
  }, [session.sessionId, session.status, session.currentSection]);

  // Complete the session
  const completeSession = useCallback(async (surveyData?: {
    responses: Record<string, any>;
    surveyTitle?: string;
  }) => {
    console.log('🔍 completeSession called with:', {
      sessionId: session.sessionId,
      hasSurveyData: !!surveyData,
      surveyDataKeys: surveyData ? Object.keys(surveyData) : [],
      responses: surveyData?.responses,
      surveyTitle: surveyData?.surveyTitle
    });

    if (!session.sessionId) {
      console.log('❌ No session ID, skipping session completion');
      return;
    }

    try {
      await databaseHelpers.updateSurveySession(session.sessionId, {
        status: 'completed',
        lastActivityAt: new Date().toISOString(),
        metadata: {
          completedAt: new Date().toISOString(),
          completedBy: 'user_submission'
        }
      });

      setSession(prev => ({
        ...prev,
        status: 'completed',
        lastActivityAt: new Date()
      }));

      // Send email notification if survey data is provided
      if (surveyData && surveyInstanceId) {
        try {
          console.log('🔍 Email notification check - Survey data received:', {
            hasSurveyData: !!surveyData,
            hasResponses: !!surveyData.responses,
            responseKeys: Object.keys(surveyData.responses || {}),
            responseValues: surveyData.responses,
            surveyTitle: surveyData.surveyTitle
          });

          // Look for email field in responses using multiple strategies
          let recipientEmail: string | undefined;
          let foundField: string | undefined;
          
          // Strategy 1: Look for common field name patterns (including transformed names)
          const emailFields = [
            'email', 'Email', 'EMAIL',
            'emailAddress', 'EmailAddress', 'email_address', 
            'participantEmail', 'userEmail', 'user_email',
            'contactEmail', 'contact_email', 'e_mail', 'eMail'
          ];
          
          for (const field of emailFields) {
            if (surveyData.responses[field] && typeof surveyData.responses[field] === 'string') {
              recipientEmail = surveyData.responses[field] as string;
              foundField = field;
              break;
            }
          }
          
          // Strategy 2: Look for fields that END with common email patterns (for transformed field names)
          if (!recipientEmail) {
            const emailPatterns = ['_email', '_Email', 'email', 'Email'];
            for (const [fieldName, value] of Object.entries(surveyData.responses)) {
              if (typeof value === 'string' && emailPatterns.some(pattern => fieldName.endsWith(pattern))) {
                recipientEmail = value;
                foundField = fieldName;
                break;
              }
            }
          }
          
          // Strategy 3: Look for any field that contains a valid email address (fallback)
          if (!recipientEmail) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            for (const [fieldName, value] of Object.entries(surveyData.responses)) {
              if (typeof value === 'string' && emailRegex.test(value)) {
                recipientEmail = value;
                foundField = fieldName;
                break;
              }
            }
          }

          console.log('🔍 Email field search results:', {
            foundField,
            recipientEmail,
            hasAtSymbol: recipientEmail ? recipientEmail.includes('@') : false,
            allResponseFields: Object.keys(surveyData.responses),
            strategy: foundField ? (
              emailFields.includes(foundField) ? 'Strategy 1: Direct match' :
              foundField.endsWith('_email') || foundField.endsWith('_Email') || foundField.endsWith('email') || foundField.endsWith('Email') ? 'Strategy 2: Ends with email pattern' :
              'Strategy 3: Email regex match'
            ) : 'No email found'
          });

          if (recipientEmail && recipientEmail.includes('@')) {
            console.log('📧 Sending survey completion email to:', recipientEmail);
            
            const emailResult = await emailService.sendSurveyCompletionEmail({
              surveyInstanceId: surveyInstanceId,
              sessionId: session.sessionId,
              recipientEmail: recipientEmail,
              surveyResponses: surveyData.responses,
              surveyTitle: surveyData.surveyTitle
            });

            if (emailResult.success) {
              console.log('✅ Survey completion email sent successfully');
            } else {
              console.warn('⚠️ Email sending failed but survey was completed:', emailResult.error);
            }
          } else {
            console.log('📧 No valid email address found in survey responses, skipping email notification');
            console.log('📧 Available response fields:', Object.keys(surveyData.responses || {}));
          }
        } catch (emailError) {
          console.warn('⚠️ Email sending failed but survey was completed:', emailError);
          // Don't throw - email failure shouldn't prevent session completion
        }
      } else {
        console.log('🔍 Email notification skipped:', {
          hasSurveyData: !!surveyData,
          surveyInstanceId
        });
      }

      // Clean up localStorage and global tracker
      if (surveyInstanceId) {
        localStorage.removeItem(`survey_session_${surveyInstanceId}`);
        sessionTracker.clearSession(surveyInstanceId);
      }
      
      console.log('✅ Session completed:', session.sessionId);
    } catch (error) {
      console.error('❌ Failed to complete session:', error);
    }
  }, [session.sessionId, surveyInstanceId, sessionTracker]);

  // Initialize session on mount or resume existing session
  useEffect(() => {
    if (!surveyInstanceId || session.sessionId) {
      return; // No surveyInstanceId provided or already have a session, don't initialize
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
            // Resume session - convert snake_case to camelCase and restore saved answers
            const savedAnswers = existingSession.metadata?.savedAnswers || {};
            setSession({
              sessionId: existingSession.id,
              startedAt: new Date(existingSession.started_at),
              lastActivityAt: new Date(existingSession.last_activity_at),
              currentSection: existingSession.current_section || 0,
              status: existingSession.status,
              savedAnswers: savedAnswers
            });
            sessionTokenRef.current = storedToken;
            
            console.log('🔄 Resumed existing session:', existingSession.id);
            
            // Update activity to mark as active again (database will handle status management)
            setTimeout(() => {
              if (existingSession.id) {
                updateActivity();
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
      await createSession();
    };

    initializeSession();
  }, [surveyInstanceId]); // Remove unstable dependencies

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (activityDebounceRef.current) {
        clearTimeout(activityDebounceRef.current);
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
    saveAnswersToSession,
    // Helper functions
    getSessionDuration: useCallback(() => {
      if (!session.startedAt) return 0;
      return Math.floor((Date.now() - session.startedAt.getTime()) / 1000);
    }, [session.startedAt]),
    
    isSessionActive: useCallback(() => {
      return session.sessionId && session.status !== 'completed' && session.status !== 'abandoned' && session.status !== 'expired';
    }, [session.sessionId, session.status])
  };
};