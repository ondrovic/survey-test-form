import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '../button';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
        this.props.onError?.(error, errorInfo);
    }

    override render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen bg-amber-50/30 flex items-center justify-center">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">
                            Something went wrong
                        </h1>
                        <p className="text-gray-600 mb-6">
                            An unexpected error occurred. Please try refreshing the page.
                        </p>
                        <Button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2"
                        >
                            Refresh Page
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
