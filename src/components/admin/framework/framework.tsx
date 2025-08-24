import { useSurveyData } from '@/contexts/survey-data-context/index';
import { useValidationStatus } from '@/contexts/validation-status-context';
import { useAdminFrameworkHandlers, useAdminFrameworkModals, useAutomaticValidation, useConfigValidation } from '@/hooks';
import { SurveyConfig, SurveyInstance } from '@/types';
import { getInstanceConfig, getInstanceCount } from '@/utils/admin-framework.utils';
import { PAGINATION_DEFAULTS } from '@/constants/pagination.constants';
import React, { useRef } from 'react';
import {
  FrameworkHeader,
  SurveyConfigPaginatedSection,
  SurveyInstancePaginatedSection
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

  // Get validation status from context (single source of truth)
  const { validationStatus, updateValidationStatus, clearValidationStatus } = useValidationStatus();
  
  // Get config validation operations
  const { handleVerifyConfig } = useConfigValidation();

  // Automatic validation using the context
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
      <FrameworkHeader />

      {/* Survey Configurations */}
      <SurveyConfigPaginatedSection
        title="Survey Configurations"
        configs={surveyConfigs}
        onCreateNew={onCreateNewSurvey}
        onEdit={configHandlers.handleEditConfig}
        onDelete={configHandlers.handleDeleteConfig}
        onCreateInstance={configHandlers.handleCreateInstance}
        createButtonLabel="New Config"
        emptyMessage="No survey configurations found. Create your first survey configuration to get started."
        getInstanceCount={handleGetInstanceCount}
        validationStatus={validationStatus}
        onVerifyConfig={handleVerifyConfig}
        onClearValidationErrors={clearValidationStatus}
        defaultExpanded={true}
        itemsPerPage={PAGINATION_DEFAULTS.ITEMS_PER_PAGE}
      />

      {/* Survey Instances */}
      <SurveyInstancePaginatedSection
        title="Survey Instances"
        instances={surveyInstances}
        onSettings={instanceHandlers.handleInstanceSettings}
        onDelete={instanceHandlers.handleDeleteInstance}
        onToggleActive={instanceHandlers.handleToggleInstanceActive}
        onVisualize={instanceHandlers.handleVisualize}
        onAnalytics={instanceHandlers.handleAnalytics}
        emptyMessage="No survey instances found. Create an instance from a survey configuration to get started."
        getInstanceConfig={handleGetInstanceConfig}
        defaultExpanded={true}
        itemsPerPage={PAGINATION_DEFAULTS.ITEMS_PER_PAGE}
      />

    </div>
  );
};