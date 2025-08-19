import { RadioOptionSetManager } from "@/components/admin/radio-option-set-manager/radio-option-set-manager";
import { MultiSelectOptionSetManager } from "@/components/admin/multi-select-option-set-manager/multi-select-option-set-manager";
import { SelectOptionSetManager } from "@/components/admin/select-option-set-manager/select-option-set-manager";
import { RatingScaleManager } from "@/components/admin/rating-option-set-manager/rating-option-set-manager";
import { ValidationResultsModal } from "@/components/common/framework/modal/validation-results-modal";
import { useToast } from "@/contexts/toast-context/index";
import { useModal } from "@/contexts/modal-context";
import { useSurveyOperations } from "./use-survey-operations";
import { useState } from "react";

interface ValidationStatus {
  hasErrors: boolean;
  errorCount: number;
  lastChecked: Date | null;
}

export const useConfigValidation = () => {
  const { showError, showInfo } = useToast();
  const { verifyConfig } = useSurveyOperations();
  const { openModal, closeModal } = useModal();

  // Validation status state
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>({
    hasErrors: false,
    errorCount: 0,
    lastChecked: null,
  });

  // Update validation status helper
  const updateValidationStatus = (results: any) => {
    setValidationStatus({
      hasErrors: results.invalidConfigs > 0,
      errorCount: results.invalidConfigs,
      lastChecked: new Date(),
    });
  };

  // Handle verification
  const handleVerifyConfig = async () => {
    try {
      const results = await verifyConfig();
      updateValidationStatus(results);
      openModal(
        "validation-results",
        <ValidationResultsModal
          isOpen={true}
          onClose={() => closeModal("validation-results")}
          validationResults={
            results || {
              totalConfigs: 0,
              validConfigs: 0,
              invalidConfigs: 0,
              totalInstances: 0,
              deactivatedInstances: 0,
              errors: [],
              warnings: [],
            }
          }
          onCreateMissingItem={handleCreateMissingItem}
          onRefreshValidation={handleRefreshValidation}
        />
      );
    } catch (error) {
      showError("Failed to verify configurations. Please try again.");
      console.error("Failed to verify config:", error);
    }
  };

  // Handle creating missing items
  const handleCreateMissingItem = async (
    type: string,
    id: string,
    name?: string,
    fieldLabel?: string
  ) => {
    console.log("🔧 Opening creation modal for missing item:", {
      type,
      id,
      name,
      fieldLabel,
    });

    showInfo(`Opening ${type.replace(/-/g, " ")} creation form...`);

    // Handle modal close with validation refresh
    const handleModalCloseWithRefresh = (modalId: string) => {
      return () => {
        closeModal(modalId);
        // Refresh validation after creating an item
        verifyConfig().then((results) => {
          updateValidationStatus(results);
          // Update validation results modal if it's open
          handleRefreshValidation(results);
        });
      };
    };

    // Open the appropriate creation modal based on the item type
    switch (type) {
      case "rating-scale":
        openModal(
          "rating-scale-creation",
          <RatingScaleManager
            isVisible={true}
            onClose={handleModalCloseWithRefresh("rating-scale-creation")}
            isCreating={true}
            editingScale={{
              id,
              name: fieldLabel || "New Rating Scale",
              description: `Rating scale for field "${fieldLabel}"`,
              options: [],
              isActive: true,
              metadata: {
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: "user",
              },
            }}
          />
        );
        break;
      case "radio-option-set":
        openModal(
          "radio-option-set-creation",
          <RadioOptionSetManager
            isVisible={true}
            onClose={handleModalCloseWithRefresh("radio-option-set-creation")}
            isCreating={true}
            editingOptionSet={{
              id,
              name: fieldLabel || "New Radio Option Set",
              description: `Option set for field "${fieldLabel}"`,
              options: [],
              isActive: true,
              metadata: {
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: "user",
              },
            }}
          />
        );
        break;
      case "multi-select-option-set":
        openModal(
          "multi-select-option-set-creation",
          <MultiSelectOptionSetManager
            isVisible={true}
            onClose={handleModalCloseWithRefresh(
              "multi-select-option-set-creation"
            )}
            isCreating={true}
            editingOptionSet={{
              id,
              name: fieldLabel || "New Multi-Select Option Set",
              description: `Option set for field "${fieldLabel}"`,
              options: [],
              minSelections: 1,
              maxSelections: undefined,
              isActive: true,
              metadata: {
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: "user",
              },
            }}
          />
        );
        break;
      case "select-option-set":
        openModal(
          "select-option-set-creation",
          <SelectOptionSetManager
            isVisible={true}
            onClose={handleModalCloseWithRefresh("select-option-set-creation")}
            isCreating={true}
            editingOptionSet={{
              id,
              name: fieldLabel || "New Select Option Set",
              description: `Option set for field "${fieldLabel}"`,
              options: [],
              allowMultiple: false,
              isActive: true,
              metadata: {
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: "user",
              },
            }}
          />
        );
        break;
      default:
        showError(`Unknown item type: ${type}`);
        return;
    }
  };

  // Handle validation refresh (can accept results parameter or fetch new ones)
  const handleRefreshValidation = async (results?: any) => {
    console.log("🔄 Re-running validation after item creation...");

    const validationResults = results || (await verifyConfig());

    console.log("📊 New validation results:", {
      totalConfigs: validationResults.totalConfigs,
      validConfigs: validationResults.validConfigs,
      invalidConfigs: validationResults.invalidConfigs,
      errorCount: validationResults.errors.length,
    });

    updateValidationStatus(validationResults);

    // Update validation results modal if it's open by closing and reopening it
    closeModal("validation-results");
    openModal(
      "validation-results",
      <ValidationResultsModal
        isOpen={true}
        onClose={() => closeModal("validation-results")}
        validationResults={
          validationResults || {
            totalConfigs: 0,
            validConfigs: 0,
            invalidConfigs: 0,
            totalInstances: 0,
            deactivatedInstances: 0,
            errors: [],
            warnings: [],
          }
        }
        onCreateMissingItem={handleCreateMissingItem}
        onRefreshValidation={handleRefreshValidation}
      />
    );
  };

  return {
    validationStatus,
    handleVerifyConfig,
    handleCreateMissingItem,
  };
};
