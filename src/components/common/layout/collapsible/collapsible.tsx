import React, { forwardRef, useCallback, useId, useState } from 'react';
import { clsx } from 'clsx';
import { ChevronDown } from 'lucide-react';
import { collapsible as collapsibleTokens } from '@/styles/design-tokens';

/**
 * Collapsible Types
 */
export type CollapsibleSize = 'sm' | 'md' | 'lg' | 'xl';
export type CollapsibleVariant = 'default' | 'minimal' | 'card';

/**
 * Collapsible Props
 */
export interface CollapsibleProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  expanded?: boolean;
  onToggle?: (expanded: boolean) => void;
  variant?: CollapsibleVariant;
  size?: CollapsibleSize;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  badge?: string | number;
  badgeVariant?: 'default' | 'primary';
  headerAction?: React.ReactNode;
  animationDuration?: number;
}

/**
 * Enhanced Collapsible component with design tokens and accessibility
 * 
 * Features:
 * - Controlled and uncontrolled modes
 * - Smooth animations with customizable duration
 * - Multiple variants and sizes
 * - Design token integration
 * - Full accessibility support (ARIA, keyboard navigation)
 * - Optional badges and header actions
 * - Custom icons
 * 
 * @example
 * ```tsx
 * <Collapsible title="FAQ Section" badge={5}>
 *   <p>This is the collapsible content</p>
 * </Collapsible>
 * 
 * <Collapsible 
 *   title="Settings" 
 *   variant="card" 
 *   size="lg"
 *   headerAction={<Button size="sm">Edit</Button>}
 * >
 *   <div>Settings content</div>
 * </Collapsible>
 * ```
 */
export const Collapsible = forwardRef<HTMLDivElement, CollapsibleProps>(({
  title,
  children,
  defaultExpanded = false,
  expanded: controlledExpanded,
  onToggle,
  variant = 'default',
  size = 'md',
  className,
  triggerClassName,
  contentClassName,
  disabled = false,
  icon,
  badge,
  badgeVariant = 'default',
  headerAction,
  animationDuration = 200,
}, ref) => {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const isControlled = controlledExpanded !== undefined;
  const isExpanded = isControlled ? controlledExpanded : internalExpanded;
  
  const contentId = useId();
  const triggerId = useId();

  const handleToggle = useCallback(() => {
    if (disabled) return;
    
    const newExpanded = !isExpanded;
    
    if (!isControlled) {
      setInternalExpanded(newExpanded);
    }
    
    onToggle?.(newExpanded);
  }, [disabled, isExpanded, isControlled, onToggle]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  }, [handleToggle]);

  const triggerClasses = clsx(
    collapsibleTokens.trigger.base,
    collapsibleTokens.trigger.variants[variant],
    {
      'opacity-50 cursor-not-allowed': disabled,
    },
    triggerClassName
  );

  const iconClasses = clsx(
    collapsibleTokens.icon.base,
    collapsibleTokens.icon.sizes[size === 'xl' ? 'lg' : size === 'lg' ? 'md' : 'sm'],
    {
      [collapsibleTokens.icon.expanded]: isExpanded,
    }
  );

  const titleClasses = clsx(
    collapsibleTokens.title.base,
    collapsibleTokens.title.sizes[size]
  );

  const contentClasses = clsx(
    collapsibleTokens.content.base,
    collapsibleTokens.content.variants[variant],
    contentClassName
  );

  const badgeClasses = clsx(
    collapsibleTokens.badge.base,
    badgeVariant === 'primary' ? collapsibleTokens.badge.primary : collapsibleTokens.badge.default
  );

  return (
    <div
      ref={ref}
      className={clsx(
        collapsibleTokens.container,
        collapsibleTokens.variants[variant],
        className
      )}
    >
      <div className={clsx(triggerClasses, "flex items-center justify-between")}>
        <button
          id={triggerId}
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          className="flex items-center gap-3 min-w-0 flex-1 bg-transparent border-none p-0 text-left hover:bg-transparent focus:outline-none"
          aria-expanded={isExpanded}
          aria-controls={contentId}
          disabled={disabled}
          type="button"
        >
          <h3 className={titleClasses}>
            {title}
          </h3>
          
          {badge !== undefined && (
            <span className={badgeClasses}>
              {typeof badge === 'number' && badge > 0 
                ? `${badge} ${badge === 1 ? 'item' : 'items'}`
                : badge
              }
            </span>
          )}
        </button>
        
        <div className="flex items-center gap-2">
          {headerAction && (
            <div className="flex items-center gap-2">
              {headerAction}
            </div>
          )}
          
          <button
            onClick={handleToggle}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors bg-transparent border-none"
            aria-expanded={isExpanded}
            aria-controls={contentId}
            disabled={disabled}
            type="button"
          >
            {icon || (
              <ChevronDown className={iconClasses} />
            )}
          </button>
        </div>
      </div>
      
      <div
        id={contentId}
        className={contentClasses}
        style={{
          maxHeight: isExpanded ? '1000px' : '0px',
          opacity: isExpanded ? 1 : 0,
          transitionDuration: `${animationDuration}ms`,
          transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
          transitionProperty: 'max-height, opacity, padding',
          paddingTop: isExpanded ? undefined : '0px',
          paddingBottom: isExpanded ? undefined : '0px',
        }}
        aria-hidden={!isExpanded}
        role="region"
        aria-labelledby={triggerId}
      >
        <div style={{ 
          transform: isExpanded ? 'translateY(0)' : 'translateY(-10px)',
          transitionDuration: `${animationDuration}ms`,
          transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
          transitionProperty: 'transform',
        }}>
          {children}
        </div>
      </div>
    </div>
  );
});

Collapsible.displayName = 'Collapsible';

/**
 * Legacy CollapsibleSection - backward compatible wrapper
 */
export interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  className?: string;
  headerAction?: React.ReactNode;
  count?: number;
}

export const CollapsibleSection = forwardRef<HTMLDivElement, CollapsibleSectionProps>(({
  title,
  children,
  defaultExpanded = true,
  className,
  headerAction,
  count,
}, ref) => {
  return (
    <Collapsible
      ref={ref}
      title={title}
      defaultExpanded={defaultExpanded}
      variant="card"
      size="lg"
      className={className}
      badge={count}
      headerAction={headerAction}
    >
      {children}
    </Collapsible>
  );
});

CollapsibleSection.displayName = 'CollapsibleSection';

export default Collapsible;