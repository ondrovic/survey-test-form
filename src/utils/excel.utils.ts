import * as XLSX from "xlsx";
import {
  COMMERCIAL_SERVICE_LINES,
  INDUSTRIES,
  RESIDENTIAL_SERVICE_LINES,
} from "../constants/services.constants";
import { SUB_NAV_OPTIONS } from "../constants/sub-nav.constants";
import { SurveyData } from "../types/survey.types";
import { getSubNavKey, getSubNavOtherKey } from "./sub-nav.utils";

export interface ExcelExportOptions {
  filename?: string;
  sheetName?: string;
}

/**
 * Gets the expected number of columns for the Excel export
 * Useful for testing and validation
 */
export function getExpectedColumnCount(): number {
  let count = 13; // Base columns (ID, Submitted At, Updated At, Personal Info, Business Info, Navigation Layout, Additional Notes)

  // Add Sub-Nav columns (2 per service: Selected Options and Other Text)
  count += SUB_NAV_OPTIONS.length * 2;

  // Add Residential Services columns
  RESIDENTIAL_SERVICE_LINES.forEach((category) => {
    count += category.items.length; // Rating for each item (no more selected column)
  });

  // Add Commercial Services columns
  COMMERCIAL_SERVICE_LINES.forEach((category) => {
    count += category.items.length; // Rating for each item (no more selected column)
  });

  // Add Industries columns
  INDUSTRIES.forEach((category) => {
    count += category.items.length; // Rating for each item (no more selected column)
  });

  return count;
}

/**
 * Converts survey data to a flat structure suitable for Excel export
 */
export function flattenSurveyData(surveys: SurveyData[]): any[] {
  return surveys.map((survey) => {
    const flatData: any = {
      ID: survey.id,
      "Submitted At": survey.submittedAt,
      "Updated At": survey.updatedAt,

      // Personal Info
      "Full Name": survey.personalInfo.fullName,
      Email: survey.personalInfo.email,
      Franchise: survey.personalInfo.franchise,

      // Business Info
      "Market Regions": survey.businessInfo.marketRegions.join(", "),
      "Other Market": survey.businessInfo.otherMarket || "",
      "Number of Licenses": survey.businessInfo.numberOfLicenses,
      "Business Focus": survey.businessInfo.businessFocus,
      "Navigation Layout": survey.businessInfo.navigationLayout,
    };

    // Add Sub-Nav Questions and Other Text
    SUB_NAV_OPTIONS.forEach((option) => {
      const subNavKey = getSubNavKey(option.service);
      const subNavOtherKey = getSubNavOtherKey(option.service);

      // Add selected options for this service
      const selectedOptions =
        survey.businessInfo.subNavQuestions[subNavKey] || [];
      flatData[`${option.service} - Sub-Nav - Selected Options`] =
        selectedOptions.join(", ");

      // Add other text for this service
      const otherText =
        survey.businessInfo.subNavOtherText[subNavOtherKey] || "";
      flatData[`${option.service} - Sub-Nav - Other Text`] = otherText;
    });

    // Add Residential Services - dynamically based on constants
    RESIDENTIAL_SERVICE_LINES.forEach((category) => {
      category.items.forEach((itemName) => {
        const prefix = `Residential ${category.heading} ${itemName}`;

        // Find the corresponding item in the survey data
        const categoryData = survey.serviceLines.residentialServices.find(
          (cat) => cat.heading === category.heading
        );
        const itemData = categoryData?.items.find(
          (item) => item.name === itemName
        );

        // Show the actual rating value
        flatData[`${prefix} Rating`] = itemData?.rating || "Not Important";
      });
    });

    // Add Commercial Services - dynamically based on constants
    COMMERCIAL_SERVICE_LINES.forEach((category) => {
      category.items.forEach((itemName) => {
        const prefix = `Commercial ${category.heading} ${itemName}`;

        // Find the corresponding item in the survey data
        const categoryData = survey.serviceLines.commercialServices.find(
          (cat) => cat.heading === category.heading
        );
        const itemData = categoryData?.items.find(
          (item) => item.name === itemName
        );

        // Show the actual rating value
        flatData[`${prefix} Rating`] = itemData?.rating || "Not Important";
      });
    });

    // Add Industries - dynamically based on constants
    INDUSTRIES.forEach((category) => {
      category.items.forEach((itemName) => {
        const prefix = `Industries ${category.heading} ${itemName}`;

        // Find the corresponding item in the survey data
        const categoryData = survey.serviceLines.industries.find(
          (cat) => cat.heading === category.heading
        );
        const itemData = categoryData?.items.find(
          (item) => item.name === itemName
        );

        // Show the actual rating value
        flatData[`${prefix} Rating`] = itemData?.rating || "Not Important";
      });
    });

    // Add Additional Notes
    flatData["Residential Additional Notes"] =
      survey.serviceLines.residentialAdditionalNotes || "";
    flatData["Commercial Additional Notes"] =
      survey.serviceLines.commercialAdditionalNotes || "";
    flatData["Industries Additional Notes"] =
      survey.serviceLines.industriesAdditionalNotes || "";

    return flatData;
  });
}

/**
 * Downloads survey data as an Excel file
 */
export function downloadSurveyDataAsExcel(
  surveys: SurveyData[],
  options: ExcelExportOptions = {}
): void {
  const { filename = "survey-data.xlsx", sheetName = "Survey Data" } = options;

  try {
    // Flatten the data for Excel export
    const flatData = flattenSurveyData(surveys);

    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Convert data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(flatData);

    // Auto-size columns based on dynamic headers
    const columnWidths = Object.keys(flatData[0] || {}).map((key) => ({
      wch: Math.max(key.length, 15),
    }));
    worksheet["!cols"] = columnWidths;

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generate the Excel file
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    // Create a blob and download
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the URL
    window.URL.revokeObjectURL(url);

    console.log(
      `Excel file "${filename}" downloaded successfully with ${surveys.length} survey records`
    );
  } catch (error) {
    console.error("Error generating Excel file:", error);
    throw new Error("Failed to generate Excel file");
  }
}
