import { clsx } from 'clsx';
import { AlertCircle, Loader2, UserX, Wifi, WifiOff } from 'lucide-react';
import React from 'react';
import { ConnectionStatusProps } from './connection-status.types';

/**
 * ConnectionStatus component to display Firebase connection status
 * 
 * @example
 * ```tsx
 * <ConnectionStatus
 *   connected={isConnected}
 *   loading={isLoading}
 *   error={error}
 *   onRetry={handleRetry}
 *   isAuthenticated={isAuthenticated}
 * />
 * ```
 */
export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
    connected,
    loading,
    error,
    onRetry,
    isAuthenticated = true,
    className
}) => {

    const getStatusInfo = () => {
        if (loading) {
            return {
                icon: Loader2,
                text: 'Checking Database connection...',
                color: 'text-blue-600',
                bgColor: 'bg-blue-50',
                borderColor: 'border-blue-200',
                animate: true
            };
        }

        if (!isAuthenticated) {
            return {
                icon: UserX,
                text: 'Authentication required',
                color: 'text-orange-600',
                bgColor: 'bg-orange-50',
                borderColor: 'border-orange-200',
                animate: false
            };
        }

        if (connected) {
            return {
                icon: Wifi,
                text: 'Connected to Database',
                color: 'text-green-600',
                bgColor: 'bg-green-50',
                borderColor: 'border-green-200',
                animate: false
            };
        }

        if (error) {
            return {
                icon: AlertCircle,
                text: 'Database connection failed',
                color: 'text-red-600',
                bgColor: 'bg-red-50',
                borderColor: 'border-red-200',
                animate: false
            };
        }

        return {
            icon: WifiOff,
            text: 'No Database connection',
            color: 'text-gray-600',
            bgColor: 'bg-gray-50',
            borderColor: 'border-gray-200',
            animate: false
        };
    };

    const statusInfo = getStatusInfo();
    const Icon = statusInfo.icon;

    const classes = clsx(
        'flex items-center space-x-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-200',
        statusInfo.bgColor,
        statusInfo.borderColor,
        statusInfo.color,
        className
    );

    return (
        <div className={classes}>
            <Icon
                className={clsx(
                    "h-4 w-4",
                    statusInfo.animate && "animate-spin"
                )}
                aria-hidden="true"
            />
            <span>{statusInfo.text}</span>

            {error && onRetry && (
                <button
                    type="button"
                    onClick={onRetry}
                    className="ml-2 text-xs underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                    disabled={loading}
                >
                    Retry
                </button>
            )}
        </div>
    );
}; 