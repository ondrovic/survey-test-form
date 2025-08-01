import { clsx } from 'clsx';
import { CheckboxGroupProps } from './CheckboxGroup.types';

/**
 * CheckboxGroup component for multiple selection with accessibility support
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
export const CheckboxGroup = <T extends string | number = string>({
    name,
    options,
    selectedValues,
    onChange,
    label,
    required = false,
    error,
    layout = 'vertical',
    'data-testid': testId,
    className
}: CheckboxGroupProps<T>) => {
    const groupId = `${name}-group`;
    const errorId = `${name}-error`;

    const handleOptionChange = (optionValue: T, checked: boolean) => {
        if (checked) {
            onChange([...selectedValues, optionValue]);
        } else {
            onChange(selectedValues.filter(value => value !== optionValue));
        }
    };

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

                            return (
                                <div key={option.value} className="flex items-center bg-white border border-gray-200 rounded-md px-3 py-2">
                                    <input
                                        id={optionId}
                                        name={name}
                                        type="checkbox"
                                        value={option.value}
                                        checked={isChecked}
                                        onChange={(e) => handleOptionChange(option.value, e.target.checked)}
                                        disabled={option.disabled}
                                        className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded disabled:opacity-50"
                                    />
                                    <label
                                        htmlFor={optionId}
                                        className={clsx(
                                            'ml-2 text-sm text-gray-800',
                                            option.disabled && 'opacity-50 cursor-not-allowed'
                                        )}
                                    >
                                        {option.label}
                                    </label>
                                </div>
                            );
                        })}
                    </div>
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