import { Button } from '@/components/common';
import { useSurveyData } from '@/contexts/survey-data-context/index';
import { baseRoute } from '@/routes';
import { SurveyConfig, SurveyInstance } from '@/types';
import { generateUniqueSlug } from '@/utils/slug.utils';
import React from 'react';

interface CreateInstanceModalProps {
  config: SurveyConfig;
  existingInstances: SurveyInstance[];
  onClose: () => void;
  onConfirm: () => void;
}

export const CreateInstanceModal: React.FC<CreateInstanceModalProps> = ({
  config,
  existingInstances,
  onClose,
  onConfirm
}) => {
  const { state: { surveyInstances } } = useSurveyData();

  const generateInstanceId = () => {
    return generateUniqueSlug(config.title, surveyInstances);
  };

  const generateInstanceUrl = () => {
    return `${window.location.origin}${baseRoute}/${generateInstanceId()}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
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
                <code className="text-xs bg-green-100 px-2 py-1 rounded font-mono">
                  {generateInstanceId()}
                </code>
              </p>
              <p>
                <strong>Survey URL will be:</strong><br />
                <code className="text-xs bg-green-100 px-2 py-1 rounded font-mono whitespace-nowrap overflow-x-auto block">
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