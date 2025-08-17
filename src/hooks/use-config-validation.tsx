import { RadioOptionSetManager } from '@/components/admin/radio-option-set-manager/radio-option-set-manager';
import { MultiSelectOptionSetManager } from '@/components/admin/multi-select-option-set-manager/multi-select-option-set-manager';
import { SelectOptionSetManager } from '@/components/admin/select-option-set-manager/select-option-set-manager';
import { RatingScaleManager } from '@/components/admin/rating-option-set-manager/rating-option-set-manager';
import { ValidationResultsModal } from '@/components/common/framework7/modal/validation-results-modal';
import { useToast } from '@/contexts/toast-context/index';
import { useModalState } from './use-modal-state';
import { useSurveyOperations } from './use-survey-operations';
import { useState } from 'react';

interface ValidationStatus {
  hasErrors: boolean;
  errorCount: number;
  lastChecked: Date | null;
}

export const useConfigValidation = () => {
  const { showError, showInfo } = useToast();
  const { verifyConfig } = useSurveyOperations();
  
  // Validation status state
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>({
    hasErrors: false,
    errorCount: 0,
    lastChecked: null
  });

  // Modal states
  const validationResultsModal = useModalState<any>();
  const radioOptionSetModal = useModalState<{id: string, fieldLabel?: string}>();
  const multiSelectOptionSetModal = useModalState<{id: string, fieldLabel?: string}>();
  const selectOptionSetModal = useModalState<{id: string, fieldLabel?: string}>();
  const ratingScaleModal = useModalState<{id: string, fieldLabel?: string}>();

  // Update validation status helper
  const updateValidationStatus = (results: any) => {
    setValidationStatus({
      hasErrors: results.invalidConfigs > 0,
      errorCount: results.invalidConfigs,
      lastChecked: new Date()
    });
  };

  // Handle verification
  const handleVerifyConfig = async () => {
    try {
      const results = await verifyConfig();
      updateValidationStatus(results);
      validationResultsModal.open(results);
    } catch (error) {
      showError('Failed to verify configurations. Please try again.');
      console.error('Failed to verify config:', error);
    }
  };

  // Handle creating missing items
  const handleCreateMissingItem = async (type: string, id: string, name?: string, fieldLabel?: string) => {
    console.log('🔧 Opening creation modal for missing item:', { type, id, name, fieldLabel });
    
    showInfo(`Opening ${type.replace(/-/g, ' ')} creation form...`);

    // Open the appropriate creation modal based on the item type
    switch (type) {
      case 'rating-scale':
        ratingScaleModal.open({ id, fieldLabel });
        break;
      case 'radio-option-set':
        radioOptionSetModal.open({ id, fieldLabel });
        break;
      case 'multi-select-option-set':
        multiSelectOptionSetModal.open({ id, fieldLabel });
        break;
      case 'select-option-set':
        selectOptionSetModal.open({ id, fieldLabel });
        break;
      default:
        showError(`Unknown item type: ${type}`);
        return;
    }
  };

  // Handle modal close with validation refresh
  const handleModalCloseWithRefresh = (modalClose: () => void) => {
    return () => {
      modalClose();
      // Refresh validation after creating an item
      verifyConfig().then(results => {
        updateValidationStatus(results);
        validationResultsModal.updateData(results);
      });
    };
  };

  // Handle validation refresh
  const handleRefreshValidation = async () => {
    console.log('🔄 Re-running validation after item creation...');
    
    const results = await verifyConfig();
    
    console.log('📊 New validation results:', {
      totalConfigs: results.totalConfigs,
      validConfigs: results.validConfigs,
      invalidConfigs: results.invalidConfigs,
      errorCount: results.errors.length
    });
    
    updateValidationStatus(results);
    validationResultsModal.updateData(results);
  };

  // Render validation modals
  const renderValidationModals = () => (
    <>
      {/* Validation Results Modal */}
      <ValidationResultsModal
        isOpen={validationResultsModal.isOpen}
        onClose={validationResultsModal.close}
        validationResults={validationResultsModal.data || {
          totalConfigs: 0,
          validConfigs: 0,
          invalidConfigs: 0,
          totalInstances: 0,
          deactivatedInstances: 0,
          errors: [],
          warnings: []
        }}
        onCreateMissingItem={handleCreateMissingItem}
        onRefreshValidation={handleRefreshValidation}
      />

      {/* Option Set Creation Modals */}
      <RadioOptionSetManager
        isVisible={radioOptionSetModal.isOpen}
        onClose={handleModalCloseWithRefresh(radioOptionSetModal.close)}
        isCreating={true}
        editingOptionSet={radioOptionSetModal.data ? {
          id: radioOptionSetModal.data.id,
          name: radioOptionSetModal.data.fieldLabel || 'New Radio Option Set',
          description: `Option set for field "${radioOptionSetModal.data.fieldLabel}"`,
          options: [],
          isActive: true,
          metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'user'
          }
        } : null}
      />

      <MultiSelectOptionSetManager
        isVisible={multiSelectOptionSetModal.isOpen}
        onClose={handleModalCloseWithRefresh(multiSelectOptionSetModal.close)}
        isCreating={true}
        editingOptionSet={multiSelectOptionSetModal.data ? {
          id: multiSelectOptionSetModal.data.id,
          name: multiSelectOptionSetModal.data.fieldLabel || 'New Multi-Select Option Set',
          description: `Option set for field "${multiSelectOptionSetModal.data.fieldLabel}"`,
          options: [],
          minSelections: 1,
          maxSelections: undefined,
          isActive: true,
          metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'user'
          }
        } : null}
      />

      <SelectOptionSetManager
        isVisible={selectOptionSetModal.isOpen}
        onClose={handleModalCloseWithRefresh(selectOptionSetModal.close)}
        isCreating={true}
        editingOptionSet={selectOptionSetModal.data ? {
          id: selectOptionSetModal.data.id,
          name: selectOptionSetModal.data.fieldLabel || 'New Select Option Set',
          description: `Option set for field "${selectOptionSetModal.data.fieldLabel}"`,
          options: [],
          allowMultiple: false,
          isActive: true,
          metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'user'
          }
        } : null}
      />

      <RatingScaleManager
        isVisible={ratingScaleModal.isOpen}
        onClose={handleModalCloseWithRefresh(ratingScaleModal.close)}
        isCreating={true}
        editingScale={ratingScaleModal.data ? {
          id: ratingScaleModal.data.id,
          name: ratingScaleModal.data.fieldLabel || 'New Rating Scale',
          description: `Rating scale for field "${ratingScaleModal.data.fieldLabel}"`,
          options: [],
          isActive: true,
          metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'user'
          }
        } : null}
      />
    </>
  );

  return {
    validationStatus,
    handleVerifyConfig,
    handleCreateMissingItem,
    renderValidationModals
  };
};