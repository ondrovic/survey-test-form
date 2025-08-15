import React from 'react';
import { Button } from '@/components/common';
import { useVisualization } from '../../context';

interface AdvancedFiltersProps {
  sectionNames: string[];
  subsectionsBySection: Record<string, Array<{ id: string; title: string }>>;
  orderedSections: any[];
}

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  sectionNames,
  subsectionsBySection,
  orderedSections
}) => {
  const { filters, updateFilters, state, updateState, expandAll, collapseAll } = useVisualization();

  const handleCollapseAll = () => {
    const allSectionIds = orderedSections.map((s) => s.id);
    const allSubsectionIds = orderedSections.flatMap((s) => (s.subsections || []).map((ss) => ss.id));
    collapseAll(allSectionIds, allSubsectionIds);
  };

  if (!state.showAdvanced) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
      <div>
        <label htmlFor="section-filter" className="block text-sm text-gray-700 mb-1">
          Section
        </label>
        <select 
          id="section-filter" 
          className="w-full px-3 py-2 border border-gray-300 rounded-md" 
          value={filters.sectionFilter} 
          onChange={(e) => {
            updateFilters({ 
              sectionFilter: e.target.value,
              subsectionFilter: 'all'
            });
          }}
        >
          <option value="all">All sections</option>
          {sectionNames.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      
      <div className="md:col-span-2">
        <label htmlFor="subsection-filter" className="block text-sm text-gray-700 mb-1">
          Subsection
        </label>
        <select 
          id="subsection-filter" 
          className="w-full px-3 py-2 border border-gray-300 rounded-md" 
          value={filters.subsectionFilter} 
          onChange={(e) => updateFilters({ subsectionFilter: e.target.value })}
        >
          <option value="all">All subsections</option>
          {(filters.sectionFilter !== 'all' 
            ? (subsectionsBySection[filters.sectionFilter] || []) 
            : orderedSections.flatMap(sec => 
                (sec.subsections || []).map(ss => ({ 
                  id: ss.id, 
                  title: `${sec.title} • ${ss.title}` 
                }))
              )
          ).map((ss) => (
            <option key={ss.id} value={ss.title}>{ss.title}</option>
          ))}
        </select>
      </div>
      
      <div>
        <label htmlFor="search-input" className="block text-sm text-gray-700 mb-1">
          Search
        </label>
        <input 
          id="search-input" 
          className="w-full px-3 py-2 border border-gray-300 rounded-md" 
          placeholder="Search" 
          value={filters.search} 
          onChange={(e) => updateFilters({ search: e.target.value })} 
        />
      </div>
      
      <div className="md:col-span-2">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="form" 
            onClick={() => updateState({ showHideFieldsUI: true })}
          >
            Choose fields to hide
          </Button>
          <Button variant="outline" size="form" onClick={expandAll}>
            Expand all
          </Button>
          <Button variant="outline" size="form" onClick={handleCollapseAll}>
            Collapse all
          </Button>
        </div>
      </div>
    </div>
  );
};