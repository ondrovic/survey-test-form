import React, { forwardRef, useCallback } from 'react';
import { clsx } from 'clsx';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { pagination as paginationTokens, typography } from '@/styles/design-tokens';

/**
 * Pagination Types
 */
export type PaginationSize = 'sm' | 'md' | 'lg';
export type PaginationVariant = 'default' | 'simple' | 'compact';

/**
 * Base Pagination Props
 */
export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  size?: PaginationSize;
  variant?: PaginationVariant;
  className?: string;
  showFirstLast?: boolean;
  showInfo?: boolean;
  totalItems?: number;
  itemsPerPage?: number;
  maxVisiblePages?: number;
  disabled?: boolean;
}

/**
 * Enhanced Pagination component with design tokens and accessibility
 * 
 * Features:
 * - Mobile-first responsive design
 * - Keyboard navigation support
 * - ARIA accessibility
 * - Design token integration
 * - Multiple size and variant options
 * - Optional first/last page buttons
 * - Info display showing current range
 * 
 * @example
 * ```tsx
 * <Pagination
 *   currentPage={1}
 *   totalPages={10}
 *   onPageChange={handlePageChange}
 *   showInfo
 *   totalItems={100}
 *   itemsPerPage={10}
 * />
 * ```
 */
export const Pagination = forwardRef<HTMLElement, PaginationProps>(({
  currentPage,
  totalPages,
  onPageChange,
  size = 'md',
  variant = 'default',
  className,
  showFirstLast = false,
  showInfo = false,
  totalItems,
  itemsPerPage,
  maxVisiblePages = 5,
  disabled = false,
}, ref) => {
  const getPageNumbers = useCallback(() => {
    const pages: (number | string)[] = [];
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Calculate range around current page
      let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      // Adjust if we're near the end
      if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
      
      // Add first page and ellipsis if needed
      if (startPage > 1) {
        pages.push(1);
        if (startPage > 2) {
          pages.push('...');
        }
      }
      
      // Add visible pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      // Add ellipsis and last page if needed
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pages.push('...');
        }
        pages.push(totalPages);
      }
    }
    
    return pages;
  }, [currentPage, totalPages, maxVisiblePages]);

  const handlePageChange = useCallback((page: number) => {
    if (disabled || page < 1 || page > totalPages || page === currentPage) return;
    onPageChange(page);
  }, [disabled, totalPages, currentPage, onPageChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, page: number | string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (typeof page === 'number') {
        handlePageChange(page);
      }
    }
  }, [handlePageChange]);

  // Don't render if there's only one page or no pages
  if (totalPages <= 1) return null;

  // Calculate info for display
  const getInfoText = () => {
    if (!showInfo || !totalItems || !itemsPerPage) return null;
    
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);
    
    return `Showing ${startItem}-${endItem} of ${totalItems} results`;
  };

  const containerClasses = clsx(
    variant === 'simple' ? 'flex items-center justify-between' : paginationTokens.container,
    paginationTokens.variants[variant],
    className
  );

  const buttonBaseClasses = clsx(
    paginationTokens.button.base,
    paginationTokens.button.sizes[size]
  );

  if (variant === 'simple') {
    return (
      <nav
        ref={ref}
        className={containerClasses}
        role="navigation"
        aria-label="Pagination"
      >
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={disabled || currentPage === 1}
          className={clsx(
            buttonBaseClasses,
            'min-h-[44px] px-4 py-2', // Mobile-friendly touch targets
            currentPage === 1 ? paginationTokens.nav.disabled : paginationTokens.nav.enabled
          )}
          aria-label="Go to previous page"
        >
          <ChevronLeft className="w-5 h-5 mr-2" />
          <span className="hidden sm:inline">Previous</span>
          <span className="sm:hidden">Prev</span>
        </button>
        
        {showInfo && (
          <div className="flex-1 text-center px-4">
            <span className={clsx(paginationTokens.info.text, 'text-sm')}>
              <span className="hidden sm:inline">{getInfoText()}</span>
              <span className="sm:hidden">
                Page {currentPage} of {totalPages}
              </span>
            </span>
          </div>
        )}
        
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={disabled || currentPage === totalPages}
          className={clsx(
            buttonBaseClasses,
            'min-h-[44px] px-4 py-2', // Mobile-friendly touch targets
            currentPage === totalPages ? paginationTokens.nav.disabled : paginationTokens.nav.enabled
          )}
          aria-label="Go to next page"
        >
          <span className="hidden sm:inline">Next</span>
          <span className="sm:hidden">Next</span>
          <ChevronRight className="w-5 h-5 ml-2" />
        </button>
      </nav>
    );
  }

  return (
    <div className="space-y-3">
      {showInfo && (
        <div className="text-center">
          <span className={clsx(paginationTokens.info.muted, typography.text.sm)}>
            <span className="hidden sm:inline">{getInfoText()}</span>
            <span className="sm:hidden">
              Page {currentPage} of {totalPages}
              {totalItems && ` (${totalItems} total)`}
            </span>
          </span>
        </div>
      )}
      
      <nav
        ref={ref}
        className={clsx(
          // Mobile-first responsive container
          'flex items-center justify-center',
          // Mobile: simplified layout with scroll
          'gap-1 overflow-x-auto pb-2 sm:pb-0',
          // Desktop: standard layout
          'sm:gap-1 sm:overflow-visible',
          className
        )}
        role="navigation"
        aria-label="Pagination"
      >
        {/* First page button - hidden on mobile */}
        {showFirstLast && (
          <button
            onClick={() => handlePageChange(1)}
            disabled={disabled || currentPage === 1}
            className={clsx(
              buttonBaseClasses,
              'hidden sm:flex min-h-[44px] min-w-[44px]', // Mobile-friendly touch targets
              currentPage === 1 ? paginationTokens.nav.disabled : paginationTokens.nav.enabled
            )}
            aria-label="Go to first page"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
        )}

        {/* Previous page button */}
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={disabled || currentPage === 1}
          className={clsx(
            buttonBaseClasses,
            'min-h-[44px] min-w-[44px]', // Mobile-friendly touch targets
            currentPage === 1 ? paginationTokens.nav.disabled : paginationTokens.nav.enabled
          )}
          aria-label="Go to previous page"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Mobile-optimized page number buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {getPageNumbers().map((page, index) => {
            const isCurrentPage = page === currentPage;
            const isEllipsis = page === '...';
            
            // On mobile, show fewer pages for better UX
            const shouldShowOnMobile = () => {
              if (isEllipsis) return index < 3; // Limit ellipsis on mobile
              if (typeof page === 'number') {
                // On mobile, show current, one before, one after, first, and last
                return (
                  page === currentPage ||
                  Math.abs(page - currentPage) <= 1 ||
                  page === 1 ||
                  page === totalPages
                );
              }
              return true;
            };
            
            return (
              <button
                key={`${page}-${index}`}
                onClick={() => typeof page === 'number' && handlePageChange(page)}
                onKeyDown={(e) => handleKeyDown(e, page)}
                disabled={disabled || isEllipsis}
                className={clsx(
                  buttonBaseClasses,
                  'min-h-[44px] min-w-[44px]', // Mobile-friendly touch targets
                  // Mobile visibility
                  shouldShowOnMobile() ? 'flex' : 'hidden sm:flex',
                  isCurrentPage 
                    ? paginationTokens.page.active
                    : isEllipsis 
                      ? paginationTokens.page.ellipsis
                      : paginationTokens.page.default
                )}
                aria-label={
                  isEllipsis 
                    ? undefined 
                    : isCurrentPage 
                      ? `Current page, page ${page}`
                      : `Go to page ${page}`
                }
                aria-current={isCurrentPage ? 'page' : undefined}
                tabIndex={isEllipsis ? -1 : 0}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* Next page button */}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={disabled || currentPage === totalPages}
          className={clsx(
            buttonBaseClasses,
            'min-h-[44px] min-w-[44px]', // Mobile-friendly touch targets
            currentPage === totalPages ? paginationTokens.nav.disabled : paginationTokens.nav.enabled
          )}
          aria-label="Go to next page"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Last page button - hidden on mobile */}
        {showFirstLast && (
          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={disabled || currentPage === totalPages}
            className={clsx(
              buttonBaseClasses,
              'hidden sm:flex min-h-[44px] min-w-[44px]', // Mobile-friendly touch targets
              currentPage === totalPages ? paginationTokens.nav.disabled : paginationTokens.nav.enabled
            )}
            aria-label="Go to last page"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        )}
      </nav>

      {/* Mobile page jump helper */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-2">
          <span>Swipe pagination to navigate</span>
          {totalPages > 10 && (
            <span>Page {currentPage}/{totalPages}</span>
          )}
        </div>
      </div>
    </div>
  );
});

Pagination.displayName = 'Pagination';

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

export default Pagination;