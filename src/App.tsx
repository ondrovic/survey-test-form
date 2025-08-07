import { AdminPage } from '@/components/admin';
import { ErrorBoundary, LoadingSpinner } from '@/components/common';
import { DynamicForm } from '@/components/form';
import { SurveyConfirmation } from '@/components/survey';
import { firestoreHelpers } from '@/config/firebase';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/constants';
import { AdminTabProvider } from '@/contexts/AdminTabContext';
import { SurveyDataProvider } from '@/contexts/SurveyDataContext';
import { ToastProvider, useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/hooks';
import { SurveyConfig, SurveyInstance, SurveyResponse } from '@/types';
import { suppressConsoleWarnings } from '@/utils';
import { getCurrentTimestamp } from '@/utils/date.utils';
import { getClientIPAddressWithTimeout } from '@/utils/ip.utils';
import { migrateExistingData } from '@/utils/migration.utils';
import { isReCaptchaConfigured, verifyReCaptchaTokenWithFirebase } from '@/utils/recaptcha.utils';
import { useCallback, useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { Route, Routes, useNavigate } from 'react-router-dom';

const currentYear = new Date().getFullYear();
const copyright = `© ${currentYear}`;

/**
 * Main App component that integrates all survey functionality
 */
function App() {
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

            // Migrate existing data to framework
            await migrateExistingData(firestoreHelpers);

            // Get all survey instances
            const instances = await firestoreHelpers.getSurveyInstances();
            setAllSurveyInstances(instances);

            // Debug: Check what survey configs exist
            const configs = await firestoreHelpers.getSurveyConfigs();

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

    // Initialize framework on mount
    useEffect(() => {
        if (isAuthenticated) {
            initializeFramework();
        }
    }, [isAuthenticated, initializeFramework]);

    const getSurveyInstanceBySlug = (slug: string) => {
        return allSurveyInstances.find(instance =>
            instance.title.toLowerCase().replace(/\s+/g, '-') === slug
        );
    };

    // Show loading while auth is initializing
    if (authLoading || isMigrating) {
        return <LoadingSpinner fullScreen text="Initializing..." />;
    }

    return (
        <ErrorBoundary>
            <ToastProvider>
                <SurveyDataProvider>
                    <AdminTabProvider>
                        <Routes>
                            <Route path="/admin" element={<AdminPage onBack={() => navigate('/')} />} />
                            <Route path="/survey-test-form/admin" element={<AdminPage onBack={() => navigate('/')} />} />
                            <Route path="/survey-confirmation/:slug" element={
                                (() => {
                                    const slug = window.location.pathname.split('/').pop() || '';
                                    const instance = getSurveyInstanceBySlug(slug);
                                    if (instance) {
                                        return <SurveyConfirmation surveyTitle={instance.title} />;
                                    } else {
                                        return <NotFoundPage />;
                                    }
                                })()
                            } />
                            <Route path="/survey-test-form/:slug" element={
                                (() => {
                                    const slug = window.location.pathname.split('/').pop() || '';
                                    const instance = getSurveyInstanceBySlug(slug);
                                    if (instance) {
                                        return <SurveyPage instance={instance} />;
                                    } else {
                                        return <NotFoundPage />;
                                    }
                                })()
                            } />
                            <Route path="/:slug" element={
                                (() => {
                                    const slug = window.location.pathname.split('/').pop() || '';
                                    const instance = getSurveyInstanceBySlug(slug);
                                    if (instance) {
                                        return <SurveyPage instance={instance} />;
                                    } else {
                                        return <NotFoundPage />;
                                    }
                                })()
                            } />
                            <Route path="/" element={<NotFoundPage />} />
                        </Routes>
                    </AdminTabProvider>
                </SurveyDataProvider>
                <Toaster />
            </ToastProvider>
        </ErrorBoundary>
    );
}

// Survey Page Component
function SurveyPage({ instance }: { instance: SurveyInstance | undefined }) {
    const [surveyConfig, setSurveyConfig] = useState<SurveyConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [resetFormTrigger, setResetFormTrigger] = useState(0); // Add trigger for form reset
    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();

    // Check if instance is valid
    if (!instance) {
        return <NotFoundPage />;
    }

    const loadSurveyConfig = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const config = await firestoreHelpers.getSurveyConfig(instance.configId);
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
    }, [instance.configId]);

    useEffect(() => {
        loadSurveyConfig();
    }, [loadSurveyConfig]);

    const handleSubmit = useCallback(async (responses: Record<string, any>) => {
        console.log('🔍 handleSubmit called with:', {
            hasSurveyConfig: !!surveyConfig,
            surveyConfigId: surveyConfig?.id,
            responsesCount: Object.keys(responses).length,
            responses: responses
        });

        if (!surveyConfig) {
            console.error('❌ No survey config available, cannot submit');
            showError('Survey configuration not found');
            return;
        }

        setIsSubmitting(true);
        try {
            console.log('Starting survey submission...', {
                instanceId: instance.id,
                configVersion: surveyConfig.metadata.version,
                responseCount: Object.keys(responses).length
            });

            // Verify reCAPTCHA if enabled
            if (isReCaptchaConfigured() && responses.recaptchaToken) {
                const isValid = await verifyReCaptchaTokenWithFirebase(responses.recaptchaToken);
                if (!isValid) {
                    throw new Error('reCAPTCHA verification failed');
                }
            }

            // Get client IP address
            const ipAddress = await getClientIPAddressWithTimeout(3000); // 3 second timeout

            const surveyResponse: SurveyResponse = {
                id: crypto.randomUUID(),
                surveyInstanceId: instance.id,
                configVersion: surveyConfig.metadata?.version || surveyConfig.id || 'unknown',
                responses,
                metadata: {
                    submittedAt: getCurrentTimestamp(),
                    userAgent: navigator.userAgent,
                    ipAddress: ipAddress || undefined,
                }
            };

            console.log('Submitting survey response to Firebase...', surveyResponse);
            await firestoreHelpers.addSurveyResponse(surveyResponse);
            console.log('Survey response submitted successfully!');
            showSuccess(SUCCESS_MESSAGES.surveySubmitted);

            // Redirect to confirmation page instead of resetting form
            const slug = instance.title.toLowerCase().replace(/\s+/g, '-');
            navigate(`/survey-confirmation/${slug}`);
        } catch (err) {
            console.error('Survey submission error:', err);
            showError(ERROR_MESSAGES.submissionError);
            throw err; // Re-throw the error so DynamicForm can catch it
        } finally {
            setIsSubmitting(false);
        }
    }, [instance.id, surveyConfig, showSuccess, showError]);

    if (loading) {
        return <LoadingSpinner fullScreen text="Loading survey..." />;
    }

    if (error || !surveyConfig) {
        return (
            <div className="min-h-screen bg-amber-50/30 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Survey Not Found</h1>
                    <p className="text-gray-600 mb-6">{error || 'The requested survey could not be loaded.'}</p>
                    <button
                        onClick={() => navigate('/')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                        Go to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-amber-50/30">
            {/* Main Content */}
            <main className="py-8">
                <DynamicForm
                    config={surveyConfig}
                    onSubmit={handleSubmit}
                    loading={isSubmitting}
                    resetTrigger={resetFormTrigger}
                />
            </main>

            {/* Footer */}
            <footer className="bg-white border-t mt-12">
                <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-center">
                        <p className="text-sm text-gray-500">{copyright}</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

// Not Found Page Component
function NotFoundPage() {
    return (
        <div className="min-h-screen bg-amber-50/30 flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Page Not Found</h1>
                <p className="text-gray-600 mb-6">The resource you're looking for doesn't exist.</p>
            </div>
        </div>
    );
}

export default App; 