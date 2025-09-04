import React from 'react';
import { useVisualization } from '../../context';

interface SparklineProps {
  data: Array<{ x: string; y: number }>;
}

export const Sparkline: React.FC<SparklineProps> = ({ data }) => {
  const { isDarkMode } = useVisualization();
  // Simple SVG sparkline
  const width = 280;
  const height = 60;
  const padding = 6;
  const ys = data.map((d) => d.y);
  const maxY = Math.max(1, ...ys);

  const points = data
    .map((d, i) => 
      `${padding + (i / Math.max(1, data.length - 1)) * (width - padding * 2)},${
        height - padding - (d.y / maxY) * (height - padding * 2)
      }`
    )
    .join(' ');

  return (
    <svg width={width} height={height} className={isDarkMode ? "text-amber-400" : "text-amber-600"}>
      <polyline 
        fill="none" 
        stroke={isDarkMode ? "#fbbf24" : "#f59e0b"} 
        strokeWidth="2" 
        points={points} 
      />
    </svg>
  );
};