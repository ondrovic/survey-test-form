import { RATING_OPTIONS } from '@/constants';
import { RatingValue } from '@/types';
import { clsx } from 'clsx';
import { ChevronDown, ChevronUp } from 'lucide-react';
import React, { useCallback, useMemo } from 'react';
import { getColorClasses } from '../../../utils/color.utils';
import { RatingSectionProps } from './rating-section.types';

/**
 * RatingSection component with expandable functionality and smooth animations
 * 
 * @example
 * ```tsx
 * <RatingSection
 *   label="Customer Service"
 *   value={rating}
 *   onChange={setRating}
 *   expanded={isExpanded}
 *   onToggle={setIsExpanded}
 * />
 * ```
 */
export const RatingSection: React.FC<RatingSectionProps> = ({
    label,
    value,
    onChange,
    expanded = false,
    onToggle,
    className
}) => {
    const handleRatingChange = useCallback((rating: RatingValue) => {
        onChange(rating);
    }, [onChange]);

    const handleToggle = useCallback(() => {
        onToggle(!expanded);
    }, [expanded, onToggle]);

    const ratingButtons = useMemo(() =>
        RATING_OPTIONS.map(option => ({
            ...option,
            active: value === option.value
        })), [value]
    );

    const getRatingColor = (rating: RatingValue | null) => {
        if (!rating) return 'bg-gray-100 text-gray-500';

        switch (rating) {
            case 'High':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'Medium':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'Low':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'Not Important':
                return 'bg-gray-100 text-gray-500 border-gray-200';
            default:
                return 'bg-gray-100 text-gray-500';
        }
    };

    const getButtonClasses = (option: any, isActive: boolean) => {
        const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';

        if (isActive) {
            // Use shared color utility but adjust for active button state (darker background)
            const colorClasses = getColorClasses(option.color);
            const colorName = option.color || 'transparent';
            const colorMap: Record<string, string> = {
                'success': 'bg-green-600 text-white focus:ring-green-500 shadow-lg',
                'warning': 'bg-yellow-600 text-white focus:ring-yellow-500 shadow-lg',
                'error': 'bg-red-600 text-white focus:ring-red-500 shadow-lg',
                'blue': 'bg-blue-600 text-white focus:ring-blue-500 shadow-lg',
                'transparent': 'bg-gray-600 text-white focus:ring-gray-500 shadow-lg'
            };
            return clsx(baseClasses, colorMap[colorName] || colorMap.transparent);
        } else {
            return clsx(
                baseClasses,
                'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-blue-500'
            );
        }
    };

    const classes = clsx(
        'border border-gray-200 rounded-lg overflow-hidden transition-all duration-300',
        className
    );

    return (
        <div className={classes}>
            {/* Header */}
            <button
                type="button"
                onClick={handleToggle}
                className="w-full px-4 py-3 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                aria-expanded={expanded}
                aria-controls={`rating-${label.toLowerCase().replace(/\s+/g, '-')}`}
            >
                <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-900">{label}</span>
                    {value && (
                        <span className={clsx(
                            'px-2 py-1 text-xs font-medium rounded-full border',
                            getRatingColor(value)
                        )}>
                            {value}
                        </span>
                    )}
                </div>

                {expanded ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" aria-hidden="true" />
                ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                )}
            </button>

            {/* Expandable Content */}
            <div
                id={`rating-${label.toLowerCase().replace(/\s+/g, '-')}`}
                className={clsx(
                    'overflow-hidden transition-all duration-300 ease-in-out',
                    expanded ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'
                )}
            >
                <div className="px-4 pb-3 bg-gray-50">
                    <div className="flex flex-wrap gap-2 pt-3">
                        {ratingButtons.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => handleRatingChange(option.value)}
                                className={getButtonClasses(option, option.active)}
                                aria-pressed={option.active}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}; 