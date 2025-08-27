/**
 * Error Logs Table Component
 * 
 * Responsive data table with sorting, pagination, row expansion, and bulk actions
 */

import React, { useState, useMemo } from 'react';
import { clsx } from 'clsx';
import { ErrorLogTableProps, SortField, SortDirection } from '../error-logs.types';
import { ErrorLogStatusBadge, getSeverityColorClasses } from './error-log-status-badge';

const sortableColumns: { key: SortField; label: string; className?: string }[] = [
  { key: 'occurred_at', label: 'Date/Time', className: 'min-w-[140px]' },
  { key: 'severity', label: 'Severity', className: 'min-w-[100px]' },
  { key: 'component_name', label: 'Component', className: 'min-w-[120px]' },
  { key: 'error_message', label: 'Error Message', className: 'min-w-[300px]' },
  { key: 'status', label: 'Status', className: 'min-w-[100px]' }
];

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

export const ErrorLogsTable: React.FC<ErrorLogTableProps> = ({
  errors,
  loading = false,
  onSort,
  onSelectError,
  onUpdateStatus,
  onBulkAction,
  filters,
  sort,
  selectedErrors,
  onSelectionChange,
  totalCount,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  
  const handleSort = (field: SortField) => {
    const direction: SortDirection = 
      sort.field === field && sort.direction === 'desc' ? 'asc' : 'desc';
    onSort({ field, direction });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(errors.map(error => error.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectRow = (errorId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedErrors, errorId]);
    } else {
      onSelectionChange(selectedErrors.filter(id => id !== errorId));
    }
  };

  const toggleRowExpansion = (errorId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(errorId)) {
      newExpanded.delete(errorId);
    } else {
      newExpanded.add(errorId);
    }
    setExpandedRows(newExpanded);
  };

  const handleBulkStatusUpdate = (status: string) => {
    if (selectedErrors.length > 0) {
      onBulkAction(selectedErrors, 'update_status', { status });
      onSelectionChange([]);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const truncateMessage = (message: string, maxLength: number = 100) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  const totalPages = Math.ceil(totalCount / pageSize);
  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalCount);
  
  const isAllSelected = errors.length > 0 && selectedErrors.length === errors.length;
  const isPartiallySelected = selectedErrors.length > 0 && selectedErrors.length < errors.length;

  const paginationNumbers = useMemo(() => {
    const delta = 2;
    const range: number[] = [];
    const rangeWithDots: (number | string)[] = [];

    for (let i = Math.max(2, page - delta); i <= Math.min(totalPages - 1, page + delta); i++) {
      range.push(i);
    }

    if (page - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (page + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  }, [page, totalPages]);

  if (loading) {
    return (
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="p-8 text-center">
          <div className="inline-flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            Loading error logs...
          </div>
        </div>
      </div>
    );
  }

  if (errors.length === 0) {
    return (
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="p-8 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No error logs found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filters.search || filters.severity.length > 0 || filters.status.length > 0
              ? 'Try adjusting your filters to see more results.'
              : 'No errors have been logged yet.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200">
      {/* Bulk Actions Bar */}
      {selectedErrors.length > 0 && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-sm text-blue-700">
                {selectedErrors.length} error{selectedErrors.length === 1 ? '' : 's'} selected
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <select
                onChange={(e) => handleBulkStatusUpdate(e.target.value)}
                className="text-sm border-blue-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                defaultValue=""
              >
                <option value="" disabled>Update Status</option>
                <option value="investigating">Mark as Investigating</option>
                <option value="resolved">Mark as Resolved</option>
                <option value="ignored">Mark as Ignored</option>
              </select>
              <button
                onClick={() => onSelectionChange([])}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {/* Select All Checkbox */}
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = isPartiallySelected;
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                
                {/* Expand Column */}
                <th className="px-2 py-3 text-left">
                  <span className="sr-only">Expand</span>
                </th>

                {/* Sortable Columns */}
                {sortableColumns.map((column) => (
                  <th
                    key={column.key}
                    className={clsx(
                      "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100",
                      column.className
                    )}
                    onClick={() => handleSort(column.key)}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{column.label}</span>
                      <div className="flex flex-col">
                        <svg
                          className={clsx(
                            "h-3 w-3 -mb-1",
                            sort.field === column.key && sort.direction === 'asc'
                              ? "text-gray-900"
                              : "text-gray-400"
                          )}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                        <svg
                          className={clsx(
                            "h-3 w-3",
                            sort.field === column.key && sort.direction === 'desc'
                              ? "text-gray-900"
                              : "text-gray-400"
                          )}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </th>
                ))}

                {/* Actions Column */}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {errors.map((error, index) => {
                const isExpanded = expandedRows.has(error.id);
                const isSelected = selectedErrors.includes(error.id);
                const formatted = formatDate(error.occurred_at);
                const severityColors = getSeverityColorClasses(error.severity);

                return (
                  <React.Fragment key={error.id}>
                    {/* Main Row */}
                    <tr className={clsx(
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50',
                      isSelected && 'bg-blue-50'
                    )}>
                      {/* Select Checkbox */}
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleSelectRow(error.id, e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>

                      {/* Expand Button */}
                      <td className="px-2 py-4">
                        <button
                          onClick={() => toggleRowExpansion(error.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <svg
                            className={clsx("h-4 w-4 transition-transform", isExpanded ? "rotate-90" : "")}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </td>

                      {/* Date/Time */}
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <div className="text-gray-900">{formatted.date}</div>
                        <div className="text-gray-500">{formatted.time}</div>
                      </td>

                      {/* Severity */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={clsx(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                          severityColors.bg,
                          severityColors.text
                        )}>
                          <span className={clsx("w-2 h-2 rounded-full mr-1.5", severityColors.dot)} />
                          {error.severity.charAt(0).toUpperCase() + error.severity.slice(1)}
                        </span>
                      </td>

                      {/* Component */}
                      <td className="px-4 py-4 text-sm text-gray-900">
                        <div className="font-medium">{error.component_name || 'Unknown'}</div>
                        {error.file_path && (
                          <div className="text-gray-500 text-xs">{error.file_path}</div>
                        )}
                      </td>

                      {/* Error Message */}
                      <td className="px-4 py-4 text-sm text-gray-900">
                        <div className="font-mono">
                          {truncateMessage(error.error_message)}
                        </div>
                        {error.occurrence_count > 1 && (
                          <div className="text-xs text-gray-500 mt-1">
                            {error.occurrence_count} occurrences
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <ErrorLogStatusBadge status={error.status} size="sm" showSeverity={false} />
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => onSelectError(error)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View
                          </button>
                          {error.status === 'open' && (
                            <button
                              onClick={() => onUpdateStatus(error.id, 'investigating')}
                              className="text-yellow-600 hover:text-yellow-900"
                            >
                              Investigate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Row Details */}
                    {isExpanded && (
                      <tr className="bg-gray-100">
                        <td colSpan={8} className="px-4 py-4">
                          <div className="space-y-3">
                            {/* Full Error Message */}
                            {error.error_message.length > 100 && (
                              <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-1">Full Error Message:</h4>
                                <div className="bg-red-50 border border-red-200 rounded p-2 text-sm font-mono text-red-800">
                                  {error.error_message}
                                </div>
                              </div>
                            )}

                            {/* Additional Details Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              {[
                                { label: 'User ID', value: error.user_id },
                                { label: 'User Email', value: error.user_email },
                                { label: 'Function', value: error.function_name },
                                { label: 'Line', value: error.line_number },
                                { label: 'URL', value: error.url },
                                { label: 'HTTP Method', value: error.http_method },
                                { label: 'Assigned To', value: error.assigned_to },
                                { label: 'Error Code', value: error.error_code }
                              ].filter(item => item.value).map((item, idx) => (
                                <div key={idx}>
                                  <dt className="font-medium text-gray-600">{item.label}:</dt>
                                  <dd className="text-gray-900 break-all">{item.value}</dd>
                                </div>
                              ))}
                            </div>

                            {/* Tags */}
                            {error.tags && error.tags.length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-1">Tags:</h4>
                                <div className="flex flex-wrap gap-1">
                                  {error.tags.map((tag, tagIdx) => (
                                    <span
                                      key={tagIdx}
                                      className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Resolution Notes */}
                            {error.resolution_notes && (
                              <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-1">Resolution Notes:</h4>
                                <div className="bg-white border border-gray-200 rounded p-2 text-sm text-gray-700">
                                  {error.resolution_notes}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
        <div className="flex items-center justify-between">
          {/* Results Info */}
          <div className="flex items-center">
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{startItem}</span> to{' '}
              <span className="font-medium">{endItem}</span> of{' '}
              <span className="font-medium">{totalCount}</span> results
            </p>
            <div className="ml-4 flex items-center space-x-2">
              <label htmlFor="pageSize" className="text-sm text-gray-700">
                Show:
              </label>
              <select
                id="pageSize"
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                {ITEMS_PER_PAGE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">Previous</span>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>

            {paginationNumbers.map((pageNum, index) => (
              <React.Fragment key={index}>
                {pageNum === '...' ? (
                  <span className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700">
                    ...
                  </span>
                ) : (
                  <button
                    onClick={() => onPageChange(Number(pageNum))}
                    className={clsx(
                      "relative inline-flex items-center px-4 py-2 text-sm font-medium border rounded-md",
                      page === pageNum
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-500 border-gray-300 hover:bg-gray-50"
                    )}
                  >
                    {pageNum}
                  </button>
                )}
              </React.Fragment>
            ))}

            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">Next</span>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};