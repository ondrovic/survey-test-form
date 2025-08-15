import React from 'react';
import { BaseChartProps } from '../../types';
import { computeColorForLabel } from '../../utils';

export const BarChart: React.FC<BaseChartProps> = ({ 
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

  // Responsive sizing based on chart size prop
  const isLarge = chartSize === 'large';
  const barHeight = isLarge ? 'h-12' : 'h-8';
  const labelSize = isLarge ? 'text-base' : 'text-sm';
  const valueSize = isLarge ? 'text-xl' : 'text-lg';
  const padding = isLarge ? 'p-4' : 'p-3';
  const spacing = isLarge ? 'space-y-4' : 'space-y-3';
  const gap = isLarge ? 'gap-6' : 'gap-4';

  return (
    <div className={spacing}>
      {entries.map(([label, value]) => {
        const pct = total > 0 ? (value / total) * 100 : 0;
        const lower = label?.toString().toLowerCase?.() || '';
        const strict = lower.replace(/[^a-z0-9]+/g, '-');
        const color = computeColorForLabel({ label, lower, strict, colors, neutralMode, colorSalt });

        const widthPct = Math.max(0.5, pct);

        return (
          <div key={label} className={`${spacing} ${padding} bg-gray-50 rounded-lg border border-gray-100`}>
            {/* Label - now on its own line for better readability */}
            <div className={`${labelSize} font-medium text-gray-800 truncate`} title={label}>
              {label || '—'}
            </div>

            {/* Bar container with better spacing */}
            <div className={`flex items-center ${gap}`}>
              <div className={`flex-1 bg-gray-200 rounded-full ${barHeight} overflow-hidden shadow-inner`}>
                <div
                  className="h-full rounded-full transition-all duration-300 ease-out shadow-sm"
                  style={{
                    width: `${widthPct}%`,
                    backgroundColor: color,
                    minWidth: isLarge ? '20px' : '12px' // Ensure visibility even for small values
                  }}
                  title={`${label}: ${value} (${pct.toFixed(1)}%)`}
                />
              </div>

              {/* Value display - larger and more prominent */}
              <div className={`${valueSize} font-bold text-gray-700 min-w-[4rem] text-right`}>
                {showPercent ? `${pct.toFixed(0)}%` : value}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};