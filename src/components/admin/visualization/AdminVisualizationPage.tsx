import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, LoadingSpinner, ScrollableContent } from '@/components/common';
import { baseRoute } from '@/routes';

import { VisualizationProvider, useVisualization } from './context';
import { useVisualizationData, useFilters, useSectionData } from './hooks';
import { 
  StatsPanel, 
  ChartModal, 
  SectionRenderer,
  QuickRangeFilter,
  CustomDateRange,
  ChartControls,
  AdvancedFilters,
  FieldHideControls
} from './components';

const VisualizationContent: React.FC = () => {
  const { instanceId } = useParams<{ instanceId: string }>();
  const navigate = useNavigate();
  const { state, updateState, filters } = useVisualization();

  // Load data
  const { loading, error, config, responses, computeAggregatedSeries } = useVisualizationData(instanceId);
  
  // Filter data
  const { filteredResponses, submissionsByDay, todayCount, seriesMatchesSearch } = useFilters(responses);
  
  // Compute series
  const series = computeAggregatedSeries(filteredResponses);
  
  // Section data
  const { orderedSections, fieldIdToSeries, sectionNames, subsectionsBySection, availableFields } = useSectionData(config, series);

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
    <div className={`min-h-screen flex flex-col ${state.isChartModalOpen ? 'bg-black bg-opacity-20' : 'bg-amber-50/30'}`}>
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
              <ChartControls />
              <Button 
                variant="outline" 
                size="form" 
                onClick={() => updateState({ showAdvanced: !state.showAdvanced })}
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

          {/* Field Hide Controls */}
          <FieldHideControls availableFields={availableFields} />

          {/* Chart Grid */}
          <div>
            <ScrollableContent showScrollIndicators={true} smoothScroll={true} mobileOptimized={false}>
              <div className="w-full">
                {series.length === 0 ? (
                  <p className="text-gray-500">No aggregations available yet.</p>
                ) : (
                  <div className="space-y-10 pb-4">
                    {orderedSections
                      .filter((section) => filters.sectionFilter === 'all' || section.title === filters.sectionFilter)
                      .map((section) => (
                        <SectionRenderer
                          key={section.id}
                          section={section}
                          fieldIdToSeries={fieldIdToSeries}
                          seriesMatchesSearch={seriesMatchesSearch}
                        />
                      ))}
                  </div>
                )}
              </div>
            </ScrollableContent>
          </div>
        </div>
      </div>

      {/* Chart Modal */}
      <ChartModal />
    </div>
  );
};

export const AdminVisualizationPage: React.FC = () => {
  return (
    <VisualizationProvider>
      <VisualizationContent />
    </VisualizationProvider>
  );
};