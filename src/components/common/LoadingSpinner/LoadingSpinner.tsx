import { clsx } from 'clsx';
import React from 'react';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    text?: string;
    fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 'md',
    className,
    text = 'Loading...',
    fullScreen = false
}) => {
    const sizeClasses = {
        sm: 'h-6 w-6',
        md: 'h-8 w-8',
        lg: 'h-12 w-12'
    };

    const spinner = (
        <div className={clsx('flex flex-col items-center justify-center', className)}>
            <div className={clsx(
                'animate-spin rounded-full border-b-2 border-blue-600',
                sizeClasses[size]
            )} />
            {text && (
                <p className="text-gray-600 mt-2 text-sm">{text}</p>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="min-h-screen bg-amber-50/30 flex items-center justify-center">
                {spinner}
            </div>
        );
    }

    return spinner;
};
