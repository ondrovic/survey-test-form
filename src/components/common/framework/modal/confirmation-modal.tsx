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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <p className="text-gray-600 mb-6" dangerouslySetInnerHTML={{ __html: message }} />
        <div className={`flex gap-3 ${showDeactivate ? 'flex-col' : ''}`}>
          {showDeactivate && onDeactivate && (
            <Button
              onClick={onDeactivate}
              variant="outline"
              className="flex-1 bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100 focus:ring-yellow-500"
            >
              {deactivateText}
            </Button>
          )}
          <div className={`flex gap-3 ${showDeactivate ? 'w-full' : ''}`}>
            <Button
              onClick={onConfirm}
              variant={confirmVariant}
              className={`flex-1 ${confirmVariant === 'secondary' ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' : ''}`}
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