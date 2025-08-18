import React, { createContext, useContext, useState, ReactNode } from 'react';
import { UnifiedModal, ConfirmationModal, ModalProps } from '../../components/common/unified-modal/unified-modal';

interface ModalState {
  id: string;
  component: ReactNode;
  props: Partial<ModalProps>;
  renderFunction?: () => ReactNode;
  forceUpdate?: number;
}

interface ModalContextType {
  // Basic modal management
  openModal: (id: string, component: ReactNode, props?: Partial<ModalProps>) => void;
  openReactiveModal: (id: string, renderFunction: () => ReactNode, props?: Partial<ModalProps>) => void;
  updateModal: (id: string, component: ReactNode, props?: Partial<ModalProps>) => void;
  forceUpdateModal: (id: string) => void;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
  isModalOpen: (id: string) => boolean;
  
  // Convenience methods
  showConfirmation: (options: {
    id?: string;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    // Alternative action support
    showAlternative?: boolean;
    alternativeText?: string;
    onAlternative?: () => void;
  }) => void;
  
  showAlert: (options: {
    id?: string;
    title: string;
    message: string;
    onClose?: () => void;
  }) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = (): ModalContextType => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

interface ModalProviderProps {
  children: ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const [modals, setModals] = useState<ModalState[]>([]);

  const openModal = (id: string, component: ReactNode, props: Partial<ModalProps> = {}) => {
    setModals(prev => {
      // Remove existing modal with same ID
      const filtered = prev.filter(modal => modal.id !== id);
      return [...filtered, { id, component, props }];
    });
  };

  const openReactiveModal = (id: string, renderFunction: () => ReactNode, props: Partial<ModalProps> = {}) => {
    setModals(prev => {
      // Remove existing modal with same ID
      const filtered = prev.filter(modal => modal.id !== id);
      return [...filtered, { 
        id, 
        component: renderFunction(), 
        props, 
        renderFunction,
        forceUpdate: 0
      }];
    });
  };

  const updateModal = (id: string, component: ReactNode, props: Partial<ModalProps> = {}) => {
    setModals(prev => {
      const existingModalIndex = prev.findIndex(modal => modal.id === id);
      
      if (existingModalIndex === -1) {
        // Modal doesn't exist, treat as openModal
        return [...prev, { id, component, props }];
      }
      // Update existing modal
      const updated = [...prev];
      updated[existingModalIndex] = { id, component, props };
      return updated;
    });
  };

  const forceUpdateModal = (id: string) => {
    setModals(prev => {
      const existingModalIndex = prev.findIndex(modal => modal.id === id);
      
      if (existingModalIndex === -1 || !prev[existingModalIndex].renderFunction) {
        return prev; // Modal doesn't exist or isn't reactive
      }
      
      // Re-render the modal by calling its render function
      const updated = [...prev];
      const modal = updated[existingModalIndex];
      
      updated[existingModalIndex] = {
        ...modal,
        component: modal.renderFunction!(),
        forceUpdate: (modal.forceUpdate || 0) + 1
      };
      
      return updated;
    });
  };

  const closeModal = (id: string) => {
    setModals(prev => prev.filter(modal => modal.id !== id));
  };

  const closeAllModals = () => {
    setModals([]);
  };

  const isModalOpen = (id: string) => {
    return modals.some(modal => modal.id === id);
  };

  const showConfirmation = ({
    id = 'confirmation',
    title,
    message,
    onConfirm,
    onCancel,
    confirmText,
    cancelText,
    variant = 'danger',
    showAlternative,
    alternativeText,
    onAlternative
  }: Parameters<ModalContextType['showConfirmation']>[0]) => {
    const handleConfirm = () => {
      onConfirm();
      closeModal(id);
    };

    const handleCancel = () => {
      onCancel?.();
      closeModal(id);
    };

    const handleAlternative = () => {
      onAlternative?.();
      closeModal(id);
    };

    openModal(
      id,
      <ConfirmationModal
        isOpen={true}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        title={title}
        message={message}
        confirmText={confirmText}
        cancelText={cancelText}
        variant={variant}
        showAlternative={showAlternative}
        alternativeText={alternativeText}
        onAlternative={showAlternative ? handleAlternative : undefined}
      />
    );
  };

  const showAlert = ({
    id = 'alert',
    title,
    message,
    onClose
  }: Parameters<ModalContextType['showAlert']>[0]) => {
    const handleClose = () => {
      onClose?.();
      closeModal(id);
    };

    openModal(
      id,
      <UnifiedModal
        isOpen={true}
        onClose={handleClose}
        title={title}
        size="sm"
        variant="confirmation"
        footer={
          <div className="flex justify-end">
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              OK
            </button>
          </div>
        }
      >
        <div className="p-6">
          <p className="text-gray-700">{message}</p>
        </div>
      </UnifiedModal>
    );
  };

  const contextValue: ModalContextType = {
    openModal,
    openReactiveModal,
    updateModal,
    forceUpdateModal,
    closeModal,
    closeAllModals,
    isModalOpen,
    showConfirmation,
    showAlert,
  };

  return (
    <ModalContext.Provider value={contextValue}>
      {children}
      
      {/* Render all active modals */}
      {modals.map((modal, index) => (
        <div key={`${modal.id}-${modal.forceUpdate || 0}`} style={{ zIndex: 9999 + index }}>
          {modal.component}
        </div>
      ))}
    </ModalContext.Provider>
  );
};

// Hook for common modal patterns
export const useConfirmation = () => {
  const { showConfirmation } = useModal();
  
  return (options: Parameters<ModalContextType['showConfirmation']>[0]) => {
    return new Promise<boolean>((resolve) => {
      showConfirmation({
        ...options,
        onConfirm: () => {
          options.onConfirm();
          resolve(true);
        },
        onCancel: () => {
          options.onCancel?.();
          resolve(false);
        },
      });
    });
  };
};

export const useAlert = () => {
  const { showAlert } = useModal();
  
  return (options: Parameters<ModalContextType['showAlert']>[0]) => {
    return new Promise<void>((resolve) => {
      showAlert({
        ...options,
        onClose: () => {
          options.onClose?.();
          resolve();
        },
      });
    });
  };
};