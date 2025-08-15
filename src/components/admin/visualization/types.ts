export interface AggregatedSeries {
  fieldId: string;
  label: string;
  section?: string;
  counts: Record<string, number>;
  total: number;
  type?: 'bar' | 'histogram';
  orderedValues?: string[];
  colors?: Record<string, string | undefined>;
  neutralMode?: boolean;
}

export type ChartType = 'horizontal' | 'vertical' | 'donut';

export interface VisualizationPreferences {
  defaultChartType: ChartType;
  setDefaultChartType: (t: ChartType) => void;
  perFieldChartType: Record<string, ChartType | undefined>;
  setPerFieldChartType: (fieldId: string, t: ChartType | undefined) => void;
}

export interface ChartModalData {
  type: 'field' | 'subsection';
  data: any;
  series: AggregatedSeries;
  sectionTitle: string;
  subsectionTitle?: string;
}

export interface FilterState {
  startDate: string;
  endDate: string;
  showPercent: boolean;
  sectionFilter: string;
  subsectionFilter: string;
  search: string;
  quickRange: 'all' | '7d' | '30d' | 'month' | 'custom';
}

export interface VisualizationState {
  collapsedSections: Set<string>;
  collapsedSubsections: Set<string>;
  hiddenFields: Set<string>;
  showAdvanced: boolean;
  showHideFieldsUI: boolean;
  selectedChart: ChartModalData | null;
  isChartModalOpen: boolean;
}

export interface OptionSets {
  ratingScalesById: Record<string, any>;
  ratingScalesByName: Record<string, any>;
  radioSetsById: Record<string, any>;
  radioSetsByName: Record<string, any>;
  selectSetsById: Record<string, any>;
  selectSetsByName: Record<string, any>;
  multiSetsById: Record<string, any>;
  multiSetsByName: Record<string, any>;
}

export interface ChartSize {
  size?: 'normal' | 'large';
}

export interface BaseChartProps extends ChartSize {
  counts: Record<string, number>;
  total: number;
  orderedValues?: string[];
  colors?: Record<string, string | undefined>;
  showPercent?: boolean;
  neutralMode?: boolean;
  colorSalt?: number;
}