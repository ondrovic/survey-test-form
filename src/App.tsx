import { ConnectionStatus, SurveyForm } from '@/components/survey';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/constants';
import { useFirebaseStorage } from '@/hooks/useFirebaseStorage';
import { SurveyData, SurveyFormData } from '@/types';
import { getCurrentTimestamp } from '@/utils/date.utils';
import { isDevelopment } from '@/utils/env.utils';
import { useCallback, useState } from 'react';

/**
 * Main App component that integrates all survey functionality
 */
function App() {
    const [alert, setAlert] = useState<{
        type: 'success' | 'error';
        message: string;
    } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { loading, error, connected, save, refresh } = useFirebaseStorage<SurveyData>();

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

                        {/* Only show connection status in development mode */}
                        {isDevelopment() && (
                            <ConnectionStatus
                                connected={connected}
                                loading={loading}
                                error={error}
                                onRetry={handleRetryConnection}
                            />
                        )}
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
        </div>
    );
}

export default App; 