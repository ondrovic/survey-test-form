import React from 'react';
import { OverviewCard } from './OverviewCard';

interface OptionSetOverviewCardsProps {
    ratingScales: any[];
    radioOptionSets: any[];
    multiSelectOptionSets: any[];
    selectOptionSets: any[];
    onNavigateToOptionSets: () => void;
}

export const RatingScalesOverviewCard: React.FC<{
    ratingScales: any[];
    onNavigateToOptionSets: () => void;
}> = ({ ratingScales, onNavigateToOptionSets }) => (
    <OverviewCard
        title="Rating Scales"
        description="Create and manage reusable rating scales with default values"
        statistics={[{ label: 'Available Scales', value: `${ratingScales.length} scales` }]}
        actionLabel="Manage Rating Scales"
        onAction={onNavigateToOptionSets}
    />
);

export const RadioOptionSetsOverviewCard: React.FC<{
    radioOptionSets: any[];
    onNavigateToOptionSets: () => void;
}> = ({ radioOptionSets, onNavigateToOptionSets }) => (
    <OverviewCard
        title="Radio Option Sets"
        description="Create and manage single-selection option groups"
        statistics={[{ label: 'Available Sets', value: `${radioOptionSets.length} sets` }]}
        actionLabel="Manage Radio Sets"
        onAction={onNavigateToOptionSets}
    />
);

export const MultiSelectOptionSetsOverviewCard: React.FC<{
    multiSelectOptionSets: any[];
    onNavigateToOptionSets: () => void;
}> = ({ multiSelectOptionSets, onNavigateToOptionSets }) => (
    <OverviewCard
        title="Multi-Select Option Sets"
        description="Create and manage multiple-selection option groups with constraints"
        statistics={[{ label: 'Available Sets', value: `${multiSelectOptionSets.length} sets` }]}
        actionLabel="Manage Multi-Select Sets"
        onAction={onNavigateToOptionSets}
    />
);

export const SelectOptionSetsOverviewCard: React.FC<{
    selectOptionSets: any[];
    onNavigateToOptionSets: () => void;
}> = ({ selectOptionSets, onNavigateToOptionSets }) => (
    <OverviewCard
        title="Select Option Sets"
        description="Create and manage dropdown-style option groups"
        statistics={[{ label: 'Available Sets', value: `${selectOptionSets.length} sets` }]}
        actionLabel="Manage Select Sets"
        onAction={onNavigateToOptionSets}
    />
);
