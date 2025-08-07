import { useSurveyData } from '@/hooks';
import { RatingScale, SurveyConfig, SurveyData, SurveyInstance } from '@/types';
import React, { createContext, ReactNode, useContext, useEffect } from 'react';

interface SurveyDataContextType {
    // Framework data
    surveyConfigs: SurveyConfig[];
    surveyInstances: SurveyInstance[];
    ratingScales: RatingScale[];

    // Legacy data
    surveys: SurveyData[];

    // Loading states
    isLoading: boolean;
    error: string | null;

    // Actions
    loadFrameworkData: () => Promise<void>;
    loadLegacyData: () => Promise<void>;
    loadRatingScales: () => Promise<void>;
    refreshAll: () => Promise<void>;
}

const SurveyDataContext = createContext<SurveyDataContextType | undefined>(undefined);

interface SurveyDataProviderProps {
    children: ReactNode;
}

export const SurveyDataProvider: React.FC<SurveyDataProviderProps> = ({ children }) => {
    const surveyData = useSurveyData();

    // Auto-load data when provider mounts
    useEffect(() => {
        surveyData.refreshAll();
    }, []);

    return (
        <SurveyDataContext.Provider value={surveyData}>
            {children}
        </SurveyDataContext.Provider>
    );
};

export const useSurveyDataContext = (): SurveyDataContextType => {
    const context = useContext(SurveyDataContext);
    if (context === undefined) {
        throw new Error('useSurveyDataContext must be used within a SurveyDataProvider');
    }
    return context;
};
