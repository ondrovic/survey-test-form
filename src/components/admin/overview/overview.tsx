import { useSurveyData } from '@/contexts/survey-data-context/index';
import React from 'react';
import {
    FrameworkOverviewCard,
    // LegacyOverviewCard,
    MultiSelectOptionSetsOverviewCard,
    QuickActionsOverviewCard,
    RadioOptionSetsOverviewCard,
    RatingScalesOverviewCard,
    SelectOptionSetsOverviewCard
} from './index';

interface AdminOverviewProps {
    onCreateNewSurvey: () => void;
    onDownloadAllData: () => void;
    onNavigateToTab: (tab: 'overview' | 'framework' | 'legacy' | 'option-sets') => void;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({
    onCreateNewSurvey,
    onDownloadAllData,
    onNavigateToTab
}) => {
    const {
        state: {
            surveyConfigs,
            surveyInstances,
            // surveys,
            ratingScales,
            radioOptionSets,
            multiSelectOptionSets,
            selectOptionSets
        }
    } = useSurveyData();

    // const totalResponses = surveys.reduce((sum, s) => sum + (s.responses?.length || 0), 0);
    const activeInstances = surveyInstances.filter(i => i.isActive).length;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FrameworkOverviewCard
                surveyConfigs={surveyConfigs}
                activeInstances={activeInstances}
                onNavigateToFramework={() => onNavigateToTab('framework')}
            />

            {/* <LegacyOverviewCard
                surveys={surveys}
                totalResponses={totalResponses}
                onNavigateToLegacy={() => onNavigateToTab('legacy')}
            /> */}

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

            <QuickActionsOverviewCard
                onCreateNewSurvey={onCreateNewSurvey}
                onDownloadAllData={onDownloadAllData}
            />
        </div>
    );
};
