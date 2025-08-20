import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { loadingSpinner as spinnerTokens, typography, transitions } from '@/styles/design-tokens';

/**
 * Loading Spinner Types
 */
export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type SpinnerVariant = 'spinner' | 'ring' | 'dots' | 'pulse';
export type SpinnerColor = 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';

/**
 * Loading Spinner Props
 */
export interface LoadingSpinnerProps {
  size?: SpinnerSize;
  variant?: SpinnerVariant;
  color?: SpinnerColor;
  className?: string;
  text?: string;
  textPosition?: 'bottom' | 'right';
  fullScreen?: boolean;
  overlay?: boolean;
  duration?: 'fast' | 'normal' | 'slow';
  'aria-label'?: string;
}

/**
 * Enhanced Loading Spinner component with design tokens and accessibility
 * 
 * Features:
 * - Multiple spinner variants (spinner, ring, dots, pulse)
 * - Design token integration for consistent styling
 * - Accessibility support with proper ARIA labels
 * - Full screen and overlay options
 * - Customizable animation duration
 * - Text positioning options
 * 
 * @example
 * ```tsx
 * <LoadingSpinner size="md" variant="spinner" text="Loading..." />
 * 
 * <LoadingSpinner 
 *   size="lg" 
 *   variant="dots" 
 *   color="primary" 
 *   fullScreen 
 *   text="Please wait..."
 * />
 * ```
 */
export const LoadingSpinner = forwardRef<HTMLDivElement, LoadingSpinnerProps>(({
  size = 'md',
  variant = 'spinner',
  color = 'primary',
  className,
  text,
  textPosition = 'bottom',
  fullScreen = false,
  overlay = false,
  duration = 'normal',
  'aria-label': ariaLabel,
}, ref) => {
  const durationClasses = {
    fast: 'animate-spin',
    normal: 'animate-spin',
    slow: 'animate-spin',
  };

  const customDuration = duration !== 'normal' ? {
    animationDuration: duration === 'fast' ? '0.5s' : '2s'
  } : {};

  const renderSpinner = () => {
    switch (variant) {
      case 'dots':
        return (
          <div 
            className={clsx(
              'flex space-x-1',
              spinnerTokens.colors[color]
            )}
            style={customDuration}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={clsx(
                  'rounded-full bg-current animate-pulse',
                  {
                    'h-1 w-1': size === 'xs',
                    'h-1.5 w-1.5': size === 'sm',
                    'h-2 w-2': size === 'md',
                    'h-3 w-3': size === 'lg',
                    'h-4 w-4': size === 'xl',
                  }
                )}
                style={{
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: duration === 'fast' ? '0.8s' : duration === 'slow' ? '1.6s' : '1.2s'
                }}
              />
            ))}
          </div>
        );

      case 'pulse':
        return (
          <div
            className={clsx(
              spinnerTokens.base,
              spinnerTokens.sizes[size],
              spinnerTokens.variants[variant],
              spinnerTokens.colors[color],
              'animate-pulse'
            )}
            style={customDuration}
          />
        );

      case 'ring':
        return (
          <div
            className={clsx(
              spinnerTokens.base,
              spinnerTokens.sizes[size],
              spinnerTokens.variants[variant],
              spinnerTokens.colors[color],
              durationClasses[duration]
            )}
            style={customDuration}
          />
        );

      default: // spinner
        return (
          <div
            className={clsx(
              spinnerTokens.base,
              spinnerTokens.sizes[size],
              spinnerTokens.variants[variant],
              spinnerTokens.colors[color],
              durationClasses[duration]
            )}
            style={customDuration}
          />
        );
    }
  };

  const spinnerElement = (
    <div
      ref={ref}
      className={clsx(
        spinnerTokens.container,
        {
          'flex-row space-x-3': textPosition === 'right',
          'flex-col': textPosition === 'bottom',
        },
        className
      )}
      role="status"
      aria-label={ariaLabel || text || 'Loading'}
    >
      {renderSpinner()}
      {text && (
        <span
          className={clsx(
            spinnerTokens.text,
            typography.text.sm,
            {
              'mt-2': textPosition === 'bottom',
              'ml-2 mt-0': textPosition === 'right',
            }
          )}
          aria-hidden="true"
        >
          {text}
        </span>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className={spinnerTokens.fullscreen}>
        {spinnerElement}
      </div>
    );
  }

  if (overlay) {
    return (
      <div className={spinnerTokens.overlay}>
        {spinnerElement}
      </div>
    );
  }

  return spinnerElement;
});

LoadingSpinner.displayName = 'LoadingSpinner';

/**
 * Inline Loading Spinner - optimized for inline usage
 */
export interface InlineSpinnerProps {
  size?: SpinnerSize;
  variant?: SpinnerVariant;
  color?: SpinnerColor;
  className?: string;
}

export const InlineSpinner = forwardRef<HTMLDivElement, InlineSpinnerProps>(({
  size = 'sm',
  variant = 'spinner',
  color = 'primary',
  className,
}, ref) => {
  return (
    <div
      ref={ref}
      className={clsx(
        spinnerTokens.base,
        spinnerTokens.sizes[size],
        spinnerTokens.variants[variant],
        spinnerTokens.colors[color],
        className
      )}
      role="status"
      aria-label="Loading"
      aria-hidden="true"
    />
  );
});

InlineSpinner.displayName = 'InlineSpinner';

/**
 * Button Spinner - optimized for button loading states
 */
export interface ButtonSpinnerProps {
  size?: 'sm' | 'md';
  className?: string;
}

export const ButtonSpinner = forwardRef<HTMLDivElement, ButtonSpinnerProps>(({
  size = 'sm',
  className,
}, ref) => {
  return (
    <div
      ref={ref}
      className={clsx(
        spinnerTokens.base,
        spinnerTokens.sizes[size],
        spinnerTokens.variants.spinner,
        'text-current',
        className
      )}
      role="status"
      aria-label="Loading"
      aria-hidden="true"
    />
  );
});

ButtonSpinner.displayName = 'ButtonSpinner';

export default LoadingSpinner;