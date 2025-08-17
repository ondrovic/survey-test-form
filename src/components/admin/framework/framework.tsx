import { useSurveyData } from '@/contexts/survey-data-context/index';
import { useAdminFrameworkHandlers, useAdminFrameworkModals } from '@/hooks';
import { SurveyConfig, SurveyInstance } from '@/types';
import { getInstanceConfig, getInstanceCount } from '@/utils/admin-framework.utils';
import React from 'react';
import {
  FrameworkHeader,
  FrameworkModals,
  SurveyConfigSection,
  SurveyInstanceSection
} from './components';

export interface AdminFrameworkProps {
  onCreateNewSurvey: () => void;
  onEditSurveyConfig: (config: SurveyConfig) => void;
  onDeleteSurveyConfig: (configId: string, configName?: string) => void;
  onDeleteSurveyInstance: (instanceId: string, instanceName?: string) => void;
  onToggleInstanceActive: (instanceId: string, isActive: boolean, instanceName?: string) => void;
  onUpdateInstanceDateRange: (instanceId: string, dateRange: { startDate: string; endDate: string } | null, instanceName?: string) => void;
}

export const AdminFramework: React.FC<AdminFrameworkProps> = ({
  onCreateNewSurvey,
  onEditSurveyConfig,
  onDeleteSurveyConfig,
  onDeleteSurveyInstance,
  onToggleInstanceActive,
  onUpdateInstanceDateRange
}) => {
  const {
    state: { surveyConfigs, surveyInstances }
  } = useSurveyData();

  // Modal management
  const { modalStates, modalActions } = useAdminFrameworkModals();

  // Operations object for handlers
  const operations = {
    onCreateNewSurvey,
    onEditSurveyConfig,
    onDeleteSurveyConfig,
    onDeleteSurveyInstance,
    onToggleInstanceActive,
    onUpdateInstanceDateRange
  };

  // Handlers
  const {
    configHandlers,
    instanceHandlers,
    modalHandlers,
    importExportActions
  } = useAdminFrameworkHandlers(operations, modalActions);

  // Utility functions
  const handleGetInstanceConfig = (instance: SurveyInstance) => 
    getInstanceConfig(instance, surveyConfigs);

  const handleGetInstanceCount = (configId: string) => 
    getInstanceCount(configId, surveyInstances);

  return (
    <div className="space-y-6">
      {/* Header */}
      <FrameworkHeader
        surveyConfigs={surveyConfigs}
        onCreateNewSurvey={onCreateNewSurvey}
        onImportConfig={configHandlers.handleImportConfig}
      />

      {/* Survey Configurations */}
      <SurveyConfigSection
        surveyConfigs={surveyConfigs}
        getInstanceCount={handleGetInstanceCount}
        onEdit={configHandlers.handleEditConfig}
        onCreateInstance={configHandlers.handleCreateInstance}
        onDelete={configHandlers.handleDeleteConfig}
        onExport={configHandlers.handleExportConfig}
      />

      {/* Survey Instances */}
      <SurveyInstanceSection
        surveyInstances={surveyInstances}
        getInstanceConfig={handleGetInstanceConfig}
        onToggleActive={instanceHandlers.handleToggleInstanceActive}
        onSettings={instanceHandlers.handleInstanceSettings}
        onDelete={instanceHandlers.handleDeleteInstance}
        onVisualize={instanceHandlers.handleVisualize}
        onExport={instanceHandlers.handleExportInstance}
        onImportInstance={instanceHandlers.handleImportInstance}
      />

      {/* All Modals */}
      <FrameworkModals
        deleteModal={modalStates.deleteModal}
        settingsModal={modalStates.settingsModal}
        createInstanceModal={modalStates.createInstanceModal}
        importConfigModal={modalStates.importConfigModal}
        importInstanceModal={modalStates.importInstanceModal}
        onConfirmDelete={() => modalHandlers.handleConfirmDelete(modalStates.deleteModal.data)}
        onCancelDelete={modalActions.deleteModal.close}
        onDeactivateInstance={(instanceId: string, instanceName: string) => {
          onToggleInstanceActive(instanceId, false, instanceName);
          modalActions.deleteModal.close();
        }}
        onSaveInstanceSettings={async (updates) => await modalHandlers.handleSaveInstanceSettings(modalStates.settingsModal.data, updates)}
        onCloseInstanceSettings={modalActions.settingsModal.close}
        onConfirmCreateInstance={() => modalHandlers.handleConfirmCreateInstance(modalStates.createInstanceModal.data)}
        onCloseCreateInstance={modalActions.createInstanceModal.close}
        onCloseImportConfig={modalActions.importConfigModal.close}
        onCloseImportInstance={modalActions.importInstanceModal.close}
        onImportConfig={importExportActions.importConfig}
        onImportInstance={importExportActions.importInstance}
        surveyInstances={surveyInstances}
      />
    </div>
  );
};