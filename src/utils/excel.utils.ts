import * as XLSX from "xlsx";
import { SurveyConfig, SurveyResponse } from "../types/framework.types";

export interface ExcelExportOptions {
  filename?: string;
  sheetName?: string;
}


/**
 * Downloads framework survey responses as an Excel file with proper ordering based on survey configuration
 */
export const downloadFrameworkResponsesAsExcel = (
  responses: SurveyResponse[],
  surveyConfig?: SurveyConfig,
  options: ExcelExportOptions = {}
): void => {
  const {
    filename = "framework-survey-data.xlsx",
    sheetName = "Survey Responses",
  } = options;

  try {
    if (responses.length === 0) {
      console.warn("No responses to download");
      return;
    }

    // Transform responses to flat structure for Excel with proper ordering
    const flatData = responses.map((response, index) => {
      const flatRow: any = {
        // Metadata section (1st)
        "Response ID": response.id,
        "Survey Instance ID": response.surveyInstanceId,
        "Config Version": response.configVersion,
        "Submitted At": response.submittedAt,
        "User Agent": response.metadata.userAgent,
        "IP Address": response.metadata.ipAddress || "Not Available",
      };

      // Add all response fields dynamically, but we'll reorder them later
      if (response.responses) {
        console.log(`Processing response ${index + 1}/${responses.length}:`, {
          responseId: response.id,
          fieldCount: Object.keys(response.responses).length,
          fields: Object.keys(response.responses),
        });

        Object.entries(response.responses).forEach(([key, value]) => {
          // Convert the key to a more readable format
          const readableKey = key
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase());

          // Handle different value types properly
          let displayValue = value;
          if (Array.isArray(value)) {
            // Convert arrays to comma-separated strings
            displayValue = value.join(", ");
            console.log(
              `Array field "${readableKey}":`,
              value,
              "->",
              displayValue
            );
          } else if (value === null || value === undefined) {
            displayValue = "";
          } else if (typeof value === "object") {
            // Convert objects to JSON strings for readability
            displayValue = JSON.stringify(value);
            console.log(
              `Object field "${readableKey}":`,
              value,
              "->",
              displayValue
            );
          }

          flatRow[readableKey] = displayValue;
        });
      }

      return flatRow;
    });

    // Reorder columns based on survey configuration if available
    const reorderedData = flatData.map((row) => {
      const reorderedRow: any = {};

      // 1. Metadata fields (always first)
      reorderedRow["Response ID"] = row["Response ID"];
      reorderedRow["Survey Instance ID"] = row["Survey Instance ID"];
      reorderedRow["Config Version"] = row["Config Version"];
      reorderedRow["Submitted At"] = row["Submitted At"];
      reorderedRow["User Agent"] = row["User Agent"];
      reorderedRow["IP Address"] = row["IP Address"];

      if (surveyConfig) {
        console.log("Reordering data using survey config:", {
          sections: surveyConfig.sections.map((s) => s.title),
          totalFields: surveyConfig.sections.reduce(
            (sum, s) => sum + s.fields.length,
            0
          ),
        });

        // Group fields by section and process them in order
        surveyConfig.sections.forEach((section, sectionIndex) => {
          console.log(
            `Processing section ${sectionIndex + 1}: "${section.title}" with ${
              section.fields.length
            } fields`
          );

          // Get all fields that belong to this section
          const sectionFields = Object.keys(row).filter((key) => {
            const keyLower = key.toLowerCase();
            const sectionTitleLower = section.title.toLowerCase();

            // Check if the field belongs to this section
            return keyLower.includes(
              sectionTitleLower.replace(/[^a-z0-9]+/g, " ")
            );
          });

          console.log(
            `Found ${sectionFields.length} fields for section "${section.title}":`,
            sectionFields
          );

          // Special handling for "Additional Notes" sections - group them with their main sections
          if (section.title.toLowerCase().includes("additional notes")) {
            // Find the main section this belongs to
            const mainSectionTitle = section.title
              .toLowerCase()
              .replace(" additional notes", "")
              .replace("services ", "")
              .replace("services", "");

            console.log(
              `Additional Notes section "${section.title}" belongs to main section: "${mainSectionTitle}"`
            );

            // Get all fields for the main section
            const mainSectionFields = Object.keys(row).filter((key) => {
              const keyLower = key.toLowerCase();
              return keyLower.includes(
                mainSectionTitle.replace(/[^a-z0-9]+/g, " ")
              );
            });

            // Add main section fields first, then the additional notes
            mainSectionFields.forEach((fieldKey) => {
              if (!Object.prototype.hasOwnProperty.call(reorderedRow, fieldKey)) {
                reorderedRow[fieldKey] = row[fieldKey];
                console.log(`✓ Added main section field "${fieldKey}"`);
              }
            });

            // Then add the additional notes fields
            sectionFields.forEach((fieldKey) => {
              reorderedRow[fieldKey] = row[fieldKey];
              console.log(
                `✓ Added additional notes field "${fieldKey}" to main section "${mainSectionTitle}"`
              );
            });
          } else {
            // Regular section - add all fields for this section in their original order
            sectionFields.forEach((fieldKey) => {
              reorderedRow[fieldKey] = row[fieldKey];
              console.log(
                `✓ Added field "${fieldKey}" to section "${section.title}"`
              );
            });
          }
        });
      } else {
        // No survey config available - preserve original order
        // Just add all remaining fields in their original order
        Object.keys(row).forEach((key) => {
          if (!Object.prototype.hasOwnProperty.call(reorderedRow, key)) {
            reorderedRow[key] = row[key];
          }
        });
      }

      return reorderedRow;
    });

    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Convert data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(reorderedData);

    // Log summary of exported data
    if (reorderedData.length > 0) {
      const exportedFields = Object.keys(reorderedData[0]);
      console.log("Excel export summary:", {
        totalResponses: responses.length,
        totalFields: exportedFields.length,
        exportedFields: exportedFields,
        sampleData: reorderedData[0],
      });
    }

    // Auto-size columns based on dynamic headers
    const columnWidths = Object.keys(reorderedData[0] || {}).map((key) => ({
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
      `Excel file "${filename}" downloaded successfully with ${responses.length} response records`
    );
  } catch (error) {
    console.error("Error generating Excel file:", error);
    throw new Error("Failed to generate Excel file");
  }
}
