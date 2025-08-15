import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ChartType, VisualizationPreferences, FilterState, VisualizationState, ChartModalData } from '../types';

// Context for chart preferences (already existed in original)
const VisualizationPreferencesContext = createContext<VisualizationPreferences | null>(null);

// Context for visualization state management
interface VisualizationContextType {
  // Filter state
  filters: FilterState;
  updateFilters: (updates: Partial<FilterState>) => void;
  
  // UI state
  state: VisualizationState;
  updateState: (updates: Partial<VisualizationState>) => void;
  
  // Chart preferences
  preferences: VisualizationPreferences;
  
  // Modal actions
  openChartModal: (chartData: ChartModalData) => void;
  closeChartModal: () => void;
  
  // Section management
  toggleSectionCollapsed: (sectionId: string) => void;
  toggleSubsectionCollapsed: (subsectionId: string) => void;
  expandAll: () => void;
  collapseAll: (sectionIds: string[], subsectionIds: string[]) => void;
  
  // Field management
  showAllFields: () => void;
}

const VisualizationContext = createContext<VisualizationContextType | null>(null);

interface VisualizationProviderProps {
  children: ReactNode;
}

export const VisualizationProvider: React.FC<VisualizationProviderProps> = ({ children }) => {
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

  // UI state
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
  const updateFilters = (updates: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  };

  const updateState = (updates: Partial<VisualizationState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const openChartModal = (chartData: ChartModalData) => {
    setState(prev => ({
      ...prev,
      selectedChart: chartData,
      isChartModalOpen: true
    }));
  };

  const closeChartModal = () => {
    setState(prev => ({
      ...prev,
      selectedChart: null,
      isChartModalOpen: false
    }));
  };

  const toggleSectionCollapsed = (sectionId: string) => {
    setState(prev => {
      const next = new Set(prev.collapsedSections);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return { ...prev, collapsedSections: next };
    });
  };

  const toggleSubsectionCollapsed = (subsectionId: string) => {
    setState(prev => {
      const next = new Set(prev.collapsedSubsections);
      if (next.has(subsectionId)) {
        next.delete(subsectionId);
      } else {
        next.add(subsectionId);
      }
      return { ...prev, collapsedSubsections: next };
    });
  };

  const expandAll = () => {
    setState(prev => ({
      ...prev,
      collapsedSections: new Set(),
      collapsedSubsections: new Set()
    }));
  };

  const collapseAll = (sectionIds: string[], subsectionIds: string[]) => {
    setState(prev => ({
      ...prev,
      collapsedSections: new Set(sectionIds),
      collapsedSubsections: new Set(subsectionIds)
    }));
  };

  const showAllFields = () => {
    setState(prev => ({ ...prev, hiddenFields: new Set() }));
  };

  const contextValue: VisualizationContextType = {
    filters,
    updateFilters,
    state,
    updateState,
    preferences,
    openChartModal,
    closeChartModal,
    toggleSectionCollapsed,
    toggleSubsectionCollapsed,
    expandAll,
    collapseAll,
    showAllFields
  };

  return (
    <VisualizationContext.Provider value={contextValue}>
      <VisualizationPreferencesContext.Provider value={preferences}>
        {children}
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
    throw new Error('useVisualizationPreferences must be used within a VisualizationProvider');
  }
  return context;
};