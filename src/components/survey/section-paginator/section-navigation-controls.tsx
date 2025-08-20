import { ChevronLeft, ChevronRight } from 'lucide-react';
import React from 'react';
import { clsx } from 'clsx';
import { Button } from '@/components/common/ui/button';
import { colors, typography } from '@/styles/design-tokens';
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
      className={clsx('flex items-center justify-between w-full', className)}
      aria-label="Section navigation"
    >
      {/* Previous Button */}
      <div className="flex-shrink-0">
        {!isFirstSection ? (
          <Button
            variant="outline"
            size="md"
            onClick={onPrevious}
            disabled={disabled || loading}
            icon={<ChevronLeft className="w-4 h-4" />}
            aria-label="Go to previous section"
            className="gap-2"
          >
            <span className="hidden sm:inline">Previous</span>
          </Button>
        ) : (
          <div className="w-20" />
        )}
      </div>

      {/* Section Counter (optional middle content) */}
      <div className="flex-1 text-center">
        <div className={clsx(
          'hidden sm:block',
          typography.text.sm,
          `text-${colors.gray[500]}`
        )}>
          Use arrow keys to navigate
        </div>
      </div>

      {/* Next/Submit Button */}
      <div className="flex-shrink-0">
        {isLastSection ? (
          onSubmit && (
            <Button
              variant="primary"
              size="md"
              onClick={onSubmit}
              disabled={disabled}
              loading={loading}
              aria-label="Submit survey"
              className="gap-2"
            >
              <span>Submit Survey</span>
            </Button>
          )
        ) : (
          <Button
            variant="primary"
            size="md"
            onClick={onNext}
            disabled={disabled || loading}
            icon={<ChevronRight className="w-4 h-4" />}
            aria-label="Go to next section"
            className="gap-2"
          >
            <span className="hidden sm:inline">Next</span>
          </Button>
        )}
      </div>
    </nav>
  );
};