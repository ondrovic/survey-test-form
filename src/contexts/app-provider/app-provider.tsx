import React, { ReactNode } from 'react';
import { AdminPageProvider } from '../admin-page-context';
import { AuthProvider } from '../auth-context';
import { FormProvider } from '../form-context';
import { ModalProvider } from '../modal-context';
import { OptionSetCrudProvider } from '../option-set-crud-context';
import { SurveyBuilderProvider } from '../survey-builder-context';
import { SurveyDataProvider } from '../survey-data-context';
import { ToastProvider } from '../toast-context';
import { useSessionCleanup } from '../../hooks/use-session-cleanup';

interface AppProviderProps {
    children: ReactNode;
    initialConfig?: any;
}

const AppProviderWithCleanup: React.FC<{ children: ReactNode; initialConfig?: any }> = ({ children, initialConfig }) => {
    // Initialize session cleanup service
    useSessionCleanup(true);

    return (
        <AuthProvider>
            <ToastProvider>
                <OptionSetCrudProvider>
                    <SurveyDataProvider>
                        <AdminPageProvider>
                            <FormProvider>
                                <ModalProvider>
                                    <SurveyBuilderProvider initialConfig={initialConfig}>
                                        {children}
                                    </SurveyBuilderProvider>
                                </ModalProvider>
                            </FormProvider>
                        </AdminPageProvider>
                    </SurveyDataProvider>
                </OptionSetCrudProvider>
            </ToastProvider>
        </AuthProvider>
    );
};

export const AppProvider: React.FC<AppProviderProps> = (props) => {
    return <AppProviderWithCleanup {...props} />;
};