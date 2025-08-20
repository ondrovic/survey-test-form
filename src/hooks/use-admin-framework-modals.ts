import { useModal } from "@/contexts/modal-context";
import { SurveyConfig, SurveyInstance } from "@/types";
import { DeleteModalData } from "./use-admin-framework-handlers";
import React, { useRef } from "react";

export const useAdminFrameworkModals = () => {
  const { openModal, closeModal, showConfirmation } = useModal();

  // Store current data for handlers
  const currentDeleteData = useRef<DeleteModalData | null>(null);
  const currentSettingsData = useRef<SurveyInstance | null>(null);
  const currentCreateData = useRef<SurveyConfig | null>(null);

  // Store handlers
  const handlersRef = useRef<{
    onConfirmDelete?: (data: DeleteModalData) => void;
    onDeactivateInstance?: (instanceId: string, instanceName: string) => void;
    onSaveInstanceSettings?: (
      data: SurveyInstance,
      updates: any
    ) => Promise<void>;
    onConfirmCreateInstance?: (config: SurveyConfig) => void;
    onImportConfig?: (file: File) => Promise<boolean>;
    onImportInstance?: (file: File) => Promise<boolean>;
    surveyInstances?: SurveyInstance[];
  }>({});

  // Method to set handlers
  const setHandlers = (handlers: typeof handlersRef.current) => {
    handlersRef.current = { ...handlersRef.current, ...handlers };
  };

  // Modal actions interface
  const modalActions = {
    deleteModal: {
      open: (data: DeleteModalData) => {
        currentDeleteData.current = data;
        showConfirmation({
          title: "Confirm Deletion",
          message:
            data.type === "instance"
              ? `Are you sure you want to delete "${data.name}"?\n\nThis will permanently delete the survey instance and ALL associated responses.\n\nThis action cannot be undone.`
              : `Are you sure you want to delete "${data.name}"?\n\nThis action cannot be undone.`,
          confirmText: "Delete",
          cancelText: "Cancel",
          variant: "danger",
          showAlternative: data.type === "instance",
          alternativeText: "Deactivate",
          onConfirm: () => {
            if (
              currentDeleteData.current &&
              handlersRef.current.onConfirmDelete
            ) {
              handlersRef.current.onConfirmDelete(currentDeleteData.current);
              currentDeleteData.current = null;
            }
          },
          onCancel: () => {
            currentDeleteData.current = null;
          },
          onAlternative:
            data.type === "instance"
              ? () => {
                  if (
                    currentDeleteData.current &&
                    handlersRef.current.onDeactivateInstance
                  ) {
                    handlersRef.current.onDeactivateInstance(
                      currentDeleteData.current.id,
                      currentDeleteData.current.name
                    );
                    currentDeleteData.current = null;
                  }
                }
              : undefined,
        });
      },
      close: () => {
        currentDeleteData.current = null;
        closeModal("confirmation");
      },
    },
    settingsModal: {
      open: (data: SurveyInstance) => {
        currentSettingsData.current = data;
        import("@/components/common").then(
          ({ InstanceSettingsModal }) => {
            openModal(
              "instance-settings",
              React.createElement(InstanceSettingsModal, {
                instance: data,
                isOpen: true,
                onClose: () => {
                  currentSettingsData.current = null;
                  closeModal("instance-settings");
                },
                onSave: async (updates) => {
                  if (
                    currentSettingsData.current &&
                    handlersRef.current.onSaveInstanceSettings
                  ) {
                    await handlersRef.current.onSaveInstanceSettings(
                      currentSettingsData.current,
                      updates
                    );
                    currentSettingsData.current = null;
                  }
                },
              })
            );
          }
        );
      },
      close: () => {
        currentSettingsData.current = null;
        closeModal("instance-settings");
      },
    },
    createInstanceModal: {
      open: (data: SurveyConfig) => {
        currentCreateData.current = data;
        import("@/components/admin/framework/modals").then(
          ({ CreateInstanceModal }) => {
            openModal(
              "create-instance",
              React.createElement(CreateInstanceModal, {
                config: data,
                existingInstances:
                  handlersRef.current.surveyInstances?.filter(
                    (instance) => instance.configId === data.id
                  ) || [],
                onClose: () => {
                  currentCreateData.current = null;
                  closeModal("create-instance");
                },
                onConfirm: () => {
                  if (
                    currentCreateData.current &&
                    handlersRef.current.onConfirmCreateInstance
                  ) {
                    handlersRef.current.onConfirmCreateInstance(
                      currentCreateData.current
                    );
                    currentCreateData.current = null;
                  }
                },
              })
            );
          }
        );
      },
      close: () => {
        currentCreateData.current = null;
        closeModal("create-instance");
      },
    },
    importConfigModal: {
      open: () => {
        import("@/components/common").then(({ GenericImportModal }) => {
          openModal(
            "import-config",
            React.createElement(GenericImportModal, {
              isOpen: true,
              onClose: () => closeModal("import-config"),
              onImport: async (file: File) => {
                if (handlersRef.current.onImportConfig) {
                  return await handlersRef.current.onImportConfig(file);
                }
                return false;
              },
              dataType: "config",
              title: "Import Survey Configuration",
            })
          );
        });
      },
      close: () => closeModal("import-config"),
    },
    importInstanceModal: {
      open: () => {
        import("@/components/common").then(({ GenericImportModal }) => {
          openModal(
            "import-instance",
            React.createElement(GenericImportModal, {
              isOpen: true,
              onClose: () => closeModal("import-instance"),
              onImport: async (file: File) => {
                if (handlersRef.current.onImportInstance) {
                  return await handlersRef.current.onImportInstance(file);
                }
                return false;
              },
              dataType: "instance",
              title: "Import Survey Instance",
            })
          );
        });
      },
      close: () => closeModal("import-instance"),
    },
  };

  return {
    modalActions,
    setHandlers,
  };
};
