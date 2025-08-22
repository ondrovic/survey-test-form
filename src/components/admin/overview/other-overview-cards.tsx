import { Button } from '@/components/common';
import { Download, Plus } from 'lucide-react';
import React from 'react';

interface FrameworkOverviewCardProps {
    surveyConfigs: any[];
    activeInstances: number;
    onNavigateToFramework: () => void;
}

export const FrameworkOverviewCard: React.FC<FrameworkOverviewCardProps> = ({
    surveyConfigs,
    activeInstances,
    onNavigateToFramework
}) => (
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
        <Button onClick={onNavigateToFramework} className="w-full">
            Manage Framework
        </Button>
    </div>
);

interface LegacyOverviewCardProps {
    surveys: any[];
    totalResponses: number;
    onNavigateToLegacy: () => void;
}

export const LegacyOverviewCard: React.FC<LegacyOverviewCardProps> = ({
    surveys,
    totalResponses,
    onNavigateToLegacy
}) => (
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
        <Button onClick={onNavigateToLegacy} className="w-full">
            Manage Legacy
        </Button>
    </div>
);

interface QuickActionsOverviewCardProps {
    onCreateNewSurvey: () => void;
    onDownloadAllData: () => void;
}

export const QuickActionsOverviewCard: React.FC<QuickActionsOverviewCardProps> = ({
    onCreateNewSurvey,
    onDownloadAllData
}) => (
    <div className="bg-white p-6 rounded-lg shadow md:col-span-2 lg:col-span-3">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="space-y-2 mb-6">
            <p className="text-sm text-gray-600">
                Common administrative tasks
            </p>
            <div className="text-sm">
                <p><strong>Actions:</strong> Create survey, Download data</p>
            </div>
        </div>
        <div className="flex gap-2">
            <Button onClick={onCreateNewSurvey} className="flex-1">
                <Plus className="w-4 h-4 mr-2" />
                Create New Survey
            </Button>
            <Button onClick={onDownloadAllData} variant="outline" className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Download All Data
            </Button>
        </div>

    </div>
);
