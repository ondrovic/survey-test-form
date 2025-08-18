import React from 'react';
import { BaseChartProps } from '../../types';

export const Histogram: React.FC<BaseChartProps> = ({ 
  counts, 
  total, 
  showPercent, 
  size: chartSize = 'normal' 
}) => {
  const entries = Object.entries(counts);
  const max = Math.max(1, ...entries.map(([, v]) => v));
  
  return (
    <div className="w-full">
      <div 
        className="grid gap-2 items-end" 
        style={{ 
          gridTemplateColumns: `repeat(${entries.length}, minmax(40px, 1fr))`, 
          minHeight: '140px' 
        }}
      >
        {entries.map(([bucket, value]) => {
          const pct = total > 0 ? (value / total) * 100 : 0;
          return (
            <div key={bucket} className="flex flex-col items-center">
              <div 
                className="w-full bg-amber-500 rounded" 
                style={{ height: `${(value / max) * 100}%` }} 
                title={`${bucket}: ${value} (${pct.toFixed(1)}%)`} 
              />
              <div className="mt-2 text-xs text-gray-600 truncate w-full text-center" title={bucket}>
                {bucket}
              </div>
              <div className="text-xs text-gray-500 font-medium">
                {showPercent ? `${pct.toFixed(0)}%` : value}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};