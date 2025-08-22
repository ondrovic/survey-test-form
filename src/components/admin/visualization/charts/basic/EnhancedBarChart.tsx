import React, { useMemo } from 'react';
import { BaseEChartsComponent } from '../core/BaseEChartsComponent';
import { EnhancedChartProps, AnalyticsEChartsOption } from '../../echarts-types';

export const EnhancedBarChart: React.FC<EnhancedChartProps> = ({
  counts,
  total,
  orderedValues,
  colors,
  showPercent = false,
  size = 'normal',
  series,
  chartType = 'horizontal',
  interactions = {},
  analytics = {},
  theme = 'surveyAnalytics',
  animation = true
}) => {
  const isVertical = chartType === 'vertical';
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
        rawValue: value,
        percentage: pct,
        itemStyle: {
          color: colors?.[label] || '#5470c6'
        }
      };
    });
  }, [counts, total, orderedValues, colors, showPercent]);

  // Generate ECharts option
  const option: AnalyticsEChartsOption = useMemo(() => {
    const categoryData = chartData.map(item => item.name);
    const seriesData = chartData.map(item => ({
      value: item.value,
      itemStyle: item.itemStyle,
      label: {
        show: analytics.showStatistics,
        position: (isVertical ? 'top' : 'right') as any,
        formatter: showPercent ? '{c}%' : '{c}'
      }
    }));

    const baseOption: AnalyticsEChartsOption = {
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e0e0e0',
        borderWidth: 1,
        textStyle: {
          color: '#333333',
          fontSize: 12
        },
        formatter: (params: any) => {
          const data = chartData[params.dataIndex];
          if (!data) return '';
          
          const lines = [
            `<strong>${data.name}</strong>`,
            `Count: ${data.rawValue}`,
            `Percentage: ${data.percentage.toFixed(1)}%`
          ];

          if (analytics.showStatistics && series.analytics?.statistics) {
            const stats = series.analytics.statistics;
            lines.push('', '<em>Statistics:</em>');
            if (stats.mean !== undefined) lines.push(`Mean: ${stats.mean.toFixed(1)}`);
            if (stats.median !== undefined) lines.push(`Median: ${stats.median}`);
          }

          return lines.join('<br/>');
        },
        confine: true
      },
      grid: {
        left: isVertical ? '10%' : '20%',
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
          fontSize: isLarge ? 12 : 10,
          overflow: 'truncate',
          width: isVertical ? undefined : 100
        },
        axisTick: {
          alignWithLabel: true
        }
      },
      [isVertical ? 'yAxis' : 'xAxis']: {
        type: 'value',
        axisLabel: {
          formatter: showPercent ? '{value}%' : '{value}',
          fontSize: isLarge ? 12 : 10
        },
        splitLine: {
          lineStyle: {
            type: 'dashed',
            opacity: 0.6
          }
        }
      },
      series: [{
        name: series.label,
        type: 'bar',
        data: seriesData,
        barWidth: isLarge ? '60%' : '50%',
        emphasis: {
          focus: 'series',
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowOffsetY: 0,
            shadowColor: 'rgba(0, 0, 0, 0.3)'
          }
        },
        animationDelay: (idx: number) => idx * 50
      }]
    };

    // Add brush component for data selection if enabled
    if (interactions.brushing) {
      baseOption.brush = {
        toolbox: ['rect', 'polygon', 'keep', 'clear'],
        brushLink: 'all',
        outOfBrush: {
          colorAlpha: 0.1
        }
      };
    }

    // Add data zoom for large datasets
    if (chartData.length > 10) {
      baseOption.dataZoom = [{
        type: 'slider',
        show: true,
        [isVertical ? 'xAxisIndex' : 'yAxisIndex']: [0],
        start: 0,
        end: 100,
        height: isVertical ? 20 : undefined,
        width: isVertical ? undefined : 20,
        [isVertical ? 'bottom' : 'right']: 10
      }];
    }

    // Add toolbox for export and utilities
    baseOption.toolbox = {
      show: true,
      feature: {
        dataView: { 
          show: analytics.showStatistics, 
          readOnly: false,
          title: 'Data View'
        },
        saveAsImage: { 
          show: true,
          title: 'Save as Image',
          pixelRatio: 2
        },
        ...(interactions.brushing && {
          brush: {
            type: ['rect', 'polygon', 'keep', 'clear'],
            title: {
              rect: 'Rectangle Select',
              polygon: 'Polygon Select',
              keep: 'Keep Selection',
              clear: 'Clear Selection'
            }
          }
        })
      },
      right: 15,
      top: 15
    };

    return baseOption;
  }, [chartData, isVertical, isLarge, showPercent, analytics, interactions, series]);

  // Chart event handlers
  const handleChartEvents = useMemo(() => ({
    click: (params: any) => {
      if (interactions.drilling) {
        console.log('Drill down to:', params.name, params.value);
        // Implement drill-down logic here
      }
    },
    brush: (params: any) => {
      if (interactions.brushing) {
        console.log('Brushed data:', params.areas);
        // Implement brush selection logic here
      }
    }
  }), [interactions]);

  const containerStyle = {
    height: isLarge ? '500px' : '400px',
    width: '100%'
  };

  return (
    <BaseEChartsComponent
      option={option}
      theme={theme}
      style={containerStyle}
      onEvents={handleChartEvents}
      accessibility={{
        title: `Bar chart: ${series.label}`,
        description: `Interactive bar chart showing ${chartData.length} categories with ${total} total responses`
      }}
      export={{ enabled: true }}
      performance={{
        virtualization: { enabled: chartData.length > 100, threshold: 100 },
        animation: animation
      }}
    />
  );
};

export default EnhancedBarChart;