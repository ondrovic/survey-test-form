import React from 'react';
import { SurveyField } from '../../../types/framework.types';
import { FieldRenderer } from '../../form/field-renderer';
import { PaginatedSectionRendererProps } from './survey-section-paginator.types';

interface InteractiveSectionRendererProps extends PaginatedSectionRendererProps {
  fieldValues: Record<string, any>;
  fieldErrors: Record<string, string>;
  onFieldChange: (fieldId: string, value: any) => void;
  ratingScales: Record<string, any>;
  radioOptionSets: Record<string, any>;
  multiSelectOptionSets: Record<string, any>;
  selectOptionSets: Record<string, any>;
  loadingOptionSets: boolean;
}

export const InteractiveSectionRenderer: React.FC<InteractiveSectionRendererProps> = ({
  section,
  sectionIndex,
  totalSections,
  fieldValues,
  fieldErrors,
  onFieldChange,
  ratingScales,
  radioOptionSets,
  multiSelectOptionSets,
  selectOptionSets,
  loadingOptionSets,
  className = ''
}) => {
  const renderField = (field: SurveyField) => {
    return (
      <FieldRenderer
        key={field.id}
        field={field}
        value={fieldValues[field.id]}
        onChange={onFieldChange}
        error={fieldErrors[field.id]}
        ratingScales={ratingScales}
        loadingScales={loadingOptionSets}
        radioOptionSets={radioOptionSets}
        multiSelectOptionSets={multiSelectOptionSets}
        selectOptionSets={selectOptionSets}
        loadingOptionSets={loadingOptionSets}
      />
    );
  };

  return (
    <div className={`max-w-2xl mx-auto ${className}`}>
      {/* Section Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
            Section {sectionIndex + 1} of {totalSections}
          </span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{section.title}</h2>
        {section.description && (
          <p className="text-gray-600 text-lg">{section.description}</p>
        )}
      </div>

      {/* Section Fields */}
      <div className="space-y-6">
        {section.fields.map(renderField)}

        {/* Empty state */}
        {section.fields.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">No fields in this section</p>
            <p className="text-sm">Add fields to this section in the survey builder</p>
          </div>
        )}
      </div>
    </div>
  );
};