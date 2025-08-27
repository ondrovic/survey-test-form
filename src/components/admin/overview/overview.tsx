import { useSurveyData } from '@/contexts/survey-data-context/index';
import React from 'react';
import {
    MultiSelectOptionSetsOverviewCard,
    OverviewCard,
    RadioOptionSetsOverviewCard,
    RatingScalesOverviewCard,
    SelectOptionSetsOverviewCard
} from './index';
import { SimpleErrorLogsOverview } from '@/components/admin/error-logs/simple-error-logs-overview';

interface AdminOverviewProps {
    onCreateNewSurvey: () => void;
    onNavigateToTab: (tab: 'overview' | 'framework' | 'option-sets' | 'error-logs') => void;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({
    onCreateNewSurvey,
    onNavigateToTab
}) => {
    const {
        state: {
            surveyConfigs,
            surveyInstances,
            ratingScales,
            radioOptionSets,
            multiSelectOptionSets,
            selectOptionSets
        }
    } = useSurveyData();

    const activeInstances = surveyInstances.filter(i => i.isActive).length;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <OverviewCard
                title="Survey Framework"
                description="Manage survey configurations and instances"
                statistics={[
                    { label: "Configurations", value: surveyConfigs.length },
                    { label: "Active Instances", value: activeInstances }
                ]}
                actionLabel="Manage Framework"
                onAction={() => onNavigateToTab('framework')}
            />

            <RatingScalesOverviewCard
                ratingScales={ratingScales}
                onNavigateToOptionSets={() => onNavigateToTab('option-sets')}
            />

            <RadioOptionSetsOverviewCard
                radioOptionSets={radioOptionSets}
                onNavigateToOptionSets={() => onNavigateToTab('option-sets')}
            />

            <MultiSelectOptionSetsOverviewCard
                multiSelectOptionSets={multiSelectOptionSets}
                onNavigateToOptionSets={() => onNavigateToTab('option-sets')}
            />

            <SelectOptionSetsOverviewCard
                selectOptionSets={selectOptionSets}
                onNavigateToOptionSets={() => onNavigateToTab('option-sets')}
            />

            <SimpleErrorLogsOverview
                onNavigateToErrorLogs={() => onNavigateToTab('error-logs')}
            />

            <OverviewCard
                title="Quick Actions"
                description="Common administrative tasks"
                statistics={[
                    { label: "Available Actions", value: "Create survey" }
                ]}
                actionLabel="Create New Survey"
                onAction={onCreateNewSurvey}
            />
        </div>
    );
};
