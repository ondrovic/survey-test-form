import { Button, DateRangeSelector, Modal } from '@/components/common';
import { useSurveyData } from '@/contexts/survey-data-context/index';
import { routes } from '@/routes';
import { DateRange, SurveyConfig, SurveyInstance } from '@/types';
import { generateUniqueSlug } from '@/utils/slug.utils';
import React, { useState } from 'react';

interface CreateInstanceModalProps {
  config: SurveyConfig;
  existingInstances: SurveyInstance[];
  onClose: () => void;
  onConfirm: (activeDateRange?: DateRange | null) => void;
}

export const CreateInstanceModal: React.FC<CreateInstanceModalProps> = ({
  config,
  existingInstances,
  onClose,
  onConfirm
}) => {
  const { state: { surveyInstances } } = useSurveyData();
  const [activeDateRange, setActiveDateRange] = useState<DateRange | null>(null);

  const generateInstanceId = () => {
    return generateUniqueSlug(config.title, surveyInstances);
  };

  const generateInstanceUrl = () => {
    return `${window.location.origin}/${routes.takeSurvey(generateInstanceId())}`;
  };

  const handleConfirm = () => {
    onConfirm(activeDateRange);
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      size="md"
    >
      <Modal.Header>
        <Modal.Title>Create New Survey Instance</Modal.Title>
      </Modal.Header>
      <Modal.Body>

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
              <div className="space-y-1 space-x-1 max-h-32 overflow-y-auto">
                {existingInstances.map((instance) => (
                  <div key={instance.id} className="text-xs text-blue-800 flex items-center justify-between">
                    <span>{instance.id}</span>
                    <span className={`px-1 py-0.5 rounded text-xs ${instance.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-600'
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

          <div className="border-t pt-4">
            <h5 className="font-medium mb-3">Active Date Range (Optional)</h5>
            <DateRangeSelector
              idPrefix="create"
              onChange={setActiveDateRange}
            />
          </div>

      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleConfirm}>
          Create Instance
        </Button>
      </Modal.Footer>
    </Modal>
  );
};