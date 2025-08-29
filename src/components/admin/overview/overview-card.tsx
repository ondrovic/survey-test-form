import { Button } from '@/components/common';
import { Plus } from 'lucide-react';
import React from 'react';

interface OverviewCardProps {
    title: string;
    description: string;
    statistics: Array<{ label: string; value: string | number }>;
    actionLabel: string;
    onAction: () => void;
    className?: string;
}

export const OverviewCard: React.FC<OverviewCardProps> = ({
    title,
    description,
    statistics,
    actionLabel,
    onAction,
    className = ''
}) => {
    return (
        <div
            className={`bg-white dark:bg-gray-900 p-6 rounded-lg shadow flex flex-col h-full ${className}`}
        >
            <div className="flex-grow flex flex-col">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                    {title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 flex-shrink-0">
                    {description}
                </p>
                <div className="flex-grow"></div>
                <div className="text-sm mb-6">
                    {statistics.map((stat, index) => (
                        <div key={index} className="flex justify-between items-center mb-1">
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                                {stat.label}:
                            </span>
                            <span className="text-gray-900 z">{stat.value}</span>
                        </div>
                    ))}
                </div>
            </div>
            <Button onClick={onAction} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                {actionLabel}
            </Button>
        </div>
    );
};
