import { useMemo, forwardRef } from 'react';
import ReactECharts from 'echarts-for-react';
import type { BaseChartProps } from '../../types';

interface SimpleEChartsPieProps extends BaseChartProps {
  variant?: 'pie' | 'donut';
  padAngle?: number;
  fieldName?: string; // The actual field/question name
  showLegend?: boolean; // Controls legend visibility
}

export const SimpleEChartsPie = forwardRef<ReactECharts, SimpleEChartsPieProps>(({
  counts,
  total,
  orderedValues,
  colors,
  showPercent = false,
  size = 'normal',
  variant = 'donut',
  padAngle = 5, // Padding angle between segments like the example
  fieldName = 'Survey Data', // Default fallback
  showLegend = size === 'large' // Default: show legend on large modal, hide on small
}, ref) => {
  const isLarge = size === 'large';
  const isDonut = variant === 'donut';

  // Prepare chart data
  const chartData = useMemo(() => {
    const baseEntries = Object.entries(counts);
    const entries = orderedValues && orderedValues.length > 0
      ? orderedValues.filter(v => counts[v] !== undefined).map(v => [v, counts[v]] as [string, number])
      : baseEntries.sort((a, b) => b[1] - a[1]);

    return entries.map(([label, value]) => {
      const pct = total > 0 ? (value / total) * 100 : 0;
      return {
        name: label || '—',
        value: showPercent ? parseFloat(pct.toFixed(1)) : value,
        percentage: pct,
        itemStyle: {
          color: colors?.[label] || undefined, // Let ECharts handle default colors if not specified
          borderRadius: 6, // Rounded corners for modern look
          borderColor: '#fff',
          borderWidth: 2
        }
        // Removed individual label config - using series-level labels instead
      };
    });
  }, [counts, total, orderedValues, colors, showPercent]);

  // Generate ECharts option matching the exact example you provided
  const option = useMemo(() => {
    return {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const originalCount = Object.entries(counts).find(([key]) => key === params.name)?.[1] || 0;
          const pct = total > 0 ? ((originalCount / total) * 100).toFixed(1) : '0';
          return `${params.name}<br/>Count: ${originalCount}<br/>Percentage: ${pct}%`;
        }
      },
      ...(showLegend && {
        legend: {
          top: '5%',
          left: 'center',
          textStyle: {
            fontSize: isLarge ? 12 : 10,
            color: '#666'
          },
          formatter: (name: string) => {
            const count = counts[name] || 0;
            const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0';
            return `${name}: ${count} (${pct}%)`;
          }
        }
      }),
      series: [{
        name: fieldName, // Dynamic field name like "Overall Satisfaction"
        type: 'pie',
        radius: isDonut 
          ? (isLarge ? ['35%', '75%'] : ['40%', '70%'])  // Larger donut in modal: 35%-75% vs 40%-70%
          : (isLarge ? '75%' : '65%'),                   // Larger full pie in modal: 75% vs 65%
        avoidLabelOverlap: false,
        padAngle: padAngle, // Creates the gaps between segments
        itemStyle: {
          borderRadius: 10 // Matching the example borderRadius
        },
        data: chartData,
        
        // Label configuration - matching the example exactly
        label: {
          show: false, // Hidden by default like in the example
          position: 'center'
        },
        
        // Emphasis shows the label in center on hover - key feature from example
        emphasis: {
          label: {
            show: true,
            fontSize: isLarge ? 32 : 18, // Much larger text in modal: 32px vs 18px
            fontWeight: 'bold',
            formatter: '{b}', // Just show the name (response value like "Strongly Agree")
            color: '#333'
          }
        },
        
        labelLine: {
          show: false // Hidden like in the example
        },
        
        // Animation configuration
        animation: true,
        animationType: 'expansion',
        animationEasing: 'elasticOut',
        animationDuration: 1000,
        animationDelay: (idx: number) => idx * 100
      }],
      
      // Color palette (will be used if colors not specified)
      color: [
        '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de',
        '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc', '#87c7ca',
        '#d4a574', '#8d98b3', '#e5cf54', '#97b552', '#95706d'
      ]
    };
  }, [chartData, isLarge, isDonut, padAngle, showPercent, showLegend, counts, total]);

  const containerStyle = {
    height: isLarge ? '650px' : '400px', // Optimized modal size: 650px vs 400px for grid
    width: '100%'
  };

  return (
    <ReactECharts
      ref={ref}
      option={option}
      style={containerStyle}
      theme="light"
      notMerge={true}
      lazyUpdate={true}
    />
  );
});

SimpleEChartsPie.displayName = 'SimpleEChartsPie';

export default SimpleEChartsPie;