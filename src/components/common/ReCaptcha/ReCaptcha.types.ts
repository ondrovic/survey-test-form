export interface ReCaptchaProps {
  onVerify: (token: string | null) => void;
  onExpired?: () => void;
  onError?: () => void;
  className?: string;
  disabled?: boolean;
}

export interface ReCaptchaState {
  token: string | null;
  isVerified: boolean;
  isExpired: boolean;
  hasError: boolean;
}
