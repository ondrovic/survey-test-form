import { GenericImportModal } from '@/components/common';
import { ConfirmationModal, InstanceSettingsModal } from '@/components/common/framework7';
import { useConfigValidation } from '@/hooks';
import { SurveyConfig, SurveyInstance } from '@/types';
import React from 'react';
import { CreateInstanceModal } from '../modals';
import { DeleteModalData } from '@/hooks/use-admin-framework-handlers';

interface FrameworkModalsProps {
  // Modal states
  deleteModal: {
    isOpen: boolean;
    data: DeleteModalData | null;
  };
  settingsModal: {
    isOpen: boolean;
    data: SurveyInstance | null;
  };
  createInstanceModal: {
    isOpen: boolean;
    data: SurveyConfig | null;
  };
  importConfigModal: {
    isOpen: boolean;
  };
  importInstanceModal: {
    isOpen: boolean;
  };

  // Modal handlers
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  onDeactivateInstance: (instanceId: string, instanceName: string) => void;
  onSaveInstanceSettings: (updates: { isActive: boolean; activeDateRange: { startDate: string; endDate: string } | null }) => Promise<void>;
  onCloseInstanceSettings: () => void;
  onConfirmCreateInstance: () => void;
  onCloseCreateInstance: () => void;
  onCloseImportConfig: () => void;
  onCloseImportInstance: () => void;

  // Import actions
  onImportConfig: (file: File) => Promise<boolean>;
  onImportInstance: (file: File) => Promise<boolean>;

  // Data
  surveyInstances: SurveyInstance[];
}

export const FrameworkModals: React.FC<FrameworkModalsProps> = ({
  deleteModal,
  settingsModal,
  createInstanceModal,
  importConfigModal,
  importInstanceModal,
  onConfirmDelete,
  onCancelDelete,
  onDeactivateInstance,
  onSaveInstanceSettings,
  onCloseInstanceSettings,
  onConfirmCreateInstance,
  onCloseCreateInstance,
  onCloseImportConfig,
  onCloseImportInstance,
  onImportConfig,
  onImportInstance,
  surveyInstances
}) => {
  const { renderValidationModals } = useConfigValidation();

  return (
    <>
      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        title="Confirm Deletion"
        message={deleteModal.data?.type === 'instance'
          ? `Are you sure you want to delete "${deleteModal.data?.name}"? This will permanently delete the survey instance and ALL associated responses. This action cannot be undone.`
          : `Are you sure you want to delete "${deleteModal.data?.name}"? This action cannot be undone.`
        }
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="secondary"
        showDeactivate={deleteModal.data?.type === 'instance'}
        deactivateText="Deactivate Instead"
        onConfirm={onConfirmDelete}
        onCancel={onCancelDelete}
        onDeactivate={() => {
          if (deleteModal.data?.type === 'instance') {
            onDeactivateInstance(deleteModal.data.id, deleteModal.data.name);
          }
        }}
      />

      {/* Instance Settings Modal */}
      {settingsModal.isOpen && settingsModal.data && (
        <InstanceSettingsModal
          instance={settingsModal.data}
          isOpen={settingsModal.isOpen}
          onClose={onCloseInstanceSettings}
          onSave={onSaveInstanceSettings}
        />
      )}

      {/* Create Instance Confirmation Modal */}
      {createInstanceModal.isOpen && createInstanceModal.data && (
        <CreateInstanceModal
          config={createInstanceModal.data}
          existingInstances={surveyInstances.filter(instance => instance.configId === createInstanceModal.data!.id)}
          onClose={onCloseCreateInstance}
          onConfirm={onConfirmCreateInstance}
        />
      )}

      {/* Import Config Modal */}
      <GenericImportModal
        isOpen={importConfigModal.isOpen}
        onClose={onCloseImportConfig}
        onImport={onImportConfig}
        dataType="config"
        title="Import Survey Configuration"
      />

      {/* Import Instance Modal */}
      <GenericImportModal
        isOpen={importInstanceModal.isOpen}
        onClose={onCloseImportInstance}
        onImport={onImportInstance}
        dataType="instance"
        title="Import Survey Instance"
      />

      {/* Validation Modals */}
      {renderValidationModals()}
    </>
  );
};