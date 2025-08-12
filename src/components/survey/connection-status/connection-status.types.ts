export interface ConnectionStatusProps {
  connected: boolean;
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
  isAuthenticated?: boolean;
  className?: string;
  lastCheckedAt?: Date | null;
}
