import { clsx } from 'clsx';
import React, { forwardRef } from 'react';
import { input as inputTokens, transitions } from '@/styles/design-tokens';
import { useNumberInput } from '@/hooks/use-number-input';
import { InputProps } from './Input.types';

/**
 * Enhanced Input component with design tokens and custom hooks
 * 
 * Features:
 * - Design token integration for consistent styling
 * - Custom number input validation hook
 * - Support for both controlled and react-hook-form patterns
 * - Enhanced accessibility with proper ARIA attributes
 * - Automatic autocomplete attribute generation
 * - Forward ref support
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
export const Input = forwardRef<HTMLInputElement, InputProps>(({
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
}, ref) => {
    const { handleNumberChange, handleNumberBlur, handleNumberKeyDown } = useNumberInput();
    
    const inputId = `${name}-input`;
    const errorId = `${name}-error`;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;
        
        if (type === 'number') {
            handleNumberChange(inputValue, onChange);
        } else {
            onChange?.(inputValue as any);
        }
    };

    const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;
        
        if (type === 'number') {
            handleNumberBlur(inputValue, onBlur);
        } else {
            onBlur?.(inputValue as any);
        }
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

    const inputClasses = clsx(
        inputTokens.base,
        error ? inputTokens.states.error : inputTokens.states.default,
        transitions.default,
        className
    );

    // If register is provided, use react-hook-form pattern
    if (register) {
        return (
            <div className="space-y-1 space-x-1">
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
                    ref={ref}
                    id={inputId}
                    type={type}
                    placeholder={placeholder}
                    disabled={disabled}
                    aria-invalid={error ? 'true' : 'false'}
                    aria-describedby={error ? errorId : undefined}
                    aria-required={required}
                    data-testid={testId}
                    className={inputClasses}
                    autoComplete={getAutocompleteValue()}
                    inputMode={type === 'number' ? 'numeric' : undefined}
                    pattern={type === 'number' ? '[0-9]*' : undefined}
                    onKeyDown={type === 'number' ? handleNumberKeyDown : undefined}
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
        <div className="space-y-1 space-x-1">
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
                ref={ref}
                id={inputId}
                name={name}
                type={type}
                value={value}
                onChange={handleChange}
                onBlur={handleInputBlur}
                placeholder={placeholder}
                required={required}
                disabled={disabled}
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby={error ? errorId : undefined}
                aria-required={required}
                data-testid={testId}
                className={inputClasses}
                autoComplete={getAutocompleteValue()}
                inputMode={type === 'number' ? 'numeric' : undefined}
                pattern={type === 'number' ? '[0-9]*' : undefined}
                onKeyDown={type === 'number' ? handleNumberKeyDown : undefined}
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
});

Input.displayName = 'Input'; 