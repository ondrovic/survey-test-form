import React, { ReactNode } from 'react';
import { AdminTabProvider } from '../admin-tab-context';
import { AuthProvider } from '../auth-context';
import { FormProvider } from '../form-context';
import { ModalProvider } from '../modal-context';
import { OptionSetCrudProvider } from '../option-set-crud-context';
import { SurveyBuilderProvider } from '../survey-builder-context';
import { SurveyDataProvider } from '../survey-data-context';
import { ToastProvider } from '../toast-context';

interface AppProviderProps {
    children: ReactNode;
    initialConfig?: any;
}

export const AppProvider: React.FC<AppProviderProps> = ({
    children,
    initialConfig
}) => {
    return (
        <AuthProvider>
            <ToastProvider>
                <OptionSetCrudProvider>
                    <SurveyDataProvider>
                        <AdminTabProvider>
                            <FormProvider>
                                <ModalProvider>
                                    <SurveyBuilderProvider initialConfig={initialConfig}>
                                        {children}
                                    </SurveyBuilderProvider>
                                </ModalProvider>
                            </FormProvider>
                        </AdminTabProvider>
                    </SurveyDataProvider>
                </OptionSetCrudProvider>
            </ToastProvider>
        </AuthProvider>
    );
};