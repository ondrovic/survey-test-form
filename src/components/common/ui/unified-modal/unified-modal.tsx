import React from 'react';
import { Modal, ModalProps, ModalSize, ModalVariant, ConfirmationModal, ConfirmationModalProps, LegacyModal } from '../modal/Modal';

/**
 * Legacy ModalSize interface for backward compatibility
 */
export interface LegacyModalSize {
  width: string;
  height?: string;
  maxWidth?: string;
  maxHeight?: string;
}

/**
 * Legacy UnifiedModal Props for backward compatibility
 */
export interface UnifiedModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: ModalSize | LegacyModalSize;
  variant?: ModalVariant;
  closable?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  zIndex?: number;
}

/**
 * Legacy UnifiedModal - backward compatible wrapper around new Modal
 * 
 * @deprecated Use the new Modal component with compound pattern instead
 */
export const UnifiedModal: React.FC<UnifiedModalProps> = ({
  isOpen,
  onClose,
  title,
  size = 'md',
  variant = 'default',
  closable = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  children,
  footer,
  className,
  zIndex, // This prop is ignored as new Modal uses portal
}) => {
  // Convert legacy size format to new format if needed
  const modalSize = typeof size === 'string' ? size : 'md';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={modalSize}
      variant={variant}
      closable={closable}
      closeOnBackdrop={closeOnBackdrop}
      closeOnEscape={closeOnEscape}
      className={className}
    >
      {(title || closable) && (
        <Modal.Header>
          {title && <Modal.Title>{title}</Modal.Title>}
        </Modal.Header>
      )}
      <Modal.Body padding={false}>
        <div className="p-6">
          {children}
        </div>
      </Modal.Body>
      {footer && (
        <Modal.Footer>
          {footer}
        </Modal.Footer>
      )}
    </Modal>
  );
};

// Re-export new components with legacy names for compatibility
export { ConfirmationModal } from '../modal/Modal';
export type { ConfirmationModalProps } from '../modal/Modal';

// Re-export types
export type { ModalSize, ModalVariant };

export default UnifiedModal;