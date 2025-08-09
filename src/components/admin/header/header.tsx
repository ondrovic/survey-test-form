import { Button } from '@/components/common';
import React from 'react';

interface AdminHeaderProps {
    title?: string;
    onLogout: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
    title = 'Survey Administration',
    onLogout
}) => {
    return (
        <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button variant="outline" onClick={onLogout}>
                            Logout
                        </Button>
                    </div>
                </div>
            </div>
        </header>
    );
};
