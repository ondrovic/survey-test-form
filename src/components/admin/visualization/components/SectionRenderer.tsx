import { Button } from '@/components/common';
import { getOrderedSectionContent } from '@/utils/section-content.utils';
import React, { useMemo } from 'react';
import type ReactECharts from 'echarts-for-react';
import { useVisualization } from '../context';
import { AggregatedSeries, ChartModalData } from '../types';
import { hashSaltFrom } from '../utils';
import { saveChartAsImage, generateChartFilename } from '../utils/chart-export';
import { 
  AdaptiveBarChart as BarChart,
  AdaptiveDonutChart as DonutChart, 
  AdaptiveHistogram as Histogram,
  AdaptiveVerticalBarChart as VerticalBarChart 
} from '../charts';

interface SectionRendererProps {
  section: any;
  fieldIdToSeries: Record<string, AggregatedSeries>;
  seriesMatchesSearch: (s: AggregatedSeries, context?: { section?: string; subsection?: string }) => boolean;
}

export const SectionRenderer: React.FC<SectionRendererProps> = React.memo(({
  section,
  fieldIdToSeries,
  seriesMatchesSearch
}) => {
  const { filters, state, preferences, toggleSectionCollapsed, openChartModal, hideField } = useVisualization();

  const contentItems = getOrderedSectionContent(section);
  const renderedFieldIds = new Set<string>();

  // Collect all charts for this section
  const allCharts: Array<ChartModalData> = [];

  contentItems.forEach((ci) => {
    if (ci.type === 'subsection') {
      const subsection: any = ci.data;
      if (filters.subsectionFilter !== 'all') {
        // Extract subsection name from filter value
        const filterSubsectionName = filters.subsectionFilter.split(' • ')[1] || filters.subsectionFilter;
        if (subsection.title !== filterSubsectionName) return;
      }
      const charts = subsection.fields
        .map((f: any) => fieldIdToSeries[f.id])
        .filter((s: any) => !!s && !state.hiddenFields.has(s.fieldId) && !renderedFieldIds.has(s.fieldId) && seriesMatchesSearch(s, { section: section.title, subsection: subsection.title }));
      charts.forEach((s: AggregatedSeries) => {
        renderedFieldIds.add(s.fieldId);
        allCharts.push({
          type: 'subsection',
          data: subsection,
          series: s,
          sectionTitle: section.title,
          subsectionTitle: subsection.title
        });
      });
    } else if (ci.type === 'field') {
      const field: any = ci.data;
      const s = fieldIdToSeries[field.id];
      if (!s || !seriesMatchesSearch(s, { section: section.title }) || state.hiddenFields.has(s.fieldId) || renderedFieldIds.has(s.fieldId)) return;
      renderedFieldIds.add(s.fieldId);
      allCharts.push({
        type: 'field',
        data: field,
        series: s,
        sectionTitle: section.title
      });
    }
  });

  // Create refs for all charts
  const chartRefs = useMemo(() => {
    if (allCharts.length === 0) return {};
    return allCharts.reduce((acc, chart) => {
      acc[chart.series.fieldId] = React.createRef<ReactECharts>();
      return acc;
    }, {} as Record<string, React.RefObject<ReactECharts | null>>);
  }, [allCharts]);

  if (allCharts.length === 0) return null;

  const renderChart = (chartItem: ChartModalData, chartRef: React.RefObject<ReactECharts | null>) => {
    const chartType = preferences.perFieldChartType[chartItem.series.fieldId] || preferences.defaultChartType;
    const commonProps = {
      counts: chartItem.series.counts,
      total: chartItem.series.total,
      orderedValues: chartItem.series.orderedValues,
      colors: chartItem.series.colors,
      showPercent: filters.showPercent,
      neutralMode: chartItem.series.neutralMode,
      colorSalt: hashSaltFrom(chartItem.series.fieldId),
      fieldName: chartItem.series.label, // Pass the field name for ECharts
      ref: chartRef
    };

    if (chartItem.series.type === 'histogram') {
      // For histogram data, allow user to choose chart type
      if (chartType === 'vertical') {
        return <VerticalBarChart {...commonProps} />;
      }
      if (chartType === 'donut') {
        return <DonutChart {...commonProps} />;
      }
      if (chartType === 'horizontal') {
        return <BarChart {...commonProps} />;
      }
      // Default to histogram chart
      return <Histogram {...commonProps} />;
    }
    if (chartType === 'vertical') {
      return <VerticalBarChart {...commonProps} />;
    }
    if (chartType === 'donut') {
      return <DonutChart {...commonProps} />;
    }
    return <BarChart {...commonProps} />;
  };

  const getGridClasses = () => {
    // Determine optimal grid based on chart types and content length
    const chartTypes = allCharts.map(item => {
      const chartType = preferences.perFieldChartType[item.series.fieldId] || preferences.defaultChartType;
      return item.series.type === 'histogram' ? 'histogram' : chartType;
    });

    // Count different chart types
    const donutCount = chartTypes.filter(t => t === 'donut').length;
    const histogramCount = chartTypes.filter(t => t === 'histogram').length;
    const barCount = chartTypes.filter(t => t === 'horizontal' || t === 'vertical').length;
    const totalCharts = chartTypes.length;

    // Check for long titles that need more space
    const hasLongTitles = allCharts.some(item => {
      const title = item.subsectionTitle ? `${item.subsectionTitle} • ${item.series.label}` : item.series.label;
      return title.length > 40;
    });

    // Check for donut charts with long legend labels
    const hasLongLegendLabels = allCharts.some(item => {
      const chartType = preferences.perFieldChartType[item.series.fieldId] || preferences.defaultChartType;
      if (chartType === 'donut') {
        const entries = Object.keys(item.series.counts);
        return entries.some(label => (label || '').length > 25);
      }
      return false;
    });

    // Adaptive grid logic
    if (totalCharts <= 2) return 'grid-cols-1 lg:grid-cols-2';
    if (donutCount >= totalCharts * 0.6) {
      if (hasLongTitles || hasLongLegendLabels) return 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3';
      return 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4';
    }
    if (histogramCount >= totalCharts * 0.5) return 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4';
    if (barCount >= totalCharts * 0.7) return 'grid-cols-1';
    return 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4';
  };

  return (
    <div key={section.id} className="border-b pb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">{section.title}</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => toggleSectionCollapsed(section.id)}
          className="text-xs"
        >
          {state.collapsedSections.has(section.id) ? 'Expand' : 'Collapse'}
        </Button>
      </div>

      {!state.collapsedSections.has(section.id) && (
        <div className="space-y-6">
          {/* Grid layout indicator */}
          <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-md">
            Layout: {(() => {
              const chartTypes = allCharts.map(item => {
                const chartType = preferences.perFieldChartType[item.series.fieldId] || preferences.defaultChartType;
                return item.series.type === 'histogram' ? 'histogram' : chartType;
              });
              const donutCount = chartTypes.filter(t => t === 'donut').length;
              const histogramCount = chartTypes.filter(t => t === 'histogram').length;
              const barCount = chartTypes.filter(t => t === 'horizontal' || t === 'vertical').length;
              const totalCharts = chartTypes.length;

              if (totalCharts <= 2) return 'Compact (2 charts)';
              if (donutCount >= totalCharts * 0.6) return `Dense (${donutCount} donut charts)`;
              if (histogramCount >= totalCharts * 0.5) return `Standard (${histogramCount} histograms)`;
              if (barCount >= totalCharts * 0.7) return `Full-width (${barCount} bar charts)`;
              return `Mixed (${totalCharts} charts)`;
            })()}
          </div>

          <div className={`grid gap-6 ${getGridClasses()}`}>
            {allCharts.map((chartItem) => {
              const fullTitle = chartItem.subsectionTitle
                ? `${chartItem.subsectionTitle} • ${chartItem.series.label}`
                : chartItem.series.label;
              const isLongTitle = fullTitle.length > 40;
              const chartRef = chartRefs[chartItem.series.fieldId];

              const handleSaveImage = (e: React.MouseEvent) => {
                e.stopPropagation();
                const filename = generateChartFilename(
                  chartItem.sectionTitle,
                  chartItem.subsectionTitle,
                  chartItem.series.label
                );
                // Use dynamic background color based on theme
                const isDarkMode = document.documentElement.classList.contains('dark');
                const bgColor = isDarkMode ? '#1f2937' : '#ffffff';
                saveChartAsImage(chartRef, filename, 'png', 2, bgColor);
              };

              return (
                <div
                  key={chartItem.series.fieldId}
                  className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-4 min-w-0 transition-all duration-200 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-500 group"
                >
                  <div className="flex items-start justify-between mb-4 gap-3">
                    <div className="flex-1 min-w-0">
                      <h4
                        className={`font-medium text-gray-800 dark:text-gray-200 ${isLongTitle ? 'text-sm leading-tight' : 'text-sm'} ${isLongTitle ? 'line-clamp-2' : 'truncate'}`}
                        title={fullTitle}
                      >
                        {fullTitle}
                      </h4>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          hideField(chartItem.series.fieldId);
                        }}
                        className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors duration-150"
                        title="Hide this chart"
                        aria-label={`Hide ${fullTitle} chart`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <button
                        onClick={handleSaveImage}
                        className="p-1 text-gray-400 dark:text-gray-500 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors duration-150"
                        title="Save chart as image"
                        aria-label={`Save ${fullTitle} chart as image`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => openChartModal(chartItem)}
                        className="p-1 text-gray-400 dark:text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors duration-150"
                        title="Open chart in full view"
                        aria-label={`Open ${fullTitle} chart in full view`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div 
                    className={`flex items-center justify-center cursor-pointer ${(() => {
                      const chartType = preferences.perFieldChartType[chartItem.series.fieldId] || preferences.defaultChartType;
                      if (chartItem.series.type === 'histogram') return 'min-h-[160px]';
                      if (chartType === 'donut') return 'min-h-[200px]';
                      if (chartType === 'vertical') return 'min-h-[220px]';
                      return 'min-h-[280px]';
                    })()}`}
                    onClick={() => openChartModal(chartItem)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openChartModal(chartItem);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`Open ${chartItem.subsectionTitle ? chartItem.subsectionTitle + ' • ' : ''}${chartItem.series.label} chart in full view`}
                  >
                    {renderChart(chartItem, chartRef)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});

SectionRenderer.displayName = 'SectionRenderer';