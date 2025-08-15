import React from 'react';
import { Button } from '@/components/common';
import { ChartType } from '../../types';
import { useVisualization } from '../../context';

export const ChartControls: React.FC = () => {
  const { filters, updateFilters, preferences } = useVisualization();

  return (
    <div className="ml-auto flex items-end gap-2">
      <div>
        <label htmlFor="default-chart" className="block text-sm text-gray-700 mb-1">
          Default chart
        </label>
        <select 
          id="default-chart" 
          className="px-3 py-2 border border-gray-300 rounded-md" 
          value={preferences.defaultChartType} 
          onChange={(e) => preferences.setDefaultChartType(e.target.value as ChartType)}
        >
          <option value="horizontal">Horizontal</option>
          <option value="vertical">Vertical</option>
          <option value="donut">Donut</option>
        </select>
      </div>
      
      <Button
        variant="outline"
        size="fixed"
        title="Toggle count/percentage"
        onClick={() => updateFilters({ showPercent: !filters.showPercent })}
      >
        {filters.showPercent ? 'percent' : 'count'}
      </Button>
    </div>
  );
};