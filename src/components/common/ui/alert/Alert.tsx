import { clsx } from 'clsx';
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import { forwardRef } from 'react';
import { alert as alertTokens, transitions } from '@/styles/design-tokens';
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
export const Alert = forwardRef<HTMLDivElement, AlertProps>(({
    type,
    title,
    message,
    onDismiss,
    action,
    'data-testid': testId,
    className
}, ref) => {
    const iconMap = {
        success: CheckCircle,
        error: AlertCircle,
        warning: AlertTriangle,
        info: Info
    };

    const variantClasses = {
        success: alertTokens.variants.success,
        error: alertTokens.variants.error,
        warning: alertTokens.variants.warning,
        info: alertTokens.variants.info
    };

    const iconClasses = {
        success: alertTokens.icons.success,
        error: alertTokens.icons.error,
        warning: alertTokens.icons.warning,
        info: alertTokens.icons.info
    };

    const Icon = iconMap[type];

    const classes = clsx(
        alertTokens.base,
        variantClasses[type],
        transitions.default,
        className
    );

    return (
        <div
            ref={ref}
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
});

Alert.displayName = 'Alert'; 