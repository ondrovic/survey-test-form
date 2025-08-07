import { Button } from '@/components/common';
import { useSurveyDataContext } from '@/contexts/SurveyDataContext';
import { Download, Plus } from 'lucide-react';
import React from 'react';

interface AdminOverviewProps {
    onCreateNewSurvey: () => void;
    onDownloadAllData: () => void;
    onNavigateToTab: (tab: 'framework' | 'legacy' | 'rating-scales') => void;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({
    onCreateNewSurvey,
    onDownloadAllData,
    onNavigateToTab
}) => {
    const { surveyConfigs, surveyInstances, surveys, ratingScales } = useSurveyDataContext();

    const totalResponses = surveys.reduce((sum, s) => sum + (s.responses?.length || 0), 0);
    const activeInstances = surveyInstances.filter(i => i.isActive).length;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Survey Framework</h3>
                <div className="space-y-2 mb-6">
                    <p className="text-sm text-gray-600">
                        Manage survey configurations and instances
                    </p>
                    <div className="text-sm">
                        <p><strong>Configurations:</strong> {surveyConfigs.length}</p>
                        <p><strong>Active Instances:</strong> {activeInstances}</p>
                    </div>
                </div>
                <Button
                    onClick={() => onNavigateToTab('framework')}
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
                        <p><strong>Total Surveys:</strong> {surveys.length}</p>
                        <p><strong>Total Responses:</strong> {totalResponses}</p>
                    </div>
                </div>
                <Button
                    onClick={() => onNavigateToTab('legacy')}
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
                        <p><strong>Available Scales:</strong> {ratingScales.length} scales</p>
                    </div>
                </div>
                <Button
                    onClick={() => onNavigateToTab('rating-scales')}
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
                        onClick={onCreateNewSurvey}
                        className="w-full"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Create New Survey
                    </Button>
                    <Button
                        onClick={onDownloadAllData}
                        variant="outline"
                        className="w-full"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Download All Data
                    </Button>
                </div>
            </div>
        </div>
    );
};
