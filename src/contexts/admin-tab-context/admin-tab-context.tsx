import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

type AdminTab = 'overview' | 'framework' | 'legacy' | 'option-sets';

interface AdminTabContextType {
    activeTab: AdminTab;
    setActiveTab: (tab: AdminTab) => void;
}

const AdminTabContext = createContext<AdminTabContextType | undefined>(undefined);

interface AdminTabProviderProps {
    children: ReactNode;
}

export const AdminTabProvider: React.FC<AdminTabProviderProps> = ({ children }) => {
    // Get initial active tab from localStorage
    const getInitialActiveTab = (): AdminTab => {
        const savedTab = localStorage.getItem('admin-active-tab');
        if (savedTab && ['overview', 'framework', 'legacy', 'option-sets'].includes(savedTab)) {
            return savedTab as AdminTab;
        }
        return 'overview';
    };

    const [activeTab, setActiveTabState] = useState<AdminTab>(getInitialActiveTab);

    // Save active tab to localStorage when it changes
    useEffect(() => {
        localStorage.setItem('admin-active-tab', activeTab);
    }, [activeTab]);

    const setActiveTab = (tab: AdminTab) => {
        setActiveTabState(tab);
    };

    const value: AdminTabContextType = {
        activeTab,
        setActiveTab,
    };

    return (
        <AdminTabContext.Provider value={value}>
            {children}
        </AdminTabContext.Provider>
    );
};

export const useAdminTab = (): AdminTabContextType => {
    const context = useContext(AdminTabContext);
    if (context === undefined) {
        throw new Error('useAdminTab must be used within an AdminTabProvider');
    }
    return context;
};
