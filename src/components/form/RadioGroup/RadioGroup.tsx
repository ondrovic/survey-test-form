import { clsx } from 'clsx';
import { RadioGroupProps } from './RadioGroup.types';

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
    layout = 'vertical',
    'data-testid': testId,
    className
}: RadioGroupProps<T>) => {
    const groupId = `${name}-group`;
    const errorId = `${name}-error`;

    const layoutClasses = {
        horizontal: 'flex flex-wrap gap-4',
        vertical: 'space-y-2'
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
                        role="radiogroup"
                        aria-labelledby={groupId}
                        aria-describedby={error ? errorId : undefined}
                        data-testid={testId}
                    >
                        {options.map((option) => {
                            const optionId = `${name}-${option.value}`;
                            const isChecked = selectedValue === option.value;

                            return (
                                <div key={option.value} className="flex items-center bg-white border border-gray-200 rounded-md px-3 py-2">
                                    <input
                                        id={optionId}
                                        name={name}
                                        type="radio"
                                        value={option.value}
                                        checked={isChecked}
                                        onChange={() => onChange(option.value)}
                                        disabled={option.disabled}
                                        className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 disabled:opacity-50"
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