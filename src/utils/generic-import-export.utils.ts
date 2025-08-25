import {
  MultiSelectOptionSet,
  RadioOptionSet,
  RatingScale,
  SelectOptionSet,
  SurveyConfig,
  SurveyInstance,
} from "@/types";
import {
  RATING_OPTION_SET_NAME,
  RADIO_OPTION_SET_NAME,
  MULTISELECT_OPTION_SET_NAME,
  SELECT_OPTION_SET_NAME,
} from "@/constants/options-sets.constants";

// Define supported data types
export type ExportableDataType =
  | "config"
  | "instance"
  | "rating-scale"
  | "radio-option-set"
  | "multi-select-option-set"
  | "select-option-set";

export interface ExportData<T = any> {
  type: ExportableDataType;
  version: string;
  data: T;
  metadata: {
    exportedAt: string;
    exportedFrom: string;
    originalId?: string;
    title?: string;
    description?: string;
  };
}

export interface ImportValidationResult {
  isValid: boolean;
  errors: string[];
  dataType?: ExportableDataType;
}

/**
 * Configuration for different data types
 */
const DATA_TYPE_CONFIG = {
  config: {
    filePrefix: "survey-config",
    displayName: "Survey Configuration",
    requiredFields: ["title", "sections"],
    titleField: "title",
    descriptionField: "description",
  },
  instance: {
    filePrefix: "survey-instance",
    displayName: "Survey Instance",
    requiredFields: ["title", "configId"],
    optionalFields: ["activeDateRange", "active_date_range"], // Support both naming conventions
    titleField: "title",
    descriptionField: "description",
  },
  "rating-scale": {
    filePrefix: "rating-scale",
    displayName: RATING_OPTION_SET_NAME,
    requiredFields: ["name", "options"],
    titleField: "name",
    descriptionField: "description",
  },
  "radio-option-set": {
    filePrefix: "radio-option-set",
    displayName: RADIO_OPTION_SET_NAME,
    requiredFields: ["name", "options"],
    titleField: "name",
    descriptionField: "description",
  },
  "multi-select-option-set": {
    filePrefix: "multi-select-option-set",
    displayName: MULTISELECT_OPTION_SET_NAME,
    requiredFields: ["name", "options"],
    titleField: "name",
    descriptionField: "description",
  },
  "select-option-set": {
    filePrefix: "select-option-set",
    displayName: SELECT_OPTION_SET_NAME,
    requiredFields: ["name", "options"],
    titleField: "name",
    descriptionField: "description",
  },
} as const;

/**
 * Generic export function for any supported data type
 */
export const exportData = <T>(
  data: T,
  type: ExportableDataType,
  customFilename?: string
): void => {
  const config = DATA_TYPE_CONFIG[type];
  const titleField = config.titleField as keyof T;
  const title = (data[titleField] as string) || "untitled";

  // Create clean export data
  const exportData: ExportData<T> = {
    type,
    version: "1.0.0",
    data: cleanDataForExport(data, type),
    metadata: {
      exportedAt: new Date().toISOString(),
      exportedFrom: "Survey Framework v1.0",
      originalId: (data as any).id,
      title,
      description: (data as any)[config.descriptionField] || undefined,
    },
  };

  // Generate filename
  const timestamp = new Date().toISOString().split("T")[0];
  const cleanTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const filename =
    customFilename || `${config.filePrefix}-${cleanTitle}-${timestamp}.json`;

  // Download the file
  downloadJsonFile(exportData, filename);
};

/**
 * Clean data for export by removing database-specific fields
 */
const cleanDataForExport = <T>(data: T, type: ExportableDataType): T => {
  const cleaned = { ...data };

  // Remove common database fields (but keep id for import preservation)
  // delete (cleaned as any).id; // Keep ID for import preservation
  delete (cleaned as any).metadata;
  delete (cleaned as any).created_at;
  delete (cleaned as any).updated_at;

  // Type-specific cleaning
  switch (type) {
    case "instance":
      // For instances, ensure we keep essential fields
      // Ensure activeDateRange is preserved (handle both camelCase and snake_case)
      if ((cleaned as any).active_date_range && !(cleaned as any).activeDateRange) {
        (cleaned as any).activeDateRange = (cleaned as any).active_date_range;
      }
      delete (cleaned as any).active_date_range; // Remove snake_case version after copying
      break;
    case "config":
      // Remove any instance-specific data
      delete (cleaned as any).isActive;
      break;
  }

  return cleaned;
};

