import React, { useMemo, forwardRef } from 'react';
import ReactECharts from 'echarts-for-react';
import type { BaseChartProps } from '../../types';

interface SimpleEChartsBarProps extends BaseChartProps {
  direction?: 'horizontal' | 'vertical';
}

export const SimpleEChartsBar = forwardRef<ReactECharts, SimpleEChartsBarProps>(({
  counts,
  total,
  orderedValues,
  colors,
  showPercent = false,
  size = 'normal',
  direction = 'horizontal'
}, ref) => {
  const isVertical = direction === 'vertical';
  const isLarge = size === 'large';

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
        itemStyle: {
          color: colors?.[label] || '#5470c6'
        }
      };
    });
  }, [counts, total, orderedValues, colors, showPercent]);

  // Generate ECharts option
  const option = useMemo(() => {
    const categoryData = chartData.map(item => item.name);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: (params: any) => {
          const param = params[0];
          const originalCount = Object.entries(counts).find(([key]) => key === param.name)?.[1] || 0;
          const pct = total > 0 ? ((originalCount / total) * 100).toFixed(1) : '0';
          return `${param.name}<br/>Count: ${originalCount}<br/>Percentage: ${pct}%`;
        }
      },
      grid: {
        left: isVertical ? '10%' : '15%',
        right: '10%',
        top: '15%',
        bottom: isVertical ? '15%' : '10%',
        containLabel: true
      },
      [isVertical ? 'xAxis' : 'yAxis']: {
        type: 'category',
        data: categoryData,
        axisLabel: {
          interval: 0,
          rotate: isVertical ? 45 : 0,
          fontSize: isLarge ? 12 : 10
        }
      },
      [isVertical ? 'yAxis' : 'xAxis']: {
        type: 'value',
        axisLabel: {
          formatter: showPercent ? '{value}%' : '{value}',
          fontSize: isLarge ? 12 : 10
        }
      },
      series: [{
        type: 'bar',
        data: chartData,
        barWidth: isLarge ? '60%' : '50%',
        emphasis: {
          focus: 'series'
        }
      }]
    };
  }, [chartData, isVertical, isLarge, showPercent]);

  const containerStyle = {
    height: isLarge ? '650px' : '400px', // Optimized modal size to match pie chart
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

SimpleEChartsBar.displayName = 'SimpleEChartsBar';

export default SimpleEChartsBar;