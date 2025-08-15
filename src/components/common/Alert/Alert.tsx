import { clsx } from 'clsx';
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import React from 'react';
import { AlertProps } from './Alert.types';

/**
 * Alert component for displaying success, error, warning, and info messages
 * 
 * @example
 * ```tsx
 * <Alert
 *   type="success"
 *   title="Success!"
 *   message="Your data has been saved successfully."
 *   onDismiss={() => setShowAlert(false)}
 * />
 * ```
 */
export const Alert: React.FC<AlertProps> = ({
    type,
    title,
    message,
    onDismiss,
    action,
    'data-testid': testId,
    className
}) => {
    const iconMap = {
        success: CheckCircle,
        error: AlertCircle,
        warning: AlertTriangle,
        info: Info
    };

    const variantClasses = {
        success: 'bg-green-50 border-green-200 text-green-800',
        error: 'bg-red-50 border-red-200 text-red-800',
        warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
        info: 'bg-blue-50 border-blue-200 text-blue-800'
    };

    const iconClasses = {
        success: 'text-green-400',
        error: 'text-red-400',
        warning: 'text-yellow-400',
        info: 'text-blue-400'
    };

    const Icon = iconMap[type];

    const classes = clsx(
        'border rounded-lg p-4 relative',
        variantClasses[type],
        className
    );

    return (
        <div
            className={classes}
            role="alert"
            aria-live="polite"
            data-testid={testId}
        >
            <div className="flex">
                <div className="flex-shrink-0">
                    <Icon className={`h-5 w-5 ${iconClasses[type]}`} aria-hidden="true" />
                </div>

                <div className="ml-3 flex-1">
                    {title && (
                        <h3 className="text-sm font-medium">
                            {title}
                        </h3>
                    )}

                    <div className={`text-sm ${title ? 'mt-1' : ''}`}>
                        {message}
                    </div>

                    {action && (
                        <div className="mt-3">
                            <button
                                type="button"
                                onClick={action}
                                className="text-sm font-medium underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-50 focus:ring-green-600"
                            >
                                Try again
                            </button>
                        </div>
                    )}
                </div>

                {onDismiss && (
                    <div className="ml-auto pl-3">
                        <button
                            type="button"
                            onClick={onDismiss}
                            className="inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-50 focus:ring-green-600"
                            aria-label="Dismiss alert"
                        >
                            <X className="h-4 w-4" aria-hidden="true" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}; 