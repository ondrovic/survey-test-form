import React from 'react';
import { BaseChartProps } from '../../types';
import { computeColorForLabel } from '../../utils';

export const VerticalBarChart: React.FC<BaseChartProps> = ({ 
  counts, 
  total, 
  orderedValues, 
  colors, 
  showPercent, 
  neutralMode, 
  colorSalt, 
  size: chartSize = 'normal' 
}) => {
  const baseEntries = Object.entries(counts);
  const entries = orderedValues && orderedValues.length > 0
    ? orderedValues.filter(v => counts[v] !== undefined).map(v => [v, counts[v]] as [string, number])
    : baseEntries.sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...entries.map(([, v]) => v));

  // Responsive sizing based on chart size prop
  const isLarge = chartSize === 'large';
  const gap = isLarge ? 'gap-4' : 'gap-3';
  const minHeight = isLarge ? '240px' : '180px';
  const barHeightMultiplier = isLarge ? 160 : 120;
  const labelSize = isLarge ? 'text-sm' : 'text-xs';
  const valueSize = isLarge ? 'text-sm' : 'text-xs';
  const minColumnWidth = isLarge ? '48px' : '32px';

  return (
    <div className="w-full">
      <div 
        className={`grid ${gap} items-end`} 
        style={{ 
          gridTemplateColumns: `repeat(${entries.length}, minmax(${minColumnWidth}, 1fr))`, 
          minHeight 
        }}
      >
        {entries.map(([label, value]) => {
          const pct = total > 0 ? (value / total) * 100 : 0;
          const lower = label?.toString().toLowerCase?.() || '';
          const strict = lower.replace(/[^a-z0-9]+/g, '-');
          const color = computeColorForLabel({ label, lower, strict, colors, neutralMode, colorSalt });
          
          return (
            <div key={label} className="flex flex-col items-center">
              <div 
                className="w-full rounded" 
                style={{ 
                  height: `${(value / max) * barHeightMultiplier + 4}px`, 
                  backgroundColor: color 
                }} 
                title={`${label}: ${value} (${pct.toFixed(1)}%)`} 
              />
              <div className={`mt-2 ${labelSize} text-gray-700 truncate w-full text-center`} title={label}>
                {label}
              </div>
              <div className={`${valueSize} text-gray-500 font-medium`}>
                {showPercent ? `${pct.toFixed(0)}%` : value}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};