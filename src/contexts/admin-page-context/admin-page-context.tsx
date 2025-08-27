import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

type AdminPage = 'overview' | 'framework' | 'legacy' | 'option-sets' | 'error-logs';

interface AdminPageContextType {
    activePage: AdminPage;
    setActivePage: (page: AdminPage) => void;
}

const AdminPageContext = createContext<AdminPageContextType | undefined>(undefined);

interface AdminPageProviderProps {
    children: ReactNode;
}

export const AdminPageProvider: React.FC<AdminPageProviderProps> = ({ children }) => {
    // Get initial active page from localStorage
    const getInitialActivePage = (): AdminPage => {
        const savedPage = localStorage.getItem('admin-active-page');
        if (savedPage && ['overview', 'framework', 'legacy', 'option-sets', 'error-logs'].includes(savedPage)) {
            return savedPage as AdminPage;
        }
        return 'overview';
    };

    const [activePage, setActivePageState] = useState<AdminPage>(getInitialActivePage);

    // Save active page to localStorage when it changes
    useEffect(() => {
        localStorage.setItem('admin-active-page', activePage);
    }, [activePage]);

    const setActivePage = (page: AdminPage) => {
        setActivePageState(page);
    };

    const value: AdminPageContextType = {
        activePage,
        setActivePage,
    };

    return (
        <AdminPageContext.Provider value={value}>
            {children}
        </AdminPageContext.Provider>
    );
};

export const useAdminPage = (): AdminPageContextType => {
    const context = useContext(AdminPageContext);
    if (context === undefined) {
        throw new Error('useAdminPage must be used within an AdminPageProvider');
    }
    return context;
};
