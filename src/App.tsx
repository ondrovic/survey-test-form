import { AdminPage } from '@/components/admin';
import { AdminAnalyticsPage } from '@/components/admin/analytics/AdminAnalyticsPage';
import { AdminVisualizationPage } from '@/components/admin/visualization/visualization';
import { ErrorBoundary, LoadingSpinner, NotFoundPage } from '@/components/common';
import { DynamicForm, PaginatedSurveyForm } from '@/components/form';
import { SurveyConfirmation } from '@/components/survey';
import { databaseHelpers, getDatabaseProviderInfo, initializeDatabase } from '@/config/database';
import { useSurveySession } from '@/hooks/use-survey-session';
import { ErrorLoggingService } from '@/services/error-logging.service';


import { AppProvider } from '@/contexts/app-provider';
import { useAuth } from '@/contexts/auth-context/index';
// import { useSurveyData } from '@/contexts/survey-data-context/index'; // Removed as not needed
import { useToast } from '@/contexts/toast-context/index';
import { SurveyConfig, SurveyInstance, SurveyResponse } from '@/types';
import { generateUUID, isSurveyInstanceActive, suppressConsoleWarnings } from '@/utils';
import { getCurrentTimestamp } from '@/utils/date.utils';
import { getClientIPAddressWithTimeout } from '@/utils/ip.utils';

import { routes } from '@/routes';
import { DatabaseSessionManagerService } from '@/services/database-session-manager.service';
import { isReCaptchaConfigured, verifyReCaptchaTokenClientSide } from '@/utils/recaptcha.utils';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { Route, Routes, useNavigate, useParams } from 'react-router-dom';

// Remove hardcoded copyright - now handled by SurveyFooter component

/**
 * Main App component that integrates all survey functionality
 */
