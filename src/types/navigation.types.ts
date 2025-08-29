/**
 * Navigation Type Definitions
 * 
 * Types for application navigation, admin pages, drawer management,
 * and menu item configurations.
 */

import { ReactElement } from 'react';

/**
 * Drawer page identifiers for admin navigation
 */
export type DrawerPage = 'overview' | 'framework' | 'option-sets' | 'error-logs';

/**
 * Admin page identifiers including legacy pages
 */
export type AdminPage = 'overview' | 'framework' | 'legacy' | 'option-sets' | 'error-logs';

/**
 * Navigation item structure for menu configuration
 */
export interface NavigationItem {
  id: DrawerPage;
  label: string;
  icon: ReactElement;
}

/**
 * Delete modal data with discriminated union for type safety
 */
export type DeleteModalData =
  | { id: string; name: string; type: 'rating' }
  | { id: string; name: string; type: 'radio' }
  | { id: string; name: string; type: 'multi-select' }
  | { id: string; name: string; type: 'select' };