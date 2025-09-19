import { clsx } from 'clsx';
import React from 'react';
import { TextAreaProps } from './TextArea.types';

/**
 * Generic TextArea component with validation and accessibility support
 * Works with both controlled and react-hook-form patterns
 * 
 * @example
 * ```tsx
 * // Controlled usage
 * <TextArea
 *   name="description"
 *   value={description}
 *   onChange={setDescription}
 *   label="Description"
 *   required
 *   error={errors.description}
 * />
 * 
 * // react-hook-form usage
 * <TextArea
 *   name="description"
 *   register={register}
 *   label="Description"
 *   required
 *   error={errors.description}
 * />
 * ```
 */
export const TextArea = <T extends string = string>({
    name,
    value,
    onChange,
    register,
    label,
    placeholder,
    required = false,
    error,
    disabled = false,
    'data-testid': testId,
    className,
    rows = 4,
    maxLength,
    ...props
}: TextAreaProps<T>) => {
    const textareaId = `${name}-textarea`;
    const errorId = `${name}-error`;

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (onChange) {
            onChange(e.target.value as T);
        }
    };

    const textareaClasses = clsx(
        'w-full px-3 py-2 bg-white border rounded-md shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 resize-none',
        {
            'border-red-300 focus:border-red-400 focus:ring-red-400': error,
            'border-amber-200': !error,
            'bg-gray-50 cursor-not-allowed': disabled,
        },
        className
    );

    // react-hook-form pattern
    if (register) {
        return (
            <div className="space-y-1">
                {label && (
                    <label
                        htmlFor={textareaId}
                        className="block text-sm font-semibold text-gray-800 mb-2"
                    >
                        {label}
                        {required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                )}

                <textarea
                    id={textareaId}
                    {...register(name)}
                    placeholder={placeholder}
                    required={required}
                    disabled={disabled}
                    aria-invalid={error ? 'true' : 'false'}
                    aria-describedby={error ? errorId : undefined}
                    data-testid={testId}
                    className={textareaClasses}
                    rows={rows}
                    maxLength={maxLength}
                    {...props}
                />

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
    }

    // Controlled pattern
    return (
        <div className="space-y-1">
            {label && (
                <label
                    htmlFor={textareaId}
                    className="block text-sm font-semibold text-gray-800 mb-2"
                >
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}

            <textarea
                id={textareaId}
                name={name}
                value={value}
                onChange={handleChange}
                placeholder={placeholder}
                required={required}
                disabled={disabled}
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby={error ? errorId : undefined}
                data-testid={testId}
                className={textareaClasses}
                rows={rows}
                maxLength={maxLength}
                {...props}
            />

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
