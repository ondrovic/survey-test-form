import { clsx } from 'clsx';
import React, { forwardRef } from 'react';
import { button as buttonTokens, transitions } from '@/styles/design-tokens';
import { ButtonSpinner } from '@/components/common/layout/loading-spinner';
import { ButtonProps } from './button.types';

/**
 * Enhanced Button component with design tokens and better composition
 * 
 * Features:
 * - Design token integration for consistent styling
 * - Polymorphic component support (as prop)
 * - Loading state with spinner
 * - Icon support with proper spacing
 * - Enhanced accessibility
 * - Forward ref support
 * 
 * @example
 * ```tsx
 * <Button variant="primary" size="md" onClick={handleClick}>
 *   Click me
 * </Button>
 * 
 * <Button as="a" href="/link" variant="outline">
 *   Link Button
 * </Button>
 * ```
 */
export const Button = forwardRef<HTMLElement, ButtonProps>(({
    as = 'button',
    children,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    icon,
    className,
    'aria-label': ariaLabel,
    ...props
}, ref) => {
    const Component = as as React.ElementType;

    const classes = clsx(
        buttonTokens.base,
        buttonTokens.variants[variant],
        buttonTokens.sizes[size],
        transitions.default,
        {
            'cursor-not-allowed opacity-50': disabled || loading,
        },
        className
    );

    // Generate aria-label if not provided and we have loading state
    const computedAriaLabel = ariaLabel || (loading ? 'Loading, please wait' : undefined);

    return (
        <Component
            ref={ref}
            className={classes}
            disabled={disabled || loading}
            aria-label={computedAriaLabel}
            aria-busy={loading}
            {...props}
        >
            {loading && (
                <ButtonSpinner className="mr-2" size={size === 'lg' ? 'md' : 'sm'} />
            )}
            {icon && !loading && (
                <IconContainer icon={icon} hasText={!!children} />
            )}
            {children}
        </Component>
    );
});

(Button as any).displayName = 'Button';

/**
 * Icon container with proper spacing logic
 */
const IconContainer: React.FC<{ icon: React.ReactNode; hasText: boolean }> = ({ icon, hasText }) => (
    <span className={clsx({ 'mr-2': hasText })} aria-hidden="true">
        {icon}
    </span>
); 