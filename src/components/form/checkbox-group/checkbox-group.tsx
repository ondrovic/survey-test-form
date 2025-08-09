import { clsx } from 'clsx';
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
    layout = 'grid',
    maxSelections,
    minSelections,
    'data-testid': testId,
    className
}: CheckboxGroupProps<T>) => {
    const groupId = `${name}-group`;
    const errorId = `${name}-error`;
    
    const currentSelectionCount = (selectedValues || []).length;
    const hasReachedMaxSelections = maxSelections && currentSelectionCount >= maxSelections;

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

    const layoutClasses = {
        horizontal: 'flex flex-wrap gap-3',
        vertical: 'space-y-2',
        grid: 'flex flex-wrap gap-3'
    };

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
                        className={layoutClasses[layout]}
                        role="group"
                        aria-labelledby={groupId}
                        aria-describedby={error ? errorId : undefined}
                        data-testid={testId}
                    >
                        {options.map((option) => {
                            const optionId = `${name}-${option.value}`;
                            const isChecked = selectedValues?.includes(option.value) || false;
                            
                            // Disable option if:
                            // 1. Option is explicitly disabled, OR
                            // 2. Max selections reached AND this option is not currently selected
                            const isDisabled = option.disabled || (hasReachedMaxSelections && !isChecked);

                            return (
                                <div key={option.value} className="flex items-center">
                                    <label
                                        htmlFor={optionId}
                                        className={clsx(
                                            'flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-white transition-colors',
                                            isChecked && 'border-gray-400 bg-gray-50',
                                            isDisabled 
                                                ? 'opacity-50 cursor-not-allowed' 
                                                : 'cursor-pointer hover:border-gray-400'
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
                                            className="h-4 w-4 text-gray-700 border-gray-300 mr-2"
                                        />
                                        <span className={clsx(
                                            "text-sm",
                                            isDisabled ? "text-gray-400" : "text-gray-700"
                                        )}>
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