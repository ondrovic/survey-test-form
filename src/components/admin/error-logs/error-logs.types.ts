/**
 * Error Logs Types
 * 
 * Type definitions for the admin error logs interface components
 */

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ErrorStatus = 'open' | 'investigating' | 'resolved' | 'ignored';
export type SortField = 'occurred_at' | 'severity' | 'component_name' | 'error_message' | 'status';
export type SortDirection = 'asc' | 'desc';

export interface ErrorLog {
  id: string;
  occurred_at: string;
  severity: ErrorSeverity;
  error_message: string;
  error_code?: string;
  stack_trace?: string;
  component_name?: string;
  file_path?: string;
  line_number?: number;
  function_name?: string;
  user_action?: string;
  user_id?: string;
  user_email?: string;
  session_token?: string;
  survey_instance_id?: string;
  user_agent?: string;
  ip_address?: string;
  url?: string;
  http_method?: string;
  browser_info?: Record<string, any>;
  screen_resolution?: string;
  viewport_size?: string;
  error_boundary?: boolean;
  is_handled?: boolean;
  additional_context?: Record<string, any>;
  tags?: string[];
  status: ErrorStatus;
  assigned_to?: string;
  resolution_notes?: string;
  resolved_at?: string;
  resolved_by?: string;
  updated_at: string;
  occurrence_count: number;
  last_occurrence_at: string;
  first_occurrence_at: string;
}

export interface ErrorLogFilters {
  search: string;
  severity: ErrorSeverity[];
  status: ErrorStatus[];
  componentName: string;
  assignedTo: string;
  dateRange: {
    start: string;
    end: string;
  };
  tags: string[];
}

export interface ErrorLogSort {
  field: SortField;
  direction: SortDirection;
}

export interface ErrorLogTableProps {
  errors: ErrorLog[];
  loading?: boolean;
  onSort: (sort: ErrorLogSort) => void;
  onFilter: (filters: Partial<ErrorLogFilters>) => void;
  onSelectError: (error: ErrorLog) => void;
  onUpdateStatus: (errorId: string, status: ErrorStatus, assignedTo?: string, notes?: string) => void;
  onBulkAction: (errorIds: string[], action: string, value?: any) => void;
  filters: ErrorLogFilters;
  sort: ErrorLogSort;
  selectedErrors: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export interface ErrorLogFiltersProps {
  filters: ErrorLogFilters;
  onFiltersChange: (filters: Partial<ErrorLogFilters>) => void;
  onReset: () => void;
  availableComponents: string[];
  availableAssignees: string[];
  availableTags: string[];
}

export interface ErrorLogDetailsModalProps {
  error: ErrorLog | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (errorId: string, status: ErrorStatus, assignedTo?: string, notes?: string) => void;
  availableAssignees: string[];
}

export interface ErrorLogStatusBadgeProps {
  status: ErrorStatus;
  severity?: ErrorSeverity;
  size?: 'sm' | 'md' | 'lg';
  showSeverity?: boolean;
}

export type ErrorLogsPageProps = Record<string, never>;

export interface ErrorLogOverviewCardProps {
  onNavigateToErrorLogs: () => void;
  errorStats?: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    unresolved: number;
  };
}

// API Response types
export interface GetErrorLogsResponse {
  errors: ErrorLog[];
  totalCount: number;
  page: number;
  pageSize: number;
  filters: ErrorLogFilters;
}

export interface UpdateErrorStatusRequest {
  errorId: string;
  status: ErrorStatus;
  assignedTo?: string;
  resolutionNotes?: string;
}

export interface BulkActionRequest {
  errorIds: string[];
  action: 'update_status' | 'assign' | 'add_tags' | 'remove_tags';
  payload: {
    status?: ErrorStatus;
    assignedTo?: string;
    tags?: string[];
    notes?: string;
  };
}

// Hook types
export interface UseErrorLogsOptions {
  initialFilters?: Partial<ErrorLogFilters>;
  initialSort?: ErrorLogSort;
  initialPageSize?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseErrorLogsReturn {
  errors: ErrorLog[];
  loading: boolean;
  error: string | null;
  filters: ErrorLogFilters;
  sort: ErrorLogSort;
  selectedErrors: string[];
  totalCount: number;
  page: number;
  pageSize: number;
  availableComponents: string[];
  availableAssignees: string[];
  availableTags: string[];
  
  // Actions
  setFilters: (filters: Partial<ErrorLogFilters>) => void;
  setSort: (sort: ErrorLogSort) => void;
  setSelectedErrors: (ids: string[]) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  refresh: () => void;
  updateErrorStatus: (errorId: string, status: ErrorStatus, assignedTo?: string, notes?: string) => Promise<boolean>;
  bulkAction: (errorIds: string[], action: string, payload: any) => Promise<boolean>;
  exportData: (format: 'csv' | 'json') => Promise<void>;
}