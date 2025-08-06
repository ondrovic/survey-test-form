import { RatingScaleManager } from '@/components/admin/RatingScaleManager';
import { SurveyBuilder } from '@/components/admin/SurveyBuilder';
import { Alert, Button, Input } from '@/components/common';
import { firestoreHelpers } from '@/config/firebase';
import { useAdminTab } from '@/contexts/AdminTabContext';
import { RatingScale, SurveyConfig, SurveyData, SurveyInstance } from '@/types';
import { isSurveyInstanceActive } from '@/utils';
import { cookieUtils } from '@/utils/cookie.utils';
import { downloadSurveyDataAsExcel } from '@/utils/excel.utils';
import { clsx } from 'clsx';
import { Copy, Download, Edit, Eye, EyeOff, Lock, Plus, Settings, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface AdminPageProps {
    onBack: () => void;
}

interface AdminPageState {
    password: string;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    success: string | null;
    surveys: SurveyData[]; // Legacy surveys
    showPassword: boolean;
    showSurveyBuilder: boolean;
    showRatingScaleManager: boolean;
    ratingScales: RatingScale[]; // Rating scales
    editingRatingScale: RatingScale | null;
    surveyConfigs: SurveyConfig[]; // Framework configs
    surveyInstances: SurveyInstance[]; // Framework instances
    selectedSurveyConfig: SurveyConfig | null;
    editingSurveyConfig: SurveyConfig | null;
    showDeleteConfirm: { type: 'config' | 'instance' | 'legacy' | 'rating-scale'; id: string; name: string } | null;
    showInstanceSettings: { instance: SurveyInstance; isOpen: boolean } | null;
    activeTab: 'overview' | 'framework' | 'legacy' | 'rating-scales';
}

export const AdminPage: React.FC<AdminPageProps> = ({ onBack }) => {
    const { activeTab, setActiveTab } = useAdminTab();

    const [state, setState] = useState<AdminPageState>({
        password: '',
        isAuthenticated: false,
        isLoading: false,
        error: null,
        success: null,
        surveys: [],
        showPassword: false,
        showSurveyBuilder: false,
        showRatingScaleManager: false,
        ratingScales: [],
        editingRatingScale: null,
        surveyConfigs: [],
        surveyInstances: [],
        selectedSurveyConfig: null,
        editingSurveyConfig: null,
        showDeleteConfirm: null,
        showInstanceSettings: null,
        activeTab: 'overview',
    });

    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD;

    // Check for existing authentication on component mount
    useEffect(() => {
        if (cookieUtils.isAdminAuthenticated()) {
            setState(prev => ({ ...prev, isAuthenticated: true }));
            loadFrameworkData();
            loadLegacyData();
            loadRatingScales();
        }
    }, []);

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (state.password === adminPassword) {
            // Set authentication cookie
            cookieUtils.setAdminAuth();
            setState(prev => ({ ...prev, isAuthenticated: true }));
            loadFrameworkData();
            loadLegacyData();
            loadRatingScales();
        } else {
            setState(prev => ({ ...prev, error: 'Invalid password' }));
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

    const loadLegacyData = async () => {
        try {
            const surveys = await firestoreHelpers.getSurveys();
            setState(prev => ({ ...prev, surveys }));
        } catch (error) {
            console.error('Error loading legacy data:', error);
        }
    };

    const handleDownloadData = async (surveyId?: string) => {
        try {
            setState(prev => ({ ...prev, isLoading: true }));
            if (surveyId) {
                // Download specific survey data
                const survey = state.surveys.find(s => s.id === surveyId);
                if (survey) {
                    await downloadSurveyDataAsExcel([survey], survey.title);
                }
            } else {
                // Download all survey data
                await downloadSurveyDataAsExcel(state.surveys);
            }
            setState(prev => ({
                ...prev,
                isLoading: false,
                success: `Survey data downloaded successfully!`
            }));
        } catch (error) {
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: 'Failed to download survey data'
            }));
        }
    };

    const handleDownloadFrameworkData = async (instanceId?: string) => {
        try {
            setState(prev => ({ ...prev, isLoading: true }));
            const responses = await firestoreHelpers.getSurveyResponses(instanceId);
            if (instanceId) {
                const instance = state.surveyInstances.find(i => i.id === instanceId);
                if (instance) {
                    await downloadSurveyDataAsExcel(responses, `Framework Survey - ${instance.title}`);
                }
            } else {
                await downloadSurveyDataAsExcel(responses, 'All Framework Surveys');
            }
            setState(prev => ({
                ...prev,
                isLoading: false,
                success: `Framework survey data downloaded successfully!`
            }));
        } catch (error) {
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: 'Failed to download framework survey data'
            }));
        }
    };

    const handleDeleteSurvey = async (surveyId: string) => {
        try {
            await firestoreHelpers.deleteSurvey(surveyId);
            setState(prev => ({
                ...prev,
                surveys: prev.surveys.filter(s => s.id !== surveyId),
                showDeleteConfirm: null,
                success: 'Survey deleted successfully!'
            }));
        } catch (error) {
            setState(prev => ({
                ...prev,
                showDeleteConfirm: null,
                error: 'Failed to delete survey'
            }));
        }
    };

    const handleDeleteSurveyConfig = async (configId: string) => {
        try {
            await firestoreHelpers.deleteSurveyConfig(configId);
            setState(prev => ({
                ...prev,
                surveyConfigs: prev.surveyConfigs.filter(c => c.id !== configId),
                showDeleteConfirm: null,
                success: 'Survey configuration deleted successfully!'
            }));
        } catch (error) {
            setState(prev => ({
                ...prev,
                showDeleteConfirm: null,
                error: 'Failed to delete survey configuration'
            }));
        }
    };

    const handleDeleteSurveyInstance = async (instanceId: string) => {
        try {
            await firestoreHelpers.updateSurveyInstance(instanceId, { isActive: false });
            setState(prev => ({
                ...prev,
                surveyInstances: prev.surveyInstances.map(i =>
                    i.id === instanceId ? { ...i, isActive: false } : i
                ),
                showDeleteConfirm: null,
                success: 'Survey instance deactivated successfully!'
            }));
        } catch (error) {
            setState(prev => ({
                ...prev,
                showDeleteConfirm: null,
                error: 'Failed to deactivate survey instance'
            }));
        }
    };

    const handlePermanentlyDeleteSurveyInstance = async (instanceId: string) => {
        try {
            await firestoreHelpers.deleteSurveyInstance(instanceId);
            setState(prev => ({
                ...prev,
                surveyInstances: prev.surveyInstances.filter(i => i.id !== instanceId),
                showDeleteConfirm: null,
                success: 'Survey instance permanently deleted!'
            }));
        } catch (error) {
            setState(prev => ({
                ...prev,
                showDeleteConfirm: null,
                error: 'Failed to delete survey instance'
            }));
        }
    };

    const handleEditSurveyConfig = (config: SurveyConfig) => {
        setState(prev => ({
            ...prev,
            editingSurveyConfig: config,
            showSurveyBuilder: true
        }));
    };

    const handleCreateNewSurvey = () => {
        setState(prev => ({
            ...prev,
            editingSurveyConfig: null,
            showSurveyBuilder: true
        }));
    };

    const handleCloseSurveyBuilder = () => {
        setState(prev => ({
            ...prev,
            showSurveyBuilder: false,
            editingSurveyConfig: null
        }));
        loadFrameworkData(); // Reload data after builder closes
    };

    const handleShowRatingScaleManager = () => {
        console.log('Opening RatingScaleManager for create');
        setState(prev => ({
            ...prev,
            showRatingScaleManager: true,
            editingRatingScale: null // Clear any existing editing scale
        }));
    };

    const handleCloseRatingScaleManager = () => {
        setState(prev => ({
            ...prev,
            showRatingScaleManager: false,
            editingRatingScale: null // Clear the editing state when closing
        }));
    };

    const handleEditRatingScale = (scale: RatingScale) => {
        console.log('Editing rating scale:', scale);
        setState(prev => ({
            ...prev,
            editingRatingScale: scale,
            showRatingScaleManager: true
        }));
    };

    const loadRatingScales = async () => {
        try {
            console.log('Loading rating scales...');
            const scales = await firestoreHelpers.getRatingScales();
            console.log('Loaded rating scales:', scales);

            // Check for duplicates and log them
            const duplicateNames = scales.map(s => s.name);
            const uniqueNames = [...new Set(duplicateNames)];
            console.log('Unique scale names:', uniqueNames);
            console.log('Total scales:', scales.length);
            console.log('Unique scales:', uniqueNames.length);

            if (scales.length > uniqueNames.length) {
                console.warn('Duplicate rating scales detected!');
            }

            setState(prev => ({ ...prev, ratingScales: scales }));
        } catch (error) {
            console.error('Error loading rating scales:', error);
        }
    };



    const cleanupDuplicateRatingScales = async () => {
        try {
            console.log('=== CLEANUP FUNCTION CALLED ===');
            console.log('Cleaning up duplicate rating scales...');
            const scales = await firestoreHelpers.getRatingScales();
            console.log('Current scales in database:', scales);

            // Group scales by name
            const scalesByName = new Map<string, RatingScale[]>();
            scales.forEach(scale => {
                if (!scalesByName.has(scale.name)) {
                    scalesByName.set(scale.name, []);
                }
                scalesByName.get(scale.name)!.push(scale);
            });

            console.log('Scales grouped by name:', Object.fromEntries(scalesByName));

            // Delete duplicates (keep the first one)
            let deletedCount = 0;
            for (const [name, scaleList] of scalesByName) {
                if (scaleList.length > 1) {
                    console.log(`Found ${scaleList.length} duplicates for "${name}", keeping the first one`);
                    // Delete all but the first one
                    for (let i = 1; i < scaleList.length; i++) {
                        console.log(`Deleting duplicate scale: ${scaleList[i].id} (${scaleList[i].name})`);
                        await firestoreHelpers.deleteRatingScale(scaleList[i].id);
                        deletedCount++;
                    }
                } else {
                    console.log(`No duplicates found for "${name}"`);
                }
            }

            if (deletedCount > 0) {
                console.log(`Cleaned up ${deletedCount} duplicate rating scales`);
                setState(prev => ({
                    ...prev,
                    success: `Cleaned up ${deletedCount} duplicate rating scales!`
                }));
                // Reload the scales
                await loadRatingScales();
            }
        } catch (error) {
            console.error('Error cleaning up duplicates:', error);
            setState(prev => ({
                ...prev,
                error: 'Failed to clean up duplicate rating scales'
            }));
        }
    };

    // Load rating scales when the rating-scales tab is selected
    useEffect(() => {
        if (state.isAuthenticated && state.activeTab === 'rating-scales') {
            loadRatingScales();
        }
    }, [state.activeTab, state.isAuthenticated]);

    const handleLogout = () => {
        // Clear authentication cookie
        cookieUtils.clearAdminAuth();
        setState(prev => ({
            ...prev,
            isAuthenticated: false,
            password: '',
            error: null,
            success: null
        }));
    };

    const togglePasswordVisibility = () => {
        setState(prev => ({ ...prev, showPassword: !prev.showPassword }));
    };

    const handleSetActiveTab = (tab: 'overview' | 'framework' | 'legacy' | 'rating-scales') => {
        setActiveTab(tab);
    };

    const handleCreateSurveyInstance = async (config: SurveyConfig) => {
        try {
            setState(prev => ({ ...prev, isLoading: true }));

            const instance = {
                configId: config.id,
                title: config.title,
                description: config.description,
                isActive: true,
                metadata: {
                    createdBy: 'admin',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            };

            await firestoreHelpers.addSurveyInstance(instance);

            setState(prev => ({
                ...prev,
                isLoading: false,
                success: `Survey instance "${config.title}" created successfully!`
            }));

            // Reload instances
            loadFrameworkData();
        } catch (error) {
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: 'Failed to create survey instance'
            }));
        }
    };

    const handleToggleInstanceActive = async (instanceId: string, isActive: boolean) => {
        try {
            setState(prev => ({ ...prev, isLoading: true }));

            await firestoreHelpers.updateSurveyInstance(instanceId, { isActive });

            setState(prev => ({
                ...prev,
                surveyInstances: prev.surveyInstances.map(i =>
                    i.id === instanceId ? { ...i, isActive } : i
                ),
                isLoading: false,
                success: `Survey instance ${isActive ? 'activated' : 'deactivated'} successfully!`
            }));
        } catch (error) {
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: `Failed to ${isActive ? 'activate' : 'deactivate'} survey instance`
            }));
        }
    };

    const handleUpdateInstanceDateRange = async (instanceId: string, dateRange: { startDate: string; endDate: string } | null) => {
        try {
            setState(prev => ({ ...prev, isLoading: true }));

            const updateData = dateRange ? { activeDateRange: dateRange } : { activeDateRange: undefined };
            await firestoreHelpers.updateSurveyInstance(instanceId, updateData);

            setState(prev => ({
                ...prev,
                surveyInstances: prev.surveyInstances.map(i =>
                    i.id === instanceId ? { ...i, activeDateRange: dateRange || undefined } : i
                ),
                isLoading: false,
                success: dateRange ? 'Date range updated successfully!' : 'Date range removed successfully!'
            }));
        } catch (error) {
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: 'Failed to update date range'
            }));
        }
    };

    const openInstanceSettings = (instance: SurveyInstance) => {
        setState(prev => ({
            ...prev,
            showInstanceSettings: { instance, isOpen: true }
        }));
    };

    const closeInstanceSettings = () => {
        setState(prev => ({
            ...prev,
            showInstanceSettings: null
        }));
    };

    const generateSurveyUrl = (instance: SurveyInstance) => {
        const slug = instance.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        return `${window.location.origin}/survey-test-form/${slug}`;
    };

    const copySurveyUrl = async (url: string) => {
        try {
            await navigator.clipboard.writeText(url);
            setState(prev => ({
                ...prev,
                success: 'Survey URL copied to clipboard!'
            }));
        } catch (error) {
            setState(prev => ({
                ...prev,
                error: 'Failed to copy URL to clipboard'
            }));
        }
    };

    // Authentication screen
    if (!state.isAuthenticated) {
        return (
            <div className="min-h-screen bg-amber-50/30 flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
                    <div className="text-center mb-6">
                        <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900">Admin Access</h2>
                        <p className="text-gray-600 mt-2">Enter admin password to continue</p>
                    </div>

                    <form onSubmit={handlePasswordSubmit}>
                        <div className="relative">
                            <Input
                                name="adminPassword"
                                type={state.showPassword ? "text" : "password"}
                                label="Admin Password"
                                value={state.password}
                                onChange={(value) => setState(prev => ({ ...prev, password: value }))}
                                placeholder="Enter admin password"
                                required
                            />
                            <button
                                type="button"
                                onClick={togglePasswordVisibility}
                                className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                            >
                                {state.showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>

                        {state.error && (
                            <Alert
                                type="error"
                                message={state.error}
                                onDismiss={() => setState(prev => ({ ...prev, error: null }))}
                                className="mt-4"
                            />
                        )}

                        <div className="mt-6 flex gap-3">
                            <Button
                                type="submit"
                                className="flex-1"
                                loading={state.isLoading}
                            >
                                Access Admin Panel
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-amber-50/30">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-xl font-semibold text-gray-900">Admin Panel</h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <Button variant="outline" onClick={handleLogout}>
                                Logout
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Alerts */}
            {(state.error || state.success) && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
                    <Alert
                        type={state.error ? 'error' : 'success'}
                        message={state.error || state.success || ''}
                        onDismiss={() => setState(prev => ({ ...prev, error: null, success: null }))}
                    />
                </div>
            )}

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Tab Navigation */}
                <div className="border-b border-gray-200 mb-8">
                    <nav className="-mb-px flex space-x-8">
                        {[
                            { id: 'overview', label: 'Overview' },
                            { id: 'framework', label: 'Survey Framework' },
                            { id: 'rating-scales', label: 'Rating Scales' },
                            // { id: 'legacy', label: 'Legacy Surveys' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => handleSetActiveTab(tab.id as any)}
                                className={clsx(
                                    "py-2 px-1 border-b-2 font-medium text-sm",
                                    activeTab === tab.id
                                        ? "border-blue-500 text-blue-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Tab Content */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-semibold mb-4">Survey Framework</h3>
                            <div className="space-y-2 mb-6">
                                <p className="text-sm text-gray-600">
                                    Manage survey configurations and instances
                                </p>
                                <div className="text-sm">
                                    <p><strong>Configurations:</strong> {state.surveyConfigs.length}</p>
                                    <p><strong>Active Instances:</strong> {state.surveyInstances.filter(i => i.isActive).length}</p>
                                </div>
                            </div>
                            <Button
                                onClick={() => handleSetActiveTab('framework')}
                                className="w-full"
                            >
                                Manage Framework
                            </Button>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-semibold mb-4">Legacy Surveys</h3>
                            <div className="space-y-2 mb-6">
                                <p className="text-sm text-gray-600">
                                    Access and manage legacy survey data
                                </p>
                                <div className="text-sm">
                                    <p><strong>Total Surveys:</strong> {state.surveys.length}</p>
                                    <p><strong>Total Responses:</strong> {state.surveys.reduce((sum, s) => sum + (s.responses?.length || 0), 0)}</p>
                                </div>
                            </div>
                            <Button
                                onClick={() => handleSetActiveTab('legacy')}
                                className="w-full"
                            >
                                Manage Legacy
                            </Button>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-semibold mb-4">Rating Scale Management</h3>
                            <div className="space-y-4 mb-8">
                                <p className="text-sm text-gray-600">
                                    Create and manage reusable rating scales with default values
                                </p>
                                <div className="text-sm">
                                    <p><strong>Available Scales:</strong> {state.ratingScales.length} scales</p>
                                </div>
                            </div>
                            <Button
                                onClick={() => handleSetActiveTab('rating-scales')}
                                className="w-full"
                            >
                                Manage Rating Scales
                            </Button>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                            <div className="space-y-2 mb-6">
                                <p className="text-sm text-gray-600">
                                    Common administrative tasks
                                </p>
                                <div className="text-sm">
                                    <p><strong>Actions:</strong> Create survey, Download data</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Button
                                    onClick={handleCreateNewSurvey}
                                    className="w-full"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create New Survey
                                </Button>
                                <Button
                                    onClick={() => handleDownloadFrameworkData()}
                                    variant="outline"
                                    className="w-full"
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Download All Data
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'framework' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold">Survey Framework</h2>
                            <Button onClick={handleCreateNewSurvey}>
                                <Plus className="w-4 h-4 mr-2" />
                                Create New Survey
                            </Button>
                        </div>

                        {/* Survey Configurations */}
                        <div className="bg-white rounded-lg shadow">
                            <div className="px-6 py-4 border-b">
                                <h3 className="text-lg font-semibold">Survey Configurations</h3>
                            </div>
                            <div className="p-6">
                                {state.surveyConfigs.length === 0 ? (
                                    <p className="text-gray-500 text-center py-8">No survey configurations found.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {state.surveyConfigs.map((config) => (
                                            <div key={config.id} className="border rounded-lg p-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h4 className="font-semibold">{config.title}</h4>
                                                        <p className="text-sm text-gray-600">{config.description}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {config.sections.length} sections,
                                                            {config.sections.reduce((sum, s) => sum + s.fields.length, 0)} fields
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleEditSurveyConfig(config)}
                                                        >
                                                            <Edit className="w-4 h-4 mr-1" />
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleCreateSurveyInstance(config)}
                                                        >
                                                            <Plus className="w-4 h-4 mr-1" />
                                                            Create Instance
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => setState(prev => ({
                                                                ...prev,
                                                                showDeleteConfirm: {
                                                                    type: 'config',
                                                                    id: config.id,
                                                                    name: config.title
                                                                }
                                                            }))}
                                                        >
                                                            <Trash2 className="w-4 h-4 mr-1" />
                                                            Delete
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Survey Instances */}
                        <div className="bg-white rounded-lg shadow">
                            <div className="px-6 py-4 border-b">
                                <h3 className="text-lg font-semibold">Survey Instances</h3>
                            </div>
                            <div className="p-6">
                                {state.surveyInstances.length === 0 ? (
                                    <p className="text-gray-500 text-center py-8">No survey instances found.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {state.surveyInstances.map((instance) => (
                                            <div key={instance.id} className="border rounded-lg p-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h4 className="font-semibold">{instance.title}</h4>
                                                        <p className="text-sm text-gray-600">{instance.description}</p>
                                                        <div className="flex items-center gap-4 mt-2">
                                                            <span className={clsx(
                                                                "px-2 py-1 text-xs rounded-full",
                                                                isSurveyInstanceActive(instance)
                                                                    ? "bg-green-100 text-green-800"
                                                                    : "bg-gray-100 text-gray-800"
                                                            )}>
                                                                {isSurveyInstanceActive(instance) ? 'Active' : 'Inactive'}
                                                            </span>
                                                            <span className="text-xs text-gray-500">
                                                                Created: {new Date(instance.metadata.createdAt).toLocaleDateString()}
                                                            </span>
                                                            {instance.activeDateRange && (
                                                                <span className="text-xs text-blue-600">
                                                                    {new Date(instance.activeDateRange.startDate).toLocaleDateString()} - {new Date(instance.activeDateRange.endDate).toLocaleDateString()}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="mt-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs text-gray-500">URL:</span>
                                                                <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                                                    {generateSurveyUrl(instance)}
                                                                </code>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => copySurveyUrl(generateSurveyUrl(instance))}
                                                                    className="text-gray-500 hover:text-gray-700"
                                                                >
                                                                    <Copy className="w-3 h-3" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleToggleInstanceActive(instance.id, !instance.isActive)}
                                                        >
                                                            {instance.isActive ? 'Deactivate' : 'Activate'}
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => openInstanceSettings(instance)}
                                                        >
                                                            <Settings className="w-4 h-4 mr-1" />
                                                            Settings
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleDownloadFrameworkData(instance.id)}
                                                        >
                                                            <Download className="w-4 h-4 mr-1" />
                                                            Download
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => setState(prev => ({
                                                                ...prev,
                                                                showDeleteConfirm: {
                                                                    type: 'instance',
                                                                    id: instance.id,
                                                                    name: instance.title
                                                                }
                                                            }))}
                                                        >
                                                            <Trash2 className="w-4 h-4 mr-1" />
                                                            Delete
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'rating-scales' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold">Rating Scales</h2>
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => {
                                        console.log('Clean Duplicates button clicked!');
                                        alert('Clean Duplicates button clicked!');
                                        cleanupDuplicateRatingScales();
                                    }}
                                    variant="outline"
                                    size="sm"
                                >
                                    Clean Duplicates
                                </Button>
                                <Button onClick={handleShowRatingScaleManager}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create New Rating Scale
                                </Button>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow">
                            <div className="px-6 py-4 border-b">
                                <h3 className="text-lg font-semibold">Rating Scale Configurations</h3>
                            </div>
                            <div className="p-6">
                                {state.ratingScales && state.ratingScales.length === 0 ? (
                                    <p className="text-gray-500 text-center py-8">No rating scales found. Create your first rating scale to get started.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {state.ratingScales?.map((scale) => (
                                            <div key={scale.id} className="border rounded-lg p-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h4 className="font-semibold">{scale.name}</h4>
                                                        <p className="text-sm text-gray-600">{scale.description || 'No description'}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {scale.options.length} options,
                                                            {scale.options.filter(opt => opt.isDefault).length} default
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleEditRatingScale(scale)}
                                                        >
                                                            <Edit className="w-4 h-4 mr-1" />
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => setState(prev => ({
                                                                ...prev,
                                                                showDeleteConfirm: {
                                                                    type: 'rating-scale',
                                                                    id: scale.id,
                                                                    name: scale.name
                                                                }
                                                            }))}
                                                        >
                                                            <Trash2 className="w-4 h-4 mr-1" />
                                                            Delete
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'legacy' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold">Legacy Surveys</h2>
                            <Button
                                onClick={() => handleDownloadData()}
                                variant="outline"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Download All Data
                            </Button>
                        </div>

                        <div className="bg-white rounded-lg shadow">
                            <div className="px-6 py-4 border-b">
                                <h3 className="text-lg font-semibold">Survey Data</h3>
                            </div>
                            <div className="p-6">
                                {state.surveys.length === 0 ? (
                                    <p className="text-gray-500 text-center py-8">No legacy surveys found.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {state.surveys.map((survey) => (
                                            <div key={survey.id} className="border rounded-lg p-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h4 className="font-semibold">{survey.title}</h4>
                                                        <p className="text-sm text-gray-600">
                                                            {survey.responses?.length || 0} responses
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            Created: {new Date(survey.createdAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleDownloadData(survey.id)}
                                                        >
                                                            <Download className="w-4 h-4 mr-1" />
                                                            Download
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => setState(prev => ({
                                                                ...prev,
                                                                showDeleteConfirm: {
                                                                    type: 'legacy',
                                                                    id: survey.id,
                                                                    name: survey.title
                                                                }
                                                            }))}
                                                        >
                                                            <Trash2 className="w-4 h-4 mr-1" />
                                                            Delete
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Delete Confirmation Modal */}
            {state.showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold mb-4">Confirm Deletion</h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete "{state.showDeleteConfirm.name}"?
                            This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <Button
                                onClick={() => {
                                    if (state.showDeleteConfirm?.type === 'legacy') {
                                        handleDeleteSurvey(state.showDeleteConfirm.id);
                                    } else if (state.showDeleteConfirm?.type === 'config') {
                                        handleDeleteSurveyConfig(state.showDeleteConfirm.id);
                                    } else if (state.showDeleteConfirm?.type === 'instance') {
                                        handlePermanentlyDeleteSurveyInstance(state.showDeleteConfirm.id);
                                    } else if (state.showDeleteConfirm?.type === 'rating-scale') {
                                        // For rating scales, we need to call the delete function directly
                                        // since the RatingScaleManager handles its own deletion
                                        const scaleId = state.showDeleteConfirm.id;
                                        firestoreHelpers.deleteRatingScale(scaleId);
                                        // Update the state to remove the deleted scale
                                        setState(prev => ({
                                            ...prev,
                                            ratingScales: prev.ratingScales.filter(s => s.id !== scaleId)
                                        }));
                                    }
                                    // Close the modal after deletion
                                    setState(prev => ({ ...prev, showDeleteConfirm: null }));
                                }}
                                variant="secondary"
                                className="flex-1 bg-red-600 hover:bg-red-700 focus:ring-red-500"
                            >
                                Delete
                            </Button>
                            <Button
                                onClick={() => setState(prev => ({ ...prev, showDeleteConfirm: null }))}
                                variant="outline"
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Instance Settings Modal */}
            {state.showInstanceSettings && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Survey Instance Settings</h3>
                            <Button
                                variant="ghost"
                                onClick={closeInstanceSettings}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ×
                            </Button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h4 className="font-medium mb-2">{state.showInstanceSettings.instance.title}</h4>
                                <p className="text-sm text-gray-600">{state.showInstanceSettings.instance.description}</p>
                            </div>

                            <div className="border-t pt-4">
                                <h5 className="font-medium mb-3">Active Status</h5>
                                <div className="flex items-center gap-3">
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={state.showInstanceSettings.instance.isActive}
                                            onChange={(e) => handleToggleInstanceActive(
                                                state.showInstanceSettings?.instance.id || '',
                                                e.target.checked
                                            )}
                                            className="mr-2"
                                        />
                                        Active
                                    </label>
                                    <span className={clsx(
                                        "px-2 py-1 text-xs rounded-full",
                                        isSurveyInstanceActive(state.showInstanceSettings.instance)
                                            ? "bg-green-100 text-green-800"
                                            : "bg-gray-100 text-gray-800"
                                    )}>
                                        {isSurveyInstanceActive(state.showInstanceSettings.instance) ? 'Currently Active' : 'Currently Inactive'}
                                    </span>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <h5 className="font-medium mb-3">Active Date Range (Optional)</h5>
                                <p className="text-sm text-gray-600 mb-3">
                                    Leave empty to keep survey active indefinitely
                                </p>

                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Start Date
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={state.showInstanceSettings.instance.activeDateRange?.startDate?.slice(0, 16) || ''}
                                            onChange={(e) => {
                                                const startDate = e.target.value ? new Date(e.target.value).toISOString() : '';
                                                const endDate = state.showInstanceSettings?.instance.activeDateRange?.endDate || '';
                                                const dateRange = startDate && endDate ? { startDate, endDate } : null;
                                                handleUpdateInstanceDateRange(state.showInstanceSettings?.instance.id || '', dateRange);
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            End Date
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={state.showInstanceSettings.instance.activeDateRange?.endDate?.slice(0, 16) || ''}
                                            onChange={(e) => {
                                                const startDate = state.showInstanceSettings?.instance.activeDateRange?.startDate || '';
                                                const endDate = e.target.value ? new Date(e.target.value).toISOString() : '';
                                                const dateRange = startDate && endDate ? { startDate, endDate } : null;
                                                handleUpdateInstanceDateRange(state.showInstanceSettings?.instance.id || '', dateRange);
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="mt-3">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleUpdateInstanceDateRange(state.showInstanceSettings?.instance.id || '', null)}
                                    >
                                        Remove Date Range
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <Button onClick={closeInstanceSettings}>
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Survey Builder Modal */}
            {state.showSurveyBuilder && (
                <SurveyBuilder
                    onClose={handleCloseSurveyBuilder}
                    editingConfig={state.editingSurveyConfig}
                />
            )}

            {/* Rating Scale Manager Modal */}
            {state.showRatingScaleManager && (
                <RatingScaleManager
                    isVisible={state.showRatingScaleManager}
                    onClose={() => {
                        handleCloseRatingScaleManager();
                    }}
                    onScaleSelect={() => { }}
                    editingScale={state.editingRatingScale}
                    isCreating={!state.editingRatingScale}
                    scales={state.ratingScales}
                    onScaleDeleted={(scaleId) => {
                        setState(prev => ({
                            ...prev,
                            ratingScales: prev.ratingScales.filter(s => s.id !== scaleId)
                        }));
                    }}
                    onScaleCreated={(newScale) => {
                        setState(prev => ({
                            ...prev,
                            ratingScales: [newScale, ...prev.ratingScales]
                        }));
                    }}
                    onScaleUpdated={(updatedScale) => {
                        setState(prev => ({
                            ...prev,
                            ratingScales: prev.ratingScales.map(s =>
                                s.id === updatedScale.id ? updatedScale : s
                            )
                        }));
                    }}
                />
            )}


        </div>
    );
};

