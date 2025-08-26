import React, { useEffect, useRef, useState } from 'react';
import type ReactECharts from 'echarts-for-react';
import { Button } from '@/components/common';
import { 
  AdaptiveBarChart as BarChart,
  AdaptiveDonutChart as DonutChart, 
  AdaptiveVerticalBarChart as VerticalBarChart,
  AdaptiveHistogram as Histogram 
} from '../charts';
import { useVisualization } from '../context';
import { hashSaltFrom } from '../utils';
import { saveChartAsImage, generateChartFilename } from '../utils/chart-export';

export const ChartModal: React.FC = () => {
  const { state, filters, preferences, closeChartModal } = useVisualization();
  const { selectedChart, isChartModalOpen } = state;
  const modalChartRef = useRef<ReactECharts>(null);
  const [showLegend, setShowLegend] = useState(true); // Default to true for large modal

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

  const handleSaveModalImage = () => {
    if (!selectedChart) return;
    
    const filename = generateChartFilename(
      selectedChart.sectionTitle,
      selectedChart.subsectionTitle,
      selectedChart.series.label
    );
    saveChartAsImage(modalChartRef, `${filename}_large`, 'png', 2, '#ffffff');
  };

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
      size: 'large' as const,
      fieldName: selectedChart.series.label, // Pass the field name for ECharts
      ...(chartType === 'donut' && { showLegend: showLegend }), // Only pass showLegend for charts that support it
      ref: modalChartRef
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
            {(() => {
              const chartType = preferences.perFieldChartType[selectedChart.series.fieldId] || preferences.defaultChartType;
              const supportsLegend = chartType === 'donut';
              
              console.log('ChartModal Debug:', { chartType, supportsLegend, showLegend });
              
              return supportsLegend ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    console.log('Legend toggle clicked! Current showLegend:', showLegend);
                    setShowLegend(!showLegend);
                  }}
                  className="flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  {showLegend ? 'Hide' : 'Show'} Legend
                </Button>
              ) : null;
            })()}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveModalImage}
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Save Image
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