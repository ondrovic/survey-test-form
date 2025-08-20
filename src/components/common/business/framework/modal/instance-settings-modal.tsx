import { Button } from '@/components/common';
import { SurveyInstance } from '@/types';
import { createDateRangeISOStrings, parseDateFromISOString, formatDateRangeForDisplay } from '@/utils/date.utils';
import React, { useState } from 'react';

interface InstanceSettingsModalProps {
  instance: SurveyInstance;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: { isActive: boolean; activeDateRange: { startDate: string; endDate: string } | null }) => Promise<void>;
}

export const InstanceSettingsModal: React.FC<InstanceSettingsModalProps> = ({ 
  instance, 
  isOpen, 
  onClose, 
  onSave 
}) => {
  const [isActive, setIsActive] = useState(instance.isActive);
  const [startDate, setStartDate] = useState(
    instance.activeDateRange?.startDate ? parseDateFromISOString(instance.activeDateRange.startDate) : ''
  );
  const [endDate, setEndDate] = useState(
    instance.activeDateRange?.endDate ? parseDateFromISOString(instance.activeDateRange.endDate) : ''
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const activeDateRange = startDate && endDate
        ? createDateRangeISOStrings(startDate, endDate)
        : null;

      await onSave({ isActive, activeDateRange });
    } finally {
      setIsSaving(false);
    }
  };

  const clearDateRange = () => {
    setStartDate('');
    setEndDate('');
  };

  const hasChanges = () => {
    const currentDateRange = instance.activeDateRange;
    let newDateRange: { startDate: string; endDate: string } | null = null;
    if (startDate && endDate) {
      newDateRange = createDateRangeISOStrings(startDate, endDate);
    }

    const normalizedCurrent = currentDateRange || null;
    const normalizedNew = newDateRange || null;

    const activeChanged = isActive !== instance.isActive;
    const dateRangeChanged = JSON.stringify(normalizedCurrent) !== JSON.stringify(normalizedNew);

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
            <p className="text-sm text-gray-600 mb-3">
              Leave empty to keep survey active indefinitely. Both dates must be set to enable date restrictions.
              Start date begins at 12:00:00 AM, end date ends at 11:59:59 PM.
            </p>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-2">
              {startDate && endDate ? (
                <div className="text-sm text-green-600">
                  ✓ Date range will be active from {formatDateRangeForDisplay(startDate, endDate)}
                </div>
              ) : startDate || endDate ? (
                <div className="text-sm text-orange-600">
                  ⚠ Both start and end dates must be set for date range to be active
                </div>
              ) : (
                <div className="text-sm text-gray-600">
                  Survey will be active indefinitely (no date restrictions)
                </div>
              )}
            </div>

            {(startDate || endDate) && (
              <div className="mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={clearDateRange}
                >
                  Clear Date Range
                </Button>
              </div>
            )}
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