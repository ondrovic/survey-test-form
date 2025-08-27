import { ValidationResultsModal } from "@/components/common";
import { useModal } from "@/contexts/modal-context";
import { useCallback, useRef } from "react";
import { useConfigValidation } from "./use-config-validation";
import { useSurveyOperations } from "./use-survey-operations";

// Global flag to track if an import operation is in progress
let isImportOperationInProgress = false;

/**
 * Hook for automatic configuration validation
 * Provides methods to trigger validation automatically at key points
 */
export const useAutomaticValidation = (updateValidationStatus: (results: any) => void) => {
  const { verifyConfig } = useSurveyOperations();
  const { openReactiveModal, closeModal, forceUpdateModal, isModalOpen } = useModal();
  
  // Try to get config validation, but don't fail if context is not available
  let handleCreateMissingItem: any = () => {
    console.log('No validation context available for creating missing items');
    // Since we can't create missing items without context, just show info message
    return Promise.resolve();
  };
  
  try {
    const configValidation = useConfigValidation();
    handleCreateMissingItem = configValidation.handleCreateMissingItem;
  } catch (error) {
    // This is expected when the hook is used outside the ValidationStatusProvider
    // Only log in development/debug mode to avoid console spam
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️ Validation context not available in useAutomaticValidation (expected when used at framework level)');
    }
  }

  // Store current validation results to avoid recreating the modal
  const currentValidationResults = useRef<any>(null);

  /**
   * Show validation results modal - used by automatic validation when issues are found
   */
  const showValidationModal = useCallback(
    (validationResults: any) => {
      // Prevent duplicate modals by checking if one is already open
      if (isModalOpen("validation-results")) {
        console.log("⚠️ Validation modal already open, skipping duplicate");
        return;
      }

      // Store the current results
      currentValidationResults.current = validationResults;

      const handleRefreshValidation = async () => {
        console.log("🔄 Refreshing validation after item creation...");

        try {
          // Close the modal first
          closeModal("validation-results");

          // Clear cached validation results to force fresh validation
          currentValidationResults.current = null;

          // Wait for complete data refresh cycle, then run validation
          setTimeout(async () => {
            try {
              console.log("🔍 Running delayed validation after item creation...");

              // Force a fresh data load before validation
              console.log("🔄 Forcing fresh data load before validation...");

              // Add extra delay to ensure survey config is also updated
              await new Promise((resolve) => setTimeout(resolve, 2000));

              // Run validation with fresh data
              const result = await runBackgroundValidation();

              if (result) {
                // Update validation status for UI - ensure this always happens
                console.log("🔧 Updating validation status from delayed validation");
                updateValidationStatus(result);

                if (result.invalidConfigs > 0) {
                  console.log("⚠️ Delayed validation still has issues:", result.errors);
                  console.log("🔍 This suggests the survey configuration still references the old option set ID");
                } else {
                  console.log("✅ Delayed validation passed - validation badges should clear");
                }
              } else {
                console.warn("⚠️ Delayed validation returned null - clearing validation status");
                // If validation fails, clear the status to prevent stuck badges
                updateValidationStatus({ invalidConfigs: 0, validConfigs: 0, totalConfigs: 0 });
              }
            } catch (error) {
              console.error("❌ Delayed validation failed:", error);
              // On error, clear validation status to prevent stuck badges
              updateValidationStatus({ invalidConfigs: 0, validConfigs: 0, totalConfigs: 0 });
            }
          }, 5000); // Wait 5 seconds for complete data refresh cycle

        } catch (error) {
          console.error("❌ Error during validation refresh:", error);
          // Close modal on error
          closeModal("validation-results");
        }
      };

      // Use openReactiveModal with a render function to avoid JSX in the hook
      openReactiveModal(
        "validation-results",
        () => (
          <ValidationResultsModal
            isOpen={true}
            onClose={() => closeModal("validation-results")}
            validationResults={
              currentValidationResults.current || {
                totalConfigs: 0,
                validConfigs: 0,
                invalidConfigs: 0,
                totalInstances: 0,
                deactivatedInstances: 0,
                reactivatedInstances: 0,
                errors: [],
                warnings: [],
              }
            }
            onCreateMissingItem={handleCreateMissingItem}
            onRefreshValidation={handleRefreshValidation}
          />
        )
      );
    },
    [openReactiveModal, closeModal, forceUpdateModal, handleCreateMissingItem, verifyConfig, isModalOpen]
  );

  /**
   * Run validation silently in the background
   * Does not show success messages, only logs and handles errors
   */
  const runBackgroundValidation = useCallback(async () => {
    try {
      console.log("🔍 Running automatic background validation...");
      const result = await verifyConfig(true); // Silent mode - no toasts

      if (result.invalidConfigs > 0) {
        console.warn(
          `⚠️ Background validation found ${result.invalidConfigs} configuration(s) with issues`
        );
        console.warn("Issues:", result.errors);

        if (result.deactivatedInstances > 0) {
          console.warn(
            `🔒 ${result.deactivatedInstances} survey instance(s) were automatically deactivated due to configuration errors`
          );
        }
      } else {
        let logMessage = "✅ Background validation passed - all configurations are valid";
        if (result.reactivatedInstances > 0) {
          logMessage += ` and ${result.reactivatedInstances} instance(s) were automatically reactivated`;
        }
        console.log(logMessage);
      }

      return result;
    } catch (error) {
      console.error("❌ Background validation failed:", error);
      return null;
    }
  }, [verifyConfig]);

  /**
   * Run validation after config import
   * Should be called after successfully importing a configuration
   * Shows modal if issues are found and shows success/error toasts like create/edit operations
   */
  const runPostImportValidation = useCallback(async () => {
    try {
      console.log("🔍 Running post-import validation...");

      // Set import operation flag to prevent page load validation from running
      isImportOperationInProgress = true;

      // Use non-silent mode to show toasts like create/edit operations
      const result = await verifyConfig(false);

      if (result && result.invalidConfigs > 0) {
        console.log("⚠️ Post-import validation found issues - showing modal");
        showValidationModal(result);
        // Update validation status for UI
        console.log("🔄 Updating validation status for UI (post-import with errors):", {
          invalidConfigs: result.invalidConfigs,
          deactivatedInstances: result.deactivatedInstances
        });
        updateValidationStatus(result);
      } else if (result) {
        console.log(
          "✅ Post-import validation passed - imported configuration is valid"
        );
        // Update validation status for UI
        console.log("🔄 Updating validation status for UI (post-import valid):", {
          validConfigs: result.validConfigs,
          totalConfigs: result.totalConfigs
        });
        updateValidationStatus(result);
      }

      // Clear the import operation flag after a short delay to allow page load validation to complete
      setTimeout(() => {
        isImportOperationInProgress = false;
        console.log("🔄 Import operation flag cleared, page load validation can now run");
      }, 1000);

      return result;
    } catch (error) {
      console.error("❌ Post-import validation failed:", error);
      // Clear the flag on error too
      isImportOperationInProgress = false;
      return null;
    }
  }, [runBackgroundValidation, showValidationModal, updateValidationStatus]);

  /**
   * Run validation on tab/page visit
   * Should be called when user navigates to Survey Framework admin
   * Shows modal if issues are found
   */
  const runOnPageLoad = useCallback(async () => {
    try {
      console.log("🔍 Running validation on page load...");

      // Skip page load validation if an import operation is in progress
      if (isImportOperationInProgress) {
        console.log("⏸️ Import operation in progress, skipping page load validation");
        return null;
      }

      // Add a small delay to ensure data is loaded
      await new Promise((resolve) => setTimeout(resolve, 500));

      const result = await runBackgroundValidation();

      console.log("📊 Page load validation result:", result);

      if (result && result.invalidConfigs > 0) {
        console.log("⚠️ Page load validation found issues - checking if modal already open...");

        // Only show modal if one isn't already open (prevents duplicates)
        if (!isModalOpen("validation-results")) {
          console.log("📋 No existing modal, showing validation modal");
          showValidationModal(result);
        } else {
          console.log("⚠️ Validation modal already open, skipping page load modal");
        }
        // Update validation status for UI
        console.log("🔄 Updating validation status for UI (page load with errors):", {
          invalidConfigs: result.invalidConfigs,
          deactivatedInstances: result.deactivatedInstances
        });
        console.log("🔧 Calling updateValidationStatus with result:", result);
        updateValidationStatus(result);
        console.log("✅ updateValidationStatus called");
      } else if (result) {
        console.log(
          "✅ Page load validation passed - all configurations are valid"
        );
        
        // Close validation modal if it's open since all issues are resolved
        if (isModalOpen("validation-results")) {
          console.log("🔄 Closing validation modal since all issues are resolved");
          closeModal("validation-results");
        }
        
        // Update validation status for UI
        console.log("🔄 Updating validation status for UI (page load valid):", {
          validConfigs: result.validConfigs,
          totalConfigs: result.totalConfigs
        });
        console.log("🔧 Calling updateValidationStatus with result:", result);
        updateValidationStatus(result);
        console.log("✅ updateValidationStatus called");
      }

      return result;
    } catch (error) {
      console.error("❌ Page load validation failed:", error);
      return null;
    }
  }, [runBackgroundValidation, showValidationModal, isModalOpen, updateValidationStatus]);

  /**
   * Run automatic validation and show modal only if issues are found
   */
  const runAutomaticValidationWithModal = useCallback(async () => {
    try {
      console.log("🔍 Running automatic validation with conditional modal...");
      const result = await runBackgroundValidation();

      // Show modal only if there are configuration issues
      if (result && result.invalidConfigs > 0) {
        console.log("⚠️ Automatic validation found issues - showing modal");
        showValidationModal(result);
      } else if (result) {
        console.log("✅ Automatic validation passed - no modal needed");
      }

      return result;
    } catch (error) {
      console.error("❌ Automatic validation with modal failed:", error);
      return null;
    }
  }, [runBackgroundValidation, showValidationModal]);

  /**
   * Run validation after data changes (e.g., after creating missing items)
   * This should be called when data has been modified and needs revalidation
   */
  const runAfterDataChange = useCallback(async () => {
    try {
      console.log("🔍 Running validation after data change...");

      // Add a small delay to ensure data is properly loaded
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const result = await runBackgroundValidation();

      if (result) {
        // Update validation status for UI
        updateValidationStatus(result);

        if (result.invalidConfigs > 0) {
          console.log("⚠️ Validation after data change still has issues");
        } else {
          console.log("✅ Validation after data change passed - all configurations are valid");
        }
      }

      return result;
    } catch (error) {
      console.error("❌ Validation after data change failed:", error);
      return null;
    }
  }, [runBackgroundValidation, updateValidationStatus]);

  return {
    runBackgroundValidation,
    runPostImportValidation,
    runOnPageLoad,
    runAutomaticValidationWithModal,
    runAfterDataChange,
    showValidationModal,
  };
};
