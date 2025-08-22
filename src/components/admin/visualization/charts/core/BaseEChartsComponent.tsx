import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import ReactECharts from 'echarts-for-react';
import { EChartsInstance } from 'echarts-for-react/lib/types';
import { 
  AnalyticsEChartsOption, 
  ChartEvent, 
  PerformanceConfig,
  ExportConfig
} from '../../echarts-types';
import { 
  getOptimalRendererConfig, 
  getOptimalAnimationConfig,
  getAccessibilityConfig,
  createExportableChart
} from './echarts-core';

interface BaseEChartsComponentProps {
  option: AnalyticsEChartsOption;
  loading?: boolean;
  theme?: string;
  className?: string;
  style?: React.CSSProperties;
  onChartReady?: (chartInstance: EChartsInstance) => void;
  onEvents?: Record<string, (event: ChartEvent) => void>;
  performance?: PerformanceConfig;
  accessibility?: {
    title: string;
    description?: string;
  };
  export?: {
    enabled?: boolean;
    onExport?: (data: string, config: ExportConfig) => void;
  };
}

export const BaseEChartsComponent: React.FC<BaseEChartsComponentProps> = ({
  option,
  loading = false,
  theme = 'surveyAnalytics',
  className = '',
  style = { height: '400px', width: '100%' },
  onChartReady,
  onEvents = {},
  performance = {},
  accessibility,
  export: exportConfig
}) => {
  const chartRef = useRef<ReactECharts>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Calculate data size for performance optimization
  const dataSize = useMemo(() => {
    if (!option.series) return 0;
    
    const series = Array.isArray(option.series) ? option.series : [option.series];
    return series.reduce((total, s) => {
      if (s.data && Array.isArray(s.data)) {
        return total + s.data.length;
      }
      return total;
    }, 0);
  }, [option.series]);

  // Get optimal renderer configuration
  const rendererConfig = useMemo(() => 
    getOptimalRendererConfig(dataSize), 
    [dataSize]
  );

  // Enhanced option with performance optimizations
  const enhancedOption = useMemo((): AnalyticsEChartsOption => {
    const animationConfig = getOptimalAnimationConfig(
      dataSize, 
      performance.virtualization?.enabled !== false
    );

    const baseOption = {
      ...option,
      ...animationConfig
    };

    // Add accessibility configuration if provided
    if (accessibility) {
      const accessibilityConfig = getAccessibilityConfig(
        accessibility.title, 
        accessibility.description
      );
      Object.assign(baseOption, accessibilityConfig);
    }

    // Apply performance optimizations
    if (performance.sampling?.enabled && dataSize > (performance.sampling.maxPoints || 10000)) {
      // Note: Actual sampling would be done in data preparation layer
      console.warn(`Dataset size (${dataSize}) exceeds sampling threshold, consider enabling data sampling`);
    }

    return baseOption;
  }, [option, dataSize, performance, accessibility]);

  // Chart event handlers
  const handleChartReady = useCallback((chartInstance: EChartsInstance) => {
    // Set up resize observer for responsive behavior
    if (chartRef.current) {
      const containerElement = chartRef.current.getEchartsInstance().getDom().parentElement;
      if (containerElement && !resizeObserverRef.current) {
        resizeObserverRef.current = new ResizeObserver(() => {
          chartInstance.resize();
        });
        resizeObserverRef.current.observe(containerElement);
      }
    }

    // Enable data zoom for large datasets
    if (dataSize > 1000) {
      chartInstance.dispatchAction({
        type: 'dataZoom',
        start: 0,
        end: 100
      });
    }

    onChartReady?.(chartInstance);
  }, [dataSize, onChartReady]);

  // Enhanced event handling with analytics context
  const enhancedEvents = useMemo(() => {
    const events: Record<string, (params: any) => void> = {};

    Object.entries(onEvents).forEach(([eventType, handler]) => {
      events[eventType] = (params: any) => {
        const chartEvent: ChartEvent = {
          type: eventType as ChartEvent['type'],
          data: params.data,
          seriesIndex: params.seriesIndex,
          dataIndex: params.dataIndex,
          name: params.name,
          value: params.value,
          event: params.event
        };
        handler(chartEvent);
      };
    });

    // Add default click handler for drill-down capability
    if (!events.click) {
      events.click = (params: any) => {
        console.log('Chart clicked:', params);
      };
    }

    return events;
  }, [onEvents]);

  // Export functionality
  const handleExport = useCallback((config: ExportConfig) => {
    if (!chartRef.current || !exportConfig?.enabled) return;

    const chartInstance = chartRef.current.getEchartsInstance();
    try {
      const exportData = createExportableChart(chartInstance as any, {
        format: config.format as 'png' | 'svg',
        quality: config.quality,
        width: config.width,
        height: config.height,
        backgroundColor: config.backgroundColor,
        pixelRatio: config.pixelRatio
      });

      exportConfig.onExport?.(exportData, config);
    } catch (error) {
      console.error('Export failed:', error);
    }
  }, [exportConfig]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
    };
  }, []);

  // Performance monitoring (development only)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && dataSize > 5000) {
      console.warn(`Large dataset detected (${dataSize} points). Consider enabling performance optimizations.`);
    }
  }, [dataSize]);

  return (
    <div className={`echarts-container ${className}`} style={{ position: 'relative', ...style }}>
      <ReactECharts
        ref={chartRef}
        option={enhancedOption}
        theme={theme}
        notMerge={true}
        lazyUpdate={true}
        style={{ height: '100%', width: '100%' }}
        showLoading={loading}
        loadingOption={{
          text: 'Loading...',
          color: '#5470c6',
          textColor: '#333',
          maskColor: 'rgba(255, 255, 255, 0.8)',
          zlevel: 0
        }}
        onChartReady={handleChartReady}
        onEvents={enhancedEvents}
        opts={{
          ...rendererConfig,
          devicePixelRatio: performance.virtualization?.enabled ? 1 : 2
        }}
      />
      
      {exportConfig?.enabled && (
        <div className="export-controls" style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          display: 'flex',
          gap: '4px',
          opacity: 0.7,
          transition: 'opacity 0.2s'
        }}>
          <button
            onClick={() => handleExport({ format: 'png', pixelRatio: 2 })}
            style={{
              padding: '4px 8px',
              fontSize: '12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              background: 'white',
              cursor: 'pointer'
            }}
            title="Export as PNG"
          >
            PNG
          </button>
          <button
            onClick={() => handleExport({ format: 'svg' })}
            style={{
              padding: '4px 8px',
              fontSize: '12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              background: 'white',
              cursor: 'pointer'
            }}
            title="Export as SVG"
          >
            SVG
          </button>
        </div>
      )}
    </div>
  );
};

// Higher-order component for enhanced chart capabilities
export const withAnalytics = <P extends object>(
  WrappedComponent: React.ComponentType<P>
) => {
  return React.forwardRef<any, P & { enableAnalytics?: boolean }>((props, ref) => {
    const { enableAnalytics = true, ...otherProps } = props;
    
    if (!enableAnalytics) {
      return <WrappedComponent ref={ref} {...(otherProps as P)} />;
    }

    // Add analytics enhancements
    const enhancedProps = {
      ...otherProps,
      performance: {
        virtualization: { enabled: true, threshold: 5000 },
        sampling: { enabled: true, maxPoints: 10000, strategy: 'systematic' as const },
        caching: { enabled: true, ttl: 300000, maxSize: 100 },
        ...((otherProps as any).performance || {})
      }
    } as P;

    return <WrappedComponent ref={ref} {...enhancedProps} />;
  });
};

export default BaseEChartsComponent;