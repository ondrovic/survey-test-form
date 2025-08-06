import { AdminPage } from '@/components/admin';
import { DynamicForm } from '@/components/form';
import { authHelpers, firestoreHelpers } from '@/config/firebase';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/constants';
import { AdminTabProvider } from '@/contexts/AdminTabContext';
import { useFirebaseStorage } from '@/hooks';
import { SurveyConfig, SurveyData, SurveyInstance, SurveyResponse } from '@/types';
import { suppressConsoleWarnings } from '@/utils';
import { getCurrentTimestamp } from '@/utils/date.utils';
import { migrateExistingData } from '@/utils/migration.utils';
import { isReCaptchaConfigured, verifyReCaptchaTokenWithFirebase } from '@/utils/recaptcha.utils';
import { useCallback, useEffect, useState } from 'react';
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

    const [alert, setAlert] = useState<{
        type: 'success' | 'error';
        message: string;
    } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Framework state
    const [isMigrating, setIsMigrating] = useState(true);
    const [allSurveyInstances, setAllSurveyInstances] = useState<SurveyInstance[]>([]);

    const { save } = useFirebaseStorage<SurveyData>();
    const navigate = useNavigate();

    // Initialize anonymous authentication
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                await authHelpers.signInAnonymously();
                setIsAuthenticated(true);
            } catch (error) {
                console.error('Failed to sign in anonymously:', error);
                setIsAuthenticated(false);
            }
        };

        // Listen for auth state changes
        const unsubscribe = authHelpers.onAuthStateChanged((user) => {
            setIsAuthenticated(!!user);
        });

        // Initialize auth if not already authenticated
        const currentUser = authHelpers.getCurrentUser();

        if (!currentUser) {
            initializeAuth();
        } else {
            setIsAuthenticated(true);
        }

        return unsubscribe;
    }, []);

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

            // Get active survey instance
            const instance = await firestoreHelpers.getActiveSurveyInstance();
            if (instance) {
                // This part of the logic is no longer needed as activeSurveyInstance is removed
                // and the framework state is not managed here.
            }

            setIsMigrating(false);
        } catch (error) {
            console.error('Error initializing framework:', error);
            setIsMigrating(false);
        }
    }, []);

    // Initialize framework on mount
    useEffect(() => {
        initializeFramework();
    }, [initializeFramework]);

    const getSurveyInstanceBySlug = (slug: string) => {
        return allSurveyInstances.find(instance =>
            instance.title.toLowerCase().replace(/\s+/g, '-') === slug
        );
    };

    const generateSlug = (title: string) => {
        return title.toLowerCase().replace(/\s+/g, '-');
    };

    return (
        <AdminTabProvider>
            <Routes>
                <Route path="/admin" element={<AdminPage onBack={() => navigate('/')} />} />
                <Route path="/survey-test-form/admin" element={<AdminPage onBack={() => navigate('/')} />} />
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
    );
}

// Survey Page Component
function SurveyPage({ instance }: { instance: SurveyInstance | undefined }) {
    const [surveyConfig, setSurveyConfig] = useState<SurveyConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [alert, setAlert] = useState<{
        type: 'success' | 'error';
        message: string;
    } | null>(null);
    const navigate = useNavigate();

    // Check if instance is valid
    if (!instance) {
        return (
            <div className="min-h-screen bg-amber-50/30 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Survey Not Found</h1>
                    <p className="text-gray-600 mb-6">The requested survey could not be found.</p>
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
        if (!surveyConfig) return;

        setIsSubmitting(true);
        try {
            // Verify reCAPTCHA if enabled
            if (isReCaptchaConfigured() && responses.recaptchaToken) {
                const isValid = await verifyReCaptchaTokenWithFirebase(responses.recaptchaToken);
                if (!isValid) {
                    throw new Error('reCAPTCHA verification failed');
                }
            }

            const surveyResponse: SurveyResponse = {
                id: crypto.randomUUID(),
                surveyInstanceId: instance.id,
                configVersion: surveyConfig.metadata.version,
                responses,
                metadata: {
                    submittedAt: getCurrentTimestamp(),
                    userAgent: navigator.userAgent,
                    ipAddress: undefined,
                    sessionId: undefined,
                }
            };

            await firestoreHelpers.addSurveyResponse(surveyResponse);
            setAlert({
                type: 'success',
                message: SUCCESS_MESSAGES.surveySubmitted
            });

            // Clear alert after 5 seconds
            setTimeout(() => setAlert(null), 5000);
        } catch (err) {
            console.error('Survey submission error:', err);
            setAlert({
                type: 'error',
                message: ERROR_MESSAGES.submissionError
            });
        } finally {
            setIsSubmitting(false);
        }
    }, [instance.id, surveyConfig]);

    if (loading) {
        return (
            <div className="min-h-screen bg-amber-50/30 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading survey...</p>
                </div>
            </div>
        );
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
                {alert && (
                    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
                        <div className={`p-4 rounded-md ${alert.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                            {alert.message}
                        </div>
                    </div>
                )}

                <DynamicForm
                    config={surveyConfig}
                    onSubmit={handleSubmit}
                    loading={isSubmitting}
                    error={alert?.type === 'error' ? alert.message : undefined}
                    success={alert?.type === 'success' ? alert.message : undefined}
                    onDismissAlert={() => setAlert(null)}
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