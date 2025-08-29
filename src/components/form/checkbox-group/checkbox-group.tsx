import React from 'react';
import { clsx } from 'clsx';
import { colors, transitions, typography } from '@/styles/design-tokens';
import { getSmartLayoutClasses } from '@/utils/layout.utils';
import { FormField } from '@/components/common/ui';
import { CheckboxGroupProps as BaseCheckboxGroupProps } from './checkbox-group.types';

// Re-export types for external use
export type CheckboxGroupProps<T extends string | number = string> = BaseCheckboxGroupProps<T>;

/**
 * Individual checkbox option component for better composition
 */
interface CheckboxOptionProps<T extends string | number = string> {
  option: {
    value: T;
    label: string;
    disabled?: boolean;
  };
  isChecked: boolean;
  isDisabled: boolean;
  onChange: (value: T, checked: boolean) => void;
  name: string;
}

const CheckboxOption = <T extends string | number = string>({
  option,
  isChecked,
  isDisabled,
  onChange,
  name,
}: CheckboxOptionProps<T>) => {
  const optionId = `${name}-${option.value}`;

  return (
    <div className="w-full">
      <label
        htmlFor={optionId}
        className={clsx(
          // Base styles with design tokens
          'flex items-center px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 w-full min-h-[44px]',
          `border-${colors.gray[300]} dark:border-gray-600`,
          transitions.default,
          // States
          {
            [`border-${colors.info[400]} dark:border-blue-400 bg-${colors.info[50]} dark:bg-blue-900/20`]: isChecked,
            'opacity-50 cursor-not-allowed': isDisabled,
            [`cursor-pointer hover:border-${colors.gray[400]} dark:hover:border-gray-500 hover:bg-${colors.gray[50]} dark:hover:bg-gray-600`]: !isDisabled,
          }
        )}
      >
        <input
          id={optionId}
          name={name}
          type="checkbox"
          value={option.value}
          checked={isChecked}
          onChange={(e) => onChange(option.value, e.target.checked)}
          disabled={isDisabled}
          className={clsx(
            'h-4 w-4 rounded mr-3 flex-shrink-0',
            `text-${colors.info[600]} dark:text-blue-400 border-${colors.gray[300]} dark:border-gray-600`,
            'focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800'
          )}
        />
        <span
          className={clsx(
            typography.text.sm,
            'leading-tight break-words',
            {
              [`text-${colors.gray[400]} dark:text-gray-500`]: isDisabled,
              [`text-${colors.gray[700]} dark:text-gray-200`]: !isDisabled,
            }
          )}
          style={{ wordBreak: 'break-word' }}
        >
          {option.label}
        </span>
      </label>
    </div>
  );
};

/**
 * CheckboxGroup component for multiple selection with accessibility support
 * Now uses FormField compound component and design tokens
 * 
 * @example
 * ```tsx
 * <CheckboxGroup
 *   name="regions"
 *   options={regionOptions}
 *   selectedValues={selectedRegions}
 *   onChange={setSelectedRegions}
 *   label="Select Regions"
 *   required
 *   error={errors.regions}
 * />
 * ```
 */
/**
 * Internal CheckboxGroup component that works within FormField context
 */
const CheckboxGroupInternal = <T extends string | number = string>({
  name,
  options,
  selectedValues,
  onChange,
  layout = 'balanced',
  maxSelections,
  minSelections: _minSelections,
  'data-testid': testId,
  className,
}: Omit<BaseCheckboxGroupProps<T>, 'label' | 'required' | 'error'>) => {
  const currentSelectionCount = (selectedValues || []).length;
  const hasReachedMaxSelections = Boolean(maxSelections && currentSelectionCount >= maxSelections);
  const layoutClasses = getSmartLayoutClasses(options.length, layout);

  const handleOptionChange = (optionValue: T, checked: boolean) => {
    const currentValues = selectedValues || [];
    if (checked) {
      // Only allow checking if we haven't reached max selections
      if (!maxSelections || currentValues.length < maxSelections) {
        onChange([...currentValues, optionValue]);
      }
    } else {
      onChange(currentValues.filter(value => value !== optionValue));
    }
  };

  return (
    <div
      className={clsx(layoutClasses, className)}
      role="group"
      data-testid={testId}
    >
      {options.map((option) => {
        const isChecked = Boolean(selectedValues?.includes(option.value));
        const isDisabled = option.disabled || (hasReachedMaxSelections && !isChecked);

        return (
          <CheckboxOption
            key={option.value}
            option={option}
            isChecked={isChecked}
            isDisabled={isDisabled}
            onChange={handleOptionChange}
            name={name}
          />
        );
      })}
    </div>
  );
};

/**
 * Standalone CheckboxGroup component that includes its own FormField wrapper
 */
const CheckboxGroupComponent = <T extends string | number = string>({
  name,
  options,
  selectedValues,
  onChange,
  label,
  required = false,
  error,
  layout = 'balanced',
  maxSelections,
  minSelections,
  'data-testid': testId,
  className,
}: BaseCheckboxGroupProps<T>) => {
  const currentSelectionCount = (selectedValues || []).length;
  
  // Create selection count info for the label
  const selectionInfo = (maxSelections || minSelections) ? (
    <span className={clsx('ml-2', typography.text.sm, `text-${colors.gray[500]} dark:text-gray-400`)}>
      ({currentSelectionCount}
      {maxSelections && `/${maxSelections}`} selected
      {minSelections && maxSelections && `, min ${minSelections}`}
      {minSelections && !maxSelections && `, min ${minSelections} required`}
      )
    </span>
  ) : null;

  return (
    <FormField
      name={name}
      required={required}
      error={error}
      className={className}
    >
      {label && (
        <FormField.Label>
          <span>{label}{selectionInfo}</span>
        </FormField.Label>
      )}
      
      <CheckboxGroupInternal
        name={name}
        options={options}
        selectedValues={selectedValues}
        onChange={onChange}
        layout={layout}
        maxSelections={maxSelections}
        minSelections={minSelections}
        data-testid={testId}
      />
      
      <FormField.Error />
    </FormField>
  );
};

/**
 * CheckboxGroup that can be used within existing FormField context
 */
const CheckboxGroupWithContext = <T extends string | number = string>(props: Omit<BaseCheckboxGroupProps<T>, 'label' | 'required' | 'error'>) => {
  return <CheckboxGroupInternal {...props} />;
};

CheckboxGroupComponent.displayName = 'CheckboxGroup';
CheckboxGroupWithContext.displayName = 'CheckboxGroup.WithContext';

// Export the main component with memo and attach the context version
export const CheckboxGroup = React.memo(CheckboxGroupComponent);

// Attach the context version as a static property
(CheckboxGroup as any).WithContext = CheckboxGroupWithContext;

// Export the individual option component for advanced use cases
export { CheckboxOption };
export type { CheckboxOptionProps };