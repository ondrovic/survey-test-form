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
    <div className="flex items-center space-x-2"> 
      {/* Calendar Icon - Replaced the <label> with this SVG */}
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className="lucide lucide-calendar w-4 h-4 text-gray-500" 
        aria-hidden="true"
      >
        <path d="M8 2v4"></path>
        <path d="M16 2v4"></path>
        <rect width="18" height="18" x="3" y="4" rx="2"></rect>
        <path d="M3 10h18"></path>
      </svg>
      
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