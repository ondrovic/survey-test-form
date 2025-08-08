import { useToast } from '@/contexts/toast-context/index';
import React from 'react';
import { Button } from '../button';

export const ToastDemo: React.FC = () => {
    const { showSuccess, showError, showWarning, showInfo } = useToast();

    return (
        <div className="p-6 space-y-4">
            <h2 className="text-2xl font-bold">Toast Notification Demo</h2>
            <div className="space-x-4">
                <Button onClick={() => showSuccess('This is a success message!')}>
                    Show Success
                </Button>
                <Button onClick={() => showError('This is an error message!')}>
                    Show Error
                </Button>
                <Button onClick={() => showWarning('This is a warning message!')}>
                    Show Warning
                </Button>
                <Button onClick={() => showInfo('This is an info message!')}>
                    Show Info
                </Button>
            </div>
        </div>
    );
};
