import { Button } from "@/components/common";
import React, { useState } from "react";

interface ValidationError {
  configTitle: string;
  sectionTitle: string;
  subsectionTitle?: string;
  fieldLabel: string;
  fieldId: string;
  fieldType: string;
  missingItemType:
    | "rating-scale"
    | "radio-option-set"
    | "multi-select-option-set"
    | "select-option-set";
  missingItemId: string;
  missingItemName?: string;
}

interface ValidationResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  validationResults: {
    totalConfigs: number;
    validConfigs: number;
    invalidConfigs: number;
    totalInstances: number;
    deactivatedInstances: number;
    errors: string[];
    warnings: string[];
  };
  onCreateMissingItem: (
    type: string,
    id: string,
    name?: string,
    fieldLabel?: string
  ) => Promise<void>;
  onRefreshValidation: () => Promise<void>;
}

export const ValidationResultsModal: React.FC<ValidationResultsModalProps> = ({
  isOpen,
  onClose,
  validationResults,
  onCreateMissingItem,
  onRefreshValidation,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [creatingItem, setCreatingItem] = useState<string | null>(null);
  const [createdItems, setCreatedItems] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  // Parse the error messages to extract structured information
  const parseErrors = (errors: string[]): ValidationError[] => {
    console.log("🔍 Parsing validation errors:", errors);
    return errors.map((error) => {
      console.log("🔍 Parsing error:", error);

      // Parse basic structure first
      const configMatch = error.match(/Config "([^"]+)"/);
      const sectionMatch = error.match(/Section "([^"]+)"/);
      const subsectionMatch = error.match(/Subsection "([^"]+)"/);

      // Check different error patterns
      const fieldMatch = error.match(/Field "([^"]+)"/);
      const missingItemMatch = error.match(
        /Referenced ([\w\s-]+) "([^"]+)" not found/
      );
      const noFieldsMatch = error.match(/No fields defined/);
      const mustReferenceMatch = error.match(
        /([\w\s]+) field must reference a ([\w\s-]+)/
      );

      console.log("🔍 Regex matches:", {
        configMatch: configMatch?.[1],
        sectionMatch: sectionMatch?.[1],
        fieldMatch: fieldMatch?.[1],
        missingItemMatch: missingItemMatch,
        noFieldsMatch: !!noFieldsMatch,
        mustReferenceMatch: mustReferenceMatch,
      });

      // Handle "No fields defined" error pattern
      if (configMatch && sectionMatch && noFieldsMatch) {
        console.log('✅ Successfully parsed "No fields defined" error');
        return {
          configTitle: configMatch[1],
          sectionTitle: sectionMatch[1],
          subsectionTitle: subsectionMatch?.[1],
          fieldLabel: "Section has no fields",
          fieldId: "",
          fieldType: "Section Configuration",
          missingItemType: "radio-option-set", // Default, not applicable
          missingItemId: "",
          missingItemName: "Section fields required",
        };
      }

      // Handle "must reference" error pattern like "Select field must reference a select option set"
      if (configMatch && sectionMatch && fieldMatch && mustReferenceMatch) {
        const fieldType = mustReferenceMatch[1].toLowerCase(); // "select"
        const requiredItemType = mustReferenceMatch[2]
          .toLowerCase()
          .replace(/\s+/g, "-"); // "select-option-set"

        console.log('✅ Successfully parsed "must reference" error:', {
          fieldType,
          requiredItemType,
          fieldLabel: fieldMatch[1],
        });

        return {
          configTitle: configMatch[1],
          sectionTitle: sectionMatch[1],
          subsectionTitle: subsectionMatch?.[1],
          fieldLabel: fieldMatch[1],
          fieldId: "",
          fieldType: `${fieldType} field configuration`,
          missingItemType:
            requiredItemType as ValidationError["missingItemType"],
          missingItemId: "", // No specific ID to create, needs manual assignment
          missingItemName: `${requiredItemType} required for ${fieldMatch[1]}`,
        };
      }

      // Handle "Referenced item not found" error pattern
      if (configMatch && sectionMatch && fieldMatch && missingItemMatch) {
        // Convert "radio option set" to "radio-option-set" format
        const missingItemTypeText = missingItemMatch[1]
          .toLowerCase()
          .replace(/\s+/g, "-");
        const missingItemType =
          missingItemTypeText as ValidationError["missingItemType"];
        const missingItemId = missingItemMatch[2];

        console.log("✅ Successfully parsed missing item error:", {
          missingItemType,
          missingItemId,
          fieldLabel: fieldMatch[1],
        });

        return {
          configTitle: configMatch[1],
          sectionTitle: sectionMatch[1],
          subsectionTitle: subsectionMatch?.[1],
          fieldLabel: fieldMatch[1],
          fieldId: "", // We'll need to extract this from the config
          fieldType: missingItemType.replace(/-/g, " "),
          missingItemType,
          missingItemId,
          missingItemName: missingItemMatch[2],
        };
      }

      // Fallback for unparseable errors
      console.error("❌ Failed to parse error, using fallback:", error);
      return {
        configTitle: configMatch?.[1] || "Unknown",
        sectionTitle: sectionMatch?.[1] || "Unknown",
        subsectionTitle: subsectionMatch?.[1],
        fieldLabel: error, // Show the full error message as fallback
        fieldId: "",
        fieldType: "Unknown",
        missingItemType: "radio-option-set",
        missingItemId: "",
        missingItemName: "Unknown",
      };
    });
  };

  const validationErrors = parseErrors(validationResults.errors);
  const hasErrors = validationResults.invalidConfigs > 0;

  const getMissingItemDisplayName = (type: string): string => {
    switch (type) {
      case "rating-scale":
        return "Rating Scale";
      case "radio-option-set":
        return "Radio Option Set";
      case "multi-select-option-set":
        return "Multi-Select Option Set";
      case "select-option-set":
        return "Select Option Set";
      default:
        return type;
    }
  };

  const getMissingItemIcon = (type: string): string => {
    switch (type) {
      case "rating-scale":
        return "⭐";
      case "radio-option-set":
        return "🔘";
      case "multi-select-option-set":
        return "☑️";
      case "select-option-set":
        return "📋";
      default:
        return "❓";
    }
  };

  const handleCreateMissingItem = async (error: ValidationError) => {
    try {
      console.log("🚀 Starting creation for missing item:", error);
      setIsCreating(true);
      setCreatingItem(error.missingItemId);

      // Create the missing item
      console.log("🔧 Calling onCreateMissingItem with:", {
        type: error.missingItemType,
        id: error.missingItemId,
        name: error.fieldLabel,
        fieldLabel: error.fieldLabel,
      });
      await onCreateMissingItem(
        error.missingItemType,
        error.missingItemId,
        error.fieldLabel,
        error.fieldLabel
      );

      // Mark as created
      setCreatedItems((prev) => new Set(prev).add(error.missingItemId));

      // Refresh validation to see if issues are resolved
      await onRefreshValidation();
    } catch (error) {
      console.error("❌ Failed to create missing item in modal:", error);
    } finally {
      setIsCreating(false);
      setCreatingItem(null);
    }
  };

  const handleCreateAllMissingItems = async () => {
    try {
      console.log(
        "🚀 Starting creation for all missing items:",
        validationErrors.length
      );
      setIsCreating(true);

      // Create all missing items that can be created
      for (const error of validationErrors) {
        const canCreate =
          error.missingItemId &&
          error.fieldType !== "Section Configuration" &&
          !error.fieldType?.includes("field configuration");

        if (canCreate && !createdItems.has(error.missingItemId)) {
          console.log("🔧 Creating item in batch:", error.missingItemId);
          setCreatingItem(error.missingItemId);
          await onCreateMissingItem(
            error.missingItemType,
            error.missingItemId,
            error.fieldLabel,
            error.fieldLabel
          );
          setCreatedItems((prev) => new Set(prev).add(error.missingItemId));
        } else {
          console.log(
            "⏭️ Skipping item that cannot be auto-created or already created:",
            error.missingItemId || "structural-error"
          );
        }
      }

      // Refresh validation
      await onRefreshValidation();
    } catch (error) {
      console.error("Failed to create all missing items:", error);
    } finally {
      setIsCreating(false);
      setCreatingItem(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Configuration Validation Results
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {hasErrors
                  ? "Issues found that need to be resolved"
                  : "All configurations are valid"}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {validationResults.totalConfigs}
              </div>
              <div className="text-sm text-gray-600">Total Configs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {validationResults.validConfigs}
              </div>
              <div className="text-sm text-gray-600">Valid</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {validationResults.invalidConfigs}
              </div>
              <div className="text-sm text-gray-600">Invalid</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {validationResults.deactivatedInstances}
              </div>
              <div className="text-sm text-gray-600">Deactivated</div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {hasErrors ? (
            <div className="space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="text-red-400 mr-3">
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-red-800 font-medium">
                      Configuration Issues Detected
                    </h4>
                    <p className="text-red-700 text-sm mt-1">
                      {validationResults.invalidConfigs} configuration(s) have
                      validation errors.
                      {validationResults.deactivatedInstances > 0 &&
                        ` ${validationResults.deactivatedInstances} active instance(s) have been deactivated.`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Detailed Error List */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">
                  Validation Issues
                </h4>
                <div className="space-y-3">
                  {validationErrors.map((error, index) => {
                    const canCreate =
                      (error.missingItemId &&
                        error.missingItemType !== "radio-option-set") ||
                      error.missingItemId;
                    const isStructuralError =
                      error.fieldLabel.includes("Section has no fields") ||
                      error.fieldType === "Section Configuration";
                    const isConfigurationError =
                      error.fieldType?.includes("field configuration") &&
                      !error.missingItemId;

                    return (
                      <div
                        key={index}
                        className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <span className="text-2xl mr-3">
                                {isStructuralError || isConfigurationError
                                  ? "⚠️"
                                  : getMissingItemIcon(error.missingItemType)}
                              </span>
                              <div>
                                <h5 className="font-medium text-gray-900">
                                  {isStructuralError
                                    ? "Configuration Issue"
                                    : isConfigurationError
                                    ? "Field Configuration Required"
                                    : `Missing ${getMissingItemDisplayName(
                                        error.missingItemType
                                      )}`}
                                </h5>
                                <p className="text-sm text-gray-600">
                                  {isStructuralError
                                    ? `${error.configTitle} > ${error.sectionTitle}: ${error.fieldLabel}`
                                    : isConfigurationError
                                    ? `Field "${error.fieldLabel}" in ${
                                        error.configTitle
                                      } > ${error.sectionTitle}${
                                        error.subsectionTitle
                                          ? ` > ${error.subsectionTitle}`
                                          : ""
                                      } needs to be configured with a ${getMissingItemDisplayName(
                                        error.missingItemType
                                      ).toLowerCase()}`
                                    : `Referenced by field "${
                                        error.fieldLabel
                                      }" in ${error.configTitle} > ${
                                        error.sectionTitle
                                      }${
                                        error.subsectionTitle
                                          ? ` > ${error.subsectionTitle}`
                                          : ""
                                      }`}
                                </p>
                              </div>
                            </div>
                            {error.missingItemId && (
                              <div className="ml-11">
                                <div className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-700">
                                  ID: {error.missingItemId}
                                </div>
                              </div>
                            )}
                          </div>
                          {canCreate &&
                            !isStructuralError &&
                            !isConfigurationError && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCreateMissingItem(error)}
                                disabled={
                                  isCreating ||
                                  createdItems.has(error.missingItemId)
                                }
                                className="ml-4"
                              >
                                {createdItems.has(error.missingItemId) ? (
                                  <>✅ Created</>
                                ) : isCreating &&
                                  creatingItem === error.missingItemId ? (
                                  <>⏳ Creating...</>
                                ) : (
                                  <>
                                    Create{" "}
                                    {getMissingItemDisplayName(
                                      error.missingItemType
                                    )}
                                  </>
                                )}
                              </Button>
                            )}
                          {(isStructuralError || isConfigurationError) && (
                            <div className="ml-4 text-sm text-amber-600 bg-blue-50 px-3 py-1 rounded">
                              Manual fix required
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
                {validationErrors.some(
                  (error) =>
                    error.missingItemId &&
                    error.fieldType !== "Section Configuration" &&
                    !error.fieldType?.includes("field configuration")
                ) && (
                  <Button
                    variant="primary"
                    onClick={handleCreateAllMissingItems}
                    disabled={isCreating}
                  >
                    {isCreating
                      ? "⏳ Creating All Items..."
                      : "Create All Missing Items"}
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-green-400 text-6xl mb-4">✅</div>
              <h4 className="text-xl font-medium text-gray-900 mb-2">
                All Configurations Valid!
              </h4>
              <p className="text-gray-600">
                Your survey configurations are properly configured and ready to
                use.
              </p>
              <Button variant="primary" onClick={onClose} className="mt-4">
                Continue
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
