import React, { useCallback, useEffect } from 'react';
import { PaginatedSectionRenderer } from './paginated-section-renderer';
import { SectionNavigationControls } from './section-navigation-controls';
import { SectionStepIndicator } from './section-step-indicator';
import { SurveyPaginatorProps } from './survey-section-paginator.types';
import { useSectionPagination } from './use-section-pagination';

const DEFAULT_CONFIG = {
  renderSectionsAsPages: true,
  showStepIndicator: true,
  showSectionTitles: true,
  allowBackNavigation: true,
  showProgressBar: true,
  showProgressText: true,
  showSectionPagination: true,
  animateTransitions: true
};

export const SurveySectionPaginator: React.FC<SurveyPaginatorProps> = ({
  sections,
  config = {},
  onSubmit,
  className = ''
}) => {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  
  const {
    state,
    goToSection,
    goToNext,
    goToPrevious,
    canGoToSection
  } = useSectionPagination({
    totalSections: sections.length,
    initialIndex: 0,
    allowBackNavigation: mergedConfig.allowBackNavigation,
    onSectionChange: (index) => {
      // Optional: Analytics or other side effects
      console.log(`Navigated to section ${index + 1}: ${sections[index]?.title}`);
    }
  });

  // Keyboard navigation
  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      // Only handle if no input is focused
      if (document.activeElement?.tagName === 'INPUT' || 
          document.activeElement?.tagName === 'TEXTAREA' ||
          document.activeElement?.tagName === 'SELECT') {
        return;
      }

      switch (event.key) {
        case 'ArrowLeft':
          if (!state.isFirstSection && mergedConfig.allowBackNavigation) {
            event.preventDefault();
            goToPrevious();
          }
          break;
        case 'ArrowRight':
          if (!state.isLastSection) {
            event.preventDefault();
            goToNext();
          }
          break;
        case 'Home':
          if (canGoToSection(0)) {
            event.preventDefault();
            goToSection(0);
          }
          break;
        case 'End':
          const lastIndex = sections.length - 1;
          if (canGoToSection(lastIndex)) {
            event.preventDefault();
            goToSection(lastIndex);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [state, goToNext, goToPrevious, goToSection, canGoToSection, mergedConfig.allowBackNavigation, sections.length]);

  const handleStepClick = useCallback((index: number) => {
    if (canGoToSection(index)) {
      goToSection(index);
    }
  }, [canGoToSection, goToSection]);

  const handleSubmit = useCallback(() => {
    if (onSubmit) {
      console.log('Survey submitted with paginated navigation');
      onSubmit();
    }
  }, [onSubmit]);

  // Don't render if no sections
  if (sections.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <p className="text-gray-500 text-lg">No sections to display</p>
      </div>
    );
  }

  const currentSection = sections[state.currentSectionIndex];

  return (
    <div className={`survey-section-paginator ${className}`}>
      {/* Step Indicator */}
      {mergedConfig.showStepIndicator && (
        <div className="mb-8 px-4">
          <SectionStepIndicator
            sections={sections}
            currentIndex={state.currentSectionIndex}
            visitedIndices={state.visitedSections}
            onStepClick={mergedConfig.allowBackNavigation ? handleStepClick : undefined}
            showTitles={mergedConfig.showSectionTitles}
            showProgressBar={mergedConfig.showProgressBar}
            showProgressText={mergedConfig.showProgressText}
          />
        </div>
      )}

      {/* Section Content */}
      <div 
        className={`
          section-content mb-8
          ${mergedConfig.animateTransitions 
            ? 'transition-all duration-300 ease-in-out' 
            : ''
          }
        `}
      >
        <PaginatedSectionRenderer
          section={currentSection}
          sectionIndex={state.currentSectionIndex}
          totalSections={state.totalSections}
          showSectionPagination={mergedConfig.showSectionPagination}
        />
      </div>

      {/* Navigation Controls */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 mt-8">
        <SectionNavigationControls
          isFirstSection={state.isFirstSection}
          isLastSection={state.isLastSection}
          onPrevious={goToPrevious}
          onNext={goToNext}
          onSubmit={state.isLastSection ? handleSubmit : undefined}
          disabled={false}
          loading={false}
        />
      </div>

      {/* Accessibility announcements */}
      <div className="sr-only" role="status" aria-live="polite">
        Current section: {state.currentSectionIndex + 1} of {state.totalSections}, {currentSection.title}
      </div>
    </div>
  );
};