import { AdminPanel } from '@/components/admin';
import { ConnectionStatus, SurveyForm } from '@/components/survey';
import { authHelpers } from '@/config/firebase';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/constants';
import { useFirebaseStorage } from '@/hooks/useFirebaseStorage';
import { SurveyData, SurveyFormData } from '@/types';
import { getCurrentTimestamp } from '@/utils/date.utils';
import { Settings } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

/**
 * Main App component that integrates all survey functionality
 */
function App() {
    const [alert, setAlert] = useState<{
        type: 'success' | 'error';
        message: string;
    } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showAdminPanel, setShowAdminPanel] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const { loading, error, connected, save, refresh } = useFirebaseStorage<SurveyData>();

    // Initialize anonymous authentication
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                console.log('Starting anonymous authentication...');
                const user = await authHelpers.signInAnonymously();
                console.log('Authentication successful:', user.uid);
                setIsAuthenticated(true);
            } catch (error) {
                console.error('Failed to sign in anonymously:', error);
                setIsAuthenticated(false);
            }
        };

        // Listen for auth state changes
        const unsubscribe = authHelpers.onAuthStateChanged((user) => {
            console.log('Auth state changed:', user ? user.uid : 'No user');
            setIsAuthenticated(!!user);
        });

        // Initialize auth if not already authenticated
        const currentUser = authHelpers.getCurrentUser();
        console.log('Current user on init:', currentUser ? currentUser.uid : 'No user');

        if (!currentUser) {
            initializeAuth();
        } else {
            setIsAuthenticated(true);
        }

        return unsubscribe;
    }, []);

    // Keyboard shortcut for admin panel (Ctrl+Shift+A)
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.ctrlKey && event.shiftKey && event.key === 'A') {
                event.preventDefault();
                setShowAdminPanel(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleSubmit = useCallback(async (formData: SurveyFormData) => {
        setIsSubmitting(true);
        try {
            const surveyData: SurveyData = {
                id: crypto.randomUUID(),
                ...formData,
                submittedAt: getCurrentTimestamp(),
                updatedAt: getCurrentTimestamp()
            };

            await save(surveyData);
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
    }, [save]);

    const handleDismissAlert = useCallback(() => {
        setAlert(null);
    }, []);

    const handleRetryConnection = useCallback(() => {
        refresh();
    }, [refresh]);

    const handleAdminButtonClick = useCallback(() => {
        setShowAdminPanel(true);
    }, []);

    const handleCloseAdminPanel = useCallback(() => {
        setShowAdminPanel(false);
    }, []);

    return (
        <div className="min-h-screen bg-amber-50/30">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Service Line Feedback Survey
                            </h1>
                            <p className="text-sm text-gray-600 mt-1">
                                Help us improve our service lines by providing your feedback
                            </p>
                        </div>

                        <div className="flex items-center space-x-4">
                            <ConnectionStatus
                                connected={connected}
                                loading={loading}
                                error={error}
                                onRetry={handleRetryConnection}
                                isAuthenticated={isAuthenticated}
                            />

                            {/* Hidden admin button - accessible via keyboard or developer tools */}
                            <button
                                onClick={handleAdminButtonClick}
                                className="p-2 text-gray-400 hover:text-gray-600 transition-colors opacity-20 hover:opacity-100"
                                title="Admin Panel (Ctrl+Shift+A)"
                                aria-label="Open admin panel"
                            >
                                <Settings className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <SurveyForm
                    onSubmit={handleSubmit}
                    loading={isSubmitting}
                    error={alert?.type === 'error' ? alert.message : undefined}
                    success={alert?.type === 'success' ? alert.message : undefined}
                    onDismissAlert={handleDismissAlert}
                    connected={connected}
                />
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 mt-16">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="text-center text-sm text-gray-500">
                        <p>
                            Your responses are securely stored in Firebase and will be used to improve our services.
                        </p>
                    </div>
                </div>
            </footer>

            {/* Admin Panel */}
            <AdminPanel
                isVisible={showAdminPanel}
                onClose={handleCloseAdminPanel}
            />
        </div>
    );
}

export default App; 