import { Download, Eye, EyeOff, Lock, Plus, Star } from 'lucide-react';
import React, { useState } from 'react';
import { firestoreHelpers } from '../../config/firebase';
import { SurveyConfig, SurveyData, SurveyInstance } from '../../types/survey.types';
import { downloadSurveyDataAsExcel } from '../../utils/excel.utils';
import { Alert, Button, Input } from '../common';
// import { RatingScaleManager } from './RatingScaleManager';
import { SurveyBuilder } from './SurveyBuilder';

interface AdminPanelProps {
    isVisible: boolean;
    onClose: () => void;
    surveyCount: number | null;
    isCountLoading: boolean;
}

interface AdminPanelState {
    password: string;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    success: string | null;
    surveys: SurveyData[];
    showPassword: boolean;
    showSurveyBuilder: boolean;
    showRatingScaleManager: boolean;
    surveyConfigs: SurveyConfig[];
    surveyInstances: SurveyInstance[];
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ isVisible, onClose, surveyCount, isCountLoading }) => {
    const [state, setState] = useState<AdminPanelState>({
        password: '',
        isAuthenticated: false,
        isLoading: false,
        error: null,
        success: null,
        surveys: [],
        showPassword: false,
        showSurveyBuilder: false,
        showRatingScaleManager: false,
        surveyConfigs: [],
        surveyInstances: [],
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
            // Load framework data when authenticated
            loadFrameworkData();
        } else {
            setState(prev => ({
                ...prev,
                error: 'Invalid password. Please try again.',
                password: ''
            }));
        }
    };

    const loadFrameworkData = async () => {
        try {
            const [configs, instances] = await Promise.all([
                firestoreHelpers.getSurveyConfigs(),
                firestoreHelpers.getSurveyInstances()
            ]);
            setState(prev => ({
                ...prev,
                surveyConfigs: configs,
                surveyInstances: instances
            }));
        } catch (error) {
            console.error('Error loading framework data:', error);
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
        setState(prev => ({
            ...prev,
            isAuthenticated: false,
            surveys: [],
            surveyConfigs: [],
            surveyInstances: [],
            showSurveyBuilder: false,
            showRatingScaleManager: false
        }));
    };

    const handleClose = () => {
        setState(prev => ({
            ...prev,
            isAuthenticated: false,
            surveys: [],
            surveyConfigs: [],
            surveyInstances: [],
            showSurveyBuilder: false,
            showRatingScaleManager: false
        }));
        onClose();
    };

    const togglePasswordVisibility = () => {
        setState(prev => ({
            ...prev,
            showPassword: !prev.showPassword
        }));
    };

    const handleShowSurveyBuilder = () => {
        setState(prev => ({ ...prev, showSurveyBuilder: true }));
    };

    const handleCloseSurveyBuilder = () => {
        setState(prev => ({ ...prev, showSurveyBuilder: false }));
        // Reload framework data after builder is closed
        loadFrameworkData();
    };

    const handleShowRatingScaleManager = () => {
        setState(prev => ({ ...prev, showRatingScaleManager: true }));
    };

    const handleCloseRatingScaleManager = () => {
        setState(prev => ({ ...prev, showRatingScaleManager: false }));
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-gray-900">
                            Admin Panel
                        </h2>
                        <button
                            onClick={handleClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {!state.isAuthenticated ? (
                        <div>
                            <div className="mb-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
                                <p className="text-gray-600 text-sm">
                                    Please enter the admin password to access the admin panel.
                                </p>
                            </div>

                            <form onSubmit={handlePasswordSubmit} className="space-y-4">
                                <div className="relative">
                                    <Input
                                        type={state.showPassword ? "text" : "password"}
                                        name="password"
                                        label="Admin Password"
                                        value={state.password}
                                        onChange={(e) => setState(prev => ({ ...prev, password: e }))}
                                        placeholder="Enter admin password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={togglePasswordVisibility}
                                        className="absolute right-3 top-8 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        {state.showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                        <div className="space-y-6">
                            {/* Framework Management Section */}
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <h3 className="font-medium text-green-900 mb-2">Survey Framework</h3>
                                <p className="text-green-700 text-sm mb-3">
                                    Create and manage configurable surveys using the new framework.
                                </p>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="font-medium">Configurations:</span> {state.surveyConfigs.length}
                                    </div>
                                    <div>
                                        <span className="font-medium">Active Instances:</span> {state.surveyInstances.filter(i => i.isActive).length}
                                    </div>
                                </div>
                                <Button
                                    onClick={handleShowSurveyBuilder}
                                    variant="primary"
                                    className="mt-3"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create New Survey
                                </Button>
                            </div>

                            {/* Rating Scale Management Section */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h3 className="font-medium text-blue-900 mb-2">Rating Scale Management</h3>
                                <p className="text-blue-700 text-sm mb-3">
                                    Create and manage reusable rating scales with default values that can be used across different survey fields.
                                </p>
                                <Button
                                    onClick={handleShowRatingScaleManager}
                                    variant="primary"
                                    className="mt-3"
                                >
                                    <Star className="h-4 w-4 mr-2" />
                                    Manage Rating Scales
                                </Button>
                            </div>

                            {/* Legacy Data Section */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h3 className="font-medium text-blue-900 mb-2">Legacy Survey Data</h3>
                                <p className="text-blue-700 text-sm">
                                    Download all legacy survey responses as an Excel file (.xlsx) with comprehensive data including personal info, business details, and service line ratings.
                                </p>
                            </div>

                            {/* Survey Count Section */}
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                <h3 className="font-medium text-amber-900 mb-2">Survey Count</h3>
                                <div className="flex items-center justify-between">
                                    <div>
                                        {isCountLoading ? (
                                            <div className="flex items-center text-amber-700 text-sm">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-600 mr-2" />
                                                Loading survey count...
                                            </div>
                                        ) : surveyCount !== null ? (
                                            <p className="text-amber-700 text-sm">
                                                Currently {surveyCount} survey records in the database
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

            {/* Survey Builder Modal */}
            {state.showSurveyBuilder && (
                <SurveyBuilder onClose={handleCloseSurveyBuilder} />
            )}

            {/* Rating Scale Manager Modal */}
            {/* {state.showRatingScaleManager && (
                <RatingScaleManager
                    isVisible={state.showRatingScaleManager}
                    onClose={handleCloseRatingScaleManager}
                />
            )} */}
        </div>
    );
}; 