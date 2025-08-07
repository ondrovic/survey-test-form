import { Button } from '@/components/common';
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
        <div className={`bg-white p-6 rounded-lg shadow ${className}`}>
            <h3 className="text-lg font-semibold mb-4">{title}</h3>
            <div className="space-y-2 mb-6">
                <p className="text-sm text-gray-600">{description}</p>
                <div className="text-sm">
                    {statistics.map((stat, index) => (
                        <p key={index}>
                            <strong>{stat.label}:</strong> {stat.value}
                        </p>
                    ))}
                </div>
            </div>
            <Button onClick={onAction} className="w-full">
                {actionLabel}
            </Button>
        </div>
    );
};
