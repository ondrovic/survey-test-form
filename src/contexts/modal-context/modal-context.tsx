import React, { createContext, ReactNode, useCallback, useContext, useReducer } from 'react';

// State interface
interface ModalState {
    modals: Record<string, { isOpen: boolean; data: any }>;
}

// Action types
type ModalAction =
    | { type: 'OPEN_MODAL'; payload: { modalId: string; data?: any } }
    | { type: 'CLOSE_MODAL'; payload: { modalId: string } }
    | { type: 'TOGGLE_MODAL'; payload: { modalId: string; data?: any } }
    | { type: 'SET_MODAL_DATA'; payload: { modalId: string; data: any } }
    | { type: 'CLOSE_ALL_MODALS' };

// Initial state
const initialState: ModalState = {
    modals: {},
};

// Reducer
function modalReducer(state: ModalState, action: ModalAction): ModalState {
    switch (action.type) {
        case 'OPEN_MODAL':
            return {
                ...state,
                modals: {
                    ...state.modals,
                    [action.payload.modalId]: {
                        isOpen: true,
                        data: action.payload.data || null,
                    },
                },
            };

        case 'CLOSE_MODAL':
            return {
                ...state,
                modals: {
                    ...state.modals,
                    [action.payload.modalId]: {
                        isOpen: false,
                        data: null,
                    },
                },
            };

        case 'TOGGLE_MODAL':
            const currentModal = state.modals[action.payload.modalId];
            return {
                ...state,
                modals: {
                    ...state.modals,
                    [action.payload.modalId]: {
                        isOpen: !currentModal?.isOpen,
                        data: !currentModal?.isOpen ? (action.payload.data || null) : null,
                    },
                },
            };

        case 'SET_MODAL_DATA':
            return {
                ...state,
                modals: {
                    ...state.modals,
                    [action.payload.modalId]: {
                        ...state.modals[action.payload.modalId],
                        data: action.payload.data,
                    },
                },
            };

        case 'CLOSE_ALL_MODALS':
            const closedModals: Record<string, { isOpen: boolean; data: any }> = {};
            Object.keys(state.modals).forEach(modalId => {
                closedModals[modalId] = { isOpen: false, data: null };
            });
            return {
                ...state,
                modals: closedModals,
            };

        default:
            return state;
    }
}

// Context
interface ModalContextType {
    state: ModalState;
    dispatch: React.Dispatch<ModalAction>;
    // Convenience methods
    openModal: (modalId: string, data?: any) => void;
    closeModal: (modalId: string) => void;
    toggleModal: (modalId: string, data?: any) => void;
    setModalData: (modalId: string, data: any) => void;
    closeAllModals: () => void;
    isModalOpen: (modalId: string) => boolean;
    getModalData: (modalId: string) => any;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

// Provider component
interface ModalProviderProps {
    children: ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
    const [state, dispatch] = useReducer(modalReducer, initialState);

    const openModal = useCallback((modalId: string, data?: any) => {
        dispatch({ type: 'OPEN_MODAL', payload: { modalId, data } });
    }, []);

    const closeModal = useCallback((modalId: string) => {
        dispatch({ type: 'CLOSE_MODAL', payload: { modalId } });
    }, []);

    const toggleModal = useCallback((modalId: string, data?: any) => {
        dispatch({ type: 'TOGGLE_MODAL', payload: { modalId, data } });
    }, []);

    const setModalData = useCallback((modalId: string, data: any) => {
        dispatch({ type: 'SET_MODAL_DATA', payload: { modalId, data } });
    }, []);

    const closeAllModals = useCallback(() => {
        dispatch({ type: 'CLOSE_ALL_MODALS' });
    }, []);

    const isModalOpen = useCallback((modalId: string): boolean => {
        return state.modals[modalId]?.isOpen || false;
    }, [state.modals]);

    const getModalData = useCallback((modalId: string): any => {
        return state.modals[modalId]?.data || null;
    }, [state.modals]);

    const value: ModalContextType = {
        state,
        dispatch,
        openModal,
        closeModal,
        toggleModal,
        setModalData,
        closeAllModals,
        isModalOpen,
        getModalData,
    };

    return (
        <ModalContext.Provider value={value}>
            {children}
        </ModalContext.Provider>
    );
};

// Hook to use the context
export const useModal = (): ModalContextType => {
    const context = useContext(ModalContext);
    if (context === undefined) {
        throw new Error('useModal must be used within a ModalProvider');
    }
    return context;
};

// Hook for a specific modal
export const useSpecificModal = (modalId: string) => {
    const { isModalOpen, getModalData, openModal, closeModal, toggleModal, setModalData } = useModal();

    return {
        isOpen: isModalOpen(modalId),
        data: getModalData(modalId),
        open: (data?: any) => openModal(modalId, data),
        close: () => closeModal(modalId),
        toggle: (data?: any) => toggleModal(modalId, data),
        setData: (data: any) => setModalData(modalId, data),
    };
};
