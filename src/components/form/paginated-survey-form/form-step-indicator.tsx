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
        return 'bg-green-600 border-green-600 text-white';
      case 'completed-error':
        return 'bg-red-500 border-red-500 text-white';
      case 'current':
        return 'bg-white border-blue-600 text-blue-600 ring-4 ring-blue-100';
      case 'current-error':
        return 'bg-white border-red-500 text-red-500 ring-4 ring-red-100';
      case 'upcoming':
      default:
        return 'bg-white border-gray-300 text-gray-400';
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
          <span className="text-sm font-medium text-gray-600">
            Progress: {progressPercentage}% ({currentIndex + 1} of {totalSections})
          </span>
        </div>
      )}

      {/* Progress Bar */}
      {showProgressBar && (
        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out"
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
        <div className={`
          absolute top-4 h-0.5 bg-gray-200 -z-10
          ${totalSections <= 4 ? 'left-0 w-full' : 'left-4 right-4'}
        `}>
          <div
            className="h-full bg-blue-600 transition-all duration-300 ease-in-out"
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
                ${totalSections > 4 ? 'min-w-16' : ''}
              `}
              style={{ zIndex: 1 }}
            >
              {/* Step Circle */}
              <button
                onClick={() => clickable && onStepClick?.(index)}
                disabled={!clickable}
                className={`
                  w-8 h-8 rounded-full border-2 flex items-center justify-center
                  text-sm font-medium transition-all duration-200
                  ${getStepStyles(status)}
                  ${clickable
                    ? 'cursor-pointer hover:scale-110'
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
                  <Check className="w-4 h-4" />
                ) : status === 'completed-error' || status === 'current-error' ? (
                  <AlertTriangle className="w-4 h-4" />
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
                    className={`
                      text-xs font-medium block leading-tight break-words hyphens-auto
                      ${status === 'current' || status === 'current-error'
                        ? status === 'current-error' ? 'text-red-600' : 'text-blue-600'
                        : status === 'completed'
                          ? 'text-green-700'
                          : status === 'completed-error'
                            ? 'text-red-600'
                            : 'text-gray-400'
                      }
                    `}
                    title={section.title}
                    style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                  >
                    {formatTitleForWrapping(section.title)}
                  </span>
                  
                  {/* Validation indicator */}
                  {hasSubmitted && !isValid && (
                    <div className="text-xs text-red-500 mt-1 leading-tight">
                      Needs attention
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        </div>
      )}

      {/* Error Summary */}
      {hasSubmitted && !sectionValidationStates[currentIndex] && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <AlertTriangle className="w-4 h-4 text-red-500 mr-2" />
            <span className="text-sm text-red-700">
              Please correct the errors below before proceeding to the next section.
            </span>
          </div>
        </div>
      )}

      {/* Mobile Alternative: Simple Progress */}
      <div className="md:hidden mt-4">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>Step {currentIndex + 1}</span>
          <span>{sections[currentIndex]?.title}</span>
          <span>{totalSections} steps</span>
        </div>
      </div>
    </div>
  );
};