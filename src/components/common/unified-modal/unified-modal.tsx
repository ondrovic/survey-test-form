import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalSize {
  width: string;
  height?: string;
  maxWidth?: string;
  maxHeight?: string;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full' | ModalSize;
  variant?: 'default' | 'confirmation' | 'form' | 'fullscreen';
  closable?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  zIndex?: number;
}

const sizeMap: Record<string, ModalSize> = {
  sm: { width: 'w-full', maxWidth: 'max-w-md' },
  md: { width: 'w-full', maxWidth: 'max-w-2xl' },
  lg: { width: 'w-full', maxWidth: 'max-w-4xl' },
  xl: { width: 'w-full', maxWidth: 'max-w-6xl' },
  full: { width: 'w-full', maxWidth: 'max-w-[95vw]', maxHeight: 'max-h-[95vh]' }
};

export const UnifiedModal: React.FC<ModalProps> = ({
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
  className = '',
  zIndex = 9999,
}) => {
  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Get size configuration
  const sizeConfig = typeof size === 'string' ? sizeMap[size] : size;
  const { width, height, maxWidth, maxHeight } = sizeConfig;

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnBackdrop) {
      onClose();
    }
  };

  // Variant-specific styles
  const getVariantClasses = () => {
    switch (variant) {
      case 'confirmation':
        return 'max-w-md';
      case 'form':
        return 'max-w-2xl';
      case 'fullscreen':
        return 'w-full h-full max-w-none max-h-none m-0 rounded-none';
      default:
        return '';
    }
  };

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4`}
      style={{ zIndex }}
      onClick={handleBackdropClick}
    >
      <div
        className={`
          bg-white rounded-lg shadow-xl overflow-hidden flex flex-col
          ${width} ${height || ''} ${maxWidth || ''} ${maxHeight || ''}
          ${getVariantClasses()}
          ${className}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || closable) && (
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            {title && (
              <h2 className="text-xl font-semibold text-gray-900 truncate">
                {title}
              </h2>
            )}
            {closable && (
              <button
                onClick={onClose}
                className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors rounded-md hover:bg-gray-100"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className={`flex-1 overflow-y-auto ${title || closable ? '' : 'pt-6'}`}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex-shrink-0 p-6 border-t border-gray-200 bg-gray-50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// Specialized modal variants for common use cases
export const ConfirmationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  // Alternative action support
  showAlternative?: boolean;
  alternativeText?: string;
  onAlternative?: () => void;
}> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  showAlternative = false,
  alternativeText = 'Alternative',
  onAlternative,
}) => {
  const variantStyles = {
    danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    warning: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
    info: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
  };

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      variant="confirmation"
    >
      <div className="p-6">
        <div className="text-gray-700 space-y-2">
          {message.split('\n').map((line, index) => (
            line.trim() ? (
              <p key={index}>{line}</p>
            ) : (
              <div key={index} className="h-2" />
            )
          ))}
        </div>
      </div>
      <div className="p-6 pt-0">
        {showAlternative && onAlternative ? (
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={onAlternative}
              className="px-4 py-2 text-yellow-700 bg-yellow-50 border border-yellow-300 hover:bg-yellow-100 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
            >
              {alternativeText}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${variantStyles[variant]}`}
            >
              {confirmText}
            </button>
          </div>
        ) : (
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${variantStyles[variant]}`}
            >
              {confirmText}
            </button>
          </div>
        )}
      </div>
    </UnifiedModal>
  );
};

export default UnifiedModal;