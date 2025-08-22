import { ComposeOption } from 'echarts/core';
import {
  BarSeriesOption,
  LineSeriesOption,
  PieSeriesOption,
  ScatterSeriesOption,
  HeatmapSeriesOption,
  TreemapSeriesOption,
  ParallelSeriesOption,
  SankeySeriesOption
} from 'echarts/charts';
import {
  TitleComponentOption,
  TooltipComponentOption,
  GridComponentOption,
  LegendComponentOption,
  VisualMapComponentOption,
  DataZoomComponentOption,
  BrushComponentOption,
  ToolboxComponentOption
} from 'echarts/components';
import type { AggregatedSeries, ChartType, BaseChartProps } from './types';

// Enhanced chart types for analytics
export type AnalyticsChartType = ChartType | 'heatmap' | 'parallel' | 'treemap' | 'sankey' | 'scatter' | 'line';

// Comprehensive ECharts option type for analytics
export type AnalyticsEChartsOption = ComposeOption<
  | BarSeriesOption
  | LineSeriesOption
  | PieSeriesOption
  | ScatterSeriesOption
  | HeatmapSeriesOption
  | TreemapSeriesOption
  | ParallelSeriesOption
  | SankeySeriesOption
  | TitleComponentOption
  | TooltipComponentOption
  | GridComponentOption
  | LegendComponentOption
  | VisualMapComponentOption
  | DataZoomComponentOption
  | BrushComponentOption
  | ToolboxComponentOption
>;

// Enhanced aggregated series with ECharts-specific data
export interface EnhancedAggregatedSeries extends AggregatedSeries {
  chartType?: AnalyticsChartType;
  echartsData?: {
    source?: any[];
    heatmapData?: Array<[number, number, number]>;
    parallelData?: number[][];
    treeData?: TreeNode[];
    sankeyData?: {
      nodes: SankeyNode[];
      links: SankeyLink[];
    };
    scatterData?: Array<[number, number, number?]>;
  };
  analytics?: {
    statistics?: StatisticalSummary;
    correlations?: CorrelationMatrix;
    outliers?: OutlierData[];
    clusters?: ClusterData[];
  };
}

// Statistical analysis interfaces
export interface StatisticalSummary {
  mean?: number;
  median?: number;
  mode?: string | number;
  standardDeviation?: number;
  variance?: number;
  min?: number;
  max?: number;
  quartiles?: {
    q1: number;
    q2: number;
    q3: number;
  };
  percentiles?: Record<number, number>;
  distribution?: 'normal' | 'skewed' | 'uniform' | 'bimodal' | 'unknown';
}

export interface CorrelationMatrix {
  fieldPairs: Array<{
    field1: string;
    field2: string;
    correlation: number;
    significance: number;
    method: 'pearson' | 'spearman' | 'kendall';
  }>;
}

export interface OutlierData {
  value: any;
  score: number;
  method: 'zscore' | 'iqr' | 'isolation' | 'lof';
  respondentId?: string;
}

export interface ClusterData {
  clusterId: number;
  centroid: number[];
  members: Array<{
    respondentId: string;
    distance: number;
  }>;
  size: number;
}

// Tree structure for treemap and hierarchical data
export interface TreeNode {
  name: string;
  value?: number;
  children?: TreeNode[];
  itemStyle?: {
    color?: string;
  };
  label?: {
    show?: boolean;
    formatter?: string;
  };
}

// Sankey diagram structures
export interface SankeyNode {
  name: string;
  category?: number;
  itemStyle?: {
    color?: string;
  };
}

export interface SankeyLink {
  source: string | number;
  target: string | number;
  value: number;
}

// Enhanced chart props with ECharts capabilities
export interface EnhancedChartProps extends BaseChartProps {
  chartType?: AnalyticsChartType;
  series: EnhancedAggregatedSeries;
  interactions?: {
    brushing?: boolean;
    drilling?: boolean;
    linking?: boolean;
    zooming?: boolean;
  };
  analytics?: {
    showStatistics?: boolean;
    showCorrelations?: boolean;
    highlightOutliers?: boolean;
    showClusters?: boolean;
  };
  export?: {
    enabled?: boolean;
    formats?: ('png' | 'svg' | 'pdf' | 'excel')[];
  };
  theme?: string;
  animation?: boolean | {
    duration?: number;
    easing?: string;
  };
}

// Real-time data update interfaces
export interface RealTimeConfig {
  enabled: boolean;
  interval?: number;
  batchSize?: number;
  bufferSize?: number;
  onUpdate?: (data: EnhancedAggregatedSeries[]) => void;
  onError?: (error: Error) => void;
}

// Performance optimization interfaces
export interface PerformanceConfig {
  virtualization?: {
    enabled: boolean;
    threshold: number;
  };
  sampling?: {
    enabled: boolean;
    maxPoints: number;
    strategy: 'random' | 'systematic' | 'stratified';
  };
  caching?: {
    enabled: boolean;
    ttl: number;
    maxSize: number;
  };
  webWorkers?: {
    enabled: boolean;
    maxWorkers: number;
  };
  animation?: boolean;
}

// Export configuration
export interface ExportConfig {
  format: 'png' | 'svg' | 'pdf' | 'excel' | 'json';
  quality?: number;
  width?: number;
  height?: number;
  backgroundColor?: string;
  pixelRatio?: number;
  excludeComponents?: string[];
  filename?: string;
}

// Chart interaction events
export interface ChartEvent {
  type: 'click' | 'brush' | 'zoom' | 'drill';
  data: any;
  seriesIndex?: number;
  dataIndex?: number;
  name?: string;
  value?: any;
  event?: MouseEvent;
}

// Enhanced modal data with analytics
export interface EnhancedChartModalData {
  type: 'field' | 'subsection' | 'analytics';
  data: any;
  series: EnhancedAggregatedSeries;
  sectionTitle: string;
  subsectionTitle?: string;
  analytics?: {
    statisticalSummary?: StatisticalSummary;
    correlations?: CorrelationMatrix;
    outliers?: OutlierData[];
    clusters?: ClusterData[];
  };
  export?: ExportConfig;
}

// Data transformation utilities type definitions
export type DataTransformer<T = any> = (data: AggregatedSeries[]) => T;

export interface DataAdapter {
  toEChartsFormat: DataTransformer<AnalyticsEChartsOption>;
  toHeatmapData: DataTransformer<Array<[number, number, number]>>;
  toParallelData: DataTransformer<number[][]>;
  toTreeData: DataTransformer<TreeNode[]>;
  toSankeyData: DataTransformer<{ nodes: SankeyNode[]; links: SankeyLink[] }>;
  toScatterData: DataTransformer<Array<[number, number, number?]>>;
}

// Theme configuration
export interface AnalyticsTheme {
  name: string;
  colorPalette: string[];
  backgroundColor: string;
  textStyle: {
    color: string;
    fontFamily: string;
    fontSize: number;
  };
  animation: boolean;
  animationDuration: number;
  grid: {
    borderColor: string;
    backgroundColor: string;
  };
  tooltip: {
    backgroundColor: string;
    borderColor: string;
    textStyle: {
      color: string;
    };
  };
}

// Compatibility layer types for migration
export interface LegacyChartAdapter {
  convertLegacyProps: (props: BaseChartProps) => EnhancedChartProps;
  convertLegacySeries: (series: AggregatedSeries) => EnhancedAggregatedSeries;
  shouldUseLegacyComponent: (chartType: ChartType | AnalyticsChartType) => boolean;
}