const AppContent = () => {
    // Suppress console warnings for passive event listeners
    useEffect(() => {
        suppressConsoleWarnings();
    }, []);

    const { isAuthenticated, isLoading: authLoading } = useAuth();

    // Framework state
    const [isMigrating, setIsMigrating] = useState(true);
    const [allSurveyInstances, setAllSurveyInstances] = useState<SurveyInstance[]>([]);

    const navigate = useNavigate();

    // Initialize framework and migrate data
    const initializeFramework = useCallback(async () => {
        try {
            setIsMigrating(true);

            // Wait for database to be properly initialized
            // The auth context should have already initialized it, but let's be safe
            await initializeDatabase();

            // Wait a bit more to ensure the database is fully ready
            await new Promise(resolve => setTimeout(resolve, 100));

            // Verify database is ready before proceeding
            if (!getDatabaseProviderInfo().isInitialized) {
                const retryDelay = parseInt(import.meta.env.VITE_DATABASE_RETRY_DELAY) || 60000;
                await new Promise(resolve => setTimeout(resolve, retryDelay));

                if (!getDatabaseProviderInfo().isInitialized) {
                    throw new Error('Database initialization timeout');
                }
            }

            // Get all survey instances
            const instances = await databaseHelpers.getSurveyInstances();
            setAllSurveyInstances(instances);

            // Start the database session manager for reliable session tracking
            try {
                const sessionManager = DatabaseSessionManagerService.getInstance();
                sessionManager.start();
            } catch (error) {
                await ErrorLoggingService.logError({
                    severity: 'high',
                    errorMessage: 'Database session manager startup failed',
                    stackTrace: error instanceof Error ? error.stack : String(error),
                    componentName: 'App',
                    functionName: 'initializeFramework',
                    userAction: 'System initialization',
                    additionalContext: {
                        databaseProviderInfo: getDatabaseProviderInfo(),
                        timestamp: getCurrentTimestamp()
                    },
                    tags: ['session_manager', 'initialization', 'database']
                });
            }

            setIsMigrating(false);
        } catch (error) {
            await ErrorLoggingService.logError({
                severity: 'critical',
                errorMessage: 'Framework initialization failed',
                stackTrace: error instanceof Error ? error.stack : String(error),
                componentName: 'App',
                functionName: 'initializeFramework',
                userAction: 'System initialization',
                additionalContext: {
                    databaseProviderInfo: getDatabaseProviderInfo(),
                    isAuthenticated,
                    timestamp: getCurrentTimestamp(),
                    allSurveyInstancesCount: allSurveyInstances.length
                },
                tags: ['framework_init', 'critical_failure', 'database', 'system']
            });
            setIsMigrating(false);
        }
    }, []);

    // Use ref to avoid recreating the initialization function
    const initializeFrameworkRef = useRef(initializeFramework);
    initializeFrameworkRef.current = initializeFramework;

    // Initialize framework on mount if authenticated, or set migrating to false if not
    useEffect(() => {
        if (isAuthenticated) {
            initializeFrameworkRef.current();
        } else {
            setIsMigrating(false);
        }
    }, [isAuthenticated]); // Remove initializeFramework from deps since we use ref

    // Memoize survey instance lookup to avoid recalculation on every render
    const getSurveyInstanceBySlug = useCallback((slugOrId: string) => {
        // First, try to find by slug (preferred method)
        let instance = allSurveyInstances.find(instance =>
            instance.slug === slugOrId && isSurveyInstanceActive(instance)
        );

        // Fallback: try to find by instance ID (for existing instances without slug)
        if (!instance) {
            instance = allSurveyInstances.find(instance =>
                instance.id === slugOrId && isSurveyInstanceActive(instance)
            );
        }

        // Backward compatibility: if not found by slug or ID, try the old title-based slug method
        if (!instance) {
            instance = allSurveyInstances.find(instance =>
                instance.title.toLowerCase().replace(/\s+/g, '-') === slugOrId &&
                isSurveyInstanceActive(instance)
            );
        }

        return instance;
    }, [allSurveyInstances]);

    // Show loading while auth is initializing OR while migrating (only if authenticated)
    if (authLoading || (isAuthenticated && isMigrating)) {
        return <LoadingSpinner fullScreen text="Initializing..." />;
    }


    return (
        <ErrorBoundary>
            <Routes>
                <Route path="/admin" element={<AdminPage onBack={() => navigate('/')} />} />
                <Route path={`${routes.adminVisualize(':instanceId')}`} element={<AdminVisualizationPage />} />
                <Route path={`${routes.adminAnalytics(':instanceId')}`} element={<AdminAnalyticsPage />} />
                <Route path={routes.admin} element={<AdminPage onBack={() => navigate('/')} />} />
                <Route path="/survey-confirmation/:slug" element={<ConfirmationPage getSurveyInstanceBySlug={getSurveyInstanceBySlug} />} />
                <Route path={`${routes.takeSurvey(':slug')}`} element={
                    (() => {
                        const slug = window.location.pathname.split('/').pop() || '';
                        const instance = getSurveyInstanceBySlug(slug);
                        if (instance) {
                            return <SurveyPage instance={instance} />;
                        } else {
                            return <NotFoundPage title="Survey Not Found" message="The survey you're looking for doesn't exist or is no longer available." />;
                        }
                    })()
                } />
                <Route path="/:slug" element={
                    (() => {
                        const slug = window.location.pathname.split('/').pop() || '';
                        // Don't treat empty slug or admin routes as surveys
                        if (!slug || slug === 'admin') {
                            return <NotFoundPage title="Welcome" message="No surveys are currently available at this location." homeButtonText="Go to Admin" homeButtonPath={routes.admin} />;
                        }
                        const instance = getSurveyInstanceBySlug(slug);
                        if (instance) {
                            return <SurveyPage instance={instance} />;
                        } else {
                            return <NotFoundPage title="Survey Not Found" message="The survey you're looking for doesn't exist or is no longer available." />;
                        }
                    })()
                } />
                <Route path="/" element={<NotFoundPage title="Welcome" message="No surveys are currently available at this location." homeButtonText="Go to Admin" homeButtonPath={routes.admin} />} />
            </Routes>
            <Toaster />
        </ErrorBoundary>
    );
}

const App = () => {
    return (
        <AppProvider>
            <AppContent />
        </AppProvider>
    );
}

