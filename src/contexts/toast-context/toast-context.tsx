import React, { createContext, ReactNode, useContext } from 'react';
import toast, { ToastOptions } from 'react-hot-toast';

interface ToastContextType {
    showSuccess: (message: string, options?: ToastOptions) => void;
    showError: (message: string, options?: ToastOptions) => void;
    showWarning: (message: string, options?: ToastOptions) => void;
    showInfo: (message: string, options?: ToastOptions) => void;
    dismiss: (toastId?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
    children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
    const defaultOptions: ToastOptions = {
        duration: 5000,
        position: 'top-right',
        style: {
            borderRadius: '8px',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: '500',
        },
    };

    const showSuccess = (message: string, options?: ToastOptions) => {
        toast.success(message, {
            ...defaultOptions,
            ...options,
            style: {
                ...defaultOptions.style,
                ...options?.style,
                backgroundColor: '#f0fdf4',
                color: '#166534',
                border: '1px solid #bbf7d0',
            },
        });
    };

    const showError = (message: string, options?: ToastOptions) => {
        toast.error(message, {
            ...defaultOptions,
            ...options,
            style: {
                ...defaultOptions.style,
                ...options?.style,
                backgroundColor: '#fef2f2',
                color: '#dc2626',
                border: '1px solid #fecaca',
            },
        });
    };

    const showWarning = (message: string, options?: ToastOptions) => {
        toast(message, {
            ...defaultOptions,
            ...options,
            icon: '⚠️',
            style: {
                ...defaultOptions.style,
                ...options?.style,
                backgroundColor: '#fffbeb',
                color: '#d97706',
                border: '1px solid #fed7aa',
            },
        });
    };

    const showInfo = (message: string, options?: ToastOptions) => {
        toast(message, {
            ...defaultOptions,
            ...options,
            icon: 'ℹ️',
            style: {
                ...defaultOptions.style,
                ...options?.style,
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                border: '1px solid #bfdbfe',
            },
        });
    };

    const dismiss = (toastId?: string) => {
        if (toastId) {
            toast.dismiss(toastId);
        } else {
            toast.dismiss();
        }
    };

    const value: ToastContextType = {
        showSuccess,
        showError,
        showWarning,
        showInfo,
        dismiss,
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
        </ToastContext.Provider>
    );
};

export const useToast = (): ToastContextType => {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
