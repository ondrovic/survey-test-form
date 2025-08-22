import * as echarts from 'echarts/core';
import { CanvasRenderer, SVGRenderer } from 'echarts/renderers';
import {
  BarChart,
  LineChart,
  PieChart,
  ScatterChart,
  HeatmapChart,
  TreemapChart,
  ParallelChart,
  SankeyChart
} from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  VisualMapComponent,
  DataZoomComponent,
  BrushComponent,
  ToolboxComponent,
  MarkPointComponent,
  MarkLineComponent,
  MarkAreaComponent
} from 'echarts/components';
import { LabelLayout, UniversalTransition } from 'echarts/features';
import { AnalyticsTheme } from '../../echarts-types';

// Register required components for tree-shaking optimization
echarts.use([
  // Renderers
  CanvasRenderer,
  SVGRenderer,
  
  // Chart types
  BarChart,
  LineChart,
  PieChart,
  ScatterChart,
  HeatmapChart,
  TreemapChart,
  ParallelChart,
  SankeyChart,
  
  // Components
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  VisualMapComponent,
  DataZoomComponent,
  BrushComponent,
  ToolboxComponent,
  MarkPointComponent,
  MarkLineComponent,
  MarkAreaComponent,
  
  // Features
  LabelLayout,
  UniversalTransition
]);

// Default analytics theme
export const defaultAnalyticsTheme: AnalyticsTheme = {
  name: 'surveyAnalytics',
  colorPalette: [
    '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de',
    '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc', '#87c7ca'
  ],
  backgroundColor: '#ffffff',
  textStyle: {
    color: '#333333',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: 12
  },
  animation: true,
  animationDuration: 750,
  grid: {
    borderColor: '#e0e0e0',
    backgroundColor: 'transparent'
  },
  tooltip: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: '#e0e0e0',
    textStyle: {
      color: '#333333'
    }
  }
};

// Dark theme variant
export const darkAnalyticsTheme: AnalyticsTheme = {
  name: 'surveyAnalyticsDark',
  colorPalette: [
    '#4992ff', '#7cffb2', '#fddd60', '#ff6e76', '#58d9f9',
    '#05c091', '#ff8a45', '#8d48e3', '#dd79ff', '#00c9c9'
  ],
  backgroundColor: '#1a1a1a',
  textStyle: {
    color: '#ffffff',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: 12
  },
  animation: true,
  animationDuration: 750,
  grid: {
    borderColor: '#333333',
    backgroundColor: 'transparent'
  },
  tooltip: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderColor: '#333333',
    textStyle: {
      color: '#ffffff'
    }
  }
};

// Register themes
export const registerAnalyticsThemes = () => {
  echarts.registerTheme(defaultAnalyticsTheme.name, {
    color: defaultAnalyticsTheme.colorPalette,
    backgroundColor: defaultAnalyticsTheme.backgroundColor,
    textStyle: defaultAnalyticsTheme.textStyle,
    animation: defaultAnalyticsTheme.animation,
    animationDuration: defaultAnalyticsTheme.animationDuration,
    tooltip: {
      backgroundColor: defaultAnalyticsTheme.tooltip.backgroundColor,
      borderColor: defaultAnalyticsTheme.tooltip.borderColor,
      textStyle: defaultAnalyticsTheme.tooltip.textStyle
    },
    legend: {
      textStyle: defaultAnalyticsTheme.textStyle
    },
    categoryAxis: {
      axisLine: { lineStyle: { color: defaultAnalyticsTheme.grid.borderColor } },
      axisTick: { lineStyle: { color: defaultAnalyticsTheme.grid.borderColor } },
      axisLabel: { color: defaultAnalyticsTheme.textStyle.color },
      splitLine: { lineStyle: { color: defaultAnalyticsTheme.grid.borderColor } }
    },
    valueAxis: {
      axisLine: { lineStyle: { color: defaultAnalyticsTheme.grid.borderColor } },
      axisTick: { lineStyle: { color: defaultAnalyticsTheme.grid.borderColor } },
      axisLabel: { color: defaultAnalyticsTheme.textStyle.color },
      splitLine: { lineStyle: { color: defaultAnalyticsTheme.grid.borderColor } }
    }
  });

  echarts.registerTheme(darkAnalyticsTheme.name, {
    color: darkAnalyticsTheme.colorPalette,
    backgroundColor: darkAnalyticsTheme.backgroundColor,
    textStyle: darkAnalyticsTheme.textStyle,
    animation: darkAnalyticsTheme.animation,
    animationDuration: darkAnalyticsTheme.animationDuration,
    tooltip: {
      backgroundColor: darkAnalyticsTheme.tooltip.backgroundColor,
      borderColor: darkAnalyticsTheme.tooltip.borderColor,
      textStyle: darkAnalyticsTheme.tooltip.textStyle
    },
    legend: {
      textStyle: darkAnalyticsTheme.textStyle
    },
    categoryAxis: {
      axisLine: { lineStyle: { color: darkAnalyticsTheme.grid.borderColor } },
      axisTick: { lineStyle: { color: darkAnalyticsTheme.grid.borderColor } },
      axisLabel: { color: darkAnalyticsTheme.textStyle.color },
      splitLine: { lineStyle: { color: darkAnalyticsTheme.grid.borderColor } }
    },
    valueAxis: {
      axisLine: { lineStyle: { color: darkAnalyticsTheme.grid.borderColor } },
      axisTick: { lineStyle: { color: darkAnalyticsTheme.grid.borderColor } },
      axisLabel: { color: darkAnalyticsTheme.textStyle.color },
      splitLine: { lineStyle: { color: darkAnalyticsTheme.grid.borderColor } }
    }
  });
};

// Performance configuration based on data size
export const getOptimalRendererConfig = (dataSize: number) => {
  return {
    renderer: (dataSize > 5000 ? 'canvas' : 'svg') as 'canvas' | 'svg',
    useDirtyRect: dataSize > 1000,
    useCoarsePointer: dataSize > 10000,
    pointerSize: dataSize > 10000 ? 20 : 10
  };
};

// Animation configuration based on performance requirements
export const getOptimalAnimationConfig = (dataSize: number, enableAnimation: boolean = true) => {
  if (!enableAnimation || dataSize > 5000) {
    return {
      animation: false,
      animationDuration: 0
    };
  }

  if (dataSize > 1000) {
    return {
      animation: true,
      animationDuration: 300,
      animationEasing: 'cubicOut'
    };
  }

  return {
    animation: true,
    animationDuration: 750,
    animationEasing: 'elasticOut',
    animationDelay: (idx: number) => idx * 50
  };
};

// Common tooltip configuration for survey data
export const getSurveyTooltipConfig = (showPercent: boolean = false) => ({
  trigger: 'item',
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  borderColor: '#e0e0e0',
  borderWidth: 1,
  textStyle: {
    color: '#333333',
    fontSize: 12
  },
  formatter: (params: any) => {
    const { name, value, percent } = params;
    const displayValue = Array.isArray(value) ? value[value.length - 1] : value;
    
    if (showPercent && percent !== undefined) {
      return `${name}<br/>Count: ${displayValue}<br/>Percentage: ${percent}%`;
    }
    
    return `${name}<br/>Count: ${displayValue}`;
  },
  confine: true,
  appendToBody: true
});

// Common grid configuration for responsive charts
export const getResponsiveGridConfig = (hasLegend: boolean = true) => ({
  left: '5%',
  right: hasLegend ? '20%' : '5%',
  top: '15%',
  bottom: '10%',
  containLabel: true
});

// Accessibility configuration
export const getAccessibilityConfig = (title: string, description?: string) => ({
  aria: {
    enabled: true,
    label: title,
    description: description || `Interactive chart showing ${title}`
  }
});

// Export utilities
export const createExportableChart = (chartInstance: echarts.ECharts, config: {
  format: 'png' | 'svg';
  quality?: number;
  width?: number;
  height?: number;
  backgroundColor?: string;
  pixelRatio?: number;
}) => {
  const {
    format,
    backgroundColor = '#ffffff',
    pixelRatio = 2
  } = config;

  return chartInstance.getDataURL({
    type: format,
    backgroundColor,
    pixelRatio,
    excludeComponents: ['toolbox']
  });
};

// Initialize ECharts core with analytics themes
export const initializeEChartsCore = () => {
  registerAnalyticsThemes();
  
  return echarts;
};

export { echarts };
export default echarts;