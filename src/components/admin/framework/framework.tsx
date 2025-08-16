import { Button } from '@/components/common';
import {
  SurveyConfigCard,
  SurveyInstanceCard,
  SurveyList,
  ConfirmationModal,
  InstanceSettingsModal
} from '@/components/common/framework7';
import { useSurveyData } from '@/contexts/survey-data-context/index';
import {
  useModalState,
  useSurveyOperations,
  useSurveyUrls
} from '@/hooks';
import { baseRoute } from '@/routes';
import { SurveyConfig, SurveyInstance } from '@/types';
import { Plus } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';

interface AdminFrameworkProps {
  onCreateNewSurvey: () => void;
  onEditSurveyConfig: (config: SurveyConfig) => void;
  onDeleteSurveyConfig: (configId: string, configName?: string) => void;
  onDeleteSurveyInstance: (instanceId: string, instanceName?: string) => void;
  onToggleInstanceActive: (instanceId: string, isActive: boolean, instanceName?: string) => void;
  onUpdateInstanceDateRange: (instanceId: string, dateRange: { startDate: string; endDate: string } | null, instanceName?: string) => void;
}

interface DeleteModalData {
  type: 'config' | 'instance';
  id: string;
  name: string;
}

export const AdminFramework: React.FC<AdminFrameworkProps> = ({
  onCreateNewSurvey,
  onEditSurveyConfig,
  onDeleteSurveyConfig,
  onDeleteSurveyInstance,
  onToggleInstanceActive,
  onUpdateInstanceDateRange
}) => {
  const navigate = useNavigate();
  const { state: { surveyConfigs, surveyInstances } } = useSurveyData();
  
  // Custom hooks
  const { createSurveyInstance, downloadSurveyData, verifyDataSeparation } = useSurveyOperations();
  const { generateSurveyUrl, copySurveyUrl, openSurveyInNewTab } = useSurveyUrls();
  
  // Modal states
  const deleteModal = useModalState<DeleteModalData>();
  const settingsModal = useModalState<SurveyInstance>();
  const createInstanceModal = useModalState<SurveyConfig>();

  // Handlers for survey configs
  const handleEditConfig = (config: SurveyConfig) => {
    onEditSurveyConfig(config);
  };

  const handleDeleteConfig = (config: SurveyConfig) => {
    deleteModal.open({
      type: 'config',
      id: config.id,
      name: config.title
    });
  };

  const handleCreateInstance = (config: SurveyConfig) => {
    createInstanceModal.open(config);
  };

  // Handlers for survey instances
  const handleToggleInstanceActive = (instance: SurveyInstance) => {
    onToggleInstanceActive(instance.id, !instance.isActive, instance.title);
  };

  const handleInstanceSettings = (instance: SurveyInstance) => {
    settingsModal.open(instance);
  };

  const handleDeleteInstance = (instance: SurveyInstance) => {
    deleteModal.open({
      type: 'instance',
      id: instance.id,
      name: instance.title
    });
  };

  const handleVisualize = (instanceId: string) => {
    navigate(`${baseRoute}/admin/visualize/${instanceId}`);
  };

  // Delete confirmation handler
  const handleConfirmDelete = () => {
    if (!deleteModal.data) return;
    
    const { type, id, name } = deleteModal.data;
    if (type === 'config') {
      onDeleteSurveyConfig(id, name);
    } else {
      onDeleteSurveyInstance(id, name);
    }
    deleteModal.close();
  };

  // Instance settings save handler
  const handleSaveInstanceSettings = async (updates: { isActive: boolean; activeDateRange: { startDate: string; endDate: string } | null }) => {
    if (!settingsModal.data) return;

    try {
      const instance = settingsModal.data;
      
      // Apply active status change if it changed
      if (updates.isActive !== instance.isActive) {
        await onToggleInstanceActive(instance.id, updates.isActive, instance.title);
      }

      // Apply date range change if it changed
      const currentDateRange = instance.activeDateRange;
      const newDateRange = updates.activeDateRange;

      const normalizedCurrent = currentDateRange || null;
      const normalizedNew = newDateRange || null;

      if (JSON.stringify(normalizedCurrent) !== JSON.stringify(normalizedNew)) {
        await onUpdateInstanceDateRange(instance.id, newDateRange, instance.title);
      }

      settingsModal.close();
    } catch (error) {
      // Error handling is done in the individual functions
    }
  };

  const getInstanceConfig = (instance: SurveyInstance) => {
    return surveyConfigs.find(c => c.id === instance.configId);
  };

  const getInstanceCount = (configId: string) => {
    return surveyInstances.filter(instance => instance.configId === configId).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Survey Framework</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={verifyDataSeparation}
            className="text-green-600 border-green-600 hover:bg-green-50"
          >
            Verify Data
          </Button>
          <Button onClick={onCreateNewSurvey}>
            <Plus className="w-4 h-4 mr-2" />
            Create New Survey
          </Button>
        </div>
      </div>

      {/* Survey Configurations */}
      <SurveyList
        title="Survey Configurations"
        emptyMessage="No survey configurations found."
      >
        {surveyConfigs.map((config) => (
          <SurveyConfigCard
            key={config.id}
            config={config}
            instanceCount={getInstanceCount(config.id)}
            onEdit={handleEditConfig}
            onCreateInstance={handleCreateInstance}
            onDelete={handleDeleteConfig}
          />
        ))}
      </SurveyList>

      {/* Survey Instances */}
      <SurveyList
        title="Survey Instances"
        emptyMessage="No survey instances found."
      >
        {surveyInstances.map((instance) => (
          <SurveyInstanceCard
            key={instance.id}
            instance={instance}
            config={getInstanceConfig(instance)}
            surveyUrl={generateSurveyUrl(instance)}
            onToggleActive={handleToggleInstanceActive}
            onSettings={handleInstanceSettings}
            onDownload={downloadSurveyData}
            onVisualize={handleVisualize}
            onDelete={handleDeleteInstance}
            onCopyUrl={copySurveyUrl}
            onOpenUrl={openSurveyInNewTab}
          />
        ))}
      </SurveyList>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        title="Confirm Deletion"
        message={`Are you sure you want to delete "${deleteModal.data?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="secondary"
        onConfirm={handleConfirmDelete}
        onCancel={deleteModal.close}
      />

      {/* Instance Settings Modal */}
      {settingsModal.isOpen && settingsModal.data && (
        <InstanceSettingsModal
          instance={settingsModal.data}
          isOpen={settingsModal.isOpen}
          onClose={settingsModal.close}
          onSave={handleSaveInstanceSettings}
        />
      )}

      {/* Create Instance Confirmation Modal */}
      {createInstanceModal.isOpen && createInstanceModal.data && (
        <CreateInstanceModal
          config={createInstanceModal.data}
          existingInstances={surveyInstances.filter(instance => instance.configId === createInstanceModal.data!.id)}
          onClose={createInstanceModal.close}
          onConfirm={() => {
            createSurveyInstance(createInstanceModal.data!);
            createInstanceModal.close();
          }}
        />
      )}
    </div>
  );
};

// Create Instance Confirmation Modal Component
interface CreateInstanceModalProps {
  config: SurveyConfig;
  existingInstances: SurveyInstance[];
  onClose: () => void;
  onConfirm: () => void;
}

const CreateInstanceModal: React.FC<CreateInstanceModalProps> = ({
  config,
  existingInstances,
  onClose,
  onConfirm
}) => {
  const generateInstanceId = () => {
    return config.title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "") + 
      `-${(existingInstances.length + 1).toString().padStart(3, '0')}`;
  };

  const generateInstanceUrl = () => {
    return `${window.location.origin}${baseRoute}/${generateInstanceId()}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Create New Survey Instance</h3>

          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              You&apos;re about to create a new instance of:
            </p>
            <p className="font-medium text-gray-900">{config.title}</p>
          </div>

          {existingInstances.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">
                Existing Instances ({existingInstances.length}):
              </h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {existingInstances.map((instance) => (
                  <div key={instance.id} className="text-xs text-blue-800 flex items-center justify-between">
                    <span>{instance.id}</span>
                    <span className={`px-1 py-0.5 rounded text-xs ${instance.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                      }`}>
                      {instance.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mb-4 p-3 bg-green-50 rounded-lg">
            <div className="text-sm text-green-800">
              <p className="mb-2">
                <strong>New instance ID:</strong><br />
                <code className="text-xs bg-green-100 px-1 py-0.5 rounded">
                  {generateInstanceId()}
                </code>
              </p>
              <p>
                <strong>Survey URL will be:</strong><br />
                <code className="text-xs bg-green-100 px-1 py-0.5 rounded break-all">
                  {generateInstanceUrl()}
                </code>
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={onConfirm}>
              Create Instance
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};