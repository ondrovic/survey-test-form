/**
 * Error Logs Page Component
 * 
 * Main admin page for managing error logs with comprehensive filtering,
 * sorting, viewing, and status management capabilities
 */

import React, { useState } from 'react';
import { ErrorLogDetailsModal } from './components/error-log-details-modal';
import { ErrorLogFilters } from './components/error-log-filters';
import { ErrorLogsTable } from './components/error-logs-table';
import { ErrorLogsPageProps } from './error-logs.types';
import { useErrorLogs } from './hooks/use-error-logs';
// import { ErrorLogStatusBadge } from './components/error-log-status-badge';
import type { ErrorLog } from './error-logs.types';

export const ErrorLogsPage: React.FC<ErrorLogsPageProps> = () => {
  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
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
    setFilters,
    setSort,
    setSelectedErrors,
    setPage,
    setPageSize,
    refresh,
    updateErrorStatus,
    bulkAction,
    exportData
  } = useErrorLogs({
    initialPageSize: 25,
    autoRefresh: true,
    refreshInterval: 30000
  });

  const handleSelectError = (errorLog: ErrorLog) => {
    setSelectedError(errorLog);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedError(null);
  };

  const handleUpdateStatus = async (
    errorId: string,
    status: any,
    assignedTo?: string,
    notes?: string
  ) => {
    const success = await updateErrorStatus(errorId, status, assignedTo, notes);
    if (success && selectedError?.id === errorId) {
      // Update selected error if it's the one being viewed
      setSelectedError(prev => prev ? {
        ...prev,
        status,
        assigned_to: assignedTo || prev.assigned_to,
        resolution_notes: notes || prev.resolution_notes,
        updated_at: new Date().toISOString()
        // updated_at: new Date().toLocaleString()
      } : null);
    }
    return success;
  };

  const handleFiltersReset = () => {
    setFilters({
      search: '',
      severity: [],
      status: [],
      componentName: '',
      assignedTo: '',
      dateRange: { start: '', end: '' },
      tags: []
    });
  };

  const handleExport = async (format: 'csv' | 'json') => {
    await exportData(format);
  };

  // Get summary statistics
  const stats = {
    total: totalCount,
    critical: errors.filter(e => e.severity === 'critical').length,
    high: errors.filter(e => e.severity === 'high').length,
    medium: errors.filter(e => e.severity === 'medium').length,
    low: errors.filter(e => e.severity === 'low').length,
    unresolved: errors.filter(e => e.status === 'open' || e.status === 'investigating').length
  };

  const hasActiveFilters = filters.search ||
    filters.severity.length > 0 ||
    filters.status.length > 0 ||
    filters.componentName ||
    filters.assignedTo ||
    filters.dateRange.start ||
    filters.dateRange.end ||
    filters.tags.length > 0;

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Error Logs</h1>
          <p className="mt-1 text-sm text-gray-500">
            Monitor and manage application errors with detailed logging and resolution tracking
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
          <button
            onClick={refresh}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <svg
              className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-1 sm:space-y-0 sm:space-x-1">
            <button
              onClick={() => handleExport('csv')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Export CSV
            </button>
            <button
              onClick={() => handleExport('json')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Export JSON
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      {!loading && totalCount > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
                  <p className="text-xs font-medium text-gray-500">Total Errors</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-red-200">
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-100 rounded-md flex items-center justify-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full" />
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-2xl font-semibold text-red-900">{stats.critical}</p>
                  <p className="text-xs font-medium text-red-600">Critical</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-orange-200">
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-orange-100 rounded-md flex items-center justify-center">
                    <div className="w-3 h-3 bg-orange-500 rounded-full" />
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-2xl font-semibold text-orange-900">{stats.high}</p>
                  <p className="text-xs font-medium text-orange-600">High</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-yellow-200">
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-2xl font-semibold text-yellow-900">{stats.medium}</p>
                  <p className="text-xs font-medium text-yellow-600">Medium</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-blue-200">
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full" />
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-2xl font-semibold text-blue-900">{stats.low}</p>
                  <p className="text-xs font-medium text-blue-600">Low</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-red-200">
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-100 rounded-md flex items-center justify-center">
                    <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-2xl font-semibold text-red-900">{stats.unresolved}</p>
                  <p className="text-xs font-medium text-red-600">Unresolved</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400 dark:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error Loading Data</h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={refresh}
                  className="bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 hover:bg-red-100 dark:hover:bg-red-800 focus:ring-red-500 focus:ring-offset-red-50 dark:focus:ring-offset-red-900 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <ErrorLogFilters
        filters={filters}
        onFiltersChange={setFilters}
        onReset={handleFiltersReset}
        availableComponents={availableComponents}
        availableAssignees={availableAssignees}
        availableTags={availableTags}
      />

      {/* Active Filters Indicator */}
      {hasActiveFilters && !loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="h-4 w-4 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span className="text-sm font-medium text-blue-800">
                Filters active - showing {totalCount} of all error logs
              </span>
            </div>
            <button
              onClick={handleFiltersReset}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear all filters
            </button>
          </div>
        </div>
      )}

      {/* Error Logs Table */}
      <ErrorLogsTable
        errors={errors}
        loading={loading}
        onSort={setSort}
        onFilter={setFilters}
        onSelectError={handleSelectError}
        onUpdateStatus={handleUpdateStatus}
        onBulkAction={bulkAction}
        filters={filters}
        sort={sort}
        selectedErrors={selectedErrors}
        onSelectionChange={setSelectedErrors}
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      {/* Error Details Modal */}
      <ErrorLogDetailsModal
        error={selectedError}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onUpdateStatus={handleUpdateStatus}
        availableAssignees={availableAssignees}
      />
    </div>
  );
};