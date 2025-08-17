import React, { useEffect } from 'react';
import { Button } from '@/components/common';
import { BarChart, DonutChart, VerticalBarChart, Histogram } from './charts';
import { useVisualization } from '../context';
import { hashSaltFrom } from '../utils';

export const ChartModal: React.FC = () => {
  const { state, filters, preferences, closeChartModal, updateFilters } = useVisualization();
  const { selectedChart, isChartModalOpen } = state;

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isChartModalOpen) {
        closeChartModal();
      }
    };

    if (isChartModalOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
      document.documentElement.classList.add('modal-open');
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
      document.documentElement.classList.remove('modal-open');
    };
  }, [isChartModalOpen, closeChartModal]);

  if (!isChartModalOpen || !selectedChart) {
    return null;
  }

  const renderChart = () => {
    const chartType = preferences.perFieldChartType[selectedChart.series.fieldId] || preferences.defaultChartType;
    const commonProps = {
      counts: selectedChart.series.counts,
      total: selectedChart.series.total,
      orderedValues: selectedChart.series.orderedValues,
      colors: selectedChart.series.colors,
      showPercent: filters.showPercent,
      neutralMode: selectedChart.series.neutralMode,
      colorSalt: hashSaltFrom(selectedChart.series.fieldId),
      size: 'large' as const
    };

    if (selectedChart.series.type === 'histogram') {
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
      return <Histogram counts={selectedChart.series.counts} />;
    }
    if (chartType === 'vertical') {
      return <VerticalBarChart {...commonProps} />;
    }
    if (chartType === 'donut') {
      return <DonutChart {...commonProps} />;
    }
    return <BarChart {...commonProps} />;
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-20 backdrop-blur-sm flex items-center justify-center"
      style={{ zIndex: 9999, top: '-100px', height: 'calc(100vh + 100px)' }}
      role="presentation"
    >
      <div
        className="bg-white/95 backdrop-blur-md shadow-2xl border border-gray-200/50 w-full max-w-[95vw] xl:max-w-7xl max-h-[95vh] overflow-hidden transform transition-all duration-300 ease-out scale-100 opacity-100 rounded-lg"
        role="dialog"
        aria-modal="true"
        aria-label="Chart details modal"
        style={{ margin: 0 }}
      >
        <div className="flex items-center justify-between p-4 sm:p-6" style={{ margin: 0, paddingTop: '1rem' }}>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-gray-800 truncate">
              {selectedChart.subsectionTitle 
                ? `${selectedChart.subsectionTitle} • ${selectedChart.series.label}` 
                : selectedChart.series.label
              }
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {selectedChart.sectionTitle} • Total: {selectedChart.series.total} responses
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateFilters({ showPercent: !filters.showPercent })}
            >
              {filters.showPercent ? 'Show Counts' : 'Show Percentages'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={closeChartModal}
            >
              Close
            </Button>
          </div>
        </div>
        <div className="pt-0 px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8 overflow-auto max-h-[calc(95vh-140px)]">
          <div className="flex flex-col items-center justify-center min-h-[600px] w-full">
            {renderChart()}
          </div>
        </div>
      </div>
    </div>
  );
};