import { useState, useCallback, useEffect, useRef } from 'react';
import { databaseHelpers } from '@/config/database';
import { getClientIPAddressWithTimeout } from '../utils/ip.utils';
import { emailService } from '../services/email.service';
import { ErrorLoggingService } from '../services/error-logging.service';
import { SessionCreationTracker, SessionMetrics, UseSurveySessionOptions } from '@/types';

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
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activityDebounceRef = useRef<NodeJS.Timeout | null>(null);
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

    // Check global tracker first
    if (sessionTracker.isCreating(surveyInstanceId)) {
      return null;
    }

    const existingSessionId = sessionTracker.getExistingSession(surveyInstanceId);
    if (existingSessionId) {
      return existingSessionId;
    }

    if (isCreatingSession) {
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

      const savedSession = await databaseHelpers.addSurveySession(sessionData);
      
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

        // Mark as finished in global tracker
        sessionTracker.finishCreating(surveyInstanceId, savedSession.id);
        return savedSession.id;
      } else {
        sessionTracker.finishCreating(surveyInstanceId); // Mark as finished even if failed
        return null;
      }
    } catch (error) {
      // Log session creation error
      ErrorLoggingService.logCriticalError(
        'Failed to create survey session',
        error instanceof Error ? error : new Error(String(error)),
        {
          componentName: 'useSurveySession',
          functionName: 'createSession',
          surveyInstanceId,
          additionalContext: { totalSections }
        }
      );
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
    } catch (error) {
      // Log session abandonment error
      ErrorLoggingService.logError({
        severity: 'medium',
        errorMessage: 'Failed to abandon survey session',
        stackTrace: error instanceof Error ? error.stack : String(error),
        componentName: 'useSurveySession',
        functionName: 'abandonSession',
        sessionToken: sessionTokenRef.current || undefined,
        surveyInstanceId,
        additionalContext: { sessionId: session.sessionId }
      });
    }
  }, [session.sessionId, session.status]);

  // Save survey answers to session (debounced to avoid excessive writes)
  const saveAnswersToSession = useCallback((answers: Record<string, any>, currentPage?: number) => {
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
        // Get existing metadata to merge with new values
        const existingSession = await databaseHelpers.getSurveySession(session.sessionId!);
        const existingMetadata = existingSession?.metadata || {};
        
        // Merge existing metadata with new values
        const updatedMetadata = {
          ...existingMetadata,
          savedAnswers: answers,
          lastAnswerSave: new Date().toISOString()
        };
        
        // Only add currentPage if provided
        if (currentPage !== undefined) {
          updatedMetadata.currentPage = currentPage;
        }

        await databaseHelpers.updateSurveySession(session.sessionId!, {
          metadata: updatedMetadata,
          lastActivityAt: new Date().toISOString()
        });
      } catch (error) {
        ErrorLoggingService.logError({
          severity: 'medium',
          errorMessage: 'Failed to save answers to survey session',
          stackTrace: error instanceof Error ? error.stack : String(error),
          componentName: 'useSurveySession',
          functionName: 'saveAnswersToSession',
          sessionToken: sessionTokenRef.current || undefined,
          surveyInstanceId,
          additionalContext: { 
            sessionId: session.sessionId,
            answerCount: Object.keys(answers).length,
            currentPage 
          }
        });
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
        
        // If changing section, also update metadata to keep page tracking in sync
        const updateData: any = {
          lastActivityAt: now.toISOString(),
          currentSection: newSection !== undefined ? newSection : session.currentSection
          // Note: status will be updated by database triggers based on activity and section progress
        };
        
        // If section is changing, also update metadata.currentPage for consistent page restoration
        if (newSection !== undefined && newSection !== session.currentSection) {
          // Get existing metadata to merge with new values
          const existingSession = await databaseHelpers.getSurveySession(session.sessionId!);
          const existingMetadata = existingSession?.metadata || {};
          
          updateData.metadata = {
            ...existingMetadata,
            currentPage: newSection,
            lastPageUpdate: now.toISOString()
          };
        }
        
        await databaseHelpers.updateSurveySession(session.sessionId!, updateData);

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
      } catch (error) {
        ErrorLoggingService.logError({
          severity: 'medium',
          errorMessage: 'Failed to update session activity',
          stackTrace: error instanceof Error ? error.stack : String(error),
          componentName: 'useSurveySession',
          functionName: 'updateActivity',
          sessionToken: sessionTokenRef.current || undefined,
          surveyInstanceId,
          additionalContext: { 
            sessionId: session.sessionId,
            newSection,
            currentSection: session.currentSection 
          }
        });
      }
    }, 1500); // Reduced debounce time since we're not managing abandonment client-side
  }, [session.sessionId, session.status, session.currentSection]);

  // Complete the session
  const completeSession = useCallback(async (surveyData?: {
    responses: Record<string, any>;
    surveyTitle?: string;
  }) => {
    if (!session.sessionId) {
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
        // Look for email field in responses using multiple strategies
        let recipientEmail: string | undefined;
        try {
          
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
              break;
            }
          }
          
          // Strategy 2: Look for fields that END with common email patterns (for transformed field names)
          if (!recipientEmail) {
            const emailPatterns = ['_email', '_Email', 'email', 'Email'];
            for (const [fieldName, value] of Object.entries(surveyData.responses)) {
              if (typeof value === 'string' && emailPatterns.some(pattern => fieldName.endsWith(pattern))) {
                recipientEmail = value;
                break;
              }
            }
          }
          
          // Strategy 3: Look for any field that contains a valid email address (fallback)
          if (!recipientEmail) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            for (const [_fieldName, value] of Object.entries(surveyData.responses)) {
              if (typeof value === 'string' && emailRegex.test(value)) {
                recipientEmail = value;
                break;
              }
            }
          }

          if (recipientEmail && recipientEmail.includes('@')) {
            await emailService.sendSurveyCompletionEmail({
              surveyInstanceId: surveyInstanceId,
              sessionId: session.sessionId,
              recipientEmail: recipientEmail,
              surveyResponses: surveyData.responses,
              surveyTitle: surveyData.surveyTitle
            });

            
          }
        } catch (emailError) {
          ErrorLoggingService.logError({
            severity: 'low',
            errorMessage: 'Failed to send survey completion email',
            stackTrace: emailError instanceof Error ? emailError.stack : String(emailError),
            componentName: 'useSurveySession',
            functionName: 'completeSession',
            sessionToken: sessionTokenRef.current || undefined,
            surveyInstanceId,
            additionalContext: { 
              sessionId: session.sessionId,
              recipientEmail: recipientEmail ? 'present' : 'not_found',
              surveyTitle: surveyData?.surveyTitle
            }
          });
          // Don't throw - email failure shouldn't prevent session completion
        }
      } 

      // Clean up localStorage and global tracker
      if (surveyInstanceId) {
        localStorage.removeItem(`survey_session_${surveyInstanceId}`);
        sessionTracker.clearSession(surveyInstanceId);
      }
      
    } catch (error) {
      ErrorLoggingService.logCriticalError(
        'Failed to complete survey session',
        error instanceof Error ? error : new Error(String(error)),
        {
          componentName: 'useSurveySession',
          functionName: 'completeSession',
          sessionToken: sessionTokenRef.current || undefined,
          surveyInstanceId,
          additionalContext: { 
            sessionId: session.sessionId,
            hasSurveyData: !!surveyData,
            surveyTitle: surveyData?.surveyTitle
          }
        }
      );
    }
  }, [session.sessionId, surveyInstanceId, sessionTracker]);

  // Initialize session on mount or resume existing session
  useEffect(() => {
    if (!surveyInstanceId || session.sessionId) {
      return; // No surveyInstanceId provided or already have a session, don't initialize
    }

    const initializeSession = async () => {
      // Check for existing session token in localStorage
      const storedToken = localStorage.getItem(`survey_session_${surveyInstanceId}`);
      
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
          ErrorLoggingService.logError({
            severity: 'medium',
            errorMessage: 'Failed to resume existing survey session',
            stackTrace: error instanceof Error ? error.stack : String(error),
            componentName: 'useSurveySession',
            functionName: 'initializeSession',
            sessionToken: storedToken,
            surveyInstanceId,
            additionalContext: { 
              action: 'resume_session',
              hasStoredToken: !!storedToken
            }
          });
          localStorage.removeItem(`survey_session_${surveyInstanceId}`);
        }
      }

      // Create new session if no valid session exists
      await createSession();
    };

    initializeSession();
  }, [surveyInstanceId]); // Keep minimal dependencies to avoid infinite loops

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
    }, [session.sessionId, session.status]),
    
    getSavedPage: useCallback(async (): Promise<number | null> => {
      if (!session.sessionId) {
        return null;
      }
      try {
        const sessionData = await databaseHelpers.getSurveySession(session.sessionId);
        // Check metadata.currentPage first, then fall back to current_section
        const savedPage = sessionData?.metadata?.currentPage !== undefined 
          ? sessionData.metadata.currentPage 
          : sessionData?.current_section;
          
        return savedPage !== undefined ? savedPage : null;
      } catch (error) {
        ErrorLoggingService.logError({
          severity: 'low',
          errorMessage: 'Failed to get saved page from session',
          stackTrace: error instanceof Error ? error.stack : String(error),
          componentName: 'useSurveySession',
          functionName: 'getSavedPage',
          sessionToken: sessionTokenRef.current || undefined,
          surveyInstanceId,
          additionalContext: { 
            sessionId: session.sessionId
          }
        });
        return null;
      }
    }, [session.sessionId])
  };
};