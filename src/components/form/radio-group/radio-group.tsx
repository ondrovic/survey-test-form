import { clsx } from 'clsx';
import { getSmartLayoutClasses } from '../../../utils/layout.utils';
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
    layout = 'balanced',
    'data-testid': testId,
    className
}: RadioGroupProps<T>) => {
    const groupId = `${name}-group`;
    const errorId = `${name}-error`;

    const layoutClasses = getSmartLayoutClasses(options.length, layout);

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
                        className={layoutClasses}
                        role="radiogroup"
                        aria-labelledby={groupId}
                        aria-describedby={error ? errorId : undefined}
                        data-testid={testId}
                    >
                        {options.map((option) => {
                            const optionId = `${name}-${option.value}`;
                            const isChecked = selectedValue === option.value;

                            return (
                                <div key={option.value} className="w-full">
                                    <label
                                        htmlFor={optionId}
                                        className={clsx(
                                            'flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-white transition-colors w-full min-h-[44px]',
                                            isChecked && 'border-blue-400 bg-blue-50',
                                            option.disabled 
                                                ? 'opacity-50 cursor-not-allowed' 
                                                : 'cursor-pointer hover:border-gray-400 hover:bg-gray-50'
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
                                            className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500 mr-3 flex-shrink-0"
                                        />
                                        <span className={clsx(
                                            "text-sm leading-tight break-words",
                                            option.disabled ? "text-gray-400" : "text-gray-700"
                                        )} style={{ wordBreak: 'break-word' }}>
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