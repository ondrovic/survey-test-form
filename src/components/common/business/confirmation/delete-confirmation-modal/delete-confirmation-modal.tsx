import React from 'react';
import { ConfirmationModal } from '../../../ui/modal/Modal';

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
    return (
        <ConfirmationModal
            isOpen={isOpen}
            onClose={onCancel}
            onConfirm={onConfirm}
            title={title}
            message={message.replace('{itemName}', itemName)}
            confirmText="Delete"
            cancelText="Cancel"
            variant="danger"
        />
    );
};
