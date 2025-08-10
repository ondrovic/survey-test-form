import { ChevronLeft, ChevronRight } from 'lucide-react';
import React from 'react';
import { Button } from '../../common';
import { SectionNavigationControlsProps } from './survey-section-paginator.types';

export const SectionNavigationControls: React.FC<SectionNavigationControlsProps> = ({
  isFirstSection,
  isLastSection,
  onPrevious,
  onNext,
  onSubmit,
  disabled = false,
  loading = false,
  className = ''
}) => {
  // const handleKeyDown = (event: React.KeyboardEvent) => {
  //   if (disabled || loading) return;

  //   if (event.key === 'ArrowLeft' && !isFirstSection) {
  //     event.preventDefault();
  //     onPrevious();
  //   } else if (event.key === 'ArrowRight' && !isLastSection) {
  //     event.preventDefault();
  //     onNext();
  //   } else if (event.key === 'Enter' && isLastSection && onSubmit) {
  //     event.preventDefault();
  //     onSubmit();
  //   }
  // };

  return (
    <nav 
      className={`flex items-center justify-between w-full ${className}`}
      aria-label="Section navigation"
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

      {/* Section Counter (optional middle content) */}
      <div className="flex-1 text-center">
        <div className="text-sm text-gray-500 hidden sm:block">
          Use arrow keys to navigate
        </div>
      </div>

      {/* Next/Submit Button */}
      <div className="flex-shrink-0">
        {isLastSection ? (
          onSubmit && (
            <Button
              onClick={onSubmit}
              disabled={disabled}
              loading={loading}
              className="flex items-center gap-2"
              aria-label="Submit survey"
            >
              <span>Submit Survey</span>
            </Button>
          )
        ) : (
          <Button
            onClick={onNext}
            disabled={disabled || loading}
            className="flex items-center gap-2"
            aria-label="Go to next section"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </nav>
  );
};