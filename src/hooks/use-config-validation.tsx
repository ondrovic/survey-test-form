import { 
  MultiSelectOptionSetManager,
  RadioOptionSetManager,
  RatingScaleManager,
  SelectOptionSetManager 
} from "@/components/admin/option-set-manager";
import { ValidationResultsModal } from "@/components/common";
import { useModal } from "@/contexts/modal-context";
import { useToast } from "@/contexts/toast-context/index";
import { useValidationStatus } from "@/contexts/validation-status-context";
import { useSurveyOperations } from "./use-survey-operations";


export const useConfigValidation = () => {
  const { showError, showInfo } = useToast();
  const { verifyConfig } = useSurveyOperations();
  const { openReactiveModal, closeModal } = useModal();
  
  // Use validation status from context (single source of truth)
  const { validationStatus, updateValidationStatus, clearValidationStatus } = useValidationStatus();

  // Handle validation refresh after item creation
  const handleRefreshValidation = async () => {
    console.log("🔄 Refreshing validation after item creation...");
    try {
      // Close the validation modal first
      closeModal("validation-results");

      // Run validation to check if issues are resolved (silent mode for automatic refresh)
      const results = await verifyConfig(true);
      
      // Always update validation status with the results
      console.log("🔄 Updating validation status after refresh validation");
      updateValidationStatus(results);

      if (results.invalidConfigs > 0) {
        console.log("⚠️ Validation still has issues after item creation");
        // Reopen validation modal with updated results
        openReactiveModal(
          "validation-results",
          () => (
            <ValidationResultsModal
              isOpen={true}
              onClose={() => closeModal("validation-results")}
              validationResults={results}
              onCreateMissingItem={handleCreateMissingItem}
              onRefreshValidation={handleRefreshValidation}
            />
          )
        );
      } else {
        console.log("✅ Validation passed after item creation - badges should clear");
      }
    } catch (error) {
      console.error("❌ Error refreshing validation:", error);
      // On error, clear validation status to prevent stuck badges
      updateValidationStatus({ invalidConfigs: 0, validConfigs: 0, totalConfigs: 0 });
    }
  };

  // Handle verification
  const handleVerifyConfig = async () => {
    try {
      const results = await verifyConfig();
      
      // Always update validation status
      console.log("🔄 Updating validation status after manual verification");
      updateValidationStatus(results);
      
      openReactiveModal(
        "validation-results",
        () => (
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
        )
      );
    } catch (error) {
      showError("Failed to verify configurations. Please try again.");
      console.error("Failed to verify config:", error);
      // On error, clear validation status to prevent stuck badges
      updateValidationStatus({ invalidConfigs: 0, validConfigs: 0, totalConfigs: 0 });
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
      return async () => {
        closeModal(modalId);

        // Wait a moment for the database operations to complete
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Force a complete data refresh and revalidation
        console.log("🔄 Modal closed, triggering validation refresh...");
        await handleRefreshValidation();
      };
    };

    // Open the appropriate creation modal based on the item type
    switch (type) {
      case "rating-scale":
        openReactiveModal(
          "rating-scale-creation",
          () => (
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
          )
        );
        break;
      case "radio-option-set":
        openReactiveModal(
          "radio-option-set-creation",
          () => (
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
          )
        );
        break;
      case "multi-select-option-set":
        openReactiveModal(
          "multi-select-option-set-creation",
          () => (
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
          )
        );
        break;
      case "select-option-set":
        openReactiveModal(
          "select-option-set-creation",
          () => (
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
          )
        );
        break;
      default:
        showError(`Unknown item type: ${type}`);
        return;
    }
  };

  return {
    validationStatus,
    handleVerifyConfig,
    handleCreateMissingItem,
    updateValidationStatus,
    clearValidationStatus,
  };
};
