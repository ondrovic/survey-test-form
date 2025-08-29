import React from 'react';
import { SELECT_OPTION_BUTTON_NAME } from '@/constants/options-sets.constants';

interface SelectPreviewProps {
    data: {
        name?: string;
        options: Array<{
            label?: string;
            color?: string;
            isDefault?: boolean;
        }>;
    };
    allowMultiple?: boolean;
}

export const SelectPreview: React.FC<SelectPreviewProps> = ({ data, allowMultiple = false }) => {
    if (data.options.length === 0) {
        return (
            <div className="space-y-3">
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">{SELECT_OPTION_BUTTON_NAME} Preview</h5>
                <div className="text-sm text-gray-500 dark:text-gray-400 italic">No options configured yet</div>
            </div>
        );
    }

    const defaultOptions = data.options.filter(opt => opt.isDefault);
    const displayText = defaultOptions.length > 0
        ? defaultOptions.map(opt => opt.label || 'Option').join(', ')
        : 'Select option';

    return (
        <div className="space-y-3">
            <div className="space-y-2">
                {/* <div className="text-sm font-medium text-gray-700">{data.name || 'Select'}</div> */}
                <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{displayText}</span>
                    <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>
            {allowMultiple && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                    Multiple selections allowed
                </div>
            )}
        </div>
    );
};
