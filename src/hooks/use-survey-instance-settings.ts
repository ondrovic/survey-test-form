import { SurveyInstance } from '@/types';
import { createDateRangeISOStrings, parseDateFromISOString } from '@/utils/date.utils';
import { useState, useCallback } from 'react';

export interface SurveyInstanceSettings {
  isActive: boolean;
  activeDateRange: { startDate: string; endDate: string } | null;
}

export const useSurveyInstanceSettings = (instance: SurveyInstance) => {
  const [isActive, setIsActive] = useState(instance.isActive);
  const [startDate, setStartDate] = useState(
    instance.activeDateRange?.startDate ? parseDateFromISOString(instance.activeDateRange.startDate) : ''
  );
  const [endDate, setEndDate] = useState(
    instance.activeDateRange?.endDate ? parseDateFromISOString(instance.activeDateRange.endDate) : ''
  );
  const [isSaving, setIsSaving] = useState(false);

  const clearDateRange = useCallback(() => {
    setStartDate('');
    setEndDate('');
  }, []);

  const hasChanges = useCallback(() => {
    const currentDateRange = instance.activeDateRange;
    let newDateRange: { startDate: string; endDate: string } | null = null;
    
    if (startDate && endDate) {
      newDateRange = createDateRangeISOStrings(startDate, endDate);
    }

    const normalizedCurrent = currentDateRange || null;
    const normalizedNew = newDateRange || null;

    const activeChanged = isActive !== instance.isActive;
    const dateRangeChanged = JSON.stringify(normalizedCurrent) !== JSON.stringify(normalizedNew);

    return activeChanged || dateRangeChanged;
  }, [instance, isActive, startDate, endDate]);

  const getSettingsUpdate = useCallback((): SurveyInstanceSettings => {
    const activeDateRange = startDate && endDate
      ? createDateRangeISOStrings(startDate, endDate)
      : null;

    return { isActive, activeDateRange };
  }, [isActive, startDate, endDate]);

  return {
    isActive,
    setIsActive,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    isSaving,
    setIsSaving,
    clearDateRange,
    hasChanges,
    getSettingsUpdate
  };
};