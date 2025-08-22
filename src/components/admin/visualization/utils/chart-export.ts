import type ReactECharts from 'echarts-for-react';

/**
 * Save an ECharts instance as an image file
 * @param chartRef - Reference to the ReactECharts component
 * @param filename - Name of the file to save (without extension)
 * @param format - Image format ('png' | 'jpg' | 'svg')
 * @param pixelRatio - Resolution multiplier (default: 2 for high-DPI)
 * @param backgroundColor - Background color for the exported image
 */
export const saveChartAsImage = (
  chartRef: React.RefObject<ReactECharts>,
  filename: string = 'chart',
  format: 'png' | 'jpg' | 'svg' = 'png',
  pixelRatio: number = 2,
  backgroundColor: string = '#ffffff'
) => {
  if (!chartRef.current) {
    console.error('Chart reference is not available');
    return;
  }

  try {
    // Get the ECharts instance from the React wrapper
    const chartInstance = chartRef.current.getEchartsInstance();
    
    if (!chartInstance) {
      console.error('ECharts instance is not available');
      return;
    }

    // Generate the image data URL using ECharts built-in method
    const dataURL = chartInstance.getDataURL({
      type: format,
      pixelRatio: pixelRatio,
      backgroundColor: backgroundColor,
      excludeComponents: ['toolbox'] // Exclude toolbox from the export
    });

    // Create a temporary link element to trigger the download
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = `${filename}.${format}`;
    
    // Append to body, click, and remove (required for Firefox)
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log(`Chart saved as ${filename}.${format}`);
  } catch (error) {
    console.error('Failed to save chart as image:', error);
  }
};

/**
 * Generate a clean filename from chart title and field name
 */
export const generateChartFilename = (
  sectionTitle?: string,
  subsectionTitle?: string,
  fieldLabel?: string
): string => {
  const parts = [sectionTitle, subsectionTitle, fieldLabel]
    .filter(Boolean)
    .map(part => part!
      .replace(/[^a-zA-Z0-9\s\-_]/g, '') // Remove special characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .toLowerCase()
    );
  
  return parts.join('_') || 'chart';
};