import React, { useMemo } from 'react';
import { Button, MultiSelect } from '@/components/common';
import { useVisualization } from '../../context';

interface FieldHideControlsProps {
  availableFields: Array<{ id: string; label: string }>;
}

export const FieldHideControls: React.FC<FieldHideControlsProps> = ({ availableFields }) => {
  const { filters, state, updateState, showAllFields } = useVisualization();

  const filteredHiddenFieldOptions = useMemo(() => {
    let filtered = availableFields;

    // Filter by section first (using existing sectionFilter)
    if (filters.sectionFilter !== 'all') {
      filtered = filtered.filter((f) => f.label.startsWith(`${filters.sectionFilter} •`));

      // If subsection is also selected, filter by subsection
      if (filters.subsectionFilter !== 'all') {
        filtered = filtered.filter((f) => {
          const parts = f.label.split(' • ');
          if (parts.length === 2) {
            // Direct section field: "Section • Field" - exclude if subsection is selected
            return false;
          } else if (parts.length === 3) {
            // Subsection field: "Section • Subsection • Field" - check if subsection matches
            const subsectionName = parts[1];
            const filterSubsectionName = filters.subsectionFilter.split(' • ')[1] || filters.subsectionFilter;
            return subsectionName === filterSubsectionName;
          }
          return false;
        });
      }
    }

    return filtered;
  }, [availableFields, filters.sectionFilter, filters.subsectionFilter]);

  if (!state.showHideFieldsUI) {
    return null;
  }

  return (
    <div className="mb-6">
      <div className="p-4 border rounded-lg bg-white">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Button size="form" variant="outline" onClick={showAllFields}>
                  Reset hidden
                </Button>
                <Button 
                  size="form" 
                  variant="primary" 
                  onClick={() => updateState({ showHideFieldsUI: false })}
                >
                  Done
                </Button>
              </div>
            </div>
            
            <MultiSelect
              value={Array.from(state.hiddenFields)}
              onChange={(selectedValues) => updateState({ hiddenFields: new Set(selectedValues) })}
              options={filteredHiddenFieldOptions.map((f) => {
                // Show cleaner labels based on current filters
                let displayLabel = f.label;
                if (filters.sectionFilter !== 'all') {
                  // Remove section prefix if section is filtered
                  displayLabel = f.label.replace(`${filters.sectionFilter} • `, '');
                  if (filters.subsectionFilter !== 'all') {
                    // Remove subsection prefix if subsection is filtered
                    displayLabel = displayLabel.replace(`${filters.subsectionFilter} • `, '');
                  }
                }
                return {
                  value: f.id,
                  label: displayLabel
                };
              })}
              placeholder="Select fields to hide..."
              display="chip"
              maxSelectedLabels={5}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
};