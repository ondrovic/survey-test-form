import React from 'react';
import { OverviewCard } from './overview-card';
import {
    RATING_OPTION_SET_NAME,
    RADIO_OPTION_SET_NAME,
    MULTISELECT_OPTION_SET_NAME,
    SELECT_OPTION_SET_NAME,
    RATING_OVERVIEW_DESCRIPTION,
    RADIO_OVERVIEW_DESCRIPTION,
    MULTISELECT_OVERVIEW_DESCRIPTION,
    SELECT_OVERVIEW_DESCRIPTION,
    RATING_ACTION_LABEL,
    RADIO_ACTION_LABEL,
    MULTISELECT_ACTION_LABEL,
    SELECT_ACTION_LABEL,
    SCALES_STATISTIC_LABEL,
    SETS_STATISTIC_LABEL,
    SCALES_COUNT,
    SETS_COUNT,
} from '@/constants/options-sets.constants';

export const RatingScalesOverviewCard: React.FC<{
    ratingScales: any[];
    onNavigateToOptionSets: () => void;
}> = ({ ratingScales, onNavigateToOptionSets }) => (
    <OverviewCard
        title={RATING_OPTION_SET_NAME}
        description={RATING_OVERVIEW_DESCRIPTION}
        statistics={[{ label: SCALES_STATISTIC_LABEL, value: SCALES_COUNT(ratingScales.length) }]}
        actionLabel={RATING_ACTION_LABEL}
        onAction={onNavigateToOptionSets}
    />
);

export const RadioOptionSetsOverviewCard: React.FC<{
    radioOptionSets: any[];
    onNavigateToOptionSets: () => void;
}> = ({ radioOptionSets, onNavigateToOptionSets }) => (
    <OverviewCard
        title={RADIO_OPTION_SET_NAME}
        description={RADIO_OVERVIEW_DESCRIPTION}
        statistics={[{ label: SETS_STATISTIC_LABEL, value: SETS_COUNT(radioOptionSets.length) }]}
        actionLabel={RADIO_ACTION_LABEL}
        onAction={onNavigateToOptionSets}
    />
);

export const MultiSelectOptionSetsOverviewCard: React.FC<{
    multiSelectOptionSets: any[];
    onNavigateToOptionSets: () => void;
}> = ({ multiSelectOptionSets, onNavigateToOptionSets }) => (
    <OverviewCard
        title={MULTISELECT_OPTION_SET_NAME}
        description={MULTISELECT_OVERVIEW_DESCRIPTION}
        statistics={[{ label: SETS_STATISTIC_LABEL, value: SETS_COUNT(multiSelectOptionSets.length) }]}
        actionLabel={MULTISELECT_ACTION_LABEL}
        onAction={onNavigateToOptionSets}
    />
);

export const SelectOptionSetsOverviewCard: React.FC<{
    selectOptionSets: any[];
    onNavigateToOptionSets: () => void;
}> = ({ selectOptionSets, onNavigateToOptionSets }) => (
    <OverviewCard
        title={SELECT_OPTION_SET_NAME}
        description={SELECT_OVERVIEW_DESCRIPTION}
        statistics={[{ label: SETS_STATISTIC_LABEL, value: SETS_COUNT(selectOptionSets.length) }]}
        actionLabel={SELECT_ACTION_LABEL}
        onAction={onNavigateToOptionSets}
    />
);
