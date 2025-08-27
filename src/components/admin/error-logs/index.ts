/**
 * Error Logs Module Index
 * 
 * Central export point for all error logs functionality
 */

// Main components
export { ErrorLogsPage } from './error-logs-page';

// Sub-components
export {
  ErrorLogStatusBadge,
  ErrorLogFilters as ErrorLogFiltersComponent,
  ErrorLogDetailsModal,
  ErrorLogsTable,
  ErrorLogsOverviewCard,
  getSeverityColorClasses,
  getStatusColorClasses
} from './components';

// Hooks
export { useErrorLogs } from './hooks';

// Types
export type {
  ErrorLog,
  ErrorLogFilters,
  ErrorLogSort,
  ErrorSeverity,
  ErrorStatus,
  SortField,
  SortDirection,
  ErrorLogTableProps,
  ErrorLogFiltersProps,
  ErrorLogDetailsModalProps,
  ErrorLogStatusBadgeProps,
  ErrorLogsPageProps,
  ErrorLogOverviewCardProps,
  GetErrorLogsResponse,
  UpdateErrorStatusRequest,
  BulkActionRequest,
  UseErrorLogsOptions,
  UseErrorLogsReturn
} from './error-logs.types';