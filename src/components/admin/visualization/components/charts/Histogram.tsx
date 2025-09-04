import React from "react";
import { BaseChartProps } from "../../types";
import { useVisualization } from '../../context';

export const Histogram: React.FC<BaseChartProps> = ({
  counts,
  total,
  showPercent,
}) => {
  const { isDarkMode } = useVisualization();
  const entries = Object.entries(counts);
  const max = Math.max(1, ...entries.map(([, v]) => v));

  return (
    <div className="w-full">
      <div
        className="grid gap-2 items-end"
        style={{
          gridTemplateColumns: `repeat(${entries.length}, minmax(40px, 1fr))`,
          minHeight: "140px",
        }}
      >
        {entries.map(([bucket, value]) => {
          const pct = total > 0 ? (value / total) * 100 : 0;
          return (
            <div key={bucket} className="flex flex-col items-center">
              <div
                className={`w-full rounded ${isDarkMode ? 'bg-blue-400' : 'bg-blue-500'}`}
                style={{ height: `${(value / max) * 100}%` }}
                title={`${bucket}: ${value} (${pct.toFixed(1)}%)`}
              />
              <div
                className={`mt-2 text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} truncate w-full text-center`}
                title={bucket}
              >
                {bucket}
              </div>
              <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} font-medium`}>
                {showPercent ? `${pct.toFixed(0)}%` : value}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
