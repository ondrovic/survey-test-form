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
            currentPage === 1 ? paginationTokens.nav.disabled : paginationTokens.nav.enabled
          )}
          aria-label="Go to previous page"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </button>
        
        {showInfo && (
          <span className={clsx(paginationTokens.info.text, typography.text.sm)}>
            {getInfoText()}
          </span>
        )}
        
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={disabled || currentPage === totalPages}
          className={clsx(
            buttonBaseClasses,
            currentPage === totalPages ? paginationTokens.nav.disabled : paginationTokens.nav.enabled
          )}
          aria-label="Go to next page"
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </button>
      </nav>
    );
  }

  return (
    <div className="space-y-3">
      {showInfo && (
        <div className="text-center">
          <span className={clsx(paginationTokens.info.muted, typography.text.sm)}>
            {getInfoText()}
          </span>
        </div>
      )}
      
      <nav
        ref={ref}
        className={containerClasses}
        role="navigation"
        aria-label="Pagination"
      >
        {/* First page button */}
        {showFirstLast && (
          <button
            onClick={() => handlePageChange(1)}
            disabled={disabled || currentPage === 1}
            className={clsx(
              buttonBaseClasses,
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
            currentPage === 1 ? paginationTokens.nav.disabled : paginationTokens.nav.enabled
          )}
          aria-label="Go to previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page number buttons */}
        {getPageNumbers().map((page, index) => {
          const isCurrentPage = page === currentPage;
          const isEllipsis = page === '...';
          
          return (
            <button
              key={`${page}-${index}`}
              onClick={() => typeof page === 'number' && handlePageChange(page)}
              onKeyDown={(e) => handleKeyDown(e, page)}
              disabled={disabled || isEllipsis}
              className={clsx(
                buttonBaseClasses,
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

        {/* Next page button */}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={disabled || currentPage === totalPages}
          className={clsx(
            buttonBaseClasses,
            currentPage === totalPages ? paginationTokens.nav.disabled : paginationTokens.nav.enabled
          )}
          aria-label="Go to next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Last page button */}
        {showFirstLast && (
          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={disabled || currentPage === totalPages}
            className={clsx(
              buttonBaseClasses,
              currentPage === totalPages ? paginationTokens.nav.disabled : paginationTokens.nav.enabled
            )}
            aria-label="Go to last page"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        )}
      </nav>
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