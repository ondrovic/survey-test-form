import * as XLSX from "xlsx";
import {
  COMMERCIAL_SERVICE_LINES,
  INDUSTRIES,
  RESIDENTIAL_SERVICE_LINES,
} from "../constants/services.constants";
import { SurveyData } from "../types/survey.types";

export interface ExcelExportOptions {
  filename?: string;
  sheetName?: string;
}

/**
 * Gets the expected number of columns for the Excel export
 * Useful for testing and validation
 */
export function getExpectedColumnCount(): number {
  let count = 12; // Base columns (ID, Submitted At, Updated At, Personal Info, Business Info, Additional Notes)

  // Add Residential Services columns
  RESIDENTIAL_SERVICE_LINES.forEach((category) => {
    count += category.items.length * 2; // Selected + Rating for each item
  });

  // Add Commercial Services columns
  COMMERCIAL_SERVICE_LINES.forEach((category) => {
    count += category.items.length * 2; // Selected + Rating for each item
  });

  // Add Industries columns
  INDUSTRIES.forEach((category) => {
    count += category.items.length * 2; // Selected + Rating for each item
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
    };

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

        flatData[`${prefix} Selected`] = itemData?.selected ? "Yes" : "No";
        // For rating, if not selected, show N/A, otherwise show the actual rating
        flatData[`${prefix} Rating`] = itemData?.selected
          ? itemData?.rating || "N/A"
          : "N/A";
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

        flatData[`${prefix} Selected`] = itemData?.selected ? "Yes" : "No";
        // For rating, if not selected, show N/A, otherwise show the actual rating
        flatData[`${prefix} Rating`] = itemData?.selected
          ? itemData?.rating || "N/A"
          : "N/A";
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

        flatData[`${prefix} Selected`] = itemData?.selected ? "Yes" : "No";
        // For rating, if not selected, show N/A, otherwise show the actual rating
        flatData[`${prefix} Rating`] = itemData?.selected
          ? itemData?.rating || "N/A"
          : "N/A";
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
