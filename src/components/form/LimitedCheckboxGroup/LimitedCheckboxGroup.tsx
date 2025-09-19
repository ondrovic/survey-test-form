import { clsx } from 'clsx';
import { LimitedCheckboxGroupProps } from './LimitedCheckboxGroup.types';

/**
 * LimitedCheckboxGroup component for multiple selection with a maximum limit
 * 
 * @example
 * ```tsx
 * <LimitedCheckboxGroup
 *   name="subNavOptions"
 *   options={subNavOptions}
 *   selectedValues={selectedOptions}
 *   onChange={setSelectedOptions}
 *   label="Select Sub Navigation Options"
 *   maxSelections={3}
 *   required
 *   error={errors.subNavOptions}
 * />
 * ```
 */
export const LimitedCheckboxGroup = <T extends string | number = string>({
    name,
    options,
    selectedValues,
    onChange,
    label,
    maxSelections,
    required = false,
    error,
    layout = 'vertical',
    'data-testid': testId,
    className
}: LimitedCheckboxGroupProps<T>) => {
    const groupId = `${name}-group`;
    const errorId = `${name}-error`;

    const handleOptionChange = (optionValue: T, checked: boolean) => {
        if (checked) {
            if (selectedValues.length < maxSelections) {
                onChange([...selectedValues, optionValue]);
            }
        } else {
            onChange(selectedValues.filter(value => value !== optionValue));
        }
    };

    const isAtLimit = selectedValues.length >= maxSelections;
    const remainingSelections = maxSelections - selectedValues.length;

    const layoutClasses = {
        horizontal: 'flex flex-wrap gap-4',
        vertical: 'space-y-2',
        grid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'
    };

    const classes = clsx('space-y-2', className);

    return (
        <div className={classes}>
            {label && (
                <fieldset>
                    <legend className="text-sm font-semibold text-gray-800 mb-3">
                        {label}
                        {required && <span className="text-red-500 ml-1">*</span>}
                        <span className="text-xs text-gray-500 ml-2">
                            ({selectedValues.length}/{maxSelections} selected)
                        </span>
                    </legend>

                    <div
                        className={layoutClasses[layout]}
                        role="group"
                        aria-labelledby={groupId}
                        aria-describedby={error ? errorId : undefined}
                        data-testid={testId}
                    >
                        {options.map((option) => {
                            const optionId = `${name}-${option.value}`;
                            const isChecked = selectedValues.includes(option.value);
                            const isDisabled = option.disabled || (!isChecked && isAtLimit);

                            return (
                                <div key={option.value} className="flex items-center bg-white border border-gray-200 rounded-md px-3 py-2">
                                    <input
                                        id={optionId}
                                        name={name}
                                        type="checkbox"
                                        value={option.value}
                                        checked={isChecked}
                                        onChange={(e) => handleOptionChange(option.value, e.target.checked)}
                                        disabled={isDisabled}
                                        className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded disabled:opacity-50"
                                    />
                                    <label
                                        htmlFor={optionId}
                                        className={clsx(
                                            'ml-2 text-sm text-gray-800',
                                            isDisabled && 'opacity-50 cursor-not-allowed'
                                        )}
                                    >
                                        {option.label}
                                    </label>
                                </div>
                            );
                        })}
                    </div>

                    {isAtLimit && (
                        <p className="text-xs text-amber-600 mt-2">
                            Maximum of {maxSelections} selections allowed
                        </p>
                    )}

                    {remainingSelections > 0 && remainingSelections < maxSelections && (
                        <p className="text-xs text-gray-500 mt-2">
                            {remainingSelections} more selection{remainingSelections !== 1 ? 's' : ''} remaining
                        </p>
                    )}
                </fieldset>
            )}

            {error && (
                <p
                    id={errorId}
                    className="text-sm text-red-600"
                    role="alert"
                >
                    {error}
                </p>
            )}
        </div>
    );
};
