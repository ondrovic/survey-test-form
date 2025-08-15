import React from 'react';
import { useVisualization } from '../../context';
import { useFilters } from '../../hooks';

export const QuickRangeFilter: React.FC = () => {
  const { filters, updateFilters } = useVisualization();
  const { applyQuickRange } = useFilters([]);

  const handleQuickRangeChange = (range: 'all' | '7d' | '30d' | 'month' | 'custom') => {
    updateFilters({ quickRange: range });
    
    if (range !== 'custom') {
      const dates = applyQuickRange(range);
      updateFilters(dates);
    }
  };

  return (
    <div>
      <label htmlFor="quick-range" className="block text-sm text-gray-700 mb-1">
        Quick range
      </label>
      <select 
        id="quick-range" 
        className="px-3 py-2 border border-gray-300 rounded-md" 
        value={filters.quickRange} 
        onChange={(e) => handleQuickRangeChange(e.target.value as any)}
      >
        <option value="all">All time</option>
        <option value="7d">Last 7 days</option>
        <option value="30d">Last 30 days</option>
        <option value="month">This month</option>
        <option value="custom">Custom…</option>
      </select>
    </div>
  );
};