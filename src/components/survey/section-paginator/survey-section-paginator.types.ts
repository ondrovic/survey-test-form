import { SurveySection } from '../../../types/framework.types';

export interface SurveyPaginatorConfig {
  renderSectionsAsPages: boolean;
  showStepIndicator: boolean;
  showSectionTitles: boolean;
  allowBackNavigation: boolean;
  showProgressBar: boolean;
  showProgressText: boolean;
  showSectionPagination: boolean;
  animateTransitions?: boolean;
  allowSkipping?: boolean;
}

export interface SurveyPaginatorState {
  currentSectionIndex: number;
  visitedSections: Set<number>;
  isFirstSection: boolean;
  isLastSection: boolean;
  totalSections: number;
}

export interface SectionStepIndicatorProps {
  sections: SurveySection[];
  currentIndex: number;
  visitedIndices: Set<number>;
  onStepClick?: (index: number) => void;
  showTitles?: boolean;
  showProgressBar?: boolean;
  showProgressText?: boolean;
  showStepIndicator?: boolean;
  className?: string;
}

export interface SectionNavigationControlsProps {
  isFirstSection: boolean;
  isLastSection: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit?: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export interface PaginatedSectionRendererProps {
  section: SurveySection;
  sectionIndex: number;
  totalSections: number;
  showSectionPagination?: boolean;
  className?: string;
}

export interface SurveyPaginatorProps {
  sections: SurveySection[];
  config?: Partial<SurveyPaginatorConfig>;
  onSubmit?: () => void;
  className?: string;
}

export type SectionTransition = 'slide-left' | 'slide-right' | 'fade' | 'none';

export interface UseSectionPaginationOptions {
  totalSections: number;
  initialIndex?: number;
  allowBackNavigation?: boolean;
  onSectionChange?: (index: number) => void;
}

export interface UseSectionPaginationReturn {
  state: SurveyPaginatorState;
  goToSection: (index: number) => void;
  goToNext: () => void;
  goToPrevious: () => void;
  canGoToSection: (index: number) => boolean;
}