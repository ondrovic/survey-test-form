import React, { ReactNode } from 'react';
import { AdminTabProvider } from '../admin-tab-context';
import { AuthProvider } from '../auth-context';
import { FormProvider } from '../form-context';
import { ModalProvider } from '../modal-context';
import { OptionSetProvider } from '../option-set-context';
import { RatingScaleProvider } from '../rating-scale-context';
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
                <SurveyDataProvider>
                    <AdminTabProvider>
                        <FormProvider>
                            <ModalProvider>
                                <OptionSetProvider>
                                    <RatingScaleProvider>
                                        <SurveyBuilderProvider initialConfig={initialConfig}>
                                            {children}
                                        </SurveyBuilderProvider>
                                    </RatingScaleProvider>
                                </OptionSetProvider>
                            </ModalProvider>
                        </FormProvider>
                    </AdminTabProvider>
                </SurveyDataProvider>
            </ToastProvider>
        </AuthProvider>
    );
};