import { formatDate } from '@/utils/date.utils';
import { clsx } from 'clsx';
import { AlertCircle, ChevronDown, Loader2, RefreshCw, UserX, Wifi, WifiOff } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
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
    className,
    lastCheckedAt
}) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Display an absolute timestamp that changes only when checks occur

    // Theme configurations for different states
    const themes = {
        blue: {
            color: 'text-blue-700 dark:text-blue-300',
            bgColor: 'bg-blue-50 dark:bg-blue-900/20',
            borderColor: 'border-blue-300 dark:border-blue-600',
            hoverBg: 'hover:bg-blue-100 dark:hover:bg-blue-900/30',
            focusRing: 'focus:ring-blue-500 dark:focus:ring-blue-400'
        },
        orange: {
            color: 'text-orange-700 dark:text-orange-300',
            bgColor: 'bg-orange-50 dark:bg-orange-900/20',
            borderColor: 'border-orange-300 dark:border-orange-600',
            hoverBg: 'hover:bg-orange-100 dark:hover:bg-orange-900/30',
            focusRing: 'focus:ring-orange-500 dark:focus:ring-orange-400'
        },
        green: {
            color: 'text-green-700 dark:text-green-300',
            bgColor: 'bg-green-50 dark:bg-green-900/20',
            borderColor: 'border-green-300 dark:border-green-600',
            hoverBg: 'hover:bg-green-100 dark:hover:bg-green-900/30',
            focusRing: 'focus:ring-green-500 dark:focus:ring-green-400'
        },
        red: {
            color: 'text-red-700 dark:text-red-300',
            bgColor: 'bg-red-50 dark:bg-red-900/20',
            borderColor: 'border-red-300 dark:border-red-600',
            hoverBg: 'hover:bg-red-100 dark:hover:bg-red-900/30',
            focusRing: 'focus:ring-red-500 dark:focus:ring-red-400'
        },
        gray: {
            color: 'text-gray-700 dark:text-gray-300',
            bgColor: 'bg-gray-50 dark:bg-gray-700',
            borderColor: 'border-gray-300 dark:border-gray-600',
            hoverBg: 'hover:bg-gray-100 dark:hover:bg-gray-600',
            focusRing: 'focus:ring-gray-500 dark:focus:ring-gray-400'
        }
    };

    const getStatusInfo = () => {
        const baseText = 'Database';

        // Determine current state
        let statusKey: keyof typeof statusConfigs;
        if (loading) statusKey = 'loading';
        else if (!isAuthenticated) statusKey = 'unauthenticated';
        else if (connected) statusKey = 'connected';
        else if (error) statusKey = 'error';
        else statusKey = 'disconnected';

        // Status configurations
        const statusConfigs = {
            loading: {
                icon: Loader2,
                status: 'Checking...',
                theme: themes.blue,
                animate: true
            },
            unauthenticated: {
                icon: UserX,
                status: 'Auth Required',
                theme: themes.orange,
                animate: false
            },
            connected: {
                icon: Wifi,
                status: 'Connected',
                theme: themes.green,
                animate: false
            },
            error: {
                icon: AlertCircle,
                status: 'Failed',
                theme: themes.red,
                animate: false
            },
            disconnected: {
                icon: WifiOff,
                status: 'Disconnected',
                theme: themes.gray,
                animate: false
            }
        };

        const config = statusConfigs[statusKey];

        return {
            icon: config.icon,
            text: baseText,
            status: config.status,
            animate: config.animate,
            ...config.theme
        };
    };

    const statusInfo = getStatusInfo();
    const Icon = statusInfo.icon;

    const handleDropdownToggle = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const handleRetry = () => {
        setIsDropdownOpen(false);
        onRetry?.();
    };

    return (
        <div className={clsx('relative inline-flex', className)} ref={dropdownRef}>
            {/* Split Button Container */}
            <div className="inline-flex rounded-md shadow-sm">
                {/* Main Button */}
                <button
                    type="button"
                    // onClick={handleMainClick}
                    className={clsx(
                        'relative inline-flex items-center px-3 py-2 text-sm font-medium border',
                        'rounded-l-md focus:z-10 focus:outline-none focus:ring-2 focus:ring-offset-2',
                        statusInfo.color,
                        statusInfo.bgColor,
                        statusInfo.borderColor,
                        statusInfo.hoverBg,
                        statusInfo.focusRing,
                        'transition-all duration-200'
                    )}
                >
                    <Icon
                        className={clsx(
                            "h-4 w-4 mr-2",
                            statusInfo.animate && "animate-spin"
                        )}
                        aria-hidden="true"
                    />
                    <span className="hidden sm:inline">{statusInfo.text}</span>
                    <span className="sm:hidden">{statusInfo.status}</span>
                    <span className="hidden sm:inline ml-1"> {statusInfo.status}</span>
                </button>

                {/* Dropdown Button */}
                <button
                    type="button"
                    onClick={handleDropdownToggle}
                    className={clsx(
                        'relative inline-flex items-center px-2 py-2 text-sm font-medium border-t border-r border-b',
                        'rounded-r-md -ml-px focus:z-10 focus:outline-none focus:ring-2 focus:ring-offset-2',
                        statusInfo.color,
                        statusInfo.bgColor,
                        statusInfo.borderColor,
                        statusInfo.hoverBg,
                        statusInfo.focusRing,
                        'transition-all duration-200'
                    )}
                    disabled={loading}
                    aria-haspopup="true"
                    aria-expanded={isDropdownOpen}
                >
                    <ChevronDown className={clsx(
                        "h-4 w-4 transition-transform duration-200",
                        isDropdownOpen && "rotate-180"
                    )} />
                </button>
            </div>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
                <div className="absolute bottom-full mb-2 left-0 w-64 bg-white dark:bg-gray-800 rounded-md shadow-lg dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-600 z-50">
                    {/* Status Header */}
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-600">
                        <div className="flex items-center">
                            <Icon
                                className={clsx(
                                    "h-5 w-5 mr-3",
                                    statusInfo.animate && "animate-spin",
                                    statusInfo.color
                                )}
                            />
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{statusInfo.text}</p>
                                <p className={clsx("text-xs", statusInfo.color)}>{statusInfo.status}</p>
                            </div>
                        </div>
                    </div>

                    {/* Menu Items */}
                    {onRetry && (
                        <div className="py-1">
                            <button
                                type="button"
                                onClick={handleRetry}
                                disabled={loading}
                                className={clsx(
                                    'w-full flex items-center px-4 py-2 text-sm transition-colors duration-200',
                                    'hover:bg-gray-50 dark:hover:bg-gray-700 focus:bg-gray-50 dark:focus:bg-gray-700 focus:outline-none',
                                    loading ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed' : 'text-gray-700 dark:text-gray-200'
                                )}
                            >
                                <RefreshCw className={clsx(
                                    "h-4 w-4 mr-3",
                                    loading && "animate-spin"
                                )} />
                                {loading ? 'Retrying Connection...' : 'Retry Connection'}
                            </button>
                        </div>
                    )}

                    {/* Error Details */}
                    {error && (
                        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-600 bg-red-50 dark:bg-red-900/20">
                            <p className="text-xs font-medium text-red-800 dark:text-red-200 mb-1">Error Details:</p>
                            <p className="text-xs text-red-600 dark:text-red-400 break-words">{error}</p>
                        </div>
                    )}

                    {/* Connection Info */}
                    <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                            {connected ? (
                                lastCheckedAt ? `Checked: ${formatDate(lastCheckedAt)}` : 'Last checked: —'
                            ) : 'Status: Not connected'}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}; 