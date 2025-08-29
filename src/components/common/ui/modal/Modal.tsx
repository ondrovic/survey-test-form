import React, { createContext, forwardRef, useContext, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';
import { X } from 'lucide-react';
import { modal as modalTokens } from '@/styles/design-tokens';

/**
 * Modal Context for compound component pattern
 */
interface ModalContextValue {
  isOpen: boolean;
  onClose: () => void;
  size: ModalSize;
  variant: ModalVariant;
  closable: boolean;
  closeOnBackdrop: boolean;
  closeOnEscape: boolean;
  modalId: string;
  titleId: string;
  bodyId: string;
}

const ModalContext = createContext<ModalContextValue | null>(null);

/**
 * Hook to access modal component context
 */
export const useModalComponent = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModalComponent must be used within a Modal component');
  }
  return context;
};

/**
 * Modal Types
 */
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type ModalVariant = 'default' | 'confirmation' | 'form' | 'fullscreen';

/**
 * Main Modal Props
 */
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  size?: ModalSize;
  variant?: ModalVariant;
  closable?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  className?: string;
  children: React.ReactNode;
  portal?: boolean;
  initialFocus?: React.RefObject<HTMLElement>;
  mobileFullscreen?: boolean;
  mobileAdaptive?: boolean;
  zIndex?: number;
}

/**
 * Enhanced Modal component with compound pattern and design tokens
 * 
 * Features:
 * - Portal rendering for proper z-index management
 * - Compound component pattern for flexible composition
 * - Design token integration for consistent styling
 * - Enhanced accessibility with focus management
 * - Keyboard navigation support
 * - Backdrop click and escape key handling
 * 
 * @example
 * ```tsx
 * <Modal isOpen={isOpen} onClose={handleClose}>
 *   <Modal.Header>
 *     <Modal.Title>Edit Settings</Modal.Title>
 *   </Modal.Header>
 *   <Modal.Body>
 *     <p>Modal content goes here</p>
 *   </Modal.Body>
 *   <Modal.Footer>
 *     <Button onClick={handleClose}>Close</Button>
 *   </Modal.Footer>
 * </Modal>
 * ```
 */
export const Modal = forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      isOpen,
      onClose,
      size = 'md',
      variant = 'default',
      closable = true,
      closeOnBackdrop = true,
      closeOnEscape = true,
      className,
      children,
      portal = true,
      initialFocus,
      mobileFullscreen = false,
      mobileAdaptive = false,
      zIndex,
    },
    ref
  ) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const backdropRef = useRef<HTMLDivElement>(null);
    const modalId = `modal-${Math.random().toString(36).substr(2, 9)}`;
    const titleId = `${modalId}-title`;
    const bodyId = `${modalId}-body`;
    
    // Focus management
    const previousFocusRef = useRef<HTMLElement | null>(null);
    
    const contextValue: ModalContextValue = {
      isOpen,
      onClose,
      size,
      variant,
      closable,
      closeOnBackdrop,
      closeOnEscape,
      modalId,
      titleId,
      bodyId,
    };

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

    // Focus management
    useEffect(() => {
      if (isOpen) {
        // Store the current focused element
        previousFocusRef.current = document.activeElement as HTMLElement;
        
        // Focus the modal or initial focus element
        setTimeout(() => {
          if (initialFocus?.current) {
            initialFocus.current.focus();
          } else if (modalRef.current) {
            const focusableElement = modalRef.current.querySelector(
              'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            ) as HTMLElement;
            focusableElement?.focus();
          }
        }, 0);
      } else {
        // Restore focus when modal closes
        if (previousFocusRef.current) {
          previousFocusRef.current.focus();
          previousFocusRef.current = null;
        }
      }
    }, [isOpen, initialFocus]);

    // Prevent body scroll when modal is open
    useEffect(() => {
      if (isOpen) {
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        document.body.style.overflow = 'hidden';
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      } else {
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      }

      return () => {
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      };
    }, [isOpen]);

    // Handle backdrop click
    const handleBackdropClick = (e: React.MouseEvent) => {
      if (e.target === backdropRef.current && closeOnBackdrop) {
        onClose();
      }
    };

    // Focus trap
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || e.key !== 'Tab') return;

      const modal = modalRef.current;
      if (!modal) return;

      const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    useEffect(() => {
      if (isOpen) {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
      }
      return undefined;
    }, [isOpen]);

    if (!isOpen) return null;

    // Determine mobile-responsive classes
    const getMobileClasses = () => {
      if (mobileFullscreen) return modalTokens.mobile.fullscreen;
      if (mobileAdaptive) return modalTokens.mobile.adaptive;
      return '';
    };

    const modalContent = (
      <ModalContext.Provider value={contextValue}>
        <div
          className={modalTokens.base}
          style={zIndex ? { zIndex } : undefined}
          role="presentation"
          onClick={handleBackdropClick}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              onClose();
            }
          }}
          ref={backdropRef}
        >
          <div className={clsx(modalTokens.backdrop, modalTokens.container)}>
            <div
              ref={ref || modalRef}
              className={clsx(
                modalTokens.content,
                // Use mobile-responsive classes if specified, otherwise use standard size classes
                getMobileClasses() || modalTokens.sizes[size],
                modalTokens.variants[variant],
                className
              )}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              aria-describedby={bodyId}
            >
              {children}
            </div>
          </div>
        </div>
      </ModalContext.Provider>
    );

    return portal ? createPortal(modalContent, document.body) : modalContent;
  }
);

Modal.displayName = 'Modal';

/**
 * Modal.Header - Header component with automatic close button
 */
