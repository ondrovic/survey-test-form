import React from 'react';
import { UnifiedModal, ModalProps as UnifiedModalProps } from '../unified-modal';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    showCloseButton?: boolean;
    className?: string;
}

// Legacy wrapper for backward compatibility
export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    showCloseButton = true,
    className
}) => {
    return (
        <UnifiedModal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size={size}
            closable={showCloseButton}
            className={className}
        >
            <div className="p-6">
                {children}
            </div>
        </UnifiedModal>
    );
};
