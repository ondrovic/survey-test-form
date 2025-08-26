import { SurveyConfig } from '../../../types/framework.types';

export interface PaginatedSurveyFormProps {
    config: SurveyConfig;
    onSubmit: (data: Record<string, any>) => Promise<void> | void;
    loading?: boolean;
    showSectionPagination?: boolean;
    className?: string;
    resetTrigger?: number;
    onSectionChange?: (sectionIndex: number) => void;
    surveyInstanceId?: string; // For session-based answer persistence
}