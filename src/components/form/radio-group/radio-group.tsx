import React from 'react';
import { clsx } from 'clsx';
import { colors, focusRing, transitions, typography } from '@/styles/design-tokens';
import { getSmartLayoutClasses } from '@/utils/layout.utils';
import { FormField } from '@/components/common/ui';
import { RadioGroupProps as BaseRadioGroupProps } from './radio-group.types';

// Re-export types for external use
export type RadioGroupProps<T extends string | number = string> = BaseRadioGroupProps<T>;

/**
 * Individual radio option component for better composition
 */
interface RadioOptionProps<T extends string | number = string> {
  option: {
    value: T;
    label: string;
    disabled?: boolean;
  };
  isChecked: boolean;
  isDisabled: boolean;
  onChange: (value: T) => void;
  name: string;
}

const RadioOption = <T extends string | number = string>({
  option,
  isChecked,
  isDisabled,
  onChange,
  name,
}: RadioOptionProps<T>) => {
  const optionId = `${name}-${option.value}`;

  return (
    <div className="w-full">
      <label
        htmlFor={optionId}
        className={clsx(
          // Base styles with design tokens
          'flex items-center px-3 py-2 border rounded-lg bg-white w-full min-h-[44px]',
          `border-${colors.gray[300]}`,
          transitions.default,
          // States
          {
            [`border-${colors.info[400]} bg-${colors.info[50]}`]: isChecked,
            'opacity-50 cursor-not-allowed': isDisabled,
            [`cursor-pointer hover:border-${colors.gray[400]} hover:bg-${colors.gray[50]}`]: !isDisabled,
          }
        )}
      >
        <input
          id={optionId}
          name={name}
          type="radio"
          value={option.value}
          checked={isChecked}
          onChange={() => onChange(option.value)}
          disabled={isDisabled}
          className={clsx(
            'h-4 w-4 mr-3 flex-shrink-0',
            `text-${colors.info[600]} border-${colors.gray[300]}`,
            focusRing.info
          )}
        />
        <span
          className={clsx(
            typography.text.sm,
            'leading-tight break-words',
            {
              [`text-${colors.gray[400]}`]: isDisabled,
              [`text-${colors.gray[700]}`]: !isDisabled,
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
 * RadioGroup component for single selection with accessibility support
 * Now uses FormField compound component and design tokens
 * 
 * @example
 * ```tsx
 * <RadioGroup
 *   name="licenseRange"
 *   options={licenseOptions}
 *   selectedValue={selectedLicense}
 *   onChange={setSelectedLicense}
 *   label="Number of Licenses"
 *   required
 *   error={errors.licenseRange}
 * />
 * ```
 */
/**
 * Internal RadioGroup component that works within FormField context
 */
const RadioGroupInternal = <T extends string | number = string>({
  name,
  options,
  selectedValue,
  onChange,
  layout = 'balanced',
  'data-testid': testId,
  className,
}: Omit<BaseRadioGroupProps<T>, 'label' | 'required' | 'error'>) => {
  const layoutClasses = getSmartLayoutClasses(options.length, layout);

  return (
    <div
      className={clsx(layoutClasses, className)}
      role="radiogroup"
      data-testid={testId}
    >
      {options.map((option) => {
        const isChecked = selectedValue === option.value;
        const isDisabled = Boolean(option.disabled);

        return (
          <RadioOption
            key={option.value}
            option={option}
            isChecked={isChecked}
            isDisabled={isDisabled}
            onChange={onChange}
            name={name}
          />
        );
      })}
    </div>
  );
};

/**
 * Standalone RadioGroup component that includes its own FormField wrapper
 */
const RadioGroupComponent = <T extends string | number = string>({
  name,
  options,
  selectedValue,
  onChange,
  label,
  required = false,
  error,
  layout = 'balanced',
  'data-testid': testId,
  className,
}: BaseRadioGroupProps<T>) => {
  // No additional processing needed for radio groups

  return (
    <FormField
      name={name}
      required={required}
      error={error}
      className={className}
    >
      {label && (
        <FormField.Label>
          {label}
        </FormField.Label>
      )}
      
      <RadioGroupInternal
        name={name}
        options={options}
        selectedValue={selectedValue}
        onChange={onChange}
        layout={layout}
        data-testid={testId}
      />
      
      <FormField.Error />
    </FormField>
  );
};

/**
 * RadioGroup that can be used within existing FormField context
 */
const RadioGroupWithContext = <T extends string | number = string>(props: Omit<BaseRadioGroupProps<T>, 'label' | 'required' | 'error'>) => {
  return <RadioGroupInternal {...props} />;
};

RadioGroupComponent.displayName = 'RadioGroup';
RadioGroupWithContext.displayName = 'RadioGroup.WithContext';

// Export the main component with memo
export const RadioGroup = React.memo(RadioGroupComponent);

// Attach the context version as a static property
(RadioGroup as any).WithContext = RadioGroupWithContext;

// Export the individual option component for advanced use cases
export { RadioOption };
export type { RadioOptionProps };