import { Button } from '@/components/common';
import React, { useState, useRef, useEffect } from 'react';
import { useVisualization } from '../../context';
import { ChartType } from '../../types';

interface AvailableField {
  fieldId: string;
  label: string;
  sectionTitle: string;
  subsectionTitle?: string;
}

interface ChartControlsProps {
  availableFields: AvailableField[];
}

export const ChartControls: React.FC<ChartControlsProps> = ({ availableFields }) => {
  const { preferences, state, showAllFields, toggleFieldVisibility } = useVisualization();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
    
    return undefined;
  }, [isDropdownOpen]);

  const visibleCount = availableFields.length - state.hiddenFields.size;

  return (
    <div className="ml-auto flex items-end gap-2">
      <div>
        <label htmlFor="default-chart" className="block text-sm text-gray-700 mb-1">
          Default chart
        </label>
        <select
          id="default-chart"
          className="px-3 py-2 border border-gray-300 rounded-md"
          value={preferences.defaultChartType}
          onChange={(e) => preferences.setDefaultChartType(e.target.value as ChartType)}
        >
          <option value="horizontal">Horizontal</option>
          <option value="vertical">Vertical</option>
          <option value="donut">Donut</option>
        </select>
      </div>
      
      {availableFields.length > 0 && (
        <div className="relative" ref={dropdownRef}>
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Fields ({visibleCount}/{availableFields.length})
            </label>
            <Button
              variant="outline"
              size="form"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Show/Hide
              <svg className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </Button>
          </div>

          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-80 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
              <div className="p-3 border-b border-gray-100">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-gray-700">Field Visibility</span>
                  <div className="flex gap-2">
                    <button
                      onClick={showAllFields}
                      className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 rounded border border-blue-200 hover:bg-blue-50"
                    >
                      Show All
                    </button>
                    <button
                      onClick={() => {
                        if (state.hiddenFields.size === 0) {
                          // If none are hidden, hide all
                          availableFields.forEach(field => {
                            const fieldId = field.fieldId;
                            toggleFieldVisibility(fieldId);
                          });
                        } else if (state.hiddenFields.size === availableFields.length) {
                          // If all are hidden, show all
                          showAllFields();
                        } else {
                          // Mixed state - hide all
                          availableFields.forEach(field => {
                            const fieldId = field.fieldId;
                            if (!state.hiddenFields.has(fieldId)) {
                              toggleFieldVisibility(fieldId);
                            }
                          });
                        }
                      }}
                      className="text-xs text-gray-600 hover:text-gray-700 px-2 py-1 rounded border border-gray-200 hover:bg-gray-50"
                    >
                      {state.hiddenFields.size === 0 ? 'Hide All' : state.hiddenFields.size === availableFields.length ? 'Show All' : 'Hide All'}
                    </button>
                  </div>
                </div>
              </div>
              <div className="py-2">
                {availableFields.map((field) => {
                  const fieldId = field.fieldId;
                  const isVisible = !state.hiddenFields.has(fieldId);
                  const fullTitle = field.subsectionTitle 
                    ? `${field.subsectionTitle} • ${field.label}`
                    : field.label;
                  
                  return (
                    <div
                      key={field.fieldId}
                      className="flex items-start gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer group"
                    >
                      <label className="flex items-start gap-3 cursor-pointer flex-1">
                        <input
                          type="checkbox"
                          checked={isVisible}
                          onChange={() => {
                            const fieldId = field.fieldId;
                            toggleFieldVisibility(fieldId);
                          }}
                          aria-label={`Toggle visibility for ${fullTitle}`}
                          className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm ${isVisible ? 'text-gray-900' : 'text-gray-400'}`}>
                            {fullTitle}
                          </div>
                          <div className="text-xs text-gray-500">
                            {field.sectionTitle}
                          </div>
                        </div>
                      </label>
                      <div className={`text-xs px-2 py-0.5 rounded-full ${
                        isVisible 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {isVisible ? 'Visible' : 'Hidden'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};