/**
 * useErrorLogs Hook
 * 
 * Custom hook for managing error logs state, filtering, sorting, and data fetching
 */

import { useState, useEffect, useCallback } from 'react';
import { ErrorLoggingService } from '@/services/error-logging.service';
import { SupabaseClientService } from '@/services/supabase-client.service';
import { 
  ErrorLog, 
  ErrorLogFilters, 
  ErrorLogSort, 
  // ErrorSeverity, 
  ErrorStatus,
  UseErrorLogsOptions,
  UseErrorLogsReturn
} from '../error-logs.types';

const DEFAULT_FILTERS: ErrorLogFilters = {
  search: '',
  severity: [],
  status: [],
  componentName: '',
  assignedTo: '',
  dateRange: {
    start: '',
    end: ''
  },
  tags: []
};

const DEFAULT_SORT: ErrorLogSort = {
  field: 'occurred_at',
  direction: 'desc'
};

const DEFAULT_PAGE_SIZE = 25;

export const useErrorLogs = (options: UseErrorLogsOptions = {}): UseErrorLogsReturn => {
  const {
    initialFilters = {},
    initialSort = DEFAULT_SORT,
    initialPageSize = DEFAULT_PAGE_SIZE,
    autoRefresh = true,
    refreshInterval = 30000 // 30 seconds
  } = options;

  // State
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<ErrorLogFilters>({ 
    ...DEFAULT_FILTERS, 
    ...initialFilters 
  });
  const [sort, setSortState] = useState<ErrorLogSort>(initialSort);
  const [selectedErrors, setSelectedErrors] = useState<string[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Metadata state
  const [availableComponents, setAvailableComponents] = useState<string[]>([]);
  const [availableAssignees, setAvailableAssignees] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // Build query based on filters and sort
  const buildQuery = useCallback(() => {
    const client = SupabaseClientService.getInstance().getClientSafe();
    if (!client) {
      throw new Error('Database client not initialized');
    }
    let query = client
      .from('error_logs')
      .select('*', { count: 'exact' });

    // Apply search filter
    if (filters.search) {
      query = query.or(`error_message.ilike.%${filters.search}%,component_name.ilike.%${filters.search}%,file_path.ilike.%${filters.search}%`);
    }

    // Apply severity filter
    if (filters.severity.length > 0) {
      query = query.in('severity', filters.severity);
    }

    // Apply status filter
    if (filters.status.length > 0) {
      query = query.in('status', filters.status);
    }

    // Apply component filter
    if (filters.componentName) {
      query = query.eq('component_name', filters.componentName);
    }

    // Apply assigned to filter
    if (filters.assignedTo) {
      query = query.eq('assigned_to', filters.assignedTo);
    }

    // Apply date range filter
    if (filters.dateRange.start) {
      query = query.gte('occurred_at', filters.dateRange.start);
    }
    if (filters.dateRange.end) {
      query = query.lte('occurred_at', filters.dateRange.end + 'T23:59:59.999Z');
    }

    // Apply tags filter (PostgreSQL array contains)
    if (filters.tags.length > 0) {
      query = query.contains('tags', filters.tags);
    }

    // Apply sorting
    query = query.order(sort.field, { ascending: sort.direction === 'asc' });

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    return query;
  }, [filters, sort, page, pageSize]);

  // Fetch errors data
  const fetchErrors = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError, count } = await buildQuery();

      if (queryError) {
        throw queryError;
      }

      setErrors(data as ErrorLog[] || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Failed to fetch error logs:', err);
      setError('Failed to load error logs. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [buildQuery]);

  // Fetch metadata (components, assignees, tags)
  const fetchMetadata = useCallback(async () => {
    try {
      const client = SupabaseClientService.getInstance().getClientSafe();
      if (!client) {
        console.warn('Database client not ready for metadata fetch');
        return;
      }
      
      // Fetch distinct components
      const { data: componentsData } = await client
        .from('error_logs')
        .select('component_name')
        .not('component_name', 'is', null)
        .order('component_name');

      const uniqueComponents = [...new Set(
        componentsData?.map(item => item.component_name).filter(Boolean) || []
      )];
      setAvailableComponents(uniqueComponents);

      // Fetch distinct assignees
      const { data: assigneesData } = await client
        .from('error_logs')
        .select('assigned_to')
        .not('assigned_to', 'is', null)
        .order('assigned_to');

      const uniqueAssignees = [...new Set(
        assigneesData?.map(item => item.assigned_to).filter(Boolean) || []
      )];
      setAvailableAssignees(uniqueAssignees);

      // Fetch distinct tags (flatten array of arrays)
      const { data: tagsData } = await client
        .from('error_logs')
        .select('tags')
        .not('tags', 'is', null);

      const allTags = tagsData?.reduce((acc, item) => {
        if (Array.isArray(item.tags)) {
          acc.push(...item.tags);
        }
        return acc;
      }, [] as string[]) || [];

      const uniqueTags = [...new Set(allTags)].sort();
      setAvailableTags(uniqueTags);
    } catch (err) {
      console.error('Failed to fetch metadata:', err);
    }
  }, []);

  // Set up real-time subscriptions
  useEffect(() => {
    const client = SupabaseClientService.getInstance().getClientSafe();
    if (!client) {
      console.warn('Database client not ready for real-time subscriptions');
      return;
    }
    const channel = client
      .channel('error_logs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'error_logs'
        },
        (payload) => {
          console.log('Error logs change detected:', payload);
          // Refresh data when changes occur
          fetchErrors();
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [fetchErrors]);

  // Set up auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchErrors, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchErrors]);

  // Initial data fetch
  useEffect(() => {
    fetchErrors();
  }, [fetchErrors]);

  // Fetch metadata on mount
  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filters, sort]);

  // Public API
  const setFilters = useCallback((newFilters: Partial<ErrorLogFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
    setSelectedErrors([]); // Clear selection when filters change
  }, []);

  const setSort = useCallback((newSort: ErrorLogSort) => {
    setSortState(newSort);
    setSelectedErrors([]); // Clear selection when sort changes
  }, []);

  const refresh = useCallback(() => {
    fetchErrors();
    fetchMetadata();
  }, [fetchErrors, fetchMetadata]);

  const updateErrorStatus = useCallback(async (
    errorId: string, 
    status: ErrorStatus, 
    assignedTo?: string, 
    notes?: string
  ): Promise<boolean> => {
    try {
      const success = await ErrorLoggingService.updateErrorStatus(
        errorId, 
        status, 
        assignedTo, 
        notes
      );
      
      if (success) {
        // Update local state immediately
        setErrors(prev => prev.map(error => 
          error.id === errorId 
            ? { 
                ...error, 
                status, 
                assigned_to: assignedTo || error.assigned_to,
                resolution_notes: notes || error.resolution_notes,
                updated_at: new Date().toISOString()
              }
            : error
        ));
        
        // Refresh to get latest data
        setTimeout(fetchErrors, 1000);
      }
      
      return success;
    } catch (err) {
      console.error('Failed to update error status:', err);
      setError('Failed to update error status');
      return false;
    }
  }, [fetchErrors]);

  const bulkAction = useCallback(async (
    errorIds: string[], 
    action: string, 
    payload: any
  ): Promise<boolean> => {
    try {
      if (action === 'update_status') {
        const promises = errorIds.map(id => 
          updateErrorStatus(id, payload.status, payload.assignedTo, payload.notes)
        );
        const results = await Promise.all(promises);
        return results.every(result => result);
      }

      // Add more bulk actions as needed
      return false;
    } catch (err) {
      console.error('Failed to perform bulk action:', err);
      setError('Failed to perform bulk action');
      return false;
    }
  }, [updateErrorStatus]);

  const exportData = useCallback(async (format: 'csv' | 'json'): Promise<void> => {
    try {
      // For export, we want all data without pagination
      const client = SupabaseClientService.getInstance().getCurrentClient();
      const { data } = await client
        .from('error_logs')
        .select('*')
        .order(sort.field, { ascending: sort.direction === 'asc' });

      if (!data) return;

      if (format === 'csv') {
        // Simple CSV export
        const headers = [
          'ID', 'Occurred At', 'Severity', 'Status', 'Component', 'Error Message', 
          'File Path', 'User Email', 'Assigned To', 'Resolved At'
        ];
        
        const csvContent = [
          headers.join(','),
          ...data.map(error => [
            error.id,
            error.occurred_at,
            error.severity,
            error.status,
            error.component_name || '',
            `"${error.error_message.replace(/"/g, '""')}"`,
            error.file_path || '',
            error.user_email || '',
            error.assigned_to || '',
            error.resolved_at || ''
          ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `error-logs-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // JSON export
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `error-logs-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Failed to export data:', err);
      setError('Failed to export data');
    }
  }, [sort]);

  return {
    // Data
    errors,
    loading,
    error,
    filters,
    sort,
    selectedErrors,
    totalCount,
    page,
    pageSize,
    availableComponents,
    availableAssignees,
    availableTags,
    
    // Actions
    setFilters,
    setSort,
    setSelectedErrors,
    setPage,
    setPageSize,
    refresh,
    updateErrorStatus,
    bulkAction,
    exportData
  };
};