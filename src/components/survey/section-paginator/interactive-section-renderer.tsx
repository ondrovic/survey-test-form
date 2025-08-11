import React from 'react';
import { SurveyField } from '../../../types/framework.types';
import { FieldRenderer } from '../../form/field-renderer';
import { PaginatedSectionRendererProps } from './survey-section-paginator.types';
import { getOrderedSectionContent } from '../../../utils/section-content.utils';

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
  showSectionPagination = true,
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
        {showSectionPagination && (
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
              Section {sectionIndex + 1} of {totalSections}
            </span>
          </div>
        )}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{section.title}</h2>
        {section.description && (
          <p className="text-gray-600 text-lg">{section.description}</p>
        )}
      </div>

      {/* Section Content */}
      <div className="space-y-8">
        {/* Render content using unified ordering */}
        {getOrderedSectionContent(section).map((contentItem) => {
          if (contentItem.type === 'subsection') {
            const subsection = contentItem.data as any;
            return (
              <div key={subsection.id} className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                {/* Subsection Header */}
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">{subsection.title}</h3>
                  {subsection.description && (
                    <p className="text-gray-600">{subsection.description}</p>
                  )}
                </div>

                {/* Subsection Fields */}
                <div className="space-y-6">
                  {subsection.fields.map(renderField)}

                  {/* Subsection empty state */}
                  {subsection.fields.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm">No fields in this subsection</p>
                    </div>
                  )}
                </div>
              </div>
            );
          } else if (contentItem.type === 'field') {
            const field = contentItem.data as any;
            return <div key={field.id} className="space-y-6">{renderField(field)}</div>;
          }
          return null;
        })}

        {/* Empty state */}
        {getOrderedSectionContent(section).length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">No content in this section</p>
            <p className="text-sm">Add fields or subsections to this section in the survey builder</p>
          </div>
        )}
      </div>
    </div>
  );
};