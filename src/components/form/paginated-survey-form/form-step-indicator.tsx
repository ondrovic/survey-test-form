import { Check, AlertTriangle } from 'lucide-react';
import React from 'react';
import { SurveySection } from '../../../types/framework.types';

interface FormStepIndicatorProps {
  sections: SurveySection[];
  currentIndex: number;
  visitedIndices: Set<number>;
  sectionValidationStates: Record<number, boolean>;
  hasSubmitted: boolean;
  onStepClick?: (index: number) => void;
  showTitles?: boolean;
  showProgressBar?: boolean;
  showProgressText?: boolean;
  showStepIndicator?: boolean;
  className?: string;
}

export const FormStepIndicator: React.FC<FormStepIndicatorProps> = ({
  sections,
  currentIndex,
  visitedIndices,
  sectionValidationStates,
  hasSubmitted,
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
    const isValid = sectionValidationStates[index];
    const isCurrent = index === currentIndex;
    
    if (isCurrent) {
      return hasSubmitted && !isValid ? 'current-error' : 'current';
    }
    
    if (index < currentIndex) {
      return isValid ? 'completed' : 'completed-error';
    }
    
    return 'upcoming';
  };

  const getStepStyles = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-600 border-green-600 text-white dark:bg-green-500 dark:border-green-500';
      case 'completed-error':
        return 'bg-red-500 border-red-500 text-white dark:bg-red-400 dark:border-red-400';
      case 'current':
        return 'bg-white dark:bg-gray-800 border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 ring-4 ring-blue-100 dark:ring-blue-900/50';
      case 'current-error':
        return 'bg-white dark:bg-gray-800 border-red-500 dark:border-red-400 text-red-500 dark:text-red-400 ring-4 ring-red-100 dark:ring-red-900/50';
      case 'upcoming':
      default:
        return 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500';
    }
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
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Progress: {progressPercentage}% ({currentIndex + 1} of {totalSections})
          </span>
        </div>
      )}

      {/* Progress Bar */}
      {showProgressBar && (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-6">
          <div
            className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      )}

      {/* Step Indicator */}
      {showStepIndicator && (
        <>
          {/* Desktop Step Indicator */}
          <div className="hidden sm:block">
            <div className={`
              flex items-start relative
              ${totalSections <= 4 ? 'justify-between' : 'justify-start gap-4 overflow-x-auto pb-2 scrollbar-hide'}
            `}>
              {/* Connecting Line */}
              <div className={`
                absolute top-5 h-0.5 bg-gray-200 dark:bg-gray-700 -z-10
                ${totalSections <= 4 ? 'left-0 w-full' : 'left-5 right-5'}
              `}>
                <div
                  className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-300 ease-in-out"
                  style={{
                    width: totalSections > 1 ? `${(currentIndex / (totalSections - 1)) * 100}%` : '0%'
                  }}
                />
              </div>

              {sections.map((section, index) => {
                const status = getStepStatus(index);
                const clickable = isClickable(index);
                const isValid = sectionValidationStates[index];

                return (
                  <div
                    key={section.id}
                    className={`
                      flex flex-col items-center relative flex-shrink-0
                      ${totalSections > 4 ? 'min-w-20' : ''}
                    `}
                    style={{ zIndex: 1 }}
                  >
                    {/* Step Circle - Desktop */}
                    <button
                      onClick={() => clickable && onStepClick?.(index)}
                      disabled={!clickable}
                      className={`
                        w-10 h-10 rounded-full border-2 flex items-center justify-center
                        text-sm font-medium transition-all duration-200
                        ${getStepStyles(status)}
                        ${clickable
                          ? 'cursor-pointer hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                          : 'cursor-default'
                        }
                      `}
                      aria-label={`Section ${index + 1}: ${section.title} - ${
                        status.includes('error') ? 'Has validation errors' : 
                        status === 'completed' ? 'Completed' : 
                        status === 'current' ? 'Current' : 'Upcoming'
                      }`}
                    >
                      {status === 'completed' ? (
                        <Check className="w-5 h-5" />
                      ) : status === 'completed-error' || status === 'current-error' ? (
                        <AlertTriangle className="w-5 h-5" />
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </button>

                    {/* Step Title - Desktop */}
                    {showTitles && (
                      <div className={`
                        mt-3 text-center px-1
                        ${totalSections <= 4 ? 'min-w-0 max-w-28' : 'w-20 min-w-20'}
                      `}>
                        <span
                          className={`
                            text-xs font-medium block leading-tight break-words hyphens-auto
                            ${status === 'current' || status === 'current-error'
                              ? status === 'current-error' ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'
                              : status === 'completed'
                                ? 'text-green-700 dark:text-green-400'
                                : status === 'completed-error'
                                  ? 'text-red-600 dark:text-red-400'
                                  : 'text-gray-400 dark:text-gray-500'
                            }
                          `}
                          title={section.title}
                          style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                        >
                          {formatTitleForWrapping(section.title)}
                        </span>
                        
                        {/* Validation indicator */}
                        {hasSubmitted && !isValid && (
                          <div className="text-xs text-red-500 dark:text-red-400 mt-1 leading-tight">
                            Needs attention
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile Step Indicator - Horizontal Scrolling */}
          <div className="sm:hidden">
            <div className="flex items-center gap-3 overflow-x-auto pb-3 px-1 scrollbar-hide">
              {sections.map((section, index) => {
                const status = getStepStatus(index);
                const clickable = isClickable(index);
                const isValid = sectionValidationStates[index];

                return (
                  <div
                    key={section.id}
                    className="flex items-center gap-2 flex-shrink-0"
                  >
                    {/* Mobile Step Circle - 44px minimum touch target */}
                    <button
                      onClick={() => clickable && onStepClick?.(index)}
                      disabled={!clickable}
                      className={`
                        min-w-[44px] min-h-[44px] w-11 h-11 rounded-full border-2 flex items-center justify-center
                        text-sm font-medium transition-all duration-200
                        ${getStepStyles(status)}
                        ${clickable
                          ? 'cursor-pointer active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                          : 'cursor-default'
                        }
                      `}
                      aria-label={`Section ${index + 1}: ${section.title} - ${
                        status.includes('error') ? 'Has validation errors' : 
                        status === 'completed' ? 'Completed' : 
                        status === 'current' ? 'Current' : 'Upcoming'
                      }`}
                    >
                      {status === 'completed' ? (
                        <Check className="w-5 h-5" />
                      ) : status === 'completed-error' || status === 'current-error' ? (
                        <AlertTriangle className="w-5 h-5" />
                      ) : (
                        <span className="text-base font-semibold">{index + 1}</span>
                      )}
                    </button>

                    {/* Mobile Step Title */}
                    {showTitles && index === currentIndex && (
                      <div className="flex-shrink-0 max-w-32">
                        <span
                          className={`
                            text-sm font-medium block leading-tight
                            ${status === 'current' || status === 'current-error'
                              ? status === 'current-error' ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'
                              : status === 'completed'
                                ? 'text-green-700 dark:text-green-400'
                                : status === 'completed-error'
                                  ? 'text-red-600 dark:text-red-400'
                                  : 'text-gray-400 dark:text-gray-500'
                            }
                          `}
                          title={section.title}
                        >
                          {section.title.length > 20 ? `${section.title.substring(0, 20)}...` : section.title}
                        </span>
                        
                        {/* Mobile Validation indicator */}
                        {hasSubmitted && !isValid && (
                          <div className="text-xs text-red-500 dark:text-red-400 mt-1 leading-tight">
                            Needs attention
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Error Summary */}
      {hasSubmitted && !sectionValidationStates[currentIndex] && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-red-700 dark:text-red-300">
              Please correct the errors below before proceeding to the next section.
            </span>
          </div>
        </div>
      )}

      {/* Mobile Current Step Display */}
      <div className="sm:hidden mt-4">
        <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-4 py-3 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="font-medium">Step {currentIndex + 1} of {totalSections}</span>
            {hasSubmitted && !sectionValidationStates[currentIndex] && (
              <AlertTriangle className="w-4 h-4 text-red-500 dark:text-red-400" />
            )}
          </div>
          <span className="font-medium text-gray-900 dark:text-gray-100 truncate ml-2 max-w-[60%]">
            {sections[currentIndex]?.title}
          </span>
        </div>
      </div>
    </div>
  );
};