/**
 * Download a JSON file
 */
const downloadJsonFile = (data: any, filename: string): void => {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

/**
 * Validate imported data structure
 */
export const validateImportData = (data: any): ImportValidationResult => {
  const errors: string[] = [];

  // Check if it's our export format
  if (!data.type || !data.data || !data.metadata) {
    // Try to detect legacy format or direct data
    return validateLegacyData(data);
  }

  const { type, data: itemData } = data;

  // Check if type is supported
  if (!DATA_TYPE_CONFIG[type as ExportableDataType]) {
    errors.push(`Unsupported data type: ${type}`);
    return { isValid: false, errors };
  }

  const config = DATA_TYPE_CONFIG[type as ExportableDataType];

  // Validate required fields
  config.requiredFields.forEach((field) => {
    if (!itemData[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  });

  // Type-specific validation
  switch (type) {
    case "config":
      if (!Array.isArray(itemData.sections)) {
        errors.push("Sections must be an array");
      }
      break;
    case "rating-scale":
    case "radio-option-set":
    case "multi-select-option-set":
    case "select-option-set":
      if (!Array.isArray(itemData.options)) {
        errors.push("Options must be an array");
      }
      break;
  }

  return {
    isValid: errors.length === 0,
    errors,
    dataType: type as ExportableDataType,
  };
};

/**
 * Validate legacy data format (for backward compatibility)
 */
const validateLegacyData = (data: any): ImportValidationResult => {
  const errors: string[] = [];

  // Try to detect data type from structure
  let detectedType: ExportableDataType | undefined;

  if (data.sections && Array.isArray(data.sections)) {
    detectedType = "config";
  } else if (data.configId && data.title) {
    detectedType = "instance";
  } else if (data.options && Array.isArray(data.options) && data.name) {
    // Could be any option set, try to detect from properties
    if (data.minSelections !== undefined || data.maxSelections !== undefined) {
      detectedType = "multi-select-option-set";
    } else if (data.allowMultiple !== undefined) {
      detectedType = "select-option-set";
    } else {
      detectedType = "radio-option-set";
    }
  } else if (data.options && Array.isArray(data.options)) {
    detectedType = "rating-scale";
  }

  if (!detectedType) {
    errors.push("Could not determine data type from file structure");
    return { isValid: false, errors };
  }

  // Validate using detected type
  const config = DATA_TYPE_CONFIG[detectedType];
  config.requiredFields.forEach((field) => {
    if (!data[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    dataType: detectedType,
  };
};

/**
 * Process imported data for database insertion
 */
export const processImportedData = <
  T extends
    | SurveyConfig
    | SurveyInstance
    | RatingScale
    | RadioOptionSet
    | MultiSelectOptionSet
    | SelectOptionSet
>(
  importData: any,
  dataType: ExportableDataType
): Omit<T, "metadata"> => {
  // Extract actual data
  const data = importData.data || importData;

  // Process based on type
  switch (dataType) {
    case "config":
      return processConfigData(data) as Omit<T, "metadata">;
    case "instance":
      return processInstanceData(data) as Omit<T, "metadata">;
    case "rating-scale":
      return processRatingScaleData(data) as Omit<T, "metadata">;
    case "radio-option-set":
      return processRadioOptionSetData(data) as Omit<T, "metadata">;
    case "multi-select-option-set":
      return processMultiSelectOptionSetData(data) as Omit<T, "metadata">;
    case "select-option-set":
      return processSelectOptionSetData(data) as Omit<T, "metadata">;
    default:
      throw new Error(`Unsupported data type: ${dataType}`);
  }
};

// Type-specific processors
const processConfigData = (
  data: any
): Omit<SurveyConfig, "metadata"> => {
  const processedSections = data.sections.map((section: any) => {
    const processedFields = section.fields.map((field: any) => ({
      ...field,
      id: field.id || `field-${Math.random().toString(36).substr(2, 9)}`,
    }));

    const processedSubsections =
      section.subsections?.map((subsection: any) => ({
        ...subsection,
        id:
          subsection.id ||
          `subsection-${Math.random().toString(36).substr(2, 9)}`,
        fields:
          subsection.fields?.map((field: any) => ({
            ...field,
            id: field.id || `field-${Math.random().toString(36).substr(2, 9)}`,
          })) || [],
      })) || [];

    return {
      ...section,
      id: section.id || `section-${Math.random().toString(36).substr(2, 9)}`,
      fields: processedFields,
      subsections: processedSubsections,
    };
  });

  return {
    ...(data.id && { id: data.id }), // Include ID if present
    title: data.title,
    description: data.description || "",
    sections: processedSections,
    version: data.version,
    paginatorConfig: data.paginatorConfig,
    footerConfig: data.footerConfig,
    isActive: data.isActive !== undefined ? data.isActive : true, // Preserve original isActive status, default to true only if not specified
  };
};

const processInstanceData = (
  data: any
): Omit<SurveyInstance, "metadata"> => {
  // Note: configId from imported data may not exist in current database
  // This should be handled by requiring user to select a config during import
  // For now, we'll throw an error if configId is missing or invalid
  if (!data.configId) {
    throw new Error(
      "Instance import requires a valid configId. Please ensure the referenced config exists or select a target config during import."
    );
  }

  // Handle activeDateRange (support both camelCase and snake_case from export)
  const activeDateRange = data.activeDateRange || data.active_date_range;
  
  // Validate date range format if present
  let processedDateRange: any = undefined;
  if (activeDateRange) {
    // Ensure the date range has the correct structure
    const tempDateRange: any = {
      start: activeDateRange.start || activeDateRange.startDate,
      end: activeDateRange.end || activeDateRange.endDate,
      startDate: activeDateRange.startDate || activeDateRange.start,
      endDate: activeDateRange.endDate || activeDateRange.end,
    };
    
    // Remove undefined properties to keep the object clean
    if (!tempDateRange.start) delete tempDateRange.start;
    if (!tempDateRange.end) delete tempDateRange.end;
    if (!tempDateRange.startDate) delete tempDateRange.startDate;
    if (!tempDateRange.endDate) delete tempDateRange.endDate;
    
    // If no valid dates, set to undefined
    if (Object.keys(tempDateRange).length === 0) {
      processedDateRange = undefined;
    } else {
      processedDateRange = tempDateRange;
    }
  }

  return {
    ...(data.id && { id: data.id }), // Include ID if present
    configId: data.configId,
    title: data.title, // Don't add "(Imported)" since we're preserving IDs
    description: data.description || "",
    slug: undefined, // Will be generated
    isActive: data.isActive !== undefined ? data.isActive : false, // Preserve original isActive status, default to false if not specified
    activeDateRange: processedDateRange,
    createdAt: data.createdAt || new Date().toISOString(), // Preserve original createdAt or use current time
    updatedAt: new Date().toISOString(), // Always update the updatedAt to current time for import tracking
  };
};

const processRatingScaleData = (
  data: any
): Omit<RatingScale, "metadata"> => {
  return {
    ...(data.id && { id: data.id }), // Include ID if present
    name: data.name,
    description: data.description || "",
    options: data.options || [],
    isActive: data.isActive !== undefined ? data.isActive : true, // Preserve original isActive status
  };
};

const processRadioOptionSetData = (
  data: any
): Omit<RadioOptionSet, "metadata"> => {
  return {
    ...(data.id && { id: data.id }), // Include ID if present
    name: data.name,
    description: data.description || "",
    options: data.options || [],
    isActive: data.isActive !== undefined ? data.isActive : true, // Preserve original isActive status
  };
};

const processMultiSelectOptionSetData = (
  data: any
): Omit<MultiSelectOptionSet, "metadata"> => {
  return {
    ...(data.id && { id: data.id }), // Include ID if present
    name: data.name,
    description: data.description || "",
    options: data.options || [],
    minSelections: data.minSelections,
    maxSelections: data.maxSelections,
    isActive: data.isActive !== undefined ? data.isActive : true, // Preserve original isActive status
  };
};

const processSelectOptionSetData = (
  data: any
): Omit<SelectOptionSet, "metadata"> => {
  return {
    ...(data.id && { id: data.id }), // Include ID if present
    name: data.name,
    description: data.description || "",
    options: data.options || [],
    allowMultiple: data.allowMultiple !== undefined ? data.allowMultiple : false, // Preserve original allowMultiple setting
    isActive: data.isActive !== undefined ? data.isActive : true, // Preserve original isActive status
  };
};

/**
 * Read and parse a JSON file
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
        reject(new Error("Invalid JSON file"));
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsText(file);
  });
};

/**
 * Get display name for data type
 */
export const getDataTypeDisplayName = (type: ExportableDataType): string => {
  return DATA_TYPE_CONFIG[type]?.displayName || type;
};
