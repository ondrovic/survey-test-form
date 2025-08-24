import React from 'react';
import { routes } from '@/routes';

interface NotFoundPageProps {
  title?: string;
  message?: string;
  showHomeButton?: boolean;
  homeButtonText?: string;
  homeButtonPath?: string;
  className?: string;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({
  title = 'Resource Not Found',
  message = "The resource you're looking for doesn't exist.",
  showHomeButton = true,
  homeButtonText = 'Go to Home',
  homeButtonPath = routes.admin,
  className = 'min-h-screen bg-amber-50/30 flex items-center justify-center'
}) => {
  
  return (
    <div className={className}>
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{title}</h1>
        <p className="text-gray-600 mb-6">{message}</p>
        {showHomeButton && (
          <button
            onClick={() => {
              // Use absolute navigation to prevent relative path issues
              window.location.href = `${window.location.origin}/${homeButtonPath.replace(/^\/+/, '')}`;
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            {homeButtonText}
          </button>
        )}
      </div>
    </div>
  );
};