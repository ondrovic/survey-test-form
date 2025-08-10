/**
 * Layout utilities for consistent grid and flexbox layouts across components
 */

export type LayoutType = 'horizontal' | 'vertical' | 'grid' | 'balanced';

/**
 * Get CSS classes for smart layout based on number of items
 * Provides consistent layout logic across all multi-option components
 */
export const getSmartLayoutClasses = (
  itemCount: number, 
  layout: LayoutType = 'balanced'
): string => {
  switch (layout) {
    case 'horizontal':
      return 'flex flex-wrap gap-3';
    case 'vertical':
      return 'space-y-2';
    case 'grid':
      // Smart grid layout based on number of options
      if (itemCount <= 2) {
        return 'flex gap-3'; // Single row for 1-2 items
      } else if (itemCount <= 4) {
        return 'grid grid-cols-2 gap-3'; // 2 columns for 3-4 items
      } else if (itemCount <= 6) {
        return 'grid grid-cols-3 gap-3'; // 3 columns for 5-6 items
      } else if (itemCount <= 8) {
        return 'grid grid-cols-4 gap-3'; // 4 columns for 7-8 items
      } else if (itemCount <= 12) {
        return 'grid grid-cols-3 sm:grid-cols-4 gap-3'; // 3-4 columns for 9-12 items
      } else {
        return 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3'; // 2-5 columns for many items
      }
    case 'balanced':
      // Balanced layout that tries to distribute items evenly
      if (itemCount <= 2) {
        return 'flex gap-3'; // Single row for 1-2 items
      } else if (itemCount <= 4) {
        return 'grid grid-cols-2 gap-3'; // 2 columns for 3-4 items
      } else if (itemCount === 5) {
        return 'grid grid-cols-3 gap-3'; // 3 columns for 5 items (2-2-1 layout)
      } else if (itemCount === 6) {
        return 'grid grid-cols-3 gap-3'; // 3 columns for 6 items (2-2-2 layout)
      } else if (itemCount <= 8) {
        return 'grid grid-cols-2 gap-3'; // 2 columns for 7-8 items 
      } else if (itemCount <= 12) {
        return 'grid grid-cols-3 gap-3'; // 3 columns for 9-12 items
      } else {
        return 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3'; // 2-4 columns for many items
      }
    default:
      return 'flex flex-wrap gap-3';
  }
};

/**
 * Get layout classes specifically for badge/chip style elements (like rating options in preview)
 * Uses more conservative column counts for better readability of small elements
 */
export const getBadgeLayoutClasses = (itemCount: number): string => {
  if (itemCount <= 2) {
    return 'flex gap-2'; // Single row for 1-2 items
  } else if (itemCount <= 4) {
    return 'grid grid-cols-2 gap-2'; // 2 columns for 3-4 items
  } else if (itemCount <= 6) {
    return 'grid grid-cols-3 gap-2'; // 3 columns for 5-6 items
  } else if (itemCount <= 8) {
    return 'grid grid-cols-4 gap-2'; // 4 columns for 7-8 items
  } else {
    return 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2'; // 3-5 columns for many items
  }
};