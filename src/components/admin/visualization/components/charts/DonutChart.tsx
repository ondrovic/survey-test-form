import React from 'react';
import { BaseChartProps } from '../../types';
import { computeColorForLabel } from '../../utils';

export const DonutChart: React.FC<BaseChartProps> = ({ 
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
  const size = chartSize === 'large' ? 400 : 160; // Increased large size for better modal fit
  const radius = chartSize === 'large' ? 160 : 65;
  const stroke = chartSize === 'large' ? 30 : 18;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  let cumulative = 0;

  return (
    <div className={`grid gap-6 items-center ${chartSize === 'large' ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1 md:grid-cols-2'}`}>
      <div className={`flex justify-center items-center ${chartSize === 'large' ? 'xl:col-span-1' : ''}`}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-sm">
          <circle cx={center} cy={center} r={radius} fill="none" stroke="#f3f4f6" strokeWidth={stroke} />
          {entries.map(([label, value]) => {
            const fraction = total > 0 ? value / total : 0;
            const dash = fraction * circumference;
            const offset = circumference - cumulative * circumference;
            cumulative += fraction;
            const lower = label?.toString().toLowerCase?.() || '';
            const strict = lower.replace(/[^a-z0-9]+/g, '-');
            const color = computeColorForLabel({ label, lower, strict, colors, neutralMode, colorSalt });
            
            return (
              <circle
                key={label}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth={stroke}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={offset}
                className="transition-all duration-300 hover:stroke-width-[20]"
              />
            );
          })}
          <text 
            x={center} 
            y={center} 
            textAnchor="middle" 
            dominantBaseline="middle" 
            className="fill-gray-700" 
            fontSize={chartSize === 'large' ? "24" : "16"} 
            fontWeight="600"
          >
            {total}
          </text>
        </svg>
      </div>
      
      <div className={`space-y-2 min-w-0 ${chartSize === 'large' ? 'space-y-4' : ''}`}>
        {entries.map(([label, value]) => {
          const fraction = total > 0 ? value / total : 0;
          const lower = label?.toString().toLowerCase?.() || '';
          const strict = lower.replace(/[^a-z0-9]+/g, '-');
          const color = computeColorForLabel({ label, lower, strict, colors, neutralMode, colorSalt });
          const isLongLabel = (label || '').length > 25;

          return (
            <div key={label} className={`flex items-start justify-between gap-3 ${chartSize === 'large' ? 'text-lg' : 'text-sm'}`}>
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <span 
                  className={`inline-block rounded-sm mt-0.5 flex-shrink-0 ${chartSize === 'large' ? 'w-5 h-5' : 'w-3 h-3'}`} 
                  style={{ backgroundColor: color }} 
                />
                <span
                  className={`${isLongLabel ? 'line-clamp-2 leading-tight' : 'truncate'} text-gray-800`}
                  title={label}
                >
                  {label || '—'}
                </span>
              </div>
              <span className={`text-gray-600 shrink-0 ml-2 ${chartSize === 'large' ? 'text-lg font-semibold' : ''}`}>
                {showPercent ? `${(fraction * 100).toFixed(0)}%` : value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};