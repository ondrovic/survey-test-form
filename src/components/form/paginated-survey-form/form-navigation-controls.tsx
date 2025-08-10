import { ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import React from 'react';
import { Button } from '../../common';

interface FormNavigationControlsProps {
  isFirstSection: boolean;
  isLastSection: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit?: () => void;
  disabled?: boolean;
  loading?: boolean;
  hasValidationErrors?: boolean;
  className?: string;
}

export const FormNavigationControls: React.FC<FormNavigationControlsProps> = ({
  isFirstSection,
  isLastSection,
  onPrevious,
  onNext,
  onSubmit,
  disabled = false,
  loading = false,
  hasValidationErrors = false,
  className = ''
}) => {
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled || loading) return;

    if (event.key === 'ArrowLeft' && !isFirstSection) {
      event.preventDefault();
      onPrevious();
    } else if (event.key === 'ArrowRight' && !isLastSection && !hasValidationErrors) {
      event.preventDefault();
      onNext();
    } else if (event.key === 'Enter' && isLastSection && onSubmit && !hasValidationErrors) {
      event.preventDefault();
      onSubmit();
    }
  };

  return (
    <div 
      className={`flex items-center justify-between w-full ${className}`}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {/* Previous Button */}
      <div className="flex-shrink-0">
        {!isFirstSection ? (
          <Button
            variant="outline"
            onClick={onPrevious}
            disabled={disabled || loading}
            className="flex items-center gap-2"
            aria-label="Go to previous section"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Previous</span>
          </Button>
        ) : (
          <div className="w-20" /> // Spacer to maintain layout
        )}
      </div>

      {/* Center content with validation feedback */}
      <div className="flex-1 text-center">
        {hasValidationErrors && !isLastSection && (
          <div className="text-sm text-red-600 flex items-center justify-center gap-1">
            <AlertTriangle className="w-4 h-4" />
            <span className="hidden sm:inline">Please fix errors to continue</span>
            <span className="sm:hidden">Fix errors to continue</span>
          </div>
        )}
        {!hasValidationErrors && (
          <div className="text-sm text-gray-500 hidden sm:block">
            Use arrow keys to navigate
          </div>
        )}
      </div>

      {/* Next/Submit Button */}
      <div className="flex-shrink-0">
        {isLastSection ? (
          onSubmit && (
            <Button
              onClick={onSubmit}
              disabled={disabled || hasValidationErrors}
              loading={loading}
              className={`flex items-center gap-2 ${
                hasValidationErrors 
                  ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed' 
                  : ''
              }`}
              aria-label="Submit survey"
              title={hasValidationErrors ? 'Please fix all validation errors before submitting' : 'Submit survey'}
            >
              <span>Submit Survey</span>
            </Button>
          )
        ) : (
          <Button
            onClick={onNext}
            disabled={disabled || loading || hasValidationErrors}
            className={`flex items-center gap-2 ${
              hasValidationErrors 
                ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed' 
                : ''
            }`}
            aria-label="Go to next section"
            title={hasValidationErrors ? 'Please fix errors on this page before continuing' : 'Go to next section'}
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};