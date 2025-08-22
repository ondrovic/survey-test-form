import React from 'react';
import { 
  AdaptiveBarChart,
  SimpleEChartsBar,
  EChartsFeatureConfig,
  EChartsDebugInfo,
  useEChartsFeatures
} from '../charts';
import type { BaseChartProps } from '../types';

// Test data for validation
const testData: BaseChartProps = {
  counts: {
    'Strongly Agree': 45,
    'Agree': 32,
    'Neutral': 15,
    'Disagree': 8,
    'Strongly Disagree': 3
  },
  total: 103,
  orderedValues: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
  colors: {
    'Strongly Agree': '#22c55e',
    'Agree': '#84cc16',
    'Neutral': '#eab308',
    'Disagree': '#f97316',
    'Strongly Disagree': '#ef4444'
  },
  showPercent: false,
  neutralMode: false,
  size: 'normal'
};


/**
 * Validation component to test ECharts integration
 * This component can be temporarily added to any page for testing
 */
export const EChartsValidation: React.FC = () => {
  const { flags, isEChartsEnabled } = useEChartsFeatures();

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">ECharts Integration Validation</h1>
        <p className="text-gray-600">
          Testing the compatibility between legacy and enhanced chart components
        </p>
      </div>

      {/* Feature Status */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="font-semibold mb-2">Feature Status</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-medium">Bar Chart:</span>{' '}
            <span className={isEChartsEnabled('horizontal') ? 'text-green-600' : 'text-orange-600'}>
              {isEChartsEnabled('horizontal') ? 'Enhanced' : 'Legacy'}
            </span>
          </div>
          <div>
            <span className="font-medium">Analytics:</span>{' '}
            <span className={flags.enableAnalytics ? 'text-green-600' : 'text-gray-500'}>
              {flags.enableAnalytics ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div>
            <span className="font-medium">Export:</span>{' '}
            <span className={flags.enableExport ? 'text-green-600' : 'text-gray-500'}>
              {flags.enableExport ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div>
            <span className="font-medium">Interactions:</span>{' '}
            <span className={flags.enableInteractions ? 'text-green-600' : 'text-gray-500'}>
              {flags.enableInteractions ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>
      </div>

      {/* Side by side comparison */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Legacy Chart */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Adaptive Chart (Current)</h2>
          <p className="text-sm text-gray-600">
            This uses the adaptive component that switches between legacy and enhanced based on feature flags.
          </p>
          <div className="border rounded-lg p-4 bg-gray-50">
            <AdaptiveBarChart {...testData} />
          </div>
        </div>

        {/* Enhanced Chart */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Enhanced ECharts (New)</h2>
          <p className="text-sm text-gray-600">
            This is the new ECharts implementation with analytics capabilities.
          </p>
          <div className="border rounded-lg p-4 bg-gray-50" style={{ height: '400px' }}>
            <SimpleEChartsBar 
              {...testData}
              direction="horizontal"
            />
          </div>
        </div>
      </div>

      {/* Vertical comparison */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Vertical Layout Test</h2>
        <div className="border rounded-lg p-4 bg-gray-50" style={{ height: '400px' }}>
          <SimpleEChartsBar 
            {...testData}
            direction="vertical"
            size="large"
            showPercent={true}
          />
        </div>
      </div>

      {/* Performance test with larger dataset */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Performance Test (Large Dataset)</h2>
        <div className="border rounded-lg p-4 bg-gray-50" style={{ height: '400px' }}>
          <SimpleEChartsBar 
            counts={Object.fromEntries(
              Array.from({ length: 50 }, (_, i) => [`Option ${i + 1}`, Math.floor(Math.random() * 100)])
            )}
            total={2500}
            direction="horizontal"
            size="normal"
          />
        </div>
      </div>

      {/* Feature controls (development only) */}
      <EChartsFeatureConfig />
      <EChartsDebugInfo />
    </div>
  );
};

export default EChartsValidation;