export interface ModalHeaderProps {
  children: React.ReactNode;
  className?: string;
  showCloseButton?: boolean;
}

const ModalHeader = forwardRef<HTMLDivElement, ModalHeaderProps>(({
  children,
  className,
  showCloseButton,
}, ref) => {
  const { closable, onClose } = useModalComponent();
  const shouldShowCloseButton = showCloseButton !== undefined ? showCloseButton : closable;

  return (
    <div
      ref={ref}
      className={clsx(modalTokens.header, className)}
    >
      <div className="flex-1 min-w-0">
        {children}
      </div>
      {shouldShowCloseButton && (
        <button
          onClick={onClose}
          className={modalTokens.closeButton}
          aria-label="Close modal"
          type="button"
        >
          <X size={20} />
        </button>
      )}
    </div>
  );
});

ModalHeader.displayName = 'Modal.Header';

/**
 * Modal.Title - Title component with proper ARIA
 */
export interface ModalTitleProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

const ModalTitle = forwardRef<HTMLElement, ModalTitleProps>(({
  children,
  className,
  as = 'h2',
}, ref) => {
  const { titleId } = useModalComponent();
  const Component = as as React.ElementType;

  return (
    <Component
      ref={ref}
      id={titleId}
      className={clsx(modalTokens.title, className)}
    >
      {children}
    </Component>
  );
});

ModalTitle.displayName = 'Modal.Title';

/**
 * Modal.Body - Body component with scroll handling
 */
export interface ModalBodyProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}

const ModalBody = forwardRef<HTMLDivElement, ModalBodyProps>(({
  children,
  className,
  padding = true,
}, ref) => {
  const { bodyId } = useModalComponent();

  return (
    <div
      ref={ref}
      id={bodyId}
      className={clsx(
        // Use design token body styles which now include responsive padding
        padding ? modalTokens.body : 'flex-1 overflow-y-auto',
        className
      )}
    >
      {children}
    </div>
  );
});

ModalBody.displayName = 'Modal.Body';

/**
 * Modal.Footer - Footer component for actions
 */
export interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
  justify?: 'start' | 'center' | 'end' | 'between';
}

const ModalFooter = forwardRef<HTMLDivElement, ModalFooterProps>(({
  children,
  className,
  justify = 'end',
}, ref) => {
  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
  };

  return (
    <div
      ref={ref}
      className={clsx(
        modalTokens.footer,
        'flex items-center gap-3',
        justifyClasses[justify],
        className
      )}
    >
      {children}
    </div>
  );
});

ModalFooter.displayName = 'Modal.Footer';

// Attach sub-components to main component
(Modal as any).Header = ModalHeader;
(Modal as any).Title = ModalTitle;
(Modal as any).Body = ModalBody;
(Modal as any).Footer = ModalFooter;

// Export the compound component with proper typing
export interface ModalCompoundComponent extends React.ForwardRefExoticComponent<ModalProps & React.RefAttributes<HTMLDivElement>> {
  Header: typeof ModalHeader;
  Title: typeof ModalTitle;
  Body: typeof ModalBody;
  Footer: typeof ModalFooter;
}

// Attach compound components to Modal
const ModalWithCompounds = Modal as ModalCompoundComponent;
ModalWithCompounds.Header = ModalHeader;
ModalWithCompounds.Title = ModalTitle;
ModalWithCompounds.Body = ModalBody;
ModalWithCompounds.Footer = ModalFooter;

export default ModalWithCompounds;

// Specialized modal variants for common use cases

/**
 * Confirmation Modal - Pre-configured modal for confirmation dialogs
 */
export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  showAlternative?: boolean;
  alternativeText?: string;
  onAlternative?: () => void;
  zIndex?: number;
  closeOnBackdrop?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
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
  zIndex,
  closeOnBackdrop = true,
}) => {
  const variantStyles = {
    danger: 'bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-800 focus:ring-red-500',
    warning: 'bg-yellow-600 dark:bg-yellow-700 hover:bg-yellow-700 dark:hover:bg-yellow-800 focus:ring-yellow-500',
    info: 'bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 focus:ring-blue-500',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      variant="confirmation"
      zIndex={zIndex}
      closeOnBackdrop={closeOnBackdrop}
    >
      <ModalHeader>
        <ModalTitle>{title}</ModalTitle>
      </ModalHeader>
      <ModalBody>
        <div className="text-gray-700 dark:text-gray-300 space-y-2">
          {message.split('\n').map((line, index) => (
            line.trim() ? (
              <p key={index}>{line}</p>
            ) : (
              <div key={index} className="h-2" />
            )
          ))}
        </div>
      </ModalBody>
      <ModalFooter justify={showAlternative ? 'between' : 'end'}>
        {showAlternative && onAlternative ? (
          <>
            <button
              onClick={onAlternative}
              className="px-4 py-2 text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-800 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 dark:focus:ring-offset-gray-800"
            >
              {alternativeText}
            </button>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-md transition-colors"
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
          </>
        ) : (
          <>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-md transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${variantStyles[variant]}`}
            >
              {confirmText}
            </button>
          </>
        )}
      </ModalFooter>
    </Modal>
  );
};

// Legacy wrapper for backward compatibility
export const LegacyModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: ModalSize;
  showCloseButton?: boolean;
  className?: string;
}> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  className,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size={size} className={className}>
      {(title || showCloseButton) && (
        <ModalHeader showCloseButton={showCloseButton}>
          {title && <ModalTitle>{title}</ModalTitle>}
        </ModalHeader>
      )}
      <ModalBody>
        {children}
      </ModalBody>
    </Modal>
  );
};