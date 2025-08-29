import { Button } from '@/components/common';
import { useDateRange, type UseDateRangeOptions } from '@/hooks/use-date-range';
import type { DateRange } from '@/types/framework.types';
import React from 'react';

interface DateRangeSelectorProps extends UseDateRangeOptions {
  /** Unique prefix for input IDs to avoid conflicts when multiple selectors are on the same page */
  idPrefix?: string;
  /** Additional CSS classes for the container */
  className?: string;
  /** Whether to show the clear button */
  showClearButton?: boolean;
  /** Custom label for start date */
  startLabel?: string;
  /** Custom label for end date */
  endLabel?: string;
  /** Additional description text */
  description?: string;
  /** Callback when date range changes */
  onChange?: (dateRange: DateRange | null) => void;
}

export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  initialDateRange,
  idPrefix = 'date',
  className = '',
  showClearButton = true,
  startLabel = 'Start Date',
  endLabel = 'End Date',
  description = 'Leave empty to keep survey active indefinitely. Both dates must be set to enable date restrictions. Start date begins at 12:00:00 AM, end date ends at 11:59:59 PM.',
  onChange
}) => {
  const dateRange = useDateRange({ initialDateRange });
  const {
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    clearDateRange,
    getDateRangeISOStrings,
    hasPartialDateRange,
    getDisplayMessage
  } = dateRange;

  // Call onChange when date range changes
  React.useEffect(() => {
    if (onChange) {
      onChange(getDateRangeISOStrings());
    }
  }, [onChange, getDateRangeISOStrings]);

  const displayMessage = getDisplayMessage();

  return (
    <div className={`space-y-4 ${className}`}>
      {description && (
        <p className="text-sm text-gray-600">
          {description}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label htmlFor={`${idPrefix}-start-date`} className="block text-sm font-medium text-gray-700 mb-1 dark:text-white">
            {startLabel}
          </label>
          <input
            id={`${idPrefix}-start-date`}
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
          />
        </div>

        <div>
          <label htmlFor={`${idPrefix}-end-date`} className="block text-sm font-medium text-gray-700 mb-1 dark:text-white">
            {endLabel}
          </label>
          <input
            id={`${idPrefix}-end-date`}
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
          />
        </div>
      </div>

      <div className="mt-2">
        <div className={`text-sm ${
          displayMessage.type === 'success' ? 'text-green-600' :
          displayMessage.type === 'warning' ? 'text-orange-600' :
          'text-gray-600'
        }`}>
          {displayMessage.message}
        </div>
      </div>

      {showClearButton && hasPartialDateRange() && (
        <div className="mt-3">
          <Button
            size="sm"
            variant="outline"
            onClick={clearDateRange}
          >
            Clear Date Range
          </Button>
        </div>
      )}
    </div>
  );
};

// Export the hook for direct access if needed
export { useDateRange } from '@/hooks/use-date-range';