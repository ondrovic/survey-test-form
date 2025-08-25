import React from 'react';
import { RATING_OPTION_BUTTON_NAME } from '@/constants/options-sets.constants';

interface RatingScalePreviewProps {
    data: {
        name?: string;
        options: Array<{
            label?: string;
            color?: string;
            isDefault?: boolean;
        }>;
    };
}

export const RatingScalePreview: React.FC<RatingScalePreviewProps> = ({ data }) => {
    const defaultOption = data.options.find(opt => opt.isDefault);

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white">
                <span className="text-sm text-gray-700">{RATING_OPTION_BUTTON_NAME} Scale - {data.name || 'Option Set'} *</span>
                <div className="flex items-center space-x-2">
                    <span
                        className="text-sm font-medium"
                        style={{
                            color: defaultOption?.color === 'transparent' || !defaultOption?.color ? '#374151' : defaultOption?.color
                        }}
                    >
                        {defaultOption?.label || 'Select option'}
                    </span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>
        </div>
    );
};
