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
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700 shadow-xl dark:shadow-gray-900/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Survey Instance Settings</h3>
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ×
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2 text-gray-900 dark:text-gray-100">{instance.title}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">{instance.description}</p>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h5 className="font-medium mb-3 text-gray-900 dark:text-gray-100">Active Status</h5>
            <div className="flex items-center gap-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="mr-2 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-amber-600 dark:text-amber-500 focus:ring-amber-500 dark:focus:ring-amber-400"
                />
                <span className="text-gray-900 dark:text-gray-100">Active</span>
              </label>
              <span className={`px-2 py-1 text-xs rounded-full ${isActive
                ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                }`}>
                {isActive ? 'Will be Active' : 'Will be Inactive'}
              </span>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h5 className="font-medium mb-3 text-gray-900 dark:text-gray-100">Active Date Range (Optional)</h5>
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