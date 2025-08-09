import { Button } from '@/components/common';
import { firestoreHelpers } from '@/config/firebase';
import { useSurveyData } from '@/contexts/survey-data-context/index';
import { useToast } from '@/contexts/toast-context/index';
import { useModal } from '@/hooks';
import { SurveyConfig, SurveyInstance, SurveyResponse } from '@/types';
import { isSurveyInstanceActive } from '@/utils';
import { downloadFrameworkResponsesAsExcel } from '@/utils/excel.utils';
import { Copy, Download, Edit, ExternalLink, Plus, Settings, Trash2 } from 'lucide-react';
import React, { useState } from 'react';

interface AdminFrameworkProps {
    onCreateNewSurvey: () => void;
    onEditSurveyConfig: (config: SurveyConfig) => void;
    onDeleteSurveyConfig: (configId: string, configName?: string) => void;
    onDeleteSurveyInstance: (instanceId: string, instanceName?: string) => void;
    onToggleInstanceActive: (instanceId: string, isActive: boolean, instanceName?: string) => void;
    onUpdateInstanceDateRange: (instanceId: string, dateRange: { startDate: string; endDate: string } | null, instanceName?: string) => void;
}

export const AdminFramework: React.FC<AdminFrameworkProps> = ({
    onCreateNewSurvey,
    onEditSurveyConfig,
    onDeleteSurveyConfig,
    onDeleteSurveyInstance,
    onToggleInstanceActive,
    onUpdateInstanceDateRange
}) => {
    const { state: { surveyConfigs, surveyInstances }, refreshAll } = useSurveyData();
    const { showSuccess, showError } = useToast();
    const deleteModal = useModal<{ type: 'config' | 'instance'; id: string; name: string }>();
    const settingsModal = useModal<SurveyInstance>();

    const handleCreateSurveyInstance = async (config: SurveyConfig) => {
        try {
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
            showSuccess(`Survey instance "${config.title}" created!`);

            // Refresh the data to show the new instance immediately
            await refreshAll();
        } catch (error) {
            showError(`Failed to create survey instance for "${config.title}"`);
        }
    };

    const handleDownloadFrameworkData = async (instanceId?: string) => {
        try {
            if (instanceId) {
                // Use the new function to get responses from the survey-specific collection
                const responses = await firestoreHelpers.getSurveyResponsesFromCollection(instanceId);
                const instance = surveyInstances.find(i => i.id === instanceId);
                if (instance) {
                    // Get the survey configuration for proper ordering
                    const surveyConfig = await firestoreHelpers.getSurveyConfig(instance.configId);

                    // Generate filename with instance name and date
                    const now = new Date();
                    const dateStr = now.toISOString().split('T')[0];
                    const instanceSlug = instance.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                    const filename = `${instanceSlug}-responses-${dateStr}.xlsx`;

                    downloadFrameworkResponsesAsExcel(responses, surveyConfig || undefined, {
                        filename,
                        sheetName: `${instance.title} Responses`
                    });

                    showSuccess(`Successfully downloaded ${responses.length} responses for ${instance.title}`);
                }
            } else {
                // For all instances, we need to get responses from each survey-specific collection
                const allResponses: SurveyResponse[] = [];
                const configs = await firestoreHelpers.getSurveyConfigs();

                for (const instance of surveyInstances) {
                    try {
                        const responses = await firestoreHelpers.getSurveyResponsesFromCollection(instance.id);
                        allResponses.push(...responses);
                    } catch (error) {
                        console.warn(`Failed to get responses for instance ${instance.id}:`, error);
                    }
                }

                // Use the first config as a reference for ordering (or undefined if no configs)
                const referenceConfig = configs.length > 0 ? configs[0] : undefined;

                // Generate filename for all responses
                const now = new Date();
                const dateStr = now.toISOString().split('T')[0];
                const filename = `all-survey-responses-${dateStr}.xlsx`;

                downloadFrameworkResponsesAsExcel(allResponses, referenceConfig, {
                    filename,
                    sheetName: 'All Survey Responses'
                });

                showSuccess(`Successfully downloaded ${allResponses.length} total responses`);
            }
        } catch (error) {
            showError('Failed to download framework survey data');
        }
    };

    const generateSurveyUrl = (instance: SurveyInstance) => {
        const slug = instance.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        return `${window.location.origin}/survey-test-form/${slug}`;
    };

    const copySurveyUrl = async (url: string) => {
        try {
            await navigator.clipboard.writeText(url);
            showSuccess('Survey URL copied to clipboard!');
        } catch (error) {
            showError('Failed to copy URL to clipboard');
        }
    };

    const openSurveyInNewTab = (url: string) => {
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const openInstanceSettings = (instance: SurveyInstance) => {
        settingsModal.open(instance);
    };

    const closeInstanceSettings = () => {
        settingsModal.close();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Survey Framework</h2>
                <Button onClick={onCreateNewSurvey}>
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
                    {surveyConfigs.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No survey configurations found.</p>
                    ) : (
                        <div className="space-y-4">
                            {surveyConfigs.map((config) => (
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
                                                onClick={() => onEditSurveyConfig(config)}
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
                                                onClick={() => deleteModal.open({ type: 'config', id: config.id, name: config.title })}
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
                    {surveyInstances.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No survey instances found.</p>
                    ) : (
                        <div className="space-y-4">
                            {surveyInstances.map((instance) => (
                                <div key={instance.id} className="border rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-semibold">{instance.title}</h4>
                                            <p className="text-sm text-gray-600">{instance.description}</p>
                                            <div className="flex items-center gap-4 mt-2">
                                                <span className={`px-2 py-1 text-xs rounded-full ${isSurveyInstanceActive(instance)
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-gray-100 text-gray-800"
                                                    }`}>
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
                                                        className={`text-gray-500 hover:text-gray-700 ${!isSurveyInstanceActive(instance) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                        title={isSurveyInstanceActive(instance) ? "Copy URL" : "Survey is inactive - URL disabled"}
                                                        disabled={!isSurveyInstanceActive(instance)}
                                                    >
                                                        <Copy className="w-3 h-3" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => openSurveyInNewTab(generateSurveyUrl(instance))}
                                                        className={`text-gray-500 hover:text-gray-700 ${!isSurveyInstanceActive(instance) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                        title={isSurveyInstanceActive(instance) ? "Open survey in new tab" : "Survey is inactive - URL disabled"}
                                                        disabled={!isSurveyInstanceActive(instance)}
                                                    >
                                                        <ExternalLink className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => onToggleInstanceActive(instance.id, !instance.isActive, instance.title)}
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
                                                onClick={() => deleteModal.open({ type: 'instance', id: instance.id, name: instance.title })}
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

            {/* Delete Confirmation Modal */}
            {deleteModal.isOpen && deleteModal.data && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold mb-4">Confirm Deletion</h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete "{deleteModal.data.name}"?
                            This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <Button
                                onClick={() => {
                                    if (deleteModal.data?.type === 'config') {
                                        onDeleteSurveyConfig(deleteModal.data.id, deleteModal.data.name);
                                    } else if (deleteModal.data?.type === 'instance') {
                                        onDeleteSurveyInstance(deleteModal.data.id, deleteModal.data.name);
                                    }
                                    deleteModal.close();
                                }}
                                variant="secondary"
                                className="flex-1 bg-red-600 hover:bg-red-700 focus:ring-red-500"
                            >
                                Delete
                            </Button>
                            <Button
                                onClick={() => deleteModal.close()}
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
            {settingsModal.isOpen && settingsModal.data && (
                <InstanceSettingsModal
                    instance={settingsModal.data}
                    onClose={closeInstanceSettings}
                    onSave={async (updates) => {
                        try {
                            // Apply active status change if it changed
                            if (updates.isActive !== settingsModal.data?.isActive) {
                                await onToggleInstanceActive(settingsModal.data?.id || '', updates.isActive, settingsModal.data?.title);
                            }
                            
                            // Apply date range change if it changed
                            const currentDateRange = settingsModal.data?.activeDateRange;
                            const newDateRange = updates.activeDateRange;
                            console.log("Date range comparison:", { currentDateRange, newDateRange });
                            
                            // Normalize both values for comparison (handle undefined vs null)
                            const normalizedCurrent = currentDateRange || null;
                            const normalizedNew = newDateRange || null;
                            
                            if (JSON.stringify(normalizedCurrent) !== JSON.stringify(normalizedNew)) {
                                console.log("Date range changed, updating...");
                                await onUpdateInstanceDateRange(settingsModal.data?.id || '', newDateRange, settingsModal.data?.title);
                            } else {
                                console.log("Date range unchanged, skipping update");
                            }
                            
                            closeInstanceSettings();
                        } catch (error) {
                            // Error handling is done in the individual functions
                        }
                    }}
                />
            )}
        </div>
    );
};

// Separate component for Instance Settings Modal with local state
interface InstanceSettingsModalProps {
    instance: SurveyInstance;
    onClose: () => void;
    onSave: (updates: { isActive: boolean; activeDateRange: { startDate: string; endDate: string } | null }) => Promise<void>;
}

const InstanceSettingsModal: React.FC<InstanceSettingsModalProps> = ({ instance, onClose, onSave }) => {
    const [isActive, setIsActive] = useState(instance.isActive);
    // Initialize dates properly - use empty string only if there's no existing date range
    const [startDate, setStartDate] = useState(instance.activeDateRange?.startDate?.slice(0, 16) || '');
    const [endDate, setEndDate] = useState(instance.activeDateRange?.endDate?.slice(0, 16) || '');
    const [isSaving, setIsSaving] = useState(false);

    // Store the original state for comparison
    const originalHasDateRange = Boolean(instance.activeDateRange?.startDate && instance.activeDateRange?.endDate);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const activeDateRange = startDate && endDate 
                ? { startDate: new Date(startDate).toISOString(), endDate: new Date(endDate).toISOString() }
                : null;
            
            await onSave({ isActive, activeDateRange });
        } finally {
            setIsSaving(false);
        }
    };

    const clearDateRange = () => {
        setStartDate('');
        setEndDate('');
    };

    const hasChanges = () => {
        const currentDateRange = instance.activeDateRange;
        let newDateRange = null;
        if (startDate && endDate) {
            newDateRange = { 
                startDate: new Date(startDate).toISOString(), 
                endDate: new Date(endDate).toISOString() 
            };
        }
        
        // Normalize both values for comparison
        const normalizedCurrent = currentDateRange || null;
        const normalizedNew = newDateRange || null;
        
        const activeChanged = isActive !== instance.isActive;
        const dateRangeChanged = JSON.stringify(normalizedCurrent) !== JSON.stringify(normalizedNew);
        
        console.log("hasChanges check:", { 
            activeChanged, 
            dateRangeChanged, 
            currentDateRange: normalizedCurrent, 
            newDateRange: normalizedNew,
            startDate,
            endDate
        });
        
        return activeChanged || dateRangeChanged;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Survey Instance Settings</h3>
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        ×
                    </Button>
                </div>

                <div className="space-y-4">
                    <div>
                        <h4 className="font-medium mb-2">{instance.title}</h4>
                        <p className="text-sm text-gray-600">{instance.description}</p>
                    </div>

                    <div className="border-t pt-4">
                        <h5 className="font-medium mb-3">Active Status</h5>
                        <div className="flex items-center gap-3">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={isActive}
                                    onChange={(e) => setIsActive(e.target.checked)}
                                    className="mr-2"
                                />
                                Active
                            </label>
                            <span className={`px-2 py-1 text-xs rounded-full ${isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                                }`}>
                                {isActive ? 'Will be Active' : 'Will be Inactive'}
                            </span>
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <h5 className="font-medium mb-3">Active Date Range (Optional)</h5>
                        <p className="text-sm text-gray-600 mb-3">
                            Leave empty to keep survey active indefinitely. Both dates must be set to enable date restrictions.
                        </p>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Start Date
                                </label>
                                <input
                                    type="datetime-local"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    End Date
                                </label>
                                <input
                                    type="datetime-local"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        {/* Show status of date range */}
                        <div className="mt-2">
                            {startDate && endDate ? (
                                <div className="text-sm text-green-600">
                                    ✓ Date range will be active from {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}
                                </div>
                            ) : startDate || endDate ? (
                                <div className="text-sm text-orange-600">
                                    ⚠ Both start and end dates must be set for date range to be active
                                </div>
                            ) : (
                                <div className="text-sm text-gray-600">
                                    Survey will be active indefinitely (no date restrictions)
                                </div>
                            )}
                        </div>

                        {(startDate || endDate) && (
                            <div className="mt-3">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={clearDateRange}
                                >
                                    Clear Date Range
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <Button 
                        variant="outline" 
                        onClick={onClose}
                        disabled={isSaving}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleSave}
                        disabled={!hasChanges() || isSaving}
                    >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </div>
        </div>
    );
};
