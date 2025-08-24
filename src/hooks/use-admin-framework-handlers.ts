import { useGenericImportExport, useSurveyOperations } from "@/hooks";
import { routes } from "@/routes";
import { DateRange, SurveyConfig, SurveyInstance } from "@/types";

export interface AdminFrameworkOperations {
  onCreateNewSurvey: () => void;
  onEditSurveyConfig: (config: SurveyConfig) => void;
  onDeleteSurveyConfig: (
    configId: string,
    configName?: string,
    validationResetCallback?: () => void
  ) => void;
  onDeleteSurveyInstance: (
    instanceId: string,
    instanceName?: string,
    validationResetCallback?: () => void
  ) => void;
  onToggleInstanceActive: (
    instanceId: string,
    isActive: boolean,
    instanceName?: string
  ) => void;
  onUpdateInstanceDateRange: (
    instanceId: string,
    dateRange: { startDate: string; endDate: string } | null,
    instanceName?: string
  ) => void;
}

export interface DeleteModalData {
  type: "config" | "instance";
  id: string;
  name: string;
  validationResetCallback?: () => void; // For config deletions to reset validation status
}

export interface ModalActions {
  deleteModal: {
    open: (data: DeleteModalData) => void;
    close: () => void;
  };
  settingsModal: {
    open: (instance: SurveyInstance) => void;
    close: () => void;
  };
  createInstanceModal: {
    open: (config: SurveyConfig) => void;
    close: () => void;
  };
  importConfigModal: {
    open: () => void;
    close: () => void;
  };
  importInstanceModal: {
    open: () => void;
    close: () => void;
  };
}

export const useAdminFrameworkHandlers = (
  operations: AdminFrameworkOperations,
  modalActions: ModalActions
) => {
  const { createSurveyInstance } = useSurveyOperations();
  const { exportConfig, exportInstance, importConfig, importInstance } =
    useGenericImportExport();

  // Config handlers
  const handleEditConfig = (config: SurveyConfig) => {
    operations.onEditSurveyConfig(config);
  };

  const handleDeleteConfig = (
    config: SurveyConfig,
    validationResetCallback?: () => void
  ) => {
    modalActions.deleteModal.open({
      type: "config",
      id: config.id,
      name: config.title,
      validationResetCallback,
    });
  };

  const handleCreateInstance = (config: SurveyConfig) => {
    modalActions.createInstanceModal.open(config);
  };

  const handleExportConfig = (config: SurveyConfig) => {
    exportConfig(config);
  };

  const handleImportConfig = () => {
    modalActions.importConfigModal.open();
  };

  // Instance handlers
  const handleToggleInstanceActive = (instance: SurveyInstance) => {
    operations.onToggleInstanceActive(
      instance.id,
      !instance.isActive,
      instance.title
    );
  };

  const handleInstanceSettings = (instance: SurveyInstance) => {
    modalActions.settingsModal.open(instance);
  };

  const handleDeleteInstance = (
    instance: SurveyInstance,
    validationResetCallback?: () => void
  ) => {
    modalActions.deleteModal.open({
      type: "instance",
      id: instance.id,
      name: instance.title,
      validationResetCallback,
    });
  };

  const handleVisualize = (instance: SurveyInstance) => {
    const urlParam = instance.slug || instance.id;
    const url = `${window.location.origin}/${routes.adminVisualize(urlParam)}`;
    window.open(url, '_blank');
  };

  const handleAnalytics = (instance: SurveyInstance) => {
    const urlParam = instance.slug || instance.id;
    const url = `${window.location.origin}/${routes.adminAnalytics(urlParam)}`;
    window.open(url, '_blank');
  };

  const handleExportInstance = (instance: SurveyInstance) => {
    exportInstance(instance);
  };

  const handleImportInstance = () => {
    modalActions.importInstanceModal.open();
  };

  // Delete confirmation handler
  const handleConfirmDelete = (deleteModalData: DeleteModalData | null) => {
    if (!deleteModalData) return;

    const { type, id, name, validationResetCallback } = deleteModalData;
    if (type === "config") {
      operations.onDeleteSurveyConfig(id, name, validationResetCallback);
    } else {
      operations.onDeleteSurveyInstance(id, name);
    }
    modalActions.deleteModal.close();
  };

  // Instance settings save handler
  const handleSaveInstanceSettings = async (
    settingsModalData: SurveyInstance | null,
    updates: {
      isActive: boolean;
      activeDateRange: { startDate: string; endDate: string } | null;
    }
  ) => {
    if (!settingsModalData) return;

    try {
      const instance = settingsModalData;

      if (updates.isActive !== instance.isActive) {
        await operations.onToggleInstanceActive(
          instance.id,
          updates.isActive,
          instance.title
        );
      }

      const currentDateRange = instance.activeDateRange;
      const newDateRange = updates.activeDateRange;

      const normalizedCurrent = currentDateRange || null;
      const normalizedNew = newDateRange || null;

      if (JSON.stringify(normalizedCurrent) !== JSON.stringify(normalizedNew)) {
        await operations.onUpdateInstanceDateRange(
          instance.id,
          newDateRange,
          instance.title
        );
      }

      modalActions.settingsModal.close();
    } catch (error) {
      // Error handling is done in the individual functions
    }
  };

  // Create instance confirmation handler
  const handleConfirmCreateInstance = (config: SurveyConfig | null, activeDateRange?: DateRange | null) => {
    if (!config) return;
    createSurveyInstance(config, activeDateRange || null);
    modalActions.createInstanceModal.close();
  };

  return {
    configHandlers: {
      handleEditConfig,
      handleDeleteConfig,
      handleCreateInstance,
      handleExportConfig,
      handleImportConfig,
    },
    instanceHandlers: {
      handleToggleInstanceActive,
      handleInstanceSettings,
      handleDeleteInstance,
      handleVisualize,
      handleAnalytics,
      handleExportInstance,
      handleImportInstance,
    },
    modalHandlers: {
      handleConfirmDelete,
      handleSaveInstanceSettings,
      handleConfirmCreateInstance,
    },
    importExportActions: {
      importConfig,
      importInstance,
    },
  };
};
