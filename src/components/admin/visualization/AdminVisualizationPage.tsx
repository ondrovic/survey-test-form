import { Button, LoadingSpinner, ScrollableContent } from '@/components/common';
import { baseRoute } from '@/routes';
import React, { useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  AdvancedFilters,
  ChartControls,
  CustomDateRange,
  QuickRangeFilter,
  SectionRenderer,
  StatsPanel
} from './components';
import { VisualizationProvider, useVisualization } from './context';
import { useFilters, useSectionData, useVisualizationData } from './hooks';

const VisualizationContent: React.FC = React.memo(() => {
  const { instanceId } = useParams<{ instanceId: string }>();
  const navigate = useNavigate();
  const { state, updateState, filters } = useVisualization();

  // Load data
  const { loading, error, config, responses, instance, computeAggregatedSeries } = useVisualizationData(instanceId);

  // Filter data
  const { filteredResponses, submissionsByDay, todayCount, seriesMatchesSearch } = useFilters(responses);

  // Compute series - memoize to prevent recalculation on every render
  const series = useMemo(() => {
    return computeAggregatedSeries(filteredResponses);
  }, [computeAggregatedSeries, filteredResponses]);

  // Section data - memoize to prevent recalculation on every render
  const { orderedSections, fieldIdToSeries, sectionNames, subsectionsBySection, availableFields } = useSectionData(config, series);

  // Memoize the filtered sections to prevent unnecessary re-renders
  const filteredSections = useMemo(() => {
    return orderedSections.filter((section) =>
      filters.sectionFilter === 'all' || section.title === filters.sectionFilter
    );
  }, [orderedSections, filters.sectionFilter]);

  // Memoize the chart grid content to prevent unnecessary re-renders
  const chartGridContent = useMemo(() => {
    if (series.length === 0) {
      return <p className="text-gray-500">No aggregations available yet.</p>;
    }

    return (
      <div className="space-y-10 pb-4">
        {filteredSections.map((section) => (
          <SectionRenderer
            key={section.id}
            section={section}
            fieldIdToSeries={fieldIdToSeries}
            seriesMatchesSearch={seriesMatchesSearch}
          />
        ))}
      </div>
    );
  }, [series.length, filteredSections, fieldIdToSeries, seriesMatchesSearch]);

  // Memoize the entire ScrollableContent children to prevent unnecessary re-renders
  const scrollableChildren = useMemo(() => (
    <div className="w-full">
      {chartGridContent}
    </div>
  ), [chartGridContent]);

  // Memoize the updateState callback to prevent unnecessary re-renders
  const handleToggleAdvanced = useCallback(() => {
    updateState({ showAdvanced: !state.showAdvanced });
  }, [state.showAdvanced, updateState]);

  if (loading) return <LoadingSpinner fullScreen text="Loading data..." />;

  if (error) {
    return (
      <div className="min-h-screen bg-amber-50/30 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-gray-700">{error}</p>
          <Button onClick={() => navigate(`${baseRoute}/admin`)} variant="primary">
            Back to Admin
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-amber-50/30">
      <div className="w-full h-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Survey Data Visualization</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="form" onClick={() => navigate(`${baseRoute}/admin`)}>
              Back
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 flex-1 flex flex-col min-h-0 w-full">
          {/* Stats Panel */}
          <StatsPanel
            instanceId={instanceId}
            instance={instance}
            totalResponses={responses.length}
            startDate={filters.startDate}
            endDate={filters.endDate}
            submissionsByDay={submissionsByDay}
            todayCount={todayCount}
            totalFiltered={filteredResponses.length}
          />

          {/* Filters */}
          <div className="space-y-3 mb-6 flex-shrink-0">
            <div className="flex flex-wrap items-end gap-2">
              <QuickRangeFilter />
              <CustomDateRange />
              <ChartControls availableFields={availableFields} />
              <Button
                variant="outline"
                size="form"
                onClick={handleToggleAdvanced}
              >
                {state.showAdvanced ? 'Hide filters' : 'More filters'}
              </Button>
            </div>

            <AdvancedFilters
              sectionNames={sectionNames}
              subsectionsBySection={subsectionsBySection}
              orderedSections={orderedSections}
            />
          </div>


          {/* Chart Grid */}
          <div>
            <ScrollableContent
              key={`chart-grid-${filters.sectionFilter}-${filters.subsectionFilter}-${filters.search}`}
              showScrollIndicators={true}
              smoothScroll={true}
              mobileOptimized={false}
            >
              {scrollableChildren}
            </ScrollableContent>
          </div>
        </div>
      </div>
    </div>
  );
});

VisualizationContent.displayName = 'VisualizationContent';

export const AdminVisualizationPage: React.FC = () => {
  return (
    <VisualizationProvider>
      <VisualizationContent />
    </VisualizationProvider>
  );
};