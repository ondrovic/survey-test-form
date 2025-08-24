import { AdminPage } from '@/components/admin';
import { AdminAnalyticsPage } from '@/components/admin/analytics/AdminAnalyticsPage';
import { AdminVisualizationPage } from '@/components/admin/visualization/visualization';
import { ErrorBoundary, LoadingSpinner, NotFoundPage } from '@/components/common';
import { DynamicForm, PaginatedSurveyForm } from '@/components/form';
import { SurveyConfirmation } from '@/components/survey';
import { databaseHelpers, getDatabaseProviderInfo, initializeDatabase } from '@/config/database';
import { useSurveySession } from '@/hooks/use-survey-session';


import { AppProvider } from '@/contexts/app-provider';
import { useAuth } from '@/contexts/auth-context/index';
import { useSurveyData } from '@/contexts/survey-data-context/index';
import { useToast } from '@/contexts/toast-context/index';
import { SurveyConfig, SurveyInstance, SurveyResponse } from '@/types';
import { isSurveyInstanceActive, suppressConsoleWarnings } from '@/utils';
import { getCurrentTimestamp } from '@/utils/date.utils';
import { getClientIPAddressWithTimeout } from '@/utils/ip.utils';

import { routes } from '@/routes';
import { isReCaptchaConfigured, verifyReCaptchaTokenClientSide } from '@/utils/recaptcha.utils';
import { useCallback, useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { Route, Routes, useNavigate } from 'react-router-dom';

// Remove hardcoded copyright - now handled by SurveyFooter component

/**
 * Main App component that integrates all survey functionality
 */
function AppContent() {
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
                console.warn('Database not fully initialized yet, retrying...');
                const retryDelay = parseInt(import.meta.env.VITE_DATABASE_RETRY_DELAY) || 60000;
                await new Promise(resolve => setTimeout(resolve, retryDelay));

                if (!getDatabaseProviderInfo().isInitialized) {
                    throw new Error('Database initialization timeout');
                }
            }

            // Get all survey instances
            const instances = await databaseHelpers.getSurveyInstances();
            setAllSurveyInstances(instances);

            // Debug: Check what survey configs exist
            const configs = await databaseHelpers.getSurveyConfigs();

            // Consolidated debug information
            console.log('Framework Initialization Debug Info:', {
                surveyInstances: instances,
                surveyConfigs: configs,
                configIds: configs.map(config => ({
                    documentId: config.id,
                    configId: config.id,
                    title: config.title
                })),
                timestamp: new Date().toISOString()
            });

            setIsMigrating(false);
        } catch (error) {
            console.error('Error initializing framework:', error);
            setIsMigrating(false);
        }
    }, []);

    // Initialize framework on mount if authenticated, or set migrating to false if not
    useEffect(() => {
        if (isAuthenticated) {
            initializeFramework();
        } else {
            // If not authenticated, we don't need to migrate data
            console.log('App - Not authenticated, skipping framework initialization');
            setIsMigrating(false);
        }
    }, [isAuthenticated, initializeFramework]);

    const getSurveyInstanceBySlug = (slugOrId: string) => {
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
    };

    // Show loading while auth is initializing OR while migrating (only if authenticated)
    if (authLoading || (isAuthenticated && isMigrating)) {
        console.log('App - Showing loading spinner:', { authLoading, isAuthenticated, isMigrating });
        return <LoadingSpinner fullScreen text="Initializing..." />;
    }

    console.log('App - Rendering main content:', { authLoading, isAuthenticated, isMigrating });

    return (
        <ErrorBoundary>
            <Routes>
                <Route path="/admin" element={<AdminPage onBack={() => navigate('/')} />} />
                <Route path={`${routes.adminVisualize(':instanceId')}`} element={<AdminVisualizationPage />} />
                <Route path={`${routes.adminAnalytics(':instanceId')}`} element={<AdminAnalyticsPage />} />
                <Route path={routes.admin} element={<AdminPage onBack={() => navigate('/')} />} />
                <Route path={`${routes.confirmation(':slug')}`} element={
                    (() => {
                        const slug = window.location.pathname.split('/').pop() || '';
                        const instance = getSurveyInstanceBySlug(slug);
                        if (instance) {
                            return <SurveyConfirmation surveyTitle={instance.title} />;
                        } else {
                            return <NotFoundPage title="Survey Not Found" message="The survey you're looking for doesn't exist or is no longer available." />;
                        }
                    })()
                } />
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

function App() {
    return (
        <AppProvider>
            <AppContent />
        </AppProvider>
    );
}

// Survey Page Component
function SurveyPage({ instance }: { instance: SurveyInstance | undefined }) {
    const [surveyConfig, setSurveyConfig] = useState<SurveyConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [resetFormTrigger] = useState(0); // Add trigger for form reset
    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();
    const { refreshAll } = useSurveyData();
    
    // Initialize survey session tracking
    const surveySession = useSurveySession({
        surveyInstanceId: instance?.id || '',
        totalSections: surveyConfig?.sections?.length || 1,
        activityTimeoutMs: 24 * 60 * 60 * 1000 // 24 hours
    });

    // Debug: Log session state
    console.log('🔍 SurveyPage - Session Debug:', {
        instanceId: instance?.id,
        sessionId: surveySession.session.sessionId,
        sessionStatus: surveySession.session.status,
        startedAt: surveySession.session.startedAt,
        isCreating: surveySession.isCreatingSession,
        isSessionActive: surveySession.isSessionActive()
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
            console.error('Error loading survey config:', err);
            setError('Failed to load survey');
        } finally {
            setLoading(false);
        }
    }, [instance?.id]);

    // Load survey config and ensure all option sets are loaded
    useEffect(() => {
        const loadData = async () => {
            await Promise.all([
                loadSurveyConfig(),
                refreshAll() // Ensure all option sets are loaded
            ]);
        };
        loadData();
    }, [loadSurveyConfig, refreshAll]);

    const handleSubmit = useCallback(async (responses: Record<string, any>) => {
        if (!instance || !surveyConfig) {
            console.error('❌ No instance or survey config available, cannot submit');
            showError('Survey configuration not found');
            return;
        }

        console.log('🔍 handleSubmit called with:', {
            hasSurveyConfig: !!surveyConfig,
            surveyConfigId: surveyConfig?.id,
            responsesCount: Object.keys(responses).length,
            responses: responses
        });

        setIsSubmitting(true);
        try {
            console.log('Starting survey submission...', {
                instanceId: instance.id,
                configVersion: surveyConfig.version,
                responseCount: Object.keys(responses).length
            });

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

            console.log('🔍 Session data before creating response:', {
                hasSessionId: !!surveySession.session.sessionId,
                sessionId: surveySession.session.sessionId,
                startedAt: surveySession.session.startedAt,
                completionTimeSeconds,
                sessionStatus: surveySession.session.status
            });

            const completedAt = getCurrentTimestamp();
            const surveyResponse: SurveyResponse = {
                id: crypto.randomUUID(),
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

            console.log('🔍 Survey response being submitted:', {
                id: surveyResponse.id,
                sessionId: surveyResponse.sessionId,
                startedAt: surveyResponse.startedAt,
                completion_time_seconds: surveyResponse.completion_time_seconds,
                completion_status: surveyResponse.completion_status,
                hasResponses: Object.keys(responses).length > 0
            });
            
            console.log('Submitting survey response to database...', surveyResponse);
            await databaseHelpers.addSurveyResponse(surveyResponse);
            
            // Mark session as completed
            if (surveySession.session.sessionId) {
                await surveySession.completeSession();
                console.log('Survey session marked as completed');
            }
            
            console.log('Survey response submitted successfully!');
            showSuccess('Survey submitted!');

            // Redirect to confirmation page instead of resetting form
            const urlParam = instance.slug || instance.id;
            navigate(routes.confirmation(urlParam));
        } catch (err) {
            console.error('Survey submission error:', err);
            showError('Failed to submit survey. Please try again.');
            throw err; // Re-throw the error so DynamicForm can catch it
        } finally {
            setIsSubmitting(false);
        }
    }, [instance?.id, surveyConfig?.id, showSuccess, showError, navigate, surveySession]);

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
            onActivityUpdate={() => {
                surveySession.updateActivity();
            }}
        />
    );
}

export default App; 