import React from 'react';
import { Button } from '../button';

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    itemName: string;
    onConfirm: () => void;
    onCancel: () => void;
    title?: string;
    message?: string;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
    isOpen,
    itemName,
    onConfirm,
    onCancel,
    title = "Confirm Deletion",
    message = "Are you sure you want to delete this item? This action cannot be undone."
}) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]"
            role="dialog"
            aria-modal="true"
        >
            <div
                className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
                role="document"
            >
                <h3 className="text-lg font-semibold mb-4">{title}</h3>
                <p className="text-gray-600 mb-6">
                    {message.replace('{itemName}', itemName)}
                </p>
                <div className="flex gap-3">
                    <Button
                        onClick={onConfirm}
                        variant="secondary"
                        className="flex-1 bg-red-600 hover:bg-red-700 focus:ring-red-500"
                    >
                        Delete
                    </Button>
                    <Button
                        onClick={onCancel}
                        variant="outline"
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        </div>
    );
};
