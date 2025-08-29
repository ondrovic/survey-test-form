import { clsx } from 'clsx';
import { Eye, EyeOff } from 'lucide-react';
import React, { useState } from 'react';
import { PasswordInputProps } from './password-input.types';

/**
 * Password Input component with built-in visibility toggle
 * Extends the base Input functionality with password-specific features
 * 
 * @example
 * ```tsx
 * // Controlled usage
 * <PasswordInput
 *   name="password"
 *   value={password}
 *   onChange={setPassword}
 *   label="Password"
 *   required
 *   error={errors.password}
 * />
 * 
 * // react-hook-form usage
 * <PasswordInput
 *   name="password"
 *   register={register}
 *   label="Password"
 *   required
 *   error={errors.password}
 * />
 * ```
 */
export const PasswordInput = <T extends string = string>({
    name,
    value,
    onChange,
    onBlur,
    register,
    label,
    placeholder = "Enter password",
    required = false,
    error,
    disabled = false,
    'data-testid': testId,
    className,
    autocomplete,
    showToggle = true,
    ...props
}: PasswordInputProps<T>) => {
    const [showPassword, setShowPassword] = useState(false);

    const inputId = `${name}-input`;
    const errorId = `${name}-error`;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value as T;
        onChange?.(newValue);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const newValue = e.target.value as T;
        onBlur?.(newValue);
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    // Auto-generate autocomplete value if not provided
    const getAutocompleteValue = () => {
        if (autocomplete) return autocomplete;
        // For password fields, use appropriate autocomplete values
        if (name && name.toLowerCase().includes('current')) return 'current-password';
        if (name && name.toLowerCase().includes('new')) return 'new-password';
        return 'current-password'; // Default for login forms
    };

    const baseClasses = 'dark:text-white block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:opacity-50 disabled:cursor-not-allowed';

    const stateClasses = error
        ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
        : 'border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-amber-500 focus:border-amber-500';

    const inputClasses = clsx(baseClasses, stateClasses, className);

    // If register is provided, use react-hook-form pattern
    if (register) {
        return (
            <div className="space-y-1 space-x-1">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="block text-sm font-medium text-gray-700 mb-2 dark:text-white"
                    >
                        {label}
                        {required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                )}

                <div className="relative">
                    <input
                        id={inputId}
                        type={showPassword ? "text" : "password"}
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

                    {showToggle && (
                        <button
                            type="button"
                            onClick={togglePasswordVisibility}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    )}
                </div>

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
        <div className="space-y-1 space-x-1">
            {label && (
                <label
                    htmlFor={inputId}
                    className="block text-sm font-semibold text-gray-800 mb-2 dark:text-white"
                >
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}

            <div className="relative">
                <input
                    id={inputId}
                    name={name}
                    type={showPassword ? "text" : "password"}
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

                {showToggle && (
                    <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                )}
            </div>

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