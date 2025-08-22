import type { 
  EnhancedAggregatedSeries, 
  AnalyticsEChartsOption,
  TreeNode,
  SankeyNode,
  SankeyLink,
  DataAdapter,
  AnalyticsChartType
} from '../echarts-types';
import type { AggregatedSeries } from '../types';

export class EChartsDataAdapter implements DataAdapter {
  
  /**
   * Convert aggregated series to standard ECharts format
   */
  toEChartsFormat = (data: AggregatedSeries[]): AnalyticsEChartsOption => {
    if (!data.length) return {};

    const series = data.map(seriesData => {
      const { counts, orderedValues, colors, type, label } = seriesData;
      
      // Prepare data in ECharts format
      const chartData = orderedValues 
        ? orderedValues.map(value => ({
            name: value,
            value: counts[value] || 0,
            itemStyle: { color: colors?.[value] }
          }))
        : Object.entries(counts).map(([name, value]) => ({
            name,
            value,
            itemStyle: { color: colors?.[name] }
          }));

      // Determine chart type
      const chartType = (type === 'histogram' ? 'bar' : 'bar') as 'bar';

      return {
        name: label,
        type: chartType,
        data: chartData,
        emphasis: {
          focus: 'series' as const
        },
        label: {
          show: chartData.length <= 10, // Show labels only for smaller datasets
          position: chartType === 'bar' ? 'right' : 'top'
        }
      };
    });

    return {
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        type: 'scroll',
        orient: 'vertical',
        right: 10,
        top: 20,
        bottom: 20
      },
      series: series as any
    };
  };

  /**
   * Convert survey data to heatmap format
   * Useful for correlation analysis and response pattern visualization
   */
  toHeatmapData = (data: AggregatedSeries[]): Array<[number, number, number]> => {
    const heatmapData: Array<[number, number, number]> = [];
    
    data.forEach((series, seriesIndex) => {
      const { counts, orderedValues } = series;
      const values = orderedValues || Object.keys(counts);
      
      values.forEach((value, valueIndex) => {
        const count = counts[value] || 0;
        heatmapData.push([seriesIndex, valueIndex, count]);
      });
    });

    return heatmapData;
  };

  /**
   * Convert survey data to parallel coordinates format
   * Useful for multi-dimensional analysis
   */
  toParallelData = (data: AggregatedSeries[]): number[][] => {
    // This is a simplified implementation
    // In real use, you'd need individual response data rather than aggregated data
    return data.map(series => {
      const values = Object.values(series.counts);
      return [
        series.total,
        Math.max(...values),
        Math.min(...values),
        values.reduce((a, b) => a + b, 0) / values.length
      ];
    });
  };

  /**
   * Convert hierarchical survey data to tree format for treemap visualization
   */
  toTreeData = (data: AggregatedSeries[]): TreeNode[] => {
    // Group by section first
    const sectionGroups = data.reduce((acc, series) => {
      const section = series.section || 'Other';
      if (!acc[section]) {
        acc[section] = [];
      }
      acc[section].push(series);
      return acc;
    }, {} as Record<string, AggregatedSeries[]>);

    return Object.entries(sectionGroups).map(([sectionName, sectionSeries]) => ({
      name: sectionName,
      children: sectionSeries.map(series => ({
        name: series.label,
        value: series.total,
        children: Object.entries(series.counts)
          .filter((entry): entry is [string, number] => typeof entry[1] === 'number')
          .map(([option, count]) => ({
            name: option,
            value: count,
            itemStyle: {
              color: series.colors?.[option]
            }
          }))
      }))
    }));
  };

  /**
   * Convert survey data to Sankey diagram format
   * Useful for flow analysis between questions
   */
  toSankeyData = (data: AggregatedSeries[]): { nodes: SankeyNode[]; links: SankeyLink[] } => {
    const nodes: SankeyNode[] = [];
    const links: SankeyLink[] = [];
    
    // Create nodes for questions and answers
    data.forEach((series, index) => {
      // Question node
      nodes.push({
        name: `Q${index + 1}: ${series.label}`,
        category: 0
      });

      // Answer nodes
      Object.keys(series.counts).forEach(answer => {
        const answerNodeName = `${series.label}_${answer}`;
        if (!nodes.some(node => node.name === answerNodeName)) {
          nodes.push({
            name: answerNodeName,
            category: 1
          });
        }

        // Create link
        links.push({
          source: `Q${index + 1}: ${series.label}`,
          target: answerNodeName,
          value: series.counts[answer]
        });
      });
    });

    return { nodes, links };
  };

  /**
   * Convert survey data to scatter plot format
   * Useful for correlation analysis
   */
  toScatterData = (data: AggregatedSeries[]): Array<[number, number, number?]> => {
    const scatterData: Array<[number, number, number?]> = [];
    
    data.forEach((series, index) => {
      Object.entries(series.counts)
        .filter((entry): entry is [string, number] => typeof entry[1] === 'number')
        .forEach(([value, count]) => {
          // Convert categorical values to numeric for scatter plot
          const numericValue = this.categoricalToNumeric(value);
          scatterData.push([index, numericValue, count]);
        });
    });

    return scatterData;
  };

  /**
   * Convert categorical values to numeric for scatter plots
   */
  protected categoricalToNumeric(value: string): number {
    // Handle common survey response patterns
    const numericMappings: Record<string, number> = {
      'strongly disagree': 1,
      'disagree': 2,
      'neutral': 3,
      'agree': 4,
      'strongly agree': 5,
      'very poor': 1,
      'poor': 2,
      'fair': 3,
      'good': 4,
      'excellent': 5,
      'never': 1,
      'rarely': 2,
      'sometimes': 3,
      'often': 4,
      'always': 5,
      'no': 0,
      'yes': 1
    };

    const lowerValue = value.toLowerCase().trim();
    
    // Check for exact matches
    if (numericMappings[lowerValue] !== undefined) {
      return numericMappings[lowerValue];
    }

    // Check for numeric values
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue)) {
      return numericValue;
    }

    // Fallback: hash the string to a number
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      const char = value.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) % 100;
  }
}

/**
 * Enhanced adapter that extends basic functionality with analytics
 */
export class EnhancedEChartsAdapter extends EChartsDataAdapter {
  
  /**
   * Convert aggregated series to enhanced format with analytics capabilities
   */
  toEnhancedFormat = (
    data: AggregatedSeries[], 
    chartType: AnalyticsChartType = 'horizontal'
  ): EnhancedAggregatedSeries[] => {
    return data.map(series => ({
      ...series,
      chartType,
      echartsData: {
        source: this.prepareSourceData(series),
        heatmapData: chartType === 'heatmap' ? this.seriesToHeatmap(series) : undefined,
        parallelData: chartType === 'parallel' ? this.seriesToParallel(series) : undefined,
        treeData: chartType === 'treemap' ? this.seriesToTree(series) : undefined,
        scatterData: chartType === 'scatter' ? this.seriesToScatter(series) : undefined
      },
      analytics: {
        statistics: this.calculateStatistics(series),
        outliers: this.detectOutliers(series)
      }
    }));
  };

  /**
   * Prepare source data for ECharts dataset
   */
  private prepareSourceData(series: AggregatedSeries): any[] {
    const { counts, orderedValues } = series;
    const values = orderedValues || Object.keys(counts);
    
    return [
      ['Category', 'Count'],
      ...values.map(value => [value, counts[value] || 0])
    ];
  }

  /**
   * Convert single series to heatmap data
   */
  private seriesToHeatmap(series: AggregatedSeries): Array<[number, number, number]> {
    const { counts, orderedValues } = series;
    const values = orderedValues || Object.keys(counts);
    
    return values.map((value, index) => [0, index, counts[value] || 0]);
  }

  /**
   * Convert single series to parallel coordinates
   */
  private seriesToParallel(series: AggregatedSeries): number[][] {
    const values = Object.values(series.counts);
    return [[
      series.total,
      Math.max(...values),
      Math.min(...values),
      values.reduce((a, b) => a + b, 0) / values.length
    ]];
  }

  /**
   * Convert single series to tree data
   */
  private seriesToTree(series: AggregatedSeries): TreeNode[] {
    return [{
      name: series.label,
      children: Object.entries(series.counts)
        .filter((entry): entry is [string, number] => typeof entry[1] === 'number')
        .map(([option, count]) => ({
          name: option,
          value: count,
          itemStyle: {
            color: series.colors?.[option]
          }
        }))
    }];
  }

  /**
   * Convert single series to scatter data
   */
  private seriesToScatter(series: AggregatedSeries): Array<[number, number, number?]> {
    return Object.entries(series.counts)
      .filter((entry): entry is [string, number] => typeof entry[1] === 'number')
      .map(([value, count], index) => [
        index,
        this.categoricalToNumeric(value),
        count
      ]);
  }

  /**
   * Calculate basic statistics for a series
   */
  private calculateStatistics(series: AggregatedSeries) {
    const values = Object.values(series.counts).filter((v): v is number => typeof v === 'number');
    
    if (values.length === 0) return undefined;

    const sortedValues = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
    
    return {
      mean,
      median: sortedValues[Math.floor(sortedValues.length / 2)],
      mode: this.calculateMode(series.counts),
      standardDeviation: Math.sqrt(variance),
      variance,
      min: Math.min(...values),
      max: Math.max(...values),
      quartiles: {
        q1: sortedValues[Math.floor(sortedValues.length * 0.25)],
        q2: sortedValues[Math.floor(sortedValues.length * 0.5)],
        q3: sortedValues[Math.floor(sortedValues.length * 0.75)]
      }
    };
  }

  /**
   * Calculate mode (most frequent response)
   */
  private calculateMode(counts: Record<string, number>): string {
    let maxCount = 0;
    let mode = '';
    
    Object.entries(counts).forEach(([value, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mode = value;
      }
    });
    
    return mode;
  }

  /**
   * Simple outlier detection using IQR method
   */
  private detectOutliers(series: AggregatedSeries) {
    const values = Object.values(series.counts).filter((v): v is number => typeof v === 'number');
    const sortedValues = [...values].sort((a, b) => a - b);
    
    if (sortedValues.length < 4) return [];

    const q1 = sortedValues[Math.floor(sortedValues.length * 0.25)];
    const q3 = sortedValues[Math.floor(sortedValues.length * 0.75)];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    return Object.entries(series.counts)
      .filter((entry): entry is [string, number] => typeof entry[1] === 'number' && (entry[1] < lowerBound || entry[1] > upperBound))
      .map(([value, count]) => ({
        value,
        score: Math.abs(count - q1) / iqr,
        method: 'iqr' as const
      }));
  }
}

// Export singleton instances
export const echartsAdapter = new EChartsDataAdapter();
export const enhancedEChartsAdapter = new EnhancedEChartsAdapter();