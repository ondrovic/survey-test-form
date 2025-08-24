import { Button } from '@/components/common';
import { ConnectionStatus } from '@/components/survey/connection-status/connection-status';
import { useConnectionStatus } from '@/hooks';
import { Menu, X } from 'lucide-react';
import React, { useState } from 'react';

interface AdminHeaderProps {
    title?: string;
    onLogout: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
    title = 'Survey Administration',
    onLogout
}) => {
    const { connected, loading, error, isAuthenticated, retry, lastCheckedAt } = useConnectionStatus();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    return (
        <header className="bg-white shadow-sm border-b relative">
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-14 md:h-16">
                    {/* Left side - Title */}
                    <div className="flex items-center flex-1 min-w-0">
                        <h1 className="text-lg md:text-xl font-semibold text-gray-900 truncate pr-4">
                            {title}
                        </h1>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-4">
                        <ConnectionStatus 
                            connected={connected}
                            loading={loading}
                            error={error}
                            isAuthenticated={isAuthenticated}
                            onRetry={retry}
                            lastCheckedAt={lastCheckedAt}
                        />
                        <Button 
                            variant="outline" 
                            onClick={onLogout}
                            className="min-h-[44px] px-4"
                        >
                            Logout
                        </Button>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <button
                            onClick={toggleMobileMenu}
                            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
                            aria-label="Toggle mobile menu"
                        >
                            {isMobileMenuOpen ? (
                                <X className="w-6 h-6" />
                            ) : (
                                <Menu className="w-6 h-6" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Panel */}
                {isMobileMenuOpen && (
                    <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b shadow-lg z-50">
                        <div className="px-3 py-4 space-y-4">
                            {/* Mobile Connection Status */}
                            <div className="border-b border-gray-200 pb-4">
                                <div className="text-sm font-medium text-gray-700 mb-2">Connection Status</div>
                                <ConnectionStatus 
                                    connected={connected}
                                    loading={loading}
                                    error={error}
                                    isAuthenticated={isAuthenticated}
                                    onRetry={retry}
                                    lastCheckedAt={lastCheckedAt}
                                />
                            </div>
                            
                            {/* Mobile Actions */}
                            <div className="pt-2">
                                <Button 
                                    variant="outline" 
                                    onClick={() => {
                                        onLogout();
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className="w-full min-h-[44px] justify-center"
                                >
                                    Logout
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Backdrop for mobile menu */}
            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-25 z-40 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                    aria-hidden="true"
                />
            )}
        </header>
    );
};