// Survey Page Component
const SurveyPage = ({ instance }: { instance: SurveyInstance | undefined }) => {
    const [surveyConfig, setSurveyConfig] = useState<SurveyConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [resetFormTrigger] = useState(0); // Add trigger for form reset
    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();
    // Data loading handled automatically by survey data context
    
    // Initialize survey session tracking
    const surveySession = useSurveySession({
        surveyInstanceId: instance?.id || '',
        totalSections: surveyConfig?.sections?.length || 1,
        activityTimeoutMs: 24 * 60 * 60 * 1000 // 24 hours
    });

    const loadSurveyConfig = useCallback(async () => {
        if (!instance) return;

        try {
            setLoading(true);
            setError(null);

            const config = await databaseHelpers.getSurveyConfig(instance.configId);
            if (config) {
                setSurveyConfig(config);
            } else {
                setError('Survey configuration not found');
            }
        } catch (err) {
            await ErrorLoggingService.logError({
                severity: 'medium',
                errorMessage: 'Survey configuration loading failed',
                stackTrace: err instanceof Error ? err.stack : String(err),
                componentName: 'App',
                functionName: 'loadSurveyConfig',
                userAction: 'Loading survey configuration',
                additionalContext: {
                    instanceId: instance?.id,
                    configId: instance?.configId,
                    surveyTitle: instance?.title,
                    timestamp: getCurrentTimestamp()
                },
                tags: ['config_loading', 'survey', 'database']
            });
            setError('Failed to load survey');
        } finally {
            setLoading(false);
        }
    }, [instance?.id, instance?.configId]); // Add configId to dependencies

    // Load survey config - option sets are loaded automatically by context
    useEffect(() => {
        loadSurveyConfig();
    }, [loadSurveyConfig]);

    const handleSubmit = useCallback(async (responses: Record<string, any>) => {
        if (!instance || !surveyConfig) {
            showError('Survey configuration not found');
            return;
        }
        
        setIsSubmitting(true);
        try {
            // Check network connectivity first
            if (!navigator.onLine) {
                throw new Error('No internet connection detected');
            }
            // Verify reCAPTCHA if enabled
            if (isReCaptchaConfigured() && responses.recaptchaToken) {
                const isValid = await verifyReCaptchaTokenClientSide(responses.recaptchaToken);
                if (!isValid) {
                    throw new Error('reCAPTCHA verification failed');
                }
            }

            // Get client IP address
            const ipAddress = await getClientIPAddressWithTimeout(3000); // 3 second timeout

            // Calculate completion time if session is available
            const completionTimeSeconds = surveySession.session.sessionId ? 
                surveySession.getSessionDuration() : null;
        
            const completedAt = getCurrentTimestamp();
            const surveyResponse: SurveyResponse = {
                id: generateUUID(),
                surveyInstanceId: instance.id,
                sessionId: surveySession.session.sessionId || undefined,
                configVersion: surveyConfig.version || 'unknown',
                responses,
                startedAt: surveySession.session.startedAt?.toISOString(),
                completedAt: completedAt,
                submittedAt: completedAt, // Keep for backward compatibility
                completion_time_seconds: completionTimeSeconds || undefined,
                completion_status: 'completed',
                metadata: {
                    userAgent: navigator.userAgent,
                    ipAddress: ipAddress || undefined,
                }
            };

            // Test database connectivity before submission
            try {
                await databaseHelpers.getSurveyConfigs();
            } catch (connError) {
                await ErrorLoggingService.logError({
                    severity: 'critical',
                    errorMessage: 'Database connectivity test failed during survey submission',
                    stackTrace: connError instanceof Error ? connError.stack : String(connError),
                    componentName: 'App',
                    functionName: 'handleSubmit',
                    userAction: 'Submitting survey response',
                    additionalContext: {
                        instanceId: instance.id,
                        configId: surveyConfig.id,
                        isOnline: navigator.onLine,
                        connectionType: (navigator as any).connection?.effectiveType || 'unknown',
                        timestamp: getCurrentTimestamp()
                    },
                    tags: ['database', 'connectivity', 'submission', 'critical']
                });
                throw new Error(`Database connection failed: ${connError instanceof Error ? connError.message : 'Unknown error'}`);
            }
            // Add timeout wrapper for mobile connections
            const submissionPromise = databaseHelpers.addSurveyResponse(surveyResponse);
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Request timeout after 30 seconds')), 30000);
            });
            
            try {
                await Promise.race([submissionPromise, timeoutPromise]);
            } catch (submissionError) {
                await ErrorLoggingService.logError({
                    severity: 'critical',
                    errorMessage: 'Survey response database submission failed',
                    stackTrace: submissionError instanceof Error ? submissionError.stack : String(submissionError),
                    componentName: 'App',
                    functionName: 'handleSubmit',
                    userAction: 'Submitting survey response',
                    additionalContext: {
                        responseId: surveyResponse.id,
                        sessionId: surveyResponse.sessionId,
                        instanceId: instance.id,
                        configId: surveyConfig.id,
                        responseCount: Object.keys(responses).length,
                        isOnline: navigator.onLine,
                        timestamp: getCurrentTimestamp()
                    },
                    tags: ['submission', 'database', 'critical', 'survey_response']
                });
                throw submissionError;
            }
            
            // Add window error handler to catch any silent errors
            const originalHandler = window.onerror;
            window.onerror = async (message, source, lineno, colno, error) => {
                await ErrorLoggingService.logError({
                    severity: 'high',
                    errorMessage: `Silent error caught during survey submission: ${message}`,
                    stackTrace: error?.stack || `${source}:${lineno}:${colno}`,
                    componentName: 'App',
                    functionName: 'handleSubmit',
                    userAction: 'Survey submission process',
                    additionalContext: {
                        source,
                        lineno,
                        colno,
                        instanceId: instance?.id,
                        configId: surveyConfig?.id,
                        timestamp: getCurrentTimestamp()
                    },
                    tags: ['silent_error', 'window_error', 'submission']
                });
                if (originalHandler) originalHandler(message, source, lineno, colno, error);
                return true;
            };
            
            // Mark session as completed and send email notification
            try {
                if (surveySession.session.sessionId) {
                    await surveySession.completeSession({
                        responses,
                        surveyTitle: surveyConfig.title
                    });
                }
            } catch (sessionError) {
                await ErrorLoggingService.logError({
                    severity: 'high',
                    errorMessage: 'Survey session completion failed',
                    stackTrace: sessionError instanceof Error ? sessionError.stack : String(sessionError),
                    componentName: 'App',
                    functionName: 'handleSubmit',
                    userAction: 'Completing survey session',
                    additionalContext: {
                        sessionId: surveySession?.session?.sessionId,
                        instanceId: instance.id,
                        surveyTitle: surveyConfig.title,
                        sessionStatus: surveySession?.session?.status,
                        timestamp: getCurrentTimestamp()
                    },
                    tags: ['session', 'completion', 'survey', 'tracking']
                });
                // Don't throw - continue with success message even if session completion fails
            }
            
            showSuccess('Survey submitted!');

            // Redirect to confirmation page instead of resetting form
            const urlParam = instance.slug || instance.id;
            const confirmationUrl = `${window.location.origin}${routes.confirmation(urlParam)}`;
            
            // Try React Router navigation first, fallback to window.location
            try {
                navigate(`/survey-confirmation/${urlParam}`);
            } catch (navError) {
                await ErrorLoggingService.logError({
                    severity: 'low',
                    errorMessage: 'React Router navigation failed, fallback to window.location',
                    stackTrace: navError instanceof Error ? navError.stack : String(navError),
                    componentName: 'App',
                    functionName: 'handleSubmit',
                    userAction: 'Navigating to confirmation page',
                    additionalContext: {
                        confirmationUrl,
                        urlParam,
                        instanceId: instance.id,
                        timestamp: getCurrentTimestamp()
                    },
                    tags: ['navigation', 'router', 'fallback']
                });
                window.location.href = confirmationUrl;
            }
        } catch (err) {
            // Provide more specific error messages
            let errorMessage = 'Failed to submit survey. Please try again.';
            let errorType = 'general';
            if (err instanceof Error) {
                if (err.message.includes('No internet connection')) {
                    errorMessage = 'No internet connection. Please check your connection and try again.';
                    errorType = 'network';
                } else if (err.message.includes('Database connection failed')) {
                    errorMessage = 'Cannot connect to server. Please ensure you can access the application and try again.';
                    errorType = 'database';
                } else if (err.message.includes('network') || err.message.includes('fetch') || err.message.includes('NetworkError')) {
                    errorMessage = 'Network error. Please check your connection and try again.';
                    errorType = 'network';
                } else if (err.message.includes('timeout')) {
                    errorMessage = 'Request timed out. Please try again.';
                    errorType = 'timeout';
                }
            }
            
            await ErrorLoggingService.logError({
                severity: 'critical',
                errorMessage: `Main survey submission error: ${err instanceof Error ? err.message : String(err)}`,
                stackTrace: err instanceof Error ? err.stack : String(err),
                componentName: 'App',
                functionName: 'handleSubmit',
                userAction: 'Submitting survey',
                additionalContext: {
                    errorType,
                    instanceId: instance?.id,
                    configId: surveyConfig?.id,
                    responseCount: Object.keys(responses).length,
                    isOnline: navigator.onLine,
                    connectionType: (navigator as any).connection?.effectiveType || 'unknown',
                    userAgent: navigator.userAgent,
                    location: window.location.href,
                    timestamp: getCurrentTimestamp()
                },
                tags: ['submission', 'critical', 'survey', errorType]
            });
            
            showError(errorMessage);
            throw err; // Re-throw the error so DynamicForm can catch it
        } finally {
            setIsSubmitting(false);
        }
    }, [instance, surveyConfig, showSuccess, showError, navigate, surveySession]);

    // Check if instance is valid
    if (!instance) {
        return <NotFoundPage title="Survey Not Found" message="The survey you're looking for doesn't exist or is no longer available." />;
    }

    if (loading) {
        return <LoadingSpinner fullScreen text="Loading survey..." />;
    }

    if (error || !surveyConfig) {
        return (
            <NotFoundPage 
                title="Survey Not Found" 
                message={error || 'The requested survey could not be loaded.'}
                homeButtonText="Go to Admin"
                homeButtonPath={routes.admin}
            />
        );
    }

    // Check if pagination is enabled
    const shouldUsePagination = surveyConfig.paginatorConfig?.renderSectionsAsPages === true;

    if (shouldUsePagination) {
        return (
            <PaginatedSurveyForm
                config={surveyConfig}
                onSubmit={handleSubmit}
                loading={isSubmitting}
                showSectionPagination={surveyConfig.paginatorConfig?.showSectionPagination !== false}
                resetTrigger={resetFormTrigger}
                surveyInstanceId={instance?.id}
                onSectionChange={(sectionIndex: number) => {
                    surveySession.updateActivity(sectionIndex);
                }}
            />
        );
    }

    return (
        <DynamicForm
            config={surveyConfig}
            onSubmit={handleSubmit}
            loading={isSubmitting}
            resetTrigger={resetFormTrigger}
            surveyInstanceId={instance?.id}
            onActivityUpdate={() => {
                surveySession.updateActivity();
            }}
        />
    );
}

// Confirmation Page Component
const ConfirmationPage = ({ getSurveyInstanceBySlug }: { getSurveyInstanceBySlug: (slug: string) => SurveyInstance | undefined }) => {
    const { slug } = useParams<{ slug: string }>();
    
    // Call all hooks at the top level before any conditional logic
    const instance = slug ? getSurveyInstanceBySlug(slug) : undefined;
    
    // Handle conditional rendering after all hooks have been called
    if (!slug) {
        return <NotFoundPage title="Invalid Survey" message="No survey identifier provided." />;
    }
    
    if (instance) {
        return <SurveyConfirmation surveyTitle={instance.title} />;
    } else {
        return <NotFoundPage title="Survey Not Found" message="The survey you're looking for doesn't exist or is no longer available." />;
    }
}

export default App; 