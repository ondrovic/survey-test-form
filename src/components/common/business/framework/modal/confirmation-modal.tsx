import { Button } from '@/components/common';
import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'secondary' | 'outline';
  onConfirm: () => void;
  onCancel: () => void;
  // New props for deactivate functionality
  showDeactivate?: boolean;
  deactivateText?: string;
  onDeactivate?: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'secondary',
  onConfirm,
  onCancel,
  showDeactivate = false,
  deactivateText = 'Deactivate',
  onDeactivate
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700 shadow-xl dark:shadow-gray-900/20">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">{title}</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6" dangerouslySetInnerHTML={{ __html: message }} />
        <div className={`flex gap-3 ${showDeactivate ? 'flex-col' : ''}`}>
          {showDeactivate && onDeactivate && (
            <Button
              onClick={onDeactivate}
              variant="outline"
              className="flex-1 bg-yellow-50 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-100 dark:hover:bg-yellow-900/50 focus:ring-yellow-500 dark:focus:ring-yellow-400"
            >
              {deactivateText}
            </Button>
          )}
          <div className={`flex gap-3 ${showDeactivate ? 'w-full' : ''}`}>
            <Button
              onClick={onConfirm}
              variant={confirmVariant}
              className={`flex-1 ${confirmVariant === 'secondary' ? 'bg-red-600 dark:bg-red-600 hover:bg-red-700 dark:hover:bg-red-700 focus:ring-red-500 dark:focus:ring-red-400 text-white' : ''}`}
            >
              {confirmText}
            </Button>
            <Button
              onClick={onCancel}
              variant="outline"
              className="flex-1"
            >
              {cancelText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};