import { Button } from '@/components/common';
import { ConnectionStatus } from '@/components/survey/connection-status/connection-status';
import { useConnectionStatus } from '@/hooks';
import { clsx } from 'clsx';
import React from 'react';

export type DrawerPage = 'overview' | 'framework' | 'option-sets' | 'error-logs';

interface NavigationItem {
    id: DrawerPage;
    label: string;
    icon: JSX.Element;
}

interface AppDrawerProps {
    activePage: DrawerPage;
    onPageChange: (page: DrawerPage) => void;
    isOpen: boolean;
    onToggle: () => void;
    isCollapsed: boolean;
    onCollapsedChange: (collapsed: boolean) => void;
    onLogout: () => void;
}

const navigationItems: NavigationItem[] = [
    {
        id: 'overview',
        label: 'Overview',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5v6m4-6v6m4-6v6" />
            </svg>
        )
    },
    {
        id: 'framework',
        label: 'Framework',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        )
    },
    {
        id: 'option-sets',
        label: 'Option Sets',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
        )
    },
    {
        id: 'error-logs',
        label: 'Error Logs',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.232 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
        )
    }
];

export const AppDrawer: React.FC<AppDrawerProps> = ({ 
    activePage, 
    onPageChange, 
    isOpen, 
    onToggle,
    isCollapsed,
    onCollapsedChange,
    onLogout
}) => {
    const { connected, loading, error, isAuthenticated, retry, lastCheckedAt } = useConnectionStatus();

    const handleNavItemClick = (pageId: DrawerPage) => {
        onPageChange(pageId);
        // Always collapse drawer when nav item is clicked
        onCollapsedChange(true);
        // Close mobile drawer
        if (window.innerWidth < 1024) {
            onToggle();
        }
    };
    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-gray-600 bg-opacity-50 transition-opacity lg:hidden z-20"
                    onClick={onToggle}
                    onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                            onToggle();
                        }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label="Close navigation drawer"
                />
            )}

            {/* Drawer */}
            <div className={clsx(
                "fixed inset-y-0 left-0 z-30 bg-white shadow-lg transform transition-all duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col",
                isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
                isCollapsed ? "lg:w-16" : "w-64"
            )}>
                {/* Header */}
                <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 flex-shrink-0">
                    {!isCollapsed && (
                        <h2 className="text-lg font-semibold text-gray-800">Survey Administration</h2>
                    )}
                    <div className="flex items-center gap-2">
                        {/* Collapse/Expand button for desktop */}
                        <button
                            onClick={() => onCollapsedChange(!isCollapsed)}
                            className="hidden lg:flex p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                        >
                            <svg className={clsx("w-5 h-5 transition-transform", isCollapsed && "rotate-180")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                            </svg>
                        </button>
                        {/* Close button for mobile */}
                        <button
                            onClick={onToggle}
                            className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 lg:hidden"
                            aria-label="Close navigation drawer"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 mt-6 px-4 overflow-y-auto">
                    <ul className="space-y-2">
                        {navigationItems.map((item) => (
                            <li key={item.id}>
                                <button
                                    onClick={() => handleNavItemClick(item.id)}
                                    className={clsx(
                                        "w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150 group relative",
                                        activePage === item.id
                                            ? "bg-blue-100 text-blue-700"
                                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                    )}
                                    title={isCollapsed ? item.label : undefined}
                                >
                                    <span className="flex-shrink-0">
                                        {item.icon}
                                    </span>
                                    {!isCollapsed && (
                                        <span className="ml-3">
                                            {item.label}
                                        </span>
                                    )}
                                    {/* Active indicator for collapsed state */}
                                    {isCollapsed && activePage === item.id && (
                                        <span className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r"></span>
                                    )}
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Footer with connection status and logout */}
                <div className="flex-shrink-0 p-4 border-t border-gray-200 space-y-4">
                    {/* Connection Status */}
                    <div className={clsx("transition-all duration-200", isCollapsed && "flex justify-center")}>
                        {!isCollapsed ? (
                            <div>
                                <div className="text-xs font-medium text-gray-600 mb-2">Connection Status</div>
                                <ConnectionStatus 
                                    connected={connected}
                                    loading={loading}
                                    error={error}
                                    isAuthenticated={isAuthenticated}
                                    onRetry={retry}
                                    lastCheckedAt={lastCheckedAt}
                                />
                            </div>
                        ) : (
                            <div className="flex justify-center" title="Database Connection Status">
                                <div className={clsx("w-3 h-3 rounded-full", 
                                    connected ? "bg-green-500" : "bg-red-500"
                                )}></div>
                            </div>
                        )}
                    </div>

                    {/* Logout Button */}
                    <Button 
                        variant="outline" 
                        onClick={onLogout}
                        className={clsx(
                            "transition-all duration-200",
                            isCollapsed ? "w-10 h-10 p-0" : "w-full"
                        )}
                        title={isCollapsed ? "Logout" : undefined}
                    >
                        {!isCollapsed ? (
                            "Logout"
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        )}
                    </Button>
                </div>
            </div>
        </>
    );
};