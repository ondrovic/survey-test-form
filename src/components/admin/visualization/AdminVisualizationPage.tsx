import { Button, ScrollableContent, SkeletonPage } from "@/components/common";
import { routes } from "@/routes";
import { TrendingUp } from "lucide-react";
import React, { useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";

import {
  AdvancedFilters,
  ChartControls,
  CustomDateRange,
  QuickRangeFilter,
  SectionRenderer,
  StatsPanel,
} from "./components";
import { VisualizationProvider, useVisualization } from "./context";
import { useFilters, useSectionData, useVisualizationData } from "./hooks";

const VisualizationContent: React.FC = React.memo(() => {
  const { instanceId } = useParams<{ instanceId: string }>();
  const { state, updateState, filters } = useVisualization();

  // Load data
  const {
    loading,
    error,
    config,
    responses,
    instance,
    computeAggregatedSeries,
  } = useVisualizationData(instanceId);

  // Filter data
  const {
    filteredResponses,
    submissionsByDay,
    todayCount,
    seriesMatchesSearch,
  } = useFilters(responses);

  // Compute series - memoize to prevent recalculation on every render
  const series = useMemo(() => {
    return computeAggregatedSeries(filteredResponses);
  }, [computeAggregatedSeries, filteredResponses]);

  // Section data - memoize to prevent recalculation on every render
  const {
    orderedSections,
    fieldIdToSeries,
    // sectionNames,
    // subsectionsBySection,
    availableFields,
  } = useSectionData(config, series);

  // Memoize the filtered sections to prevent unnecessary re-renders
  const filteredSections = useMemo(() => {
    return orderedSections.filter(
      (section) =>
        filters.sectionFilter === "all" ||
        section.title === filters.sectionFilter
    );
  }, [orderedSections, filters.sectionFilter]);

  // Memoize the chart grid content to prevent unnecessary re-renders
  const chartGridContent = useMemo(() => {
    if (series.length === 0) {
      return <p className="text-gray-500 dark:text-gray-400">No aggregations available yet.</p>;
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
  const scrollableChildren = useMemo(
    () => <div className="w-full">{chartGridContent}</div>,
    [chartGridContent]
  );

  // Memoize the updateState callback to prevent unnecessary re-renders
  const handleToggleAdvanced = useCallback(() => {
    updateState({ showAdvanced: !state.showAdvanced });
  }, [state.showAdvanced, updateState]);

  // Handle analytics button click
  const handleAnalytics = useCallback(() => {
    if (instanceId) {
      const url = `${window.location.origin}/${routes.adminAnalytics(
        instanceId
      )}`;
      window.open(url, "_blank");
    }
  }, [instanceId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-blue-50/30 dark:bg-gray-900">
        <div className="w-full h-full px-4 sm:px-6 lg:px-8 py-8">
          <SkeletonPage 
            hasHeader={true}
            hasNavigation={true}
            contentType="cards"
            itemCount={8}
            className="max-w-7xl mx-auto"
          />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-blue-50/30 dark:bg-gray-900">
        <div className="w-full h-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col min-h-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="form"
                onClick={() =>
                  (window.location.href = `${window.location.origin}/${routes.admin}`)
                }
              >
                Back to Admin
              </Button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex-1 flex flex-col min-h-0 w-full">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Survey Data Visualization
              </h2>
              <p className="text-gray-700 dark:text-gray-300">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-blue-50/30 dark:bg-gray-900">
      <div className="w-full h-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="form"
              onClick={() =>
                (window.location.href = `${window.location.origin}/${routes.admin}`)
              }
            >
              Back to Admin
            </Button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex-1 flex flex-col min-h-0 w-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Survey Data Visualization
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Interactive charts and insights from your survey data
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleAnalytics}
                variant="outline"
                size="form"
                disabled={!instanceId}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Analytics
              </Button>
              <QuickRangeFilter />
            </div>
          </div>

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
          <div className="mb-6 flex-shrink-0">
            <div className="flex flex-wrap items-end gap-2">
              {/* Reserve space for advanced filters to prevent shifting */}
              <div style={{ minWidth: 280 /* adjust as needed */ }}>
                {state.showAdvanced ? (
                  <AdvancedFilters orderedSections={orderedSections} />
                ) : null}
              </div>
              <CustomDateRange />
              <ChartControls availableFields={availableFields} />
              <Button
                variant="outline"
                size="form"
                onClick={handleToggleAdvanced}
                className="min-w-[120px]" // Ensures consistent button width
              >
                {state.showAdvanced ? "Hide filters" : "More filters"}
              </Button>
            </div>
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

VisualizationContent.displayName = "VisualizationContent";

export const AdminVisualizationPage: React.FC = () => {
  return (
    <VisualizationProvider>
      <VisualizationContent />
    </VisualizationProvider>
  );
};
