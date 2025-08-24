
interface UseSurveyCountReturn {
    count: number | null;
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

export const useSurveyCount = (): UseSurveyCountReturn => {
    // Legacy surveys have been removed - always return 0
    return {
        count: 0,
        loading: false,
        error: null,
        refresh: async () => {}
    };
}; 