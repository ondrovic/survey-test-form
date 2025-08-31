import React from 'react';
import { COLOR_OPTIONS, getColorClasses } from '../../../../utils/color.utils';

interface ColorSelectorProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    className?: string;
}

export const ColorSelector: React.FC<ColorSelectorProps> = ({
    value,
    onChange,
    disabled = false,
    className = ''
}) => {
    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={`block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:shadow-gray-900/50 transition-colors duration-200 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${getColorClasses(value || 'transparent')} ${className}`}
        >
            {COLOR_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    );
};
