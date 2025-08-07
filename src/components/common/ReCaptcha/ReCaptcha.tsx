import React from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { ReCaptchaProps } from './ReCaptcha.types';

export const ReCaptchaComponent: React.FC<ReCaptchaProps> = ({
  onVerify,
  onExpired,
  onError,
  className = '',
  disabled = false,
}) => {
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

  if (!siteKey) {
    console.error('reCAPTCHA site key is not configured. Please add VITE_RECAPTCHA_SITE_KEY to your environment variables.');
    return (
      <div className={`p-4 border border-red-300 bg-red-50 rounded-md ${className}`}>
        <p className="text-red-600 text-sm">
          reCAPTCHA is not configured. Please contact the administrator.
        </p>
      </div>
    );
  }

  const handleVerify = (token: string | null) => {
    onVerify(token);
  };

  const handleExpired = () => {
    onExpired?.();
  };

  const handleError = () => {
    onError?.();
  };

  return (
    <div className={`flex justify-center ${className}`}>
      <ReCAPTCHA
        sitekey={siteKey}
        onChange={handleVerify}
        onExpired={handleExpired}
        onError={handleError}
        disabled={disabled}
      />
    </div>
  );
}; 