import { useSurveyData } from '@/contexts/survey-data-context/index';
import { useAdminFrameworkHandlers, useAdminFrameworkModals, useAutomaticValidation, useConfigValidation } from '@/hooks';
import { SurveyConfig, SurveyInstance } from '@/types';
import { getInstanceConfig, getInstanceCount } from '@/utils/admin-framework.utils';
import React, { useRef } from 'react';
import {
  FrameworkHeader,
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

  // Get validation status from the same hook that automatic validation uses
  const { validationStatus, handleVerifyConfig, updateValidationStatus } = useConfigValidation();

  // Automatic validation
  const { runOnPageLoad } = useAutomaticValidation(updateValidationStatus);

  // Track if validation has already run to prevent loops
  const hasRunValidation = useRef(false);

  // Modal management
  const { modalActions, setHandlers } = useAdminFrameworkModals();

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

  // Run automatic validation on component mount
  React.useEffect(() => {
    // Only run if we have data loaded and haven't run validation yet
    if ((surveyConfigs.length > 0 || surveyInstances.length > 0) && !hasRunValidation.current) {
      hasRunValidation.current = true;
      console.log("🚀 Starting automatic validation on page load...");
      runOnPageLoad();
    }
  }, [surveyConfigs.length, surveyInstances.length]); // Removed runOnPageLoad from dependencies

  // Remove the problematic useEffect that was causing infinite loops

  // Set handlers for the modal system
  React.useEffect(() => {
    setHandlers({
      onConfirmDelete: modalHandlers.handleConfirmDelete,
      onDeactivateInstance: (instanceId: string, instanceName: string) => {
        onToggleInstanceActive(instanceId, false, instanceName);
        modalActions.deleteModal.close();
      },
      onSaveInstanceSettings: modalHandlers.handleSaveInstanceSettings,
      onConfirmCreateInstance: modalHandlers.handleConfirmCreateInstance,
      onImportConfig: importExportActions.importConfig,
      onImportInstance: importExportActions.importInstance,
      surveyInstances
    });
  }, [setHandlers, modalHandlers, modalActions, onToggleInstanceActive, importExportActions, surveyInstances]);

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
        validationStatus={validationStatus}
        onVerifyConfig={handleVerifyConfig}
      />

      {/* Survey Configurations */}
      <SurveyConfigSection
        surveyConfigs={surveyConfigs}
        getInstanceCount={handleGetInstanceCount}
        onEdit={configHandlers.handleEditConfig}
        onCreateInstance={configHandlers.handleCreateInstance}
        onDelete={configHandlers.handleDeleteConfig}
        onExport={configHandlers.handleExportConfig}
        validationStatus={validationStatus}
        validationResetCallback={() => {
          // Reset validation status to clear any errors
          updateValidationStatus({ hasErrors: false, errorCount: 0, lastChecked: Date.now() });
        }}
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
        validationResetCallback={() => {
          // Reset validation status to clear any errors
          updateValidationStatus({ hasErrors: false, errorCount: 0, lastChecked: Date.now() });
        }}
      />

    </div>
  );
};