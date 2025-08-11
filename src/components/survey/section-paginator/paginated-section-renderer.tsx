import React from 'react';
import { OptionSetPreview } from '../../admin/survey-builder/option-set-preview';
import { getBadgeLayoutClasses } from '../../../utils/layout.utils';
import { PaginatedSectionRendererProps } from './survey-section-paginator.types';
import { getOrderedSectionContent } from '../../../utils/section-content.utils';

export const PaginatedSectionRenderer: React.FC<PaginatedSectionRendererProps> = ({
  section,
  sectionIndex,
  totalSections,
  showSectionPagination = true,
  className = ''
}) => {
  const renderField = (field: any) => (
    <div key={field.id} className="bg-white p-6 border border-gray-200 rounded-lg shadow-sm">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Field Type Preview */}
      <div className="mb-2">
        <span className="inline-block text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
          {field.type}
        </span>
      </div>

      {/* Render field based on type */}
      {field.type === 'text' && (
        <input
          type="text"
          placeholder={field.placeholder || "Text input"}
          disabled
          className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm bg-gray-50 focus:outline-none"
        />
      )}

      {field.type === 'textarea' && (
        <textarea
          placeholder={field.placeholder || "Text area"}
          disabled
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm bg-gray-50 focus:outline-none resize-none"
        />
      )}

      {field.type === 'email' && (
        <input
          type="email"
          placeholder={field.placeholder || "Enter your email address"}
          disabled
          className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm bg-gray-50 focus:outline-none"
        />
      )}

      {field.type === 'number' && (
        <input
          type="number"
          placeholder={field.placeholder || "Enter a number"}
          disabled
          className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm bg-gray-50 focus:outline-none"
        />
      )}

      {field.type === 'select' && field.selectOptionSetId && (
        <OptionSetPreview
          type="select"
          optionSetId={field.selectOptionSetId}
          optionSetName={field.selectOptionSetName || ''}
          hideLabel={true}
        />
      )}
      {field.type === 'select' && !field.selectOptionSetId && field.options && field.options.length > 0 && (
        <select
          disabled
          className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm bg-gray-50 focus:outline-none"
        >
          <option value="">{field.placeholder || 'Select an option...'}</option>
          {field.options.map((option: any, index: number) => (
            <option key={index} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}

      {field.type === 'multiselect' && field.multiSelectOptionSetId && (
        <OptionSetPreview
          type="multiselect"
          optionSetId={field.multiSelectOptionSetId}
          optionSetName={field.multiSelectOptionSetName || ''}
          hideLabel={true}
        />
      )}
      {field.type === 'multiselectdropdown' && field.selectOptionSetId && (
        <OptionSetPreview
          type="select"
          optionSetId={field.selectOptionSetId}
          optionSetName={field.selectOptionSetName || ''}
          hideLabel={true}
        />
      )}
      {(field.type === 'multiselect' || field.type === 'multiselectdropdown') && !field.multiSelectOptionSetId && !field.selectOptionSetId && field.options && field.options.length > 0 && (
        <div className="space-y-3">
          {field.options.map((option: any, index: number) => (
            <div key={index} className="flex items-center">
              <input
                type="checkbox"
                disabled
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-3 text-sm text-gray-700">{option.label}</span>
            </div>
          ))}
        </div>
      )}

      {field.type === 'radio' && field.radioOptionSetId && (
        <OptionSetPreview
          type="radio"
          optionSetId={field.radioOptionSetId}
          optionSetName={field.radioOptionSetName || ''}
          hideLabel={true}
        />
      )}
      {field.type === 'radio' && !field.radioOptionSetId && field.options && field.options.length > 0 && (
        <div className="space-y-3">
          {field.options.map((option: any, index: number) => (
            <div key={index} className="flex items-center">
              <input
                type="radio"
                name={`preview-${field.id}`}
                disabled
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-3 text-sm text-gray-700">{option.label}</span>
            </div>
          ))}
        </div>
      )}

      {field.type === 'checkbox' && field.options && field.options.length > 0 && (
        <div className="space-y-3">
          {field.options.map((option: any, index: number) => (
            <div key={index} className="flex items-center">
              <input
                type="checkbox"
                disabled
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-3 text-sm text-gray-700">{option.label}</span>
            </div>
          ))}
        </div>
      )}

      {field.type === 'rating' && field.ratingScaleId && (
        <OptionSetPreview
          type="rating"
          optionSetId={field.ratingScaleId}
          optionSetName={field.ratingScaleName || ''}
          hideLabel={true}
        />
      )}
      {field.type === 'rating' && !field.ratingScaleId && field.options && field.options.length > 0 && (
        <div className={getBadgeLayoutClasses(field.options.length)}>
          {field.options.map((option: any, index: number) => (
            <span
              key={index}
              className="px-3 py-2 text-sm rounded-md border bg-gray-100 text-gray-700 border-gray-200"
            >
              {option.label}
            </span>
          ))}
        </div>
      )}

      {/* Show placeholder message if no options configured */}
      {((field.type === 'select' || field.type === 'multiselect' || field.type === 'multiselectdropdown' || field.type === 'radio' || field.type === 'checkbox' || field.type === 'rating') && 
        !field.options?.length && 
        !field.selectOptionSetId && 
        !field.multiSelectOptionSetId && 
        !field.radioOptionSetId && 
        !field.ratingScaleId) && (
        <div className="text-sm text-gray-500 italic bg-gray-50 p-3 rounded">
          No options configured for this field
        </div>
      )}
    </div>
  );
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
            return renderField(field);
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