import React from 'react';
import { clsx } from 'clsx';
import { OptionSetPreview } from '../../admin/survey-builder/shared';
import { getBadgeLayoutClasses } from '../../../utils/layout.utils';
import { colors, typography, borderRadius, shadows } from '@/styles/design-tokens';
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
    <div key={field.id} className={clsx(
      'bg-white dark:bg-gray-800 p-6',
      `border border-${colors.gray[200]} dark:border-gray-600`,
      borderRadius.lg,
      shadows.sm
    )}>
      <label className={clsx(
        'block mb-3',
        typography.text.sm,
        typography.weight.medium,
        `text-${colors.gray[700]} dark:text-gray-200`
      )}>
        {field.label}
        {field.required && <span className={`text-${colors.error[500]} ml-1`}>*</span>}
      </label>

      {/* Field Type Preview */}
      <div className="mb-2">
        <span className={clsx(
          'inline-block px-2 py-1',
          typography.text.xs,
          `text-${colors.gray[500]} dark:text-gray-400`,
          `bg-${colors.gray[100]} dark:bg-gray-600`,
          borderRadius.sm
        )}>
          {field.type}
        </span>
      </div>

      {/* Render field based on type */}
      {field.type === 'text' && (
        <input
          type="text"
          placeholder={field.placeholder || "Text input"}
          disabled
          className={clsx(
            'w-full px-4 py-3',
            `border border-${colors.gray[300]} dark:border-gray-600`,
            borderRadius.md,
            typography.text.sm,
            `bg-${colors.gray[50]} dark:bg-gray-700`,
            'text-gray-900 dark:text-white',
            'focus:outline-none'
          )}
        />
      )}

      {field.type === 'textarea' && (
        <textarea
          placeholder={field.placeholder || "Text area"}
          disabled
          rows={4}
          className={clsx(
            'w-full px-4 py-3 resize-none',
            `border border-${colors.gray[300]} dark:border-gray-600`,
            borderRadius.md,
            typography.text.sm,
            `bg-${colors.gray[50]} dark:bg-gray-700`,
            'text-gray-900 dark:text-white',
            'focus:outline-none'
          )}
        />
      )}

      {field.type === 'email' && (
        <input
          type="email"
          placeholder={field.placeholder || "Enter your email address"}
          disabled
          className={clsx(
            'w-full px-4 py-3',
            `border border-${colors.gray[300]} dark:border-gray-600`,
            borderRadius.md,
            typography.text.sm,
            `bg-${colors.gray[50]} dark:bg-gray-700`,
            'text-gray-900 dark:text-white',
            'focus:outline-none'
          )}
        />
      )}

      {field.type === 'number' && (
        <input
          type="number"
          placeholder={field.placeholder || "Enter a number"}
          disabled
          className={clsx(
            'w-full px-4 py-3',
            `border border-${colors.gray[300]} dark:border-gray-600`,
            borderRadius.md,
            typography.text.sm,
            `bg-${colors.gray[50]} dark:bg-gray-700`,
            'text-gray-900 dark:text-white',
            'focus:outline-none'
          )}
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
          className={clsx(
            'w-full px-4 py-3',
            `border border-${colors.gray[300]} dark:border-gray-600`,
            borderRadius.md,
            typography.text.sm,
            `bg-${colors.gray[50]} dark:bg-gray-700`,
            'text-gray-900 dark:text-white',
            'focus:outline-none'
          )}
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
                className={clsx(
                  'h-4 w-4',
                  `text-${colors.primary[600]}`,
                  `focus:ring-${colors.primary[500]}`,
                  `border-${colors.gray[300]} dark:border-gray-600`,
                  'dark:bg-gray-700',
                  borderRadius.sm
                )}
              />
              <span className={clsx(
                'ml-3',
                typography.text.sm,
                `text-${colors.gray[700]} dark:text-gray-200`
              )}>{option.label}</span>
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
                className={clsx(
                  'h-4 w-4',
                  `text-${colors.primary[600]}`,
                  `focus:ring-${colors.primary[500]}`,
                  `border-${colors.gray[300]} dark:border-gray-600`,
                  'dark:bg-gray-700'
                )}
              />
              <span className={clsx(
                'ml-3',
                typography.text.sm,
                `text-${colors.gray[700]} dark:text-gray-200`
              )}>{option.label}</span>
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
                className={clsx(
                  'h-4 w-4',
                  `text-${colors.primary[600]}`,
                  `focus:ring-${colors.primary[500]}`,
                  `border-${colors.gray[300]} dark:border-gray-600`,
                  'dark:bg-gray-700',
                  borderRadius.sm
                )}
              />
              <span className={clsx(
                'ml-3',
                typography.text.sm,
                `text-${colors.gray[700]} dark:text-gray-200`
              )}>{option.label}</span>
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
              className={clsx(
                'px-3 py-2 border',
                typography.text.sm,
                borderRadius.md,
                `bg-${colors.gray[100]} dark:bg-gray-600`,
                `text-${colors.gray[700]} dark:text-gray-200`,
                `border-${colors.gray[200]} dark:border-gray-600`
              )}
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
        <div className={clsx(
          'p-3 italic',
          typography.text.sm,
          `text-${colors.gray[500]} dark:text-gray-400`,
          `bg-${colors.gray[50]} dark:bg-gray-600`,
          borderRadius.md
        )}>
          No options configured for this field
        </div>
      )}
    </div>
  );
  return (
    <div className={clsx('max-w-2xl mx-auto', className)}>
      {/* Section Header */}
      <div className="mb-8">
        {showSectionPagination && (
          <div className="flex items-center gap-3 mb-2">
            <span className={clsx(
              'px-2 py-1',
              typography.text.sm,
              typography.weight.medium,
              `text-${colors.primary[600]}`,
              `bg-${colors.primary[50]}`,
              borderRadius.sm
            )}>
              Section {sectionIndex + 1} of {totalSections}
            </span>
          </div>
        )}
        <h2 className={clsx(
          typography.text['2xl'],
          typography.weight.bold,
          `text-${colors.gray[900]} dark:text-white`,
          'mb-2'
        )}>{section.title}</h2>
        {section.description && (
          <p className={clsx(
            typography.text.lg,
            `text-${colors.gray[600]} dark:text-gray-300`
          )}>{section.description}</p>
        )}
      </div>

      {/* Section Content */}
      <div className="space-y-8">
        {/* Render content using unified ordering */}
        {getOrderedSectionContent(section).map((contentItem) => {
          if (contentItem.type === 'subsection') {
            const subsection = contentItem.data as any;
            return (
              <div key={subsection.id} className={clsx(
                'p-6',
                `bg-${colors.gray[50]} dark:bg-gray-700`,
                `border border-${colors.gray[200]} dark:border-gray-600`,
                borderRadius.lg
              )}>
                {/* Subsection Header */}
                <div className="mb-6">
                  <h3 className={clsx(
                    typography.text.xl,
                    typography.weight.semibold,
                    `text-${colors.gray[800]} dark:text-gray-200`,
                    'mb-2'
                  )}>{subsection.title}</h3>
                  {subsection.description && (
                    <p className={clsx(
                      `text-${colors.gray[600]} dark:text-gray-300`
                    )}>{subsection.description}</p>
                  )}
                </div>

                {/* Subsection Fields */}
                <div className="space-y-6">
                  {subsection.fields.map(renderField)}

                  {/* Subsection empty state */}
                  {subsection.fields.length === 0 && (
                    <div className={clsx(
                      'text-center py-8',
                      `text-${colors.gray[500]} dark:text-gray-400`
                    )}>
                      <p className={typography.text.sm}>No fields in this subsection</p>
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
          <div className={clsx(
            'text-center py-12',
            `text-${colors.gray[500]} dark:text-gray-400`
          )}>
            <p className={typography.text.lg}>No content in this section</p>
            <p className={typography.text.sm}>Add fields or subsections to this section in the survey builder</p>
          </div>
        )}
      </div>
    </div>
  );
};