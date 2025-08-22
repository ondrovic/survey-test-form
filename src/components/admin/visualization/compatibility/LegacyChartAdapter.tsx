import React, { forwardRef } from 'react';
import type ReactECharts from 'echarts-for-react';
import type { BaseChartProps, ChartType } from '../types';
import { BarChart as LegacyBarChart } from '../components/charts/BarChart';
import { DonutChart as LegacyDonutChart } from '../components/charts/DonutChart';
import { Histogram as LegacyHistogram } from '../components/charts/Histogram';
import { VerticalBarChart as LegacyVerticalBarChart } from '../components/charts/VerticalBarChart';
import { Sparkline as LegacySparkline } from '../components/charts/Sparkline';
import { SimpleEChartsBar } from '../charts/basic/SimpleEChartsBar';
import { SimpleEChartsPie } from '../charts/basic/SimpleEChartsPie';

/**
 * Feature flag to control ECharts migration
 * This allows for gradual rollout and easy rollback
 */
const ECHARTS_FEATURE_FLAGS = {
  enableBarChart: true,         // ✅ ENABLED - Use ECharts for horizontal bar charts
  enableDonutChart: true,       // ✅ ENABLED - Use ECharts for donut/pie charts with padAngle styling
  enableHistogram: false,       // Set to true to enable ECharts histogram
  enableVerticalBar: true,      // ✅ ENABLED - Use ECharts for vertical bar charts
  enableSparkline: false,       // Set to true to enable ECharts sparkline
  enableAdvancedCharts: true,   // ✅ ENABLED - Enable new chart types
  enableAnalytics: true,        // ✅ ENABLED - Enable analytics features
  enableInteractions: true,     // ✅ ENABLED - Enable interactive features
  enableExport: true           // ✅ ENABLED - Enable export features
};

/**
 * Simple adapter for basic functionality
 */
export const legacyChartAdapter = {
  shouldUseLegacyComponent: (chartType: ChartType) => {
    switch (chartType) {
      case 'horizontal':
        return !ECHARTS_FEATURE_FLAGS.enableBarChart;
      case 'vertical':
        return !ECHARTS_FEATURE_FLAGS.enableVerticalBar;
      case 'donut':
        return !ECHARTS_FEATURE_FLAGS.enableDonutChart;
      default:
        return !ECHARTS_FEATURE_FLAGS.enableAdvancedCharts;
    }
  }
};

/**
 * Adaptive Bar Chart component that switches between legacy and enhanced versions
 */
export const AdaptiveBarChart = forwardRef<ReactECharts, BaseChartProps & { fieldName?: string }>((props, ref) => {
  if (legacyChartAdapter.shouldUseLegacyComponent('horizontal')) {
    return <LegacyBarChart {...props} />;
  }

  return <SimpleEChartsBar {...props} direction="horizontal" ref={ref} />;
});

AdaptiveBarChart.displayName = 'AdaptiveBarChart';

/**
 * Adaptive Vertical Bar Chart component
 */
export const AdaptiveVerticalBarChart = forwardRef<ReactECharts, BaseChartProps & { fieldName?: string }>((props, ref) => {
  if (legacyChartAdapter.shouldUseLegacyComponent('vertical')) {
    return <LegacyVerticalBarChart {...props} />;
  }

  return <SimpleEChartsBar {...props} direction="vertical" ref={ref} />;
});

AdaptiveVerticalBarChart.displayName = 'AdaptiveVerticalBarChart';

/**
 * Adaptive Donut Chart component with beautiful padAngle styling
 */
export const AdaptiveDonutChart = forwardRef<ReactECharts, BaseChartProps & { fieldName?: string }>((props, ref) => {
  if (legacyChartAdapter.shouldUseLegacyComponent('donut')) {
    return <LegacyDonutChart {...props} />;
  }

  return <SimpleEChartsPie {...props} variant="donut" padAngle={5} ref={ref} />;
});

AdaptiveDonutChart.displayName = 'AdaptiveDonutChart';

/**
 * Adaptive Histogram component (placeholder for future implementation)
 */
export const AdaptiveHistogram = forwardRef<ReactECharts, BaseChartProps & { fieldName?: string }>((props, ref) => {
  // Always use legacy for now until ECharts histogram is implemented
  // Note: Legacy components don't support refs, so we ignore the ref for now
  return <LegacyHistogram {...props} />;
});

AdaptiveHistogram.displayName = 'AdaptiveHistogram';

/**
 * Adaptive Sparkline component (handles both BaseChartProps and SparklineProps)
 */
export const AdaptiveSparkline: React.FC<(BaseChartProps & { fieldName?: string }) | { data: Array<{ x: string; y: number }> }> = (props) => {
  // Check if props has 'data' property (SparklineProps) or 'counts' property (BaseChartProps)
  if ('data' in props) {
    // Direct sparkline data
    return <LegacySparkline data={props.data} />;
  }
  
  // Convert BaseChartProps to sparkline format
  const sparklineData = Object.entries(props.counts).map(([key, value]) => ({
    x: key,
    y: value
  }));
  
  return <LegacySparkline data={sparklineData} />;
};

/**
 * Feature flag configuration component
 * This should be used in admin/development interfaces to control feature rollout
 */
export const EChartsFeatureConfig: React.FC<{
  onConfigChange?: (config: typeof ECHARTS_FEATURE_FLAGS) => void;
}> = ({ onConfigChange }) => {
  const handleFlagChange = (flag: keyof typeof ECHARTS_FEATURE_FLAGS) => {
    const newConfig = {
      ...ECHARTS_FEATURE_FLAGS,
      [flag]: !ECHARTS_FEATURE_FLAGS[flag]
    };
    
    // Update the flags (in a real app, this would persist to storage)
    Object.assign(ECHARTS_FEATURE_FLAGS, newConfig);
    onConfigChange?.(newConfig);
  };

  if (process.env.NODE_ENV !== 'development') {
    return null; // Only show in development
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border rounded-lg shadow-lg p-4 z-50">
      <h3 className="font-bold text-sm mb-2">ECharts Features</h3>
      <div className="space-y-1 text-xs">
        {Object.entries(ECHARTS_FEATURE_FLAGS).map(([flag, enabled]) => (
          <label key={flag} className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={enabled}
              onChange={() => handleFlagChange(flag as keyof typeof ECHARTS_FEATURE_FLAGS)}
              className="w-3 h-3"
            />
            <span className={enabled ? 'text-green-600' : 'text-gray-500'}>
              {flag.replace(/([A-Z])/g, ' $1').toLowerCase()}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
};

/**
 * Hook to get current feature flag status
 */
export const useEChartsFeatures = () => {
  return {
    flags: { ...ECHARTS_FEATURE_FLAGS },
    isEChartsEnabled: (chartType: string) => !legacyChartAdapter.shouldUseLegacyComponent(chartType as ChartType)
  };
};

// Export all adaptive components as default chart components
export {
  AdaptiveBarChart as BarChart,
  AdaptiveVerticalBarChart as VerticalBarChart,
  AdaptiveDonutChart as DonutChart,
  AdaptiveHistogram as Histogram,
  AdaptiveSparkline as Sparkline
};

// Development utilities
export const EChartsDebugInfo: React.FC = () => {
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed top-4 right-4 bg-blue-50 border border-blue-200 rounded p-2 text-xs">
      <div className="font-bold">ECharts Status</div>
      <div>Bar: {ECHARTS_FEATURE_FLAGS.enableBarChart ? '🚀' : '📊'}</div>
      <div>Analytics: {ECHARTS_FEATURE_FLAGS.enableAnalytics ? '📈' : '📊'}</div>
      <div>Export: {ECHARTS_FEATURE_FLAGS.enableExport ? '💾' : '❌'}</div>
    </div>
  );
};