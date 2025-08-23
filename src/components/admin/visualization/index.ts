// Main component
export { AdminVisualizationPage } from './AdminVisualizationPage';

// Context and hooks
export { VisualizationProvider, useVisualization, useVisualizationPreferences } from './context';
export { useVisualizationData, useFilters, useSectionData } from './hooks';

// Legacy components
export * from './components';

// Enhanced ECharts components and utilities (aliased to avoid conflicts)
export {
  SimpleEChartsBar,
  SimpleEChartsPie,
  legacyChartAdapter,
  EChartsFeatureConfig,
  EChartsDebugInfo,
  useEChartsFeatures,
  AdaptiveBarChart,
  AdaptiveVerticalBarChart,
  AdaptiveDonutChart,
  AdaptiveHistogram,
  AdaptiveSparkline
} from './charts';


// Utils
export * from './utils';

// Types
export * from './types';