export interface ConnectionStatusProps {
  connected: boolean;
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
  className?: string;
}
