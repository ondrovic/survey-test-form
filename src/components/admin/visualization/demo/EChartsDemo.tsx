import React from 'react';
import { BarChart as LegacyBarChart } from '../components/charts/BarChart';
import { DonutChart as LegacyDonutChart } from '../components/charts/DonutChart';
import { SimpleEChartsBar } from '../charts/basic/SimpleEChartsBar';
import { SimpleEChartsPie } from '../charts/basic/SimpleEChartsPie';
import type { BaseChartProps } from '../types';

// Sample survey data
const sampleData: BaseChartProps = {
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
  size: 'normal'
};

/**
 * Demo component to showcase the difference between Legacy and ECharts implementations
 * Add this component to any page to see the comparison
 */
export const EChartsDemo: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          📊 Visualization Upgrade: Legacy vs ECharts
        </h1>
        <p className="text-gray-600">
          See the difference between the old CSS-based charts and the new interactive ECharts
        </p>
      </div>

      {/* Side by Side Comparison */}
      <div className="grid lg:grid-cols-2 gap-8">
        
        {/* Legacy Chart */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
            <h2 className="text-xl font-semibold text-gray-800">Legacy CSS Chart</h2>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-medium mb-4 text-gray-700">Overall Satisfaction Survey</h3>
            <LegacyBarChart {...sampleData} />
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <div>✅ Static bars with CSS styling</div>
            <div>✅ Responsive design with Tailwind</div>
            <div>❌ No interactivity (hover only)</div>
            <div>❌ No zooming or selection</div>
            <div>❌ No export functionality</div>
          </div>
        </div>

        {/* ECharts Version */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <h2 className="text-xl font-semibold text-gray-800">Enhanced ECharts</h2>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-medium mb-4 text-gray-700">Overall Satisfaction Survey</h3>
            <div style={{ height: '300px' }}>
              <SimpleEChartsBar {...sampleData} direction="horizontal" />
            </div>
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <div>✅ Interactive tooltips with rich content</div>
            <div>✅ Smooth animations and transitions</div>
            <div>✅ Professional chart styling</div>
            <div>✅ Built-in zoom and pan capabilities</div>
            <div>✅ Export to PNG/SVG (right-click)</div>
          </div>
        </div>
      </div>

      {/* Vertical Layout Comparison */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-center text-gray-800">
          Vertical Layout Comparison
        </h2>
        
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Legacy Vertical - using horizontal since we don't have a good legacy vertical */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">Legacy Approach</h3>
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <LegacyBarChart {...sampleData} />
              <p className="text-xs text-gray-500 mt-2">
                * Legacy system uses horizontal bars for most cases
              </p>
            </div>
          </div>

          {/* ECharts Vertical */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">ECharts Vertical</h3>
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div style={{ height: '300px' }}>
                <SimpleEChartsBar {...sampleData} direction="vertical" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Features Demo */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-blue-800 mb-4">
          🎯 Try These Interactive Features on ECharts:
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <h3 className="font-medium text-blue-700">Mouse Interactions:</h3>
            <ul className="text-sm text-blue-600 space-y-1">
              <li>• Hover over bars for detailed tooltips</li>
              <li>• Scroll wheel to zoom in/out</li>
              <li>• Click and drag to pan around</li>
              <li>• Right-click for context menu</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium text-blue-700">Advanced Features:</h3>
            <ul className="text-sm text-blue-600 space-y-1">
              <li>• Smooth animations on data changes</li>
              <li>• Responsive layout adaptation</li>
              <li>• Professional styling and themes</li>
              <li>• High-DPI display support</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Pie Chart Comparison */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-center text-gray-800">
          🥧 Donut/Pie Chart: Legacy vs ECharts with PadAngle
        </h2>
        <p className="text-center text-gray-600">
          Beautiful modern pie charts with segment padding and smooth animations
        </p>
        
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Legacy Donut */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">Legacy CSS Donut</h3>
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div style={{ height: '300px' }}>
                <LegacyDonutChart {...sampleData} />
              </div>
            </div>
          </div>

          {/* ECharts Donut */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">ECharts Donut with PadAngle</h3>
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div style={{ height: '300px' }}>
                <SimpleEChartsPie {...sampleData} variant="donut" padAngle={5} fieldName="Overall Satisfaction" />
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Demo Instruction */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">
            🎯 Try This: Hover Over the ECharts Donut!
          </h3>
          <p className="text-blue-700 text-sm">
            Hover over any segment in the ECharts donut chart above and watch the <strong>field name</strong> (like &ldquo;Strongly Agree&rdquo;, &ldquo;Neutral&rdquo;, etc.) 
            appear dynamically in the center with the count/percentage. This creates a clean, uncluttered look while showing detailed info on demand.
          </p>
        </div>

        {/* Feature Showcase */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-purple-800 mb-3">
            ✨ ECharts Donut Features:
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <ul className="text-sm text-purple-700 space-y-2">
              <li>🔥 <strong>PadAngle Effect:</strong> Beautiful gaps between segments</li>
              <li>🎨 <strong>Rounded Corners:</strong> Modern borderRadius styling</li>
              <li>💫 <strong>Smooth Animations:</strong> Elastic expansion effects</li>
              <li>🎯 <strong>Hover Center Labels:</strong> Field names appear in center on hover</li>
            </ul>
            <ul className="text-sm text-purple-700 space-y-2">
              <li>📝 <strong>Dynamic Labels:</strong> Shows actual response values (e.g., &ldquo;Strongly Agree&rdquo;)</li>
              <li>🎨 <strong>Clean Legend:</strong> Names displayed at top, not cluttering chart</li>
              <li>📱 <strong>Responsive:</strong> Adapts to different screen sizes</li>
              <li>💾 <strong>Exportable:</strong> Right-click to save</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Performance Comparison */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-center text-gray-800">
          Large Dataset Performance Test
        </h2>
        <p className="text-center text-gray-600">
          ECharts can handle much larger datasets efficiently
        </p>

        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-medium mb-4 text-gray-700">
            50 Categories Performance Demo
          </h3>
          <div style={{ height: '400px' }}>
            <SimpleEChartsBar
              counts={Object.fromEntries(
                Array.from({ length: 50 }, (_, i) => [
                  `Category ${i + 1}`,
                  Math.floor(Math.random() * 100) + 10
                ])
              )}
              total={2750}
              direction="horizontal"
              size="normal"
            />
          </div>
          <p className="text-sm text-gray-500 mt-4">
            💡 Try scrolling to zoom and dragging to pan through this large dataset!
          </p>
        </div>
      </div>

      <div className="text-center text-gray-500 text-sm">
        <p>🔧 This is a demo component showing the visualization upgrade capabilities.</p>
        <p>The actual charts in your application are now using ECharts when the feature flags are enabled.</p>
      </div>
    </div>
  );
};

export default EChartsDemo;