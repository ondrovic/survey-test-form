import React, { forwardRef, useCallback, useEffect, useId, useRef, useState } from 'react';
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
  const [contentHeight, setContentHeight] = useState<number>(0);
  const [shouldScroll, setShouldScroll] = useState<boolean>(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const innerContentRef = useRef<HTMLDivElement>(null);
  const isControlled = controlledExpanded !== undefined;
  const isExpanded = isControlled ? controlledExpanded : internalExpanded;
  
  const contentId = useId();
  const triggerId = useId();
  
  // Measure content height when expanded or children change
  useEffect(() => {
    if (innerContentRef.current && isExpanded) {
      // Small delay to ensure DOM has updated
      const timer = setTimeout(() => {
        if (innerContentRef.current) {
          const contentHeight = innerContentRef.current.scrollHeight;
          
          // Calculate available viewport space (accounting for header, navigation, etc.)
          const viewportHeight = window.innerHeight;
          const isMobile = window.innerWidth <= 768;
          
          // Use different height strategies for mobile vs desktop
          let finalHeight: number;
          if (isMobile) {
            // Mobile: cap at 70% of viewport to prevent taking over the screen
            const maxReasonableHeight = viewportHeight * 0.7;
            finalHeight = Math.min(contentHeight, maxReasonableHeight);
            setShouldScroll(finalHeight < contentHeight);
          } else {
            // Desktop: prefer natural height, only constrain if content is extremely large
            const maxReasonableHeight = Math.min(viewportHeight * 0.8, 1000); // More generous desktop limit
            
            // For desktop, allow natural height unless content is really excessive
            if (contentHeight <= maxReasonableHeight) {
              finalHeight = contentHeight;
              setShouldScroll(false); // Never scroll on desktop unless absolutely necessary
            } else {
              // Only constrain very large content on desktop
              finalHeight = maxReasonableHeight;
              setShouldScroll(true);
            }
          }
          
          setContentHeight(finalHeight);
        }
      }, 10);
      
      return () => clearTimeout(timer);
    }
    
    // Return empty cleanup function when not expanded
    return () => {};
  }, [isExpanded, children]);
  
  // Reset scroll state when collapsed
  useEffect(() => {
    if (!isExpanded) {
      setShouldScroll(false);
    }
  }, [isExpanded]);
  
  // Update height when window resizes (responsive layout changes)
  useEffect(() => {
    const updateHeight = () => {
      if (innerContentRef.current && isExpanded) {
        const contentHeight = innerContentRef.current.scrollHeight;
        
        // Recalculate viewport constraints
        const viewportHeight = window.innerHeight;
        const isMobile = window.innerWidth <= 768;
        
        let finalHeight: number;
        if (isMobile) {
          const maxReasonableHeight = viewportHeight * 0.7;
          finalHeight = Math.min(contentHeight, maxReasonableHeight);
          setShouldScroll(finalHeight < contentHeight);
        } else {
          // Desktop: prefer natural height, only constrain if content is extremely large
          const maxReasonableHeight = Math.min(viewportHeight * 0.8, 1000); // More generous desktop limit
          
          // For desktop, allow natural height unless content is really excessive
          if (contentHeight <= maxReasonableHeight) {
            finalHeight = contentHeight;
            setShouldScroll(false); // Never scroll on desktop unless absolutely necessary
          } else {
            // Only constrain very large content on desktop
            finalHeight = maxReasonableHeight;
            setShouldScroll(true);
          }
        }
        setContentHeight(finalHeight);
      }
    };
    
    // Debounce resize events
    let resizeTimer: NodeJS.Timeout;
    const debouncedUpdateHeight = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(updateHeight, 150);
    };
    
    window.addEventListener('resize', debouncedUpdateHeight);
    return () => {
      window.removeEventListener('resize', debouncedUpdateHeight);
      clearTimeout(resizeTimer);
    };
  }, [isExpanded]);

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
      <div className={triggerClasses}>
        <div className="flex items-center justify-between w-full sm:flex-1">
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
          
          <button
            onClick={handleToggle}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors bg-transparent border-none flex-shrink-0 sm:hidden"
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
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          {headerAction && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
              {headerAction}
            </div>
          )}
          
          <button
            onClick={handleToggle}
            className="hidden sm:block p-1 hover:bg-gray-100 rounded-md transition-colors bg-transparent border-none flex-shrink-0"
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
        ref={contentRef}
        id={contentId}
        className={clsx(
          contentClasses, 
          isExpanded 
            ? (shouldScroll ? 'overflow-y-auto' : 'overflow-y-hidden') 
            : 'overflow-hidden'
        )}
        style={{
          maxHeight: isExpanded 
            ? (shouldScroll ? `${contentHeight}px` : 'none') 
            : '0px',
          opacity: isExpanded ? 1 : 0,
          transitionDuration: `${animationDuration}ms`,
          transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
          transitionProperty: shouldScroll ? 'max-height, opacity, padding' : 'opacity, padding',
          paddingTop: isExpanded ? undefined : '0px',
          paddingBottom: isExpanded ? undefined : '0px',
          WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
        }}
        aria-hidden={!isExpanded}
        role="region"
        aria-labelledby={triggerId}
      >
        <div 
          ref={innerContentRef}
          style={{ 
            transform: isExpanded ? 'translateY(0)' : 'translateY(-10px)',
            transitionDuration: `${animationDuration}ms`,
            transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
            transitionProperty: 'transform',
          }}
        >
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
  headerContent?: React.ReactNode;
  count?: number;
}

export const CollapsibleSection = forwardRef<HTMLDivElement, CollapsibleSectionProps>(({
  title,
  children,
  defaultExpanded = true,
  className,
  headerAction,
  headerContent,
  count,
}, ref) => {
  // Combine headerContent and headerAction if both exist
  const combinedHeaderAction = headerContent || headerAction ? (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
      {headerContent}
      {headerAction}
    </div>
  ) : undefined;

  return (
    <Collapsible
      ref={ref}
      title={title}
      defaultExpanded={defaultExpanded}
      variant="card"
      size="lg"
      className={className}
      badge={count}
      headerAction={combinedHeaderAction}
    >
      {children}
    </Collapsible>
  );
});

CollapsibleSection.displayName = 'CollapsibleSection';

export default Collapsible;