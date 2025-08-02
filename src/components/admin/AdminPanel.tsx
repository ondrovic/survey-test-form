import { Download, Eye, EyeOff, Lock } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { firestoreHelpers } from '../../config/firebase';
import { SurveyData } from '../../types/survey.types';
import { downloadSurveyDataAsExcel } from '../../utils/excel.utils';
import { Alert, Button, Input } from '../common';

interface AdminPanelProps {
    isVisible: boolean;
    onClose: () => void;
}

interface AdminPanelState {
    password: string;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    success: string | null;
    surveys: SurveyData[];
    showPassword: boolean;
    surveyCount: number | null;
    isCheckingCount: boolean;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ isVisible, onClose }) => {
    const [state, setState] = useState<AdminPanelState>({
        password: '',
        isAuthenticated: false,
        isLoading: false,
        error: null,
        success: null,
        surveys: [],
        showPassword: false,
        surveyCount: null,
        isCheckingCount: false,
    });

    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD;

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!adminPassword) {
            setState(prev => ({
                ...prev,
                error: 'Admin password not configured. Please contact the administrator.'
            }));
            return;
        }

        if (state.password === adminPassword) {
            setState(prev => ({
                ...prev,
                isAuthenticated: true,
                error: null,
                password: ''
            }));
        } else {
            setState(prev => ({
                ...prev,
                error: 'Invalid password. Please try again.',
                password: ''
            }));
        }
    };

    const handleDownloadData = async () => {
        setState(prev => ({ ...prev, isLoading: true, error: null, success: null }));

        try {
            // Fetch all surveys from Firebase
            const surveys = await firestoreHelpers.getSurveys();

            if (surveys.length === 0) {
                setState(prev => ({
                    ...prev,
                    isLoading: false,
                    error: 'No survey data found to download.'
                }));
                return;
            }

            // Generate filename with current date
            const now = new Date();
            const dateStr = now.toISOString().split('T')[0];
            const filename = `survey-data-${dateStr}.xlsx`;

            // Download the Excel file
            downloadSurveyDataAsExcel(surveys, {
                filename,
                sheetName: 'Survey Data'
            });

            setState(prev => ({
                ...prev,
                isLoading: false,
                success: `Successfully downloaded ${surveys.length} survey records to ${filename}`,
                surveys
            }));

        } catch (error) {
            console.error('Error downloading data:', error);
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: 'Failed to download survey data. Please try again.'
            }));
        }
    };

    const handleLogout = () => {
        setState({
            password: '',
            isAuthenticated: false,
            isLoading: false,
            error: null,
            success: null,
            surveys: [],
            showPassword: false,
            surveyCount: null,
            isCheckingCount: false,
        });
    };

    const handleClose = () => {
        // Clear success message when closing the panel
        setState(prev => ({ ...prev, success: null }));
        onClose();
    };

    const handleCheckSurveyCount = async () => {
        setState(prev => ({ ...prev, isCheckingCount: true, error: null }));

        try {
            const surveys = await firestoreHelpers.getSurveys();
            setState(prev => ({
                ...prev,
                surveyCount: surveys.length,
                isCheckingCount: false
            }));
        } catch (error) {
            console.error('Error checking survey count:', error);
            setState(prev => ({
                ...prev,
                isCheckingCount: false,
                error: 'Failed to check survey count. Please try again.'
            }));
        }
    };

    const togglePasswordVisibility = () => {
        setState(prev => ({ ...prev, showPassword: !prev.showPassword }));
    };

    // Auto-load survey count when admin panel becomes visible
    useEffect(() => {
        if (isVisible && state.isAuthenticated) {
            handleCheckSurveyCount();
        }
    }, [isVisible, state.isAuthenticated]);

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto overscroll-contain">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-2">
                            <Lock className="h-6 w-6 text-gray-600" />
                            <h2 className="text-xl font-semibold text-gray-900">
                                Admin Panel
                            </h2>
                        </div>
                        <button
                            onClick={handleClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {!state.isAuthenticated ? (
                        <div>
                            <p className="text-gray-600 mb-4">
                                Enter the admin password to access survey data download functionality.
                            </p>

                            <form onSubmit={handlePasswordSubmit} className="space-y-4">
                                {/* Hidden username field for accessibility */}
                                <input
                                    type="text"
                                    name="username"
                                    autoComplete="username"
                                    style={{ display: 'none' }}
                                    aria-hidden="true"
                                />
                                <div className="relative">
                                    <Input
                                        name="adminPassword"
                                        type={state.showPassword ? 'text' : 'password'}
                                        value={state.password}
                                        onChange={(value) => setState(prev => ({ ...prev, password: value }))}
                                        placeholder="Enter admin password"
                                        required
                                        className="pr-10"
                                        autocomplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={togglePasswordVisibility}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {state.showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>

                                {state.error && (
                                    <Alert type="error" title="Authentication Error" message={state.error} />
                                )}

                                <div className="flex space-x-3">
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        className="flex-1"
                                    >
                                        <Lock className="h-4 w-4 mr-2" />
                                        Authenticate
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={handleClose}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h3 className="font-medium text-blue-900 mb-2">Download Survey Data</h3>
                                <p className="text-blue-700 text-sm">
                                    Download all survey responses as an Excel file (.xlsx) with comprehensive data including personal info, business details, and service line ratings.
                                </p>
                            </div>

                            {/* Survey Count Section */}
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                <h3 className="font-medium text-amber-900 mb-2">Survey Count</h3>
                                <div className="flex items-center justify-between">
                                    <div>
                                        {state.isCheckingCount ? (
                                            <div className="flex items-center text-amber-700 text-sm">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-600 mr-2" />
                                                Loading survey count...
                                            </div>
                                        ) : state.surveyCount !== null ? (
                                            <p className="text-amber-700 text-sm">
                                                Currently {state.surveyCount} survey records in the database
                                            </p>
                                        ) : (
                                            <p className="text-amber-700 text-sm">
                                                Failed to load survey count
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {state.error && (
                                <Alert type="error" title="Download Error" message={state.error} />
                            )}

                            {state.success && (
                                <Alert type="success" title="Download Successful" message={state.success} />
                            )}

                            <div className="flex space-x-3">
                                <Button
                                    onClick={handleDownloadData}
                                    disabled={state.isLoading}
                                    variant="primary"
                                    className="flex-1"
                                >
                                    {state.isLoading ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                    ) : (
                                        <Download className="h-4 w-4 mr-2" />
                                    )}
                                    {state.isLoading ? 'Downloading...' : 'Download Excel File'}
                                </Button>
                                <Button
                                    onClick={handleLogout}
                                    variant="secondary"
                                >
                                    Logout
                                </Button>
                            </div>

                            {state.surveys.length > 0 && (
                                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-600">
                                        Last download: {state.surveys.length} survey records
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}; 