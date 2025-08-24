import { clsx } from 'clsx';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import './scrollable-content.css';

export interface ScrollableContentProps {
  children: React.ReactNode;
  className?: string;
  /**
   * Maximum height as a viewport percentage (default: 60vh)
   */
  maxHeight?: string;
  /**
   * Minimum height (default: 300px)
   */
  minHeight?: string;
  /**
   * Whether to show scroll indicators/shadows
   */
  showScrollIndicators?: boolean;
  /**
   * Whether to enable smooth scrolling behavior
   */
  smoothScroll?: boolean;
  /**
   * Callback when scroll position changes
   */
  onScroll?: (scrollTop: number, scrollHeight: number, clientHeight: number) => void;
  /**
   * Whether to use mobile-optimized scrolling on small screens
   */
  mobileOptimized?: boolean;
  /**
   * When this value changes, scrollbars reset to top
   */
  resetTrigger?: any;
}

export const ScrollableContent: React.FC<ScrollableContentProps> = ({
  children,
  className = '',
  maxHeight = '60vh',
  minHeight = '300px',
  showScrollIndicators = true,
  smoothScroll = true,
  onScroll,
  mobileOptimized = true,
  resetTrigger
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollTimeRef = useRef<number>(0);
  const isScrollingRef = useRef<boolean>(false);
  const [scrollState, setScrollState] = useState({
    isScrollable: false,
    canScrollUp: false,
    canScrollDown: false,
    isNearTop: true,
    isNearBottom: false
  });

  // Check if content is scrollable and update scroll indicators
  const updateScrollState = useCallback(() => {
    if (!scrollRef.current) return;

    const element = scrollRef.current;
    const { scrollTop, scrollHeight, clientHeight } = element;

    const isScrollable = scrollHeight > clientHeight;
    const canScrollUp = scrollTop > 0;
    const canScrollDown = scrollTop < scrollHeight - clientHeight;
    const isNearTop = scrollTop < 20;
    const isNearBottom = scrollTop > scrollHeight - clientHeight - 20;

    setScrollState({
      isScrollable,
      canScrollUp,
      canScrollDown,
      isNearTop,
      isNearBottom
    });
  }, []);

  // Separate function for external scroll callback with aggressive throttling
  const handleExternalScroll = useCallback((scrollTop: number, scrollHeight: number, clientHeight: number) => {
    if (!onScroll) return;

    // If we're currently scrolling, completely skip the callback to prevent interference
    if (isScrollingRef.current) {
      return;
    }

    const now = Date.now();
    const timeSinceLastScroll = now - lastScrollTimeRef.current;

    // Only call onScroll if enough time has passed (500ms throttling - very aggressive)
    if (timeSinceLastScroll >= 500) {
      lastScrollTimeRef.current = now;
      onScroll(scrollTop, scrollHeight, clientHeight);
    } else {
      // Clear existing timeout and set a new one
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = setTimeout(() => {
        // Only call if we're not currently scrolling
        if (!isScrollingRef.current) {
          lastScrollTimeRef.current = Date.now();
          onScroll(scrollTop, scrollHeight, clientHeight);
        }
      }, 500 - timeSinceLastScroll);
    }
  }, [onScroll]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Update scroll state on mount and resize - INTENTIONALLY EMPTY DEPENDENCIES
  useEffect(() => {
    updateScrollState();

    const handleResize = () => updateScrollState();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // This should only run once on mount

  // Update scroll state when children change - INTENTIONALLY EMPTY DEPENDENCIES
  useEffect(() => {
    updateScrollState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children]); // Only depend on children, not updateScrollState

  // When resetTrigger changes, scroll to top
  useEffect(() => {
    if (resetTrigger !== undefined) {
      if (scrollRef.current) {
        scrollRef.current.scrollTo({ top: 0, behavior: smoothScroll ? 'smooth' : 'auto' });
      }
    }
  }, [resetTrigger, smoothScroll]);

  const handleScroll = useCallback(() => {
    // Set scrolling flag to prevent other operations during scroll
    isScrollingRef.current = true;

    // Clear any existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Update scroll state immediately for visual feedback
    updateScrollState();

    // Get current scroll position for external callback
    if (scrollRef.current && onScroll) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      handleExternalScroll(scrollTop, scrollHeight, clientHeight);
    }

    // Reset scrolling flag after a delay to allow for scroll completion
    scrollTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false;
      // Debounced scroll state update to prevent excessive re-renders
      updateScrollState();
    }, 150); // Wait 150ms after scroll stops
  }, [updateScrollState, handleExternalScroll, onScroll]);


  // Note: imperative handle removed to avoid ref recursion; use props/state instead

  const containerClasses = clsx(
    'relative overflow-hidden scroll-container-wrapper',
    className
  );

  const scrollClasses = clsx(
    'scrollable-content overflow-y-auto overscroll-contain',
    smoothScroll && ['scroll-smooth', 'scrollable-content-smooth'],
    // Mobile optimizations
    mobileOptimized && [
      'scrollable-content-touch',
      'md:scrollable-content-mobile-hidden', // Hide scrollbar on mobile
      'scrollable-content-mobile'
    ],
    // Desktop: only add padding class if content is scrollable
    scrollState.isScrollable && window.innerWidth > 768 && 'has-overflow'
  );

  const scrollStyle: React.CSSProperties = {
    minHeight,
    maxHeight: (() => {
      if (mobileOptimized && window.innerWidth <= 768) {
        // Mobile: always constrain height
        return `min(${maxHeight}, calc(100vh - 120px))`;
      } else if (window.innerWidth > 768) {
        // Desktop: be more generous with height, only constrain if really needed
        if (maxHeight === '60vh') {
          // For 60vh default, allow more natural height on desktop
          return 'none';
        }
        // Keep 100% as-is for forms that need full height constraint
        return maxHeight;
      }
      return maxHeight;
    })(),
    // Custom scrollbar styling - only show when needed
    scrollbarWidth: 'thin',
    scrollbarColor: '#CBD5E0 #EDF2F7'
  };

  return (
    <div className={containerClasses}>
      {/* Top scroll indicator */}
      {showScrollIndicators && scrollState.isScrollable && !scrollState.isNearTop && (
        <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-white via-white/80 to-transparent scroll-indicator pointer-events-none" />
      )}

      {/* Scrollable content */}
      <div
        ref={scrollRef}
        className={scrollClasses}
        style={scrollStyle}
        onScroll={handleScroll}
        role="region"
        aria-label="Scrollable content"
      >
        {children}
      </div>

      {/* Bottom scroll indicator */}
      {showScrollIndicators && scrollState.isScrollable && !scrollState.isNearBottom && (
        <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-white via-white/80 to-transparent scroll-indicator pointer-events-none" />
      )}

      {/* Scroll hint for mobile */}
      {mobileOptimized && scrollState.isScrollable && scrollState.isNearTop && (
        <div className="md:hidden absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 bg-white/90 px-2 py-1 rounded-full shadow-sm scroll-indicator pointer-events-none">
          Scroll for more content
        </div>
      )}
    </div>
  );
};

export default ScrollableContent;