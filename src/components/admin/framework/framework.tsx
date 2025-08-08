import { Button } from '@/components/common';
import { firestoreHelpers } from '@/config/firebase';
import { useSurveyData } from '@/contexts/survey-data-context/index';
import { useToast } from '@/contexts/toast-context/index';
import { useModal } from '@/hooks';
import { SurveyConfig, SurveyInstance, SurveyResponse } from '@/types';
import { isSurveyInstanceActive } from '@/utils';
import { downloadFrameworkResponsesAsExcel } from '@/utils/excel.utils';
import { Copy, Download, Edit, ExternalLink, Plus, Settings, Trash2 } from 'lucide-react';
import React from 'react';

interface AdminFrameworkProps {
    onCreateNewSurvey: () => void;
    onEditSurveyConfig: (config: SurveyConfig) => void;
    onDeleteSurveyConfig: (configId: string) => void;
    onDeleteSurveyInstance: (instanceId: string) => void;
    onToggleInstanceActive: (instanceId: string, isActive: boolean) => void;
    onUpdateInstanceDateRange: (instanceId: string, dateRange: { startDate: string; endDate: string } | null) => void;
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
            showSuccess(`Survey instance "${config.title}" created successfully!`);

            // Refresh the data to show the new instance immediately
            await refreshAll();
        } catch (error) {
            showError('Failed to create survey instance');
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
                                                        className="text-gray-500 hover:text-gray-700"
                                                        title="Copy URL"
                                                    >
                                                        <Copy className="w-3 h-3" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => openSurveyInNewTab(generateSurveyUrl(instance))}
                                                        className="text-gray-500 hover:text-gray-700"
                                                        title="Open survey in new tab"
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
                                                onClick={() => onToggleInstanceActive(instance.id, !instance.isActive)}
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
                                        onDeleteSurveyConfig(deleteModal.data.id);
                                    } else if (deleteModal.data?.type === 'instance') {
                                        onDeleteSurveyInstance(deleteModal.data.id);
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
                                <h4 className="font-medium mb-2">{settingsModal.data.title}</h4>
                                <p className="text-sm text-gray-600">{settingsModal.data.description}</p>
                            </div>

                            <div className="border-t pt-4">
                                <h5 className="font-medium mb-3">Active Status</h5>
                                <div className="flex items-center gap-3">
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={settingsModal.data.isActive}
                                            onChange={(e) => onToggleInstanceActive(
                                                settingsModal.data?.id || '',
                                                e.target.checked
                                            )}
                                            className="mr-2"
                                        />
                                        Active
                                    </label>
                                    <span className={`px-2 py-1 text-xs rounded-full ${isSurveyInstanceActive(settingsModal.data)
                                        ? "bg-green-100 text-green-800"
                                        : "bg-gray-100 text-gray-800"
                                        }`}>
                                        {isSurveyInstanceActive(settingsModal.data) ? 'Currently Active' : 'Currently Inactive'}
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
                                            value={settingsModal.data.activeDateRange?.startDate?.slice(0, 16) || ''}
                                            onChange={(e) => {
                                                const startDate = e.target.value ? new Date(e.target.value).toISOString() : '';
                                                const endDate = settingsModal.data?.activeDateRange?.endDate || '';
                                                const dateRange = startDate && endDate ? { startDate, endDate } : null;
                                                onUpdateInstanceDateRange(settingsModal.data?.id || '', dateRange);
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
                                            value={settingsModal.data.activeDateRange?.endDate?.slice(0, 16) || ''}
                                            onChange={(e) => {
                                                const startDate = settingsModal.data?.activeDateRange?.startDate || '';
                                                const endDate = e.target.value ? new Date(e.target.value).toISOString() : '';
                                                const dateRange = startDate && endDate ? { startDate, endDate } : null;
                                                onUpdateInstanceDateRange(settingsModal.data?.id || '', dateRange);
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="mt-3">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => onUpdateInstanceDateRange(settingsModal.data?.id || '', null)}
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
        </div>
    );
};
