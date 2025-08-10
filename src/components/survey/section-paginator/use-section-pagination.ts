import { useCallback, useMemo, useState } from 'react';
import { 
  SurveyPaginatorState, 
  UseSectionPaginationOptions, 
  UseSectionPaginationReturn 
} from './survey-section-paginator.types';

export const useSectionPagination = ({
  totalSections,
  initialIndex = 0,
  allowBackNavigation = true,
  onSectionChange
}: UseSectionPaginationOptions): UseSectionPaginationReturn => {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(initialIndex);
  const [visitedSections, setVisitedSections] = useState<Set<number>>(
    new Set([initialIndex])
  );

  const state: SurveyPaginatorState = useMemo(() => ({
    currentSectionIndex,
    visitedSections,
    isFirstSection: currentSectionIndex === 0,
    isLastSection: currentSectionIndex === totalSections - 1,
    totalSections
  }), [currentSectionIndex, visitedSections, totalSections]);

  const canGoToSection = useCallback((index: number): boolean => {
    // Can always go to current section
    if (index === currentSectionIndex) return true;
    
    // Can't go to invalid indices
    if (index < 0 || index >= totalSections) return false;
    
    // Can go to previously visited sections if back navigation is allowed
    if (allowBackNavigation && visitedSections.has(index)) return true;
    
    // Can go to next unvisited section if it's immediately after the current one
    return index === currentSectionIndex + 1;
  }, [currentSectionIndex, totalSections, allowBackNavigation, visitedSections]);

  const goToSection = useCallback((index: number): void => {
    if (!canGoToSection(index)) {
      console.warn(`Cannot navigate to section ${index}`);
      return;
    }

    setCurrentSectionIndex(index);
    setVisitedSections(prev => new Set([...prev, index]));
    onSectionChange?.(index);
  }, [canGoToSection, onSectionChange]);

  const goToNext = useCallback((): void => {
    const nextIndex = currentSectionIndex + 1;
    if (nextIndex < totalSections) {
      goToSection(nextIndex);
    }
  }, [currentSectionIndex, totalSections, goToSection]);

  const goToPrevious = useCallback((): void => {
    if (!allowBackNavigation) return;
    
    const previousIndex = currentSectionIndex - 1;
    if (previousIndex >= 0) {
      goToSection(previousIndex);
    }
  }, [currentSectionIndex, allowBackNavigation, goToSection]);

  return {
    state,
    goToSection,
    goToNext,
    goToPrevious,
    canGoToSection
  };
};