import React from 'react';

interface HistogramProps {
  counts: Record<string, number>;
}

export const Histogram: React.FC<HistogramProps> = ({ counts }) => {
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
        {entries.map(([bucket, value]) => (
          <div key={bucket} className="flex flex-col items-center">
            <div 
              className="w-full bg-amber-500 rounded" 
              style={{ height: `${(value / max) * 100}%` }} 
              title={`${bucket}: ${value}`} 
            />
            <div className="mt-2 text-xs text-gray-600 truncate w-full text-center" title={bucket}>
              {bucket}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};