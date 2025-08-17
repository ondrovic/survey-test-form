import { ChevronDown, ChevronRight } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface CollapsibleSectionProps {
    title: string;
    children: React.ReactNode;
    defaultExpanded?: boolean;
    className?: string;
    headerAction?: React.ReactNode;
    count?: number;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
    title,
    children,
    defaultExpanded = true,
    className = '',
    headerAction,
    count
}) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    // Update isExpanded when defaultExpanded prop changes
    useEffect(() => {
        setIsExpanded(defaultExpanded);
    }, [defaultExpanded]);

    return (
        <div className={`bg-white rounded-lg shadow ${className}`}>
            <div className="px-6 py-4 border-b flex items-center justify-between">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-2 hover:bg-gray-50 transition-colors rounded px-2 py-1"
                >
                    <h3 className="text-lg font-semibold">{title}</h3>
                    {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                    ) : (
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                    )}
                </button>
                <div className="flex items-center gap-2">
                    {count !== undefined && (
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                            {count} {count === 1 ? 'item' : 'items'}
                        </span>
                    )}
                    {headerAction && (
                        <div 
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.stopPropagation();
                                }
                            }}
                            role="button"
                            tabIndex={0}
                        >
                            {headerAction}
                        </div>
                    )}
                </div>
            </div>
            {isExpanded && (
                <div className="p-6">
                    {children}
                </div>
            )}
        </div>
    );
};
