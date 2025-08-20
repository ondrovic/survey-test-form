import { useState, useEffect } from 'react';
import { databaseHelpers } from '../config/database';

interface UseSurveyCountReturn {
    count: number | null;
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

export const useSurveyCount = (): UseSurveyCountReturn => {
    const [count, setCount] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchCount = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const surveys = await databaseHelpers.getSurveys();
            setCount(surveys.length);
        } catch (err) {
            console.error('Error fetching survey count:', err);
            setError('Failed to fetch survey count');
        } finally {
            setLoading(false);
        }
    };

    const refresh = async () => {
        await fetchCount();
    };

    useEffect(() => {
        fetchCount();
    }, []);

    return {
        count,
        loading,
        error,
        refresh
    };
}; 