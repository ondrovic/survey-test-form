import { clsx } from 'clsx';
import { getSmartLayoutClasses } from '../../../utils/layout.utils';
import { CheckboxGroupProps } from './checkbox-group.types';

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
    layout = 'balanced',
    maxSelections,
    minSelections,
    'data-testid': testId,
    className
}: CheckboxGroupProps<T>) => {
    const groupId = `${name}-group`;
    const errorId = `${name}-error`;
    
    const currentSelectionCount = (selectedValues || []).length;
    const hasReachedMaxSelections = Boolean(maxSelections && currentSelectionCount >= maxSelections);

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

    const layoutClasses = getSmartLayoutClasses(options.length, layout);

    const classes = clsx('space-y-2', className);

    return (
        <div className={classes}>
            {label && (
                <fieldset>
                    <legend className="text-base font-medium text-gray-700 mb-3">
                        {label}
                        {required && <span className="text-red-500 ml-1">*</span>}
                        {(maxSelections || minSelections) && (
                            <span className="ml-2 text-sm text-gray-500">
                                ({currentSelectionCount}
                                {maxSelections && `/${maxSelections}`} selected
                                {minSelections && maxSelections && `, min ${minSelections}`}
                                {minSelections && !maxSelections && `, min ${minSelections} required`}
                                )
                            </span>
                        )}
                    </legend>

                    <div
                        className={layoutClasses}
                        role="group"
                        aria-labelledby={groupId}
                        aria-describedby={error ? errorId : undefined}
                        data-testid={testId}
                    >
                        {options.map((option) => {
                            const optionId = `${name}-${option.value}`;
                            const isChecked = Boolean(selectedValues?.includes(option.value));
                            
                            // Disable option if:
                            // 1. Option is explicitly disabled, OR
                            // 2. Max selections reached AND this option is not currently selected
                            const isDisabled = option.disabled || (hasReachedMaxSelections && !isChecked);

                            return (
                                <div key={option.value} className="w-full">
                                    <label
                                        htmlFor={optionId}
                                        className={clsx(
                                            'flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-white transition-colors w-full min-h-[44px]',
                                            isChecked && 'border-blue-400 bg-blue-50',
                                            isDisabled 
                                                ? 'opacity-50 cursor-not-allowed' 
                                                : 'cursor-pointer hover:border-gray-400 hover:bg-gray-50'
                                        )}
                                    >
                                        <input
                                            id={optionId}
                                            name={name}
                                            type="checkbox"
                                            value={option.value}
                                            checked={isChecked}
                                            onChange={(e) => handleOptionChange(option.value, e.target.checked)}
                                            disabled={isDisabled}
                                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-3 flex-shrink-0"
                                        />
                                        <span className={clsx(
                                            "text-sm leading-tight break-words",
                                            isDisabled ? "text-gray-400" : "text-gray-700"
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