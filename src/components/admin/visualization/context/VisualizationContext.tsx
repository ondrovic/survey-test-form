import React, { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { ChartModalData, ChartType, FilterState, VisualizationPreferences, VisualizationState } from '../types';
import { ChartModal } from '../components/ChartModal';

// Context for chart preferences (already existed in original)
const VisualizationPreferencesContext = createContext<VisualizationPreferences | null>(null);

// Context for visualization state management
interface VisualizationContextType {
  // Filter state
  filters: FilterState;
  updateFilters: (updates: Partial<FilterState>) => void;

  // UI state (including modal state)
  state: VisualizationState;
  updateState: (updates: Partial<VisualizationState>) => void;

  // Chart preferences
  preferences: VisualizationPreferences;

  // Theme state
  isDarkMode: boolean;

  // Modal actions
  openChartModal: (chartData: ChartModalData) => void;
  closeChartModal: () => void;

  // Section management
  toggleSectionCollapsed: (sectionId: string) => void;
  toggleSubsectionCollapsed: (subsectionId: string) => void;
  expandAll: () => void;
  collapseAll: (sectionIds: string[], subsectionIds: string[]) => void;

  // Field management
  hideField: (fieldId: string) => void;
  showField: (fieldId: string) => void;
  toggleFieldVisibility: (fieldId: string) => void;
  showAllFields: () => void;
}

const VisualizationContext = createContext<VisualizationContextType | null>(null);

interface VisualizationProviderProps {
  children: ReactNode;
}

export const VisualizationProvider: React.FC<VisualizationProviderProps> = ({ children }) => {
  // Theme state - detect dark mode using multiple methods
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    
    // Check multiple sources for dark mode
    const hasClassDark = document.documentElement.classList.contains('dark');
    const hasDataDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const bodyClassDark = document.body.classList.contains('dark');
    
    // Use system preference as fallback if no class/attribute is set
    return hasClassDark || hasDataDark || bodyClassDark || systemPrefersDark;
  });

  // Watch for theme changes
  React.useEffect(() => {
    const checkDarkMode = () => {
      const hasClassDark = document.documentElement.classList.contains('dark');
      const hasDataDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const bodyClassDark = document.body.classList.contains('dark');
      
      const isDark = hasClassDark || hasDataDark || bodyClassDark || systemPrefersDark;
      
      setIsDarkMode(isDark);
    };

    // Watch for class changes on html and body elements
    const htmlObserver = new MutationObserver(checkDarkMode);
    const bodyObserver = new MutationObserver(checkDarkMode);
    
    htmlObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme']
    });
    
    bodyObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });

    // Watch for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = () => {
      checkDarkMode();
    };
    
    mediaQuery.addListener(handleMediaChange);
    
    return () => {
      htmlObserver.disconnect();
      bodyObserver.disconnect();
      mediaQuery.removeListener(handleMediaChange);
    };
  }, []);

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    startDate: '',
    endDate: '',
    showPercent: false,
    sectionFilter: 'all',
    subsectionFilter: 'all',
    search: '',
    quickRange: 'all'
  });

  // UI state (including modal state)
  const [state, setState] = useState<VisualizationState>({
    collapsedSections: new Set(),
    collapsedSubsections: new Set(),
    hiddenFields: new Set(),
    showAdvanced: false,
    showHideFieldsUI: false,
    selectedChart: null,
    isChartModalOpen: false
  });

  // Chart preferences
  const [defaultChartType, setDefaultChartType] = useState<ChartType>('donut');
  const [perFieldChartType, setPerFieldChartType] = useState<Record<string, ChartType | undefined>>({});

  const preferences: VisualizationPreferences = {
    defaultChartType,
    setDefaultChartType,
    perFieldChartType,
    setPerFieldChartType: (fieldId: string, chartType: ChartType | undefined) => {
      setPerFieldChartType(prev => ({ ...prev, [fieldId]: chartType }));
    }
  };



  // Actions
  const updateFilters = useCallback((updates: Partial<FilterState>) => {
    setFilters(prev => {
      const newFilters = { ...prev, ...updates };
      return newFilters;
    });
  }, []);

  const updateState = useCallback((updates: Partial<VisualizationState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const openChartModal = useCallback((chartData: ChartModalData) => {
    setState(prev => ({ ...prev, selectedChart: chartData, isChartModalOpen: true }));
  }, []);

  const closeChartModal = useCallback(() => {
    setState(prev => ({ ...prev, selectedChart: null, isChartModalOpen: false }));
  }, []);

  const toggleSectionCollapsed = useCallback((sectionId: string) => {
    setState(prev => {
      const next = new Set(prev.collapsedSections);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return { ...prev, collapsedSections: next };
    });
  }, []);

  const toggleSubsectionCollapsed = useCallback((subsectionId: string) => {
    setState(prev => {
      const next = new Set(prev.collapsedSubsections);
      if (next.has(subsectionId)) {
        next.delete(subsectionId);
      } else {
        next.add(subsectionId);
      }
      return { ...prev, collapsedSubsections: next };
    });
  }, []);

  const expandAll = useCallback(() => {
    setState(prev => ({
      ...prev,
      collapsedSections: new Set(),
      collapsedSubsections: new Set()
    }));
  }, []);

  const collapseAll = useCallback((sectionIds: string[], subsectionIds: string[]) => {
    setState(prev => ({
      ...prev,
      collapsedSections: new Set(sectionIds),
      collapsedSubsections: new Set(subsectionIds)
    }));
  }, []);

  const hideField = useCallback((fieldId: string) => {
    setState(prev => ({
      ...prev,
      hiddenFields: new Set(prev.hiddenFields).add(fieldId)
    }));
  }, []);

  const showField = useCallback((fieldId: string) => {
    setState(prev => {
      const newHiddenFields = new Set(prev.hiddenFields);
      newHiddenFields.delete(fieldId);
      return { ...prev, hiddenFields: newHiddenFields };
    });
  }, []);

  const toggleFieldVisibility = useCallback((fieldId: string) => {
    setState(prev => {
      const newHiddenFields = new Set(prev.hiddenFields);
      const wasHidden = newHiddenFields.has(fieldId);
      if (wasHidden) {
        newHiddenFields.delete(fieldId);
      } else {
        newHiddenFields.add(fieldId);
      }
      return { ...prev, hiddenFields: newHiddenFields };
    });
  }, []);

  const showAllFields = useCallback(() => {
    setState(prev => ({ ...prev, hiddenFields: new Set() }));
  }, []);

  const contextValue: VisualizationContextType = {
    filters,
    updateFilters,
    state,
    updateState,
    preferences,
    isDarkMode,
    openChartModal,
    closeChartModal,
    toggleSectionCollapsed,
    toggleSubsectionCollapsed,
    expandAll,
    collapseAll,
    hideField,
    showField,
    toggleFieldVisibility,
    showAllFields
  };

  return (
    <VisualizationContext.Provider value={contextValue}>
      <VisualizationPreferencesContext.Provider value={preferences}>
        {children}
        <ChartModal />
      </VisualizationPreferencesContext.Provider>
    </VisualizationContext.Provider>
  );
};

// Hooks
export const useVisualization = (): VisualizationContextType => {
  const context = useContext(VisualizationContext);
  if (!context) {
    throw new Error('useVisualization must be used within a VisualizationProvider');
  }
  return context;
};

export const useVisualizationPreferences = (): VisualizationPreferences => {
  const context = useContext(VisualizationPreferencesContext);
  if (!context) {
    throw new Error('useVisualizationPreferences must be used within a VisualizationPreferencesContext.Provider');
  }
  return context;
};

