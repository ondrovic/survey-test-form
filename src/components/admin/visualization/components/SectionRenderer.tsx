import React from 'react';
import { Button } from '@/components/common';
import { getOrderedSectionContent } from '@/utils/section-content.utils';
import { BarChart, DonutChart, VerticalBarChart, Histogram } from './charts';
import { AggregatedSeries, ChartModalData } from '../types';
import { useVisualization } from '../context';
import { hashSaltFrom } from '../utils';

interface SectionRendererProps {
  section: any;
  fieldIdToSeries: Record<string, AggregatedSeries>;
  seriesMatchesSearch: (s: AggregatedSeries, context?: { section?: string; subsection?: string }) => boolean;
}

export const SectionRenderer: React.FC<SectionRendererProps> = ({
  section,
  fieldIdToSeries,
  seriesMatchesSearch
}) => {
  const { filters, state, preferences, toggleSectionCollapsed, openChartModal } = useVisualization();

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

  if (allCharts.length === 0) return null;

  const renderChart = (chartItem: ChartModalData) => {
    const chartType = preferences.perFieldChartType[chartItem.series.fieldId] || preferences.defaultChartType;
    const commonProps = {
      counts: chartItem.series.counts,
      total: chartItem.series.total,
      orderedValues: chartItem.series.orderedValues,
      colors: chartItem.series.colors,
      showPercent: filters.showPercent,
      neutralMode: chartItem.series.neutralMode,
      colorSalt: hashSaltFrom(chartItem.series.fieldId)
    };

    if (chartItem.series.type === 'histogram') {
      return <Histogram counts={chartItem.series.counts} />;
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
    if (totalCharts <= 2) return 'grid-cols-1 md:grid-cols-2';
    if (donutCount >= totalCharts * 0.6) {
      if (hasLongTitles || hasLongLegendLabels) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
    }
    if (histogramCount >= totalCharts * 0.5) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
    if (barCount >= totalCharts * 0.7) return 'grid-cols-1 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-1';
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
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
          <div className="text-xs text-gray-500 bg-gray-100 px-3 py-2 rounded-md">
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

              return (
                <div
                  key={chartItem.series.fieldId}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-4 min-w-0 transition-all duration-200 hover:shadow-md hover:border-gray-300 cursor-pointer group"
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
                  <div className="flex items-start justify-between mb-4 gap-3">
                    <div className="flex-1 min-w-0">
                      <h4
                        className={`font-medium text-gray-800 ${isLongTitle ? 'text-sm leading-tight' : 'text-sm'} ${isLongTitle ? 'line-clamp-2' : 'truncate'}`}
                        title={fullTitle}
                      >
                        {fullTitle}
                      </h4>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </div>
                  </div>
                  <div className={`flex items-center justify-center ${(() => {
                    const chartType = preferences.perFieldChartType[chartItem.series.fieldId] || preferences.defaultChartType;
                    if (chartItem.series.type === 'histogram') return 'min-h-[160px]';
                    if (chartType === 'donut') return 'min-h-[200px]';
                    if (chartType === 'vertical') return 'min-h-[220px]';
                    return 'min-h-[280px]';
                  })()}`}>
                    {renderChart(chartItem)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};