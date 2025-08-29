import React from 'react';
import { useVisualization } from '../../context';

export const CustomDateRange: React.FC = () => {
  const { filters, updateFilters } = useVisualization();

  if (filters.quickRange !== 'custom') {
    return null;
  }

  return (
    <>
      <div>
        <label htmlFor="start-date" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
          Start
        </label>
        <input
          id="start-date"
          type="date"
          value={filters.startDate}
          onChange={(e) => updateFilters({ startDate: e.target.value })}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>
      <div>
        <label htmlFor="end-date" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
          End
        </label>
        <input
          id="end-date"
          type="date"
          value={filters.endDate}
          onChange={(e) => updateFilters({ endDate: e.target.value })}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>
    </>
  );
};