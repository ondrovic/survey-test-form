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
            className={`block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:opacity-50 disabled:cursor-not-allowed ${getColorClasses(value || 'transparent')} ${className}`}
        >
            {COLOR_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    );
};
