import { useState, useCallback } from 'react';
import { createDateRangeISOStrings, parseDateFromISOString, formatDateRangeForDisplay } from '@/utils/date.utils';
import type { DateRange } from '@/types/framework.types';

export interface UseDateRangeOptions {
  initialDateRange?: DateRange | null;
}

export const useDateRange = (options: UseDateRangeOptions = {}) => {
  const [startDate, setStartDate] = useState(
    options.initialDateRange?.startDate ? parseDateFromISOString(options.initialDateRange.startDate) : ''
  );
  const [endDate, setEndDate] = useState(
    options.initialDateRange?.endDate ? parseDateFromISOString(options.initialDateRange.endDate) : ''
  );

  const clearDateRange = () => {
    setStartDate('');
    setEndDate('');
  };

  const getDateRangeISOStrings = useCallback((): DateRange | null => {
    if (startDate && endDate) {
      const isoStrings = createDateRangeISOStrings(startDate, endDate);
      return {
        startDate: isoStrings.startDate,
        endDate: isoStrings.endDate
      };
    }
    return null;
  }, [startDate, endDate]);

  const hasValidDateRange = (): boolean => {
    return !!(startDate && endDate);
  };

  const hasPartialDateRange = (): boolean => {
    return !!(startDate || endDate);
  };

  const getDisplayMessage = (): { message: string; type: 'success' | 'warning' | 'info' } => {
    if (startDate && endDate) {
      return {
        message: `✓ Date range will be active from ${formatDateRangeForDisplay(startDate, endDate)}`,
        type: 'success'
      };
    }
    
    if (startDate || endDate) {
      return {
        message: '⚠ Both start and end dates must be set for date range to be active',
        type: 'warning'
      };
    }
    
    return {
      message: 'Survey will be active indefinitely (no date restrictions)',
      type: 'info'
    };
  };

  const hasChanges = (originalDateRange?: DateRange | null): boolean => {
    const currentDateRange = getDateRangeISOStrings();
    const normalizedOriginal = originalDateRange || null;
    const normalizedCurrent = currentDateRange || null;
    
    return JSON.stringify(normalizedOriginal) !== JSON.stringify(normalizedCurrent);
  };

  return {
    // State
    startDate,
    endDate,
    
    // Setters
    setStartDate,
    setEndDate,
    
    // Actions
    clearDateRange,
    
    // Getters
    getDateRangeISOStrings,
    hasValidDateRange,
    hasPartialDateRange,
    getDisplayMessage,
    hasChanges,
  };
};