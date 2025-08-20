import { Check } from 'lucide-react';
import React from 'react';
import { clsx } from 'clsx';
import { colors, transitions, typography, borderRadius } from '@/styles/design-tokens';
import { SectionStepIndicatorProps } from './survey-section-paginator.types';

export const SectionStepIndicator: React.FC<SectionStepIndicatorProps> = ({
  sections,
  currentIndex,
  visitedIndices,
  onStepClick,
  showTitles = true,
  showProgressBar = true,
  showProgressText = true,
  showStepIndicator = true,
  className = ''
}) => {
  const totalSections = sections.length;
  const progressPercentage = Math.round(((currentIndex + 1) / totalSections) * 100);

  const getStepStatus = (index: number) => {
    if (index < currentIndex) return 'completed';
    if (index === currentIndex) return 'current';
    return 'upcoming';
  };

  const isClickable = (index: number) => {
    return onStepClick && (visitedIndices.has(index) || index === currentIndex);
  };

  // Helper to break long words for better wrapping
  const formatTitleForWrapping = (title: string) => {
    // Add word break opportunities after common prefixes and before common suffixes
    return title
      .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space before capital letters (camelCase)
      .replace(/(\w{8,})/g, (match) => {
        // For very long words, add soft break opportunities
        if (match.length > 12) {
          return match.replace(/(.{6})/g, '$1\u00AD'); // Add soft hyphens
        }
        return match;
      });
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Progress Text */}
      {showProgressText && (
        <div className="text-center mb-4">
          <span className={clsx(
            typography.text.sm,
            typography.weight.medium,
            `text-${colors.gray[600]}`
          )}>
            Progress: {progressPercentage}% ({currentIndex + 1} of {totalSections})
          </span>
        </div>
      )}

      {/* Progress Bar */}
      {showProgressBar && (
        <div className={clsx(
          'w-full h-2 mb-6',
          `bg-${colors.gray[200]}`,
          borderRadius.full
        )}>
          <div
            className={clsx(
              'h-2',
              `bg-${colors.primary[600]}`,
              borderRadius.full,
              transitions.slow
            )}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      )}

      {/* Step Indicator */}
      {showStepIndicator && (
        <div className={`
          flex items-start relative
          ${totalSections <= 4 ? 'justify-between' : 'justify-start gap-4 overflow-x-auto pb-2'}
        `}>
          {/* Connecting Line */}
          <div className={clsx(
            'absolute top-4 h-0.5 -z-10',
            `bg-${colors.gray[200]}`,
            totalSections <= 4 ? 'left-0 w-full' : 'left-4 right-4'
          )}>
            <div
              className={clsx(
                'h-full',
                `bg-${colors.primary[600]}`,
                transitions.slow
              )}
              style={{
                width: totalSections > 1 ? `${(currentIndex / (totalSections - 1)) * 100}%` : '0%'
              }}
            />
          </div>

          {sections.map((section, index) => {
            const status = getStepStatus(index);
            const clickable = isClickable(index);

            return (
              <div
                key={section.id}
                className={`
                  flex flex-col items-center relative flex-shrink-0
                  ${totalSections > 4 ? 'min-w-16' : ''}
                `}
                style={{ zIndex: 1 }}
              >
                {/* Step Circle */}
                <button
                  onClick={() => clickable && onStepClick?.(index)}
                  disabled={!clickable}
                  className={clsx(
                    'w-8 h-8 border-2 flex items-center justify-center',
                    borderRadius.full,
                    typography.text.sm,
                    typography.weight.medium,
                    transitions.default,
                    {
                      [`bg-${colors.primary[600]} border-${colors.primary[600]} text-white`]: status === 'completed',
                      [`bg-white border-${colors.primary[600]} text-${colors.primary[600]} ring-4 ring-${colors.primary[100]}`]: status === 'current',
                      [`bg-white border-${colors.gray[300]} text-${colors.gray[400]}`]: status === 'upcoming',
                      'cursor-pointer hover:scale-110': clickable,
                      'cursor-default': !clickable,
                    }
                  )}
                  aria-label={`${status === 'completed' ? 'Completed' : status === 'current' ? 'Current' : 'Upcoming'} section: ${section.title}`}
                >
                  {status === 'completed' ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </button>

                {/* Step Title */}
                {showTitles && (
                  <div className={`
                    mt-2 text-center px-1
                    ${totalSections <= 4 ? 'min-w-0 max-w-24' : 'w-16 min-w-16'}
                  `}>
                    <span
                      className={clsx(
                        typography.text.xs,
                        typography.weight.medium,
                        typography.leading.tight,
                        'block break-words hyphens-auto',
                        {
                          [`text-${colors.primary[600]}`]: status === 'current',
                          [`text-${colors.gray[700]}`]: status === 'completed',
                          [`text-${colors.gray[400]}`]: status === 'upcoming',
                        }
                      )}
                      title={section.title}
                      style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                    >
                      {formatTitleForWrapping(section.title)}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Mobile Alternative: Simple Progress */}
      {showStepIndicator && (
        <div className="md:hidden mt-4">
          <div className={clsx(
            'flex justify-between items-center',
            typography.text.sm,
            `text-${colors.gray[600]}`
          )}>
            <span>Step {currentIndex + 1}</span>
            <span className="truncate mx-2" title={sections[currentIndex]?.title}>
              {sections[currentIndex]?.title}
            </span>
            <span>{totalSections} steps</span>
          </div>
        </div>
      )}
    </div>
  );
};