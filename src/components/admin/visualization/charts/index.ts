// Export simple ECharts components
export { SimpleEChartsBar } from './basic/SimpleEChartsBar';
export { SimpleEChartsPie } from './basic/SimpleEChartsPie';

// Export adaptive/compatibility components (these switch between legacy and enhanced based on feature flags)
export {
  AdaptiveBarChart,
  AdaptiveVerticalBarChart,
  AdaptiveDonutChart,
  AdaptiveHistogram,
  AdaptiveSparkline,
  EChartsFeatureConfig,
  EChartsDebugInfo,
  useEChartsFeatures,
  legacyChartAdapter
} from '../compatibility/LegacyChartAdapter';