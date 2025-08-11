import React, { useRef, useEffect, useState } from 'react';
import { clsx } from 'clsx';
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
}

export const ScrollableContent: React.FC<ScrollableContentProps> = ({
  children,
  className = '',
  maxHeight = '60vh',
  minHeight = '300px',
  showScrollIndicators = true,
  smoothScroll = true,
  onScroll,
  mobileOptimized = true
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = useState({
    isScrollable: false,
    canScrollUp: false,
    canScrollDown: false,
    isNearTop: true,
    isNearBottom: false
  });

  // Check if content is scrollable and update scroll indicators
  const updateScrollState = () => {
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

    // Call external scroll handler
    if (onScroll) {
      onScroll(scrollTop, scrollHeight, clientHeight);
    }
  };

  // Update scroll state on mount and resize
  useEffect(() => {
    updateScrollState();
    
    const handleResize = () => updateScrollState();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update scroll state when children change
  useEffect(() => {
    updateScrollState();
  }, [children]);

  const handleScroll = () => {
    updateScrollState();
  };

  // Scroll to top method (can be exposed via ref)
  const scrollToTop = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: 0,
        behavior: smoothScroll ? 'smooth' : 'auto'
      });
    }
  };

  // Scroll to element method
  const scrollToElement = (element: HTMLElement) => {
    if (scrollRef.current && element) {
      const containerRect = scrollRef.current.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      const relativeTop = elementRect.top - containerRect.top + scrollRef.current.scrollTop;
      
      scrollRef.current.scrollTo({
        top: relativeTop - 20, // 20px offset from top
        behavior: smoothScroll ? 'smooth' : 'auto'
      });
    }
  };

  // Expose methods via imperative handle if needed
  React.useImperativeHandle(scrollRef, () => ({
    scrollToTop,
    scrollToElement,
    scrollTo: (options: ScrollToOptions) => scrollRef.current?.scrollTo(options)
  }));

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
    ]
  );

  const scrollStyle: React.CSSProperties = {
    minHeight,
    maxHeight: mobileOptimized ? 
      `min(${maxHeight}, calc(100vh - 180px))` : // Account for mobile viewport
      maxHeight,
    // Custom scrollbar styling
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
        tabIndex={0} // Make focusable for keyboard navigation
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