import { clsx } from 'clsx';
import React from 'react';
import { InputProps } from './Input.types';

/**
 * Generic Input component with validation and accessibility support
 * Works with both controlled and react-hook-form patterns
 * 
 * @example
 * ```tsx
 * // Controlled usage
 * <Input
 *   name="email"
 *   value={email}
 *   onChange={setEmail}
 *   type="email"
 *   label="Email Address"
 *   required
 *   error={errors.email}
 * />
 * 
 * // react-hook-form usage
 * <Input
 *   name="email"
 *   register={register}
 *   type="email"
 *   label="Email Address"
 *   required
 *   error={errors.email}
 * />
 * ```
 */
export const Input = <T extends string | number = string>({
    name,
    value,
    onChange,
    onBlur,
    register,
    type = 'text',
    label,
    placeholder,
    required = false,
    error,
    disabled = false,
    'data-testid': testId,
    className,
    autocomplete,
    ...props
}: InputProps<T>) => {
    const inputId = `${name}-input`;
    const errorId = `${name}-error`;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = type === 'number' ? Number(e.target.value) as T : e.target.value as T;
        onChange?.(newValue);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const newValue = type === 'number' ? Number(e.target.value) as T : e.target.value as T;
        onBlur?.(newValue);
    };

    // Auto-generate autocomplete value if not provided
    const getAutocompleteValue = () => {
        if (autocomplete) return autocomplete;

        // Auto-generate based on type and name
        switch (type) {
            case 'email':
                return 'email';
            case 'password':
                return 'new-password'; // For admin password, use new-password
            case 'number':
                return 'off';
            default:
                // Auto-generate based on field name
                if (name && name.toLowerCase().includes('email')) return 'email';
                if (name && name.toLowerCase().includes('name')) return 'name';
                if (name && name.toLowerCase().includes('phone')) return 'tel';
                if (name && name.toLowerCase().includes('url')) return 'url';
                return 'off';
        }
    };

    const baseClasses = 'block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:opacity-50 disabled:cursor-not-allowed';

    const stateClasses = error
        ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
        : 'border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-amber-500 focus:border-amber-500';

    const inputClasses = clsx(baseClasses, stateClasses, className);

    // If register is provided, use react-hook-form pattern
    if (register) {
        return (
            <div className="space-y-1">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="block text-sm font-medium text-gray-700 mb-2"
                    >
                        {label}
                        {required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                )}

                <input
                    id={inputId}
                    type={type}
                    placeholder={placeholder}
                    disabled={disabled}
                    aria-invalid={error ? 'true' : 'false'}
                    aria-describedby={error ? errorId : undefined}
                    data-testid={testId}
                    className={inputClasses}
                    autoComplete={getAutocompleteValue()}
                    {...(typeof register === 'function' ? register(name) : register)}
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
                    htmlFor={inputId}
                    className="block text-sm font-semibold text-gray-800 mb-2"
                >
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}

            <input
                id={inputId}
                name={name}
                type={type}
                value={value}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder={placeholder}
                required={required}
                disabled={disabled}
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby={error ? errorId : undefined}
                data-testid={testId}
                className={inputClasses}
                autoComplete={getAutocompleteValue()}
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