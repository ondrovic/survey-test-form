import { SurveyConfig } from '@/types';
import { ErrorLoggingService } from '@/services/error-logging.service';

/**
 * Exports a survey config as a downloadable JSON file
 */
export const exportSurveyConfig = (config: SurveyConfig): void => {
  // Create a clean version without database-specific fields
  const exportData = {
    title: config.title,
    description: config.description,
    sections: config.sections,
    version: config.version || '1.0.0',
    paginatorConfig: config.paginatorConfig,
    footerConfig: config.footerConfig,
    exportedAt: new Date().toISOString(),
    exportedFrom: 'Survey Framework v1.0'
  };

  // Create filename with timestamp and clean title
  const timestamp = new Date().toISOString().split('T')[0];
  const cleanTitle = config.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const filename = `survey-config-${cleanTitle}-${timestamp}.json`;

  // Create and download the file
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object
  URL.revokeObjectURL(url);
};

/**
 * Validates the structure of an imported config
 */
export const validateImportedConfig = (data: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check required fields
  if (!data.title || typeof data.title !== 'string') {
    errors.push('Missing or invalid title field');
  }

  if (!data.sections || !Array.isArray(data.sections)) {
    errors.push('Missing or invalid sections array');
  }

  // Validate sections structure
  if (data.sections && Array.isArray(data.sections)) {
    data.sections.forEach((section: any, index: number) => {
      if (!section.id || typeof section.id !== 'string') {
        errors.push(`Section ${index + 1}: Missing or invalid id`);
      }
      if (!section.title || typeof section.title !== 'string') {
        errors.push(`Section ${index + 1}: Missing or invalid title`);
      }
      if (!section.fields || !Array.isArray(section.fields)) {
        errors.push(`Section ${index + 1}: Missing or invalid fields array`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Processes imported config data and prepares it for database insertion
 */
export const processImportedConfig = (data: any): Omit<SurveyConfig, 'id' | 'metadata'> => {
  // Generate unique IDs for sections and fields if they don't exist or conflict
  const processedSections = data.sections.map((section: any) => {
    const processedFields = section.fields.map((field: any) => ({
      ...field,
      id: field.id || `field-${Math.random().toString(36).substr(2, 9)}`
    }));

    const processedSubsections = section.subsections?.map((subsection: any) => ({
      ...subsection,
      id: subsection.id || `subsection-${Math.random().toString(36).substr(2, 9)}`,
      fields: subsection.fields?.map((field: any) => ({
        ...field,
        id: field.id || `field-${Math.random().toString(36).substr(2, 9)}`
      })) || []
    })) || [];

    return {
      ...section,
      id: section.id || `section-${Math.random().toString(36).substr(2, 9)}`,
      fields: processedFields,
      subsections: processedSubsections
    };
  });

  return {
    title: data.title + ' (Imported)',
    description: data.description || '',
    sections: processedSections,
    version: data.version || '1.0.0',
    paginatorConfig: data.paginatorConfig || {},
    footerConfig: data.footerConfig || {},
    isActive: true
  };
};

/**
 * Reads and parses a JSON file
 */
export const parseJsonFile = (file: File): Promise<any> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const data = JSON.parse(text);
        resolve(data);
      } catch (error) {
        ErrorLoggingService.logError({
          severity: 'low',
          errorMessage: 'Failed to parse JSON file during config import',
          stackTrace: error instanceof Error ? error.stack : String(error),
          componentName: 'configImportExportUtils',
          functionName: 'parseJsonFile',
          userAction: 'import_survey_config',
          additionalContext: {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            error: error instanceof Error ? error.message : String(error)
          },
          tags: ['config-import', 'json-parse', 'file-handling']
        });
        reject(new Error('Invalid JSON file'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
};