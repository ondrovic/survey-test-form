import { clsx } from 'clsx';
import { RadioGroupProps } from './radio-group.types';

/**
 * RadioGroup component for single selection with accessibility support
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
export const RadioGroup = <T extends string | number = string>({
    name,
    options,
    selectedValue,
    onChange,
    label,
    required = false,
    error,
    layout = 'horizontal',
    'data-testid': testId,
    className
}: RadioGroupProps<T>) => {
    const groupId = `${name}-group`;
    const errorId = `${name}-error`;

    const layoutClasses = {
        horizontal: 'flex flex-wrap gap-3',
        vertical: 'space-y-2',
        grid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'
    };

    const classes = clsx('space-y-2', className);

    return (
        <div className={classes}>
            {label && (
                <fieldset>
                    <legend className="text-base font-medium text-gray-700 mb-3">
                        {label}
                        {required && <span className="text-red-500 ml-1">*</span>}
                    </legend>

                    <div
                        className={layoutClasses[layout]}
                        role="radiogroup"
                        aria-labelledby={groupId}
                        aria-describedby={error ? errorId : undefined}
                        data-testid={testId}
                    >
                        {options.map((option) => {
                            const optionId = `${name}-${option.value}`;
                            const isChecked = selectedValue === option.value;

                            return (
                                <div key={option.value} className="flex items-center">
                                    <label
                                        htmlFor={optionId}
                                        className={clsx(
                                            'flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-white cursor-pointer hover:border-gray-400 transition-colors',
                                            isChecked && 'border-gray-400 bg-gray-50',
                                            option.disabled && 'opacity-50 cursor-not-allowed'
                                        )}
                                    >
                                        <input
                                            id={optionId}
                                            name={name}
                                            type="radio"
                                            value={option.value}
                                            checked={isChecked}
                                            onChange={() => onChange(option.value)}
                                            disabled={option.disabled}
                                            className="h-4 w-4 text-gray-700 border-gray-300 mr-2"
                                        />
                                        <span className="text-sm text-gray-700">
                                            {option.label}
                                        </span>
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