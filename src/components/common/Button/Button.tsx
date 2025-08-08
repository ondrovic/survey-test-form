import { clsx } from 'clsx';
import React from 'react';
import { ButtonProps } from './button.types';

/**
 * Button component with multiple variants and sizes
 * 
 * @example
 * ```tsx
 * <Button variant="primary" size="md" onClick={handleClick}>
 *   Click me
 * </Button>
 * ```
 */
export const Button = <T extends React.ElementType = 'button'>({
    as,
    children,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    icon,
    className,
    ...props
}: ButtonProps<T>) => {
    const Component = as || 'button';

    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variantClasses = {
        primary: 'bg-amber-600 text-white hover:bg-amber-700 focus:ring-amber-500 shadow-sm',
        secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 shadow-sm',
        outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-amber-500',
        ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500'
    };

    const sizeClasses = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base'
    };

    const classes = clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
    );

    return (
        <Component
            className={classes}
            disabled={disabled || loading}
            {...props}
        >
            {loading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
            )}
            {icon && !loading && <span className="mr-2">{icon}</span>}
            {children}
        </Component>
    );
}; 