import { Button, DateRangeSelector } from '@/components/common';
import { DateRange, SurveyInstance } from '@/types';
import React, { useState } from 'react';

interface InstanceSettingsModalProps {
  instance: SurveyInstance;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: { isActive: boolean; activeDateRange: DateRange | null }) => Promise<void>;
}

export const InstanceSettingsModal: React.FC<InstanceSettingsModalProps> = ({ 
  instance, 
  isOpen, 
  onClose, 
  onSave 
}) => {
  const [isActive, setIsActive] = useState(instance.isActive);
  const [activeDateRange, setActiveDateRange] = useState<DateRange | null>(instance.activeDateRange || null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({ isActive, activeDateRange });
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = () => {
    const normalizedOriginal = instance.activeDateRange || null;
    const normalizedNew = activeDateRange || null;

    const activeChanged = isActive !== instance.isActive;
    const dateRangeChanged = JSON.stringify(normalizedOriginal) !== JSON.stringify(normalizedNew);

    return activeChanged || dateRangeChanged;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Survey Instance Settings</h3>
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">{instance.title}</h4>
            <p className="text-sm text-gray-600">{instance.description}</p>
          </div>

          <div className="border-t pt-4">
            <h5 className="font-medium mb-3">Active Status</h5>
            <div className="flex items-center gap-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="mr-2"
                />
                Active
              </label>
              <span className={`px-2 py-1 text-xs rounded-full ${isActive
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-800"
                }`}>
                {isActive ? 'Will be Active' : 'Will be Inactive'}
              </span>
            </div>
          </div>

          <div className="border-t pt-4">
            <h5 className="font-medium mb-3">Active Date Range (Optional)</h5>
            <DateRangeSelector
              idPrefix="settings"
              initialDateRange={instance.activeDateRange}
              onChange={setActiveDateRange}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges() || isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
};