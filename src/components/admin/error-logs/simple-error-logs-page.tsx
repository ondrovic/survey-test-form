/**
 * Error Logs Page
 * Professional error monitoring and logging interface
 */

import React, { useState, useEffect } from 'react';
import { useToast } from '@/contexts/toast-context';
import { Modal } from '@/components/common/ui/modal';
import { ErrorLoggingService } from '@/services/error-logging.service';

interface SimpleErrorLog {
  id: string;
  occurred_at: string;
  severity: string;
  error_message: string;
  component_name?: string;
  file_path?: string;
  user_email?: string;
  stack_trace?: string;
}

export const SimpleErrorLogsPage: React.FC = () => {
  const [selectedError, setSelectedError] = useState<SimpleErrorLog | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string[]>([]);
  const [allErrors, setAllErrors] = useState<SimpleErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const { showError } = useToast();

  // Fetch all errors from the service
  const fetchErrors = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching errors...');
      const data = await ErrorLoggingService.getRecentErrors(1000); // Get more records
      console.log('🔍 Fetched data:', data);
      console.log('🔍 Data length:', data?.length);
      setAllErrors(data || []);
    } catch (err) {
      console.error('Failed to fetch error logs:', err);
      showError('Failed to load error logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchErrors();
  }, []);

  // Filter and search logic
  const filteredErrors = allErrors.filter(error => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        error.error_message?.toLowerCase().includes(searchLower) ||
        error.component_name?.toLowerCase().includes(searchLower) ||
        error.file_path?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Severity filter
    if (severityFilter.length > 0 && !severityFilter.includes(error.severity)) {
      return false;
    }

    return true;
  });

  // Pagination logic
  const totalCount = filteredErrors.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const errors = filteredErrors.slice(startIndex, endIndex);

  console.log('🔍 Pagination debug:', {
    allErrorsLength: allErrors.length,
    filteredErrorsLength: filteredErrors.length,
    totalCount,
    totalPages,
    page,
    pageSize,
    startIndex,
    endIndex,
    errorsLength: errors.length,
    searchTerm,
    severityFilter
  });

  // Update handlers
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setPage(1);
  };

  const handleSeverityFilterChange = (severity: string) => {
    const newSeverityFilter = severityFilter.includes(severity)
      ? severityFilter.filter(s => s !== severity)
      : [...severityFilter, severity];
    
    setSeverityFilter(newSeverityFilter);
    setPage(1);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewStack = (error: SimpleErrorLog) => {
    setSelectedError(error);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedError(null);
  };

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  return (
    <div className="p-0 sm:p-2 md:p-4 lg:p-6 w-full min-w-0">
      {/* Title and description removed - displayed in top navigation bar */}

      {/* Search and Filter Controls */}
      <div className="mb-4 sm:mb-6 space-y-4 w-full max-w-full overflow-hidden" style={{boxSizing: 'border-box'}}>
        {/* Search */}
        <div className="flex flex-col space-y-4 w-full">
          <div className="w-full relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search error messages, components, or file paths..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              style={{boxSizing: 'border-box', width: '100%', maxWidth: '100%'}}
            />
          </div>
          
          {/* Page Size Selector */}
          <div className="flex items-center space-x-2 w-full justify-center sm:justify-start">
            <label htmlFor="pageSize" className="text-sm font-medium text-gray-700 whitespace-nowrap">Show:</label>
            <select
              id="pageSize"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Severity Filter */}
        <div className="flex flex-col space-y-2 w-full">
          <span className="text-sm font-medium text-gray-700 text-center sm:text-left">Filter by severity:</span>
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
            {['critical', 'high', 'medium', 'low'].map((severity) => (
              <button
                key={severity}
                onClick={() => handleSeverityFilterChange(severity)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  severityFilter.includes(severity)
                    ? getSeverityColor(severity)
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {severity}
              </button>
            ))}
            {severityFilter.length > 0 && (
              <button
                onClick={() => {
                  setSeverityFilter([]);
                  setPage(1);
                }}
                className="px-3 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="ml-3 text-gray-600">Loading error logs...</p>
        </div>
      ) : errors.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">No error logs found. This is good! 🎉</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg w-full min-w-0" style={{boxSizing: 'border-box'}}>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date/Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Message
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Component/File
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {errors.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(log.occurred_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(log.severity)}`}>
                        {log.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-md">
                      <div className="truncate" title={log.error_message}>
                        {log.error_message}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                      <div className="truncate">
                        {log.component_name && <div className="font-medium">{log.component_name}</div>}
                        {log.file_path && <div className="text-xs text-gray-400">{log.file_path}</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.user_email || 'Anonymous'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.stack_trace ? (
                        <button 
                          onClick={() => handleViewStack(log)}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                          title="Click to view stack trace details"
                        >
                          View Stack
                        </button>
                      ) : (
                        'N/A'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3 p-2 w-full min-w-0" style={{boxSizing: 'border-box', width: '100%', maxWidth: '100%'}}>
            {errors.map((log) => (
              <div key={log.id} className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow w-full overflow-hidden" style={{maxWidth: '100%', boxSizing: 'border-box', width: '100%'}}>
                {/* Card Header */}
                <div className="flex items-start justify-between mb-2 gap-2">
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(log.severity)}`}>
                      {log.severity}
                    </span>
                    <div className="text-xs text-gray-500 truncate">
                      {new Date(log.occurred_at).toLocaleString()}
                    </div>
                  </div>
                  {log.stack_trace && (
                    <button 
                      onClick={() => handleViewStack(log)}
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium px-2 py-1 border border-blue-300 rounded flex-shrink-0"
                      title="Click to view stack trace details"
                    >
                      View Stack
                    </button>
                  )}
                </div>

                {/* Error Message */}
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-gray-900 mb-1">Error Message</h4>
                  <p className="text-sm text-gray-700 break-words">
                    {log.error_message}
                  </p>
                </div>

                {/* Component and File Path */}
                {(log.component_name || log.file_path) && (
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Component/File</h4>
                    <div className="text-sm text-gray-600">
                      {log.component_name && (
                        <div className="font-medium">{log.component_name}</div>
                      )}
                      {log.file_path && (
                        <div className="text-xs text-gray-400 font-mono break-all w-full" style={{wordBreak: 'break-word', overflowWrap: 'anywhere'}}>{log.file_path}</div>
                      )}
                    </div>
                  </div>
                )}

                {/* User */}
                <div className="text-sm text-gray-600 pt-3 border-t border-gray-100">
                  <span className="font-medium">User:</span> {log.user_email || 'Anonymous'}
                </div>
              </div>
            ))}
          </div>
          
          {/* Pagination Controls */}
          <div className="bg-gray-50 px-2 sm:px-6 py-3 flex items-center justify-between">
            <div className="flex items-center">
              <p className="text-sm text-gray-600">
                <span className="sm:hidden">{((page - 1) * pageSize) + 1}-{Math.min(page * pageSize, totalCount)} / {totalCount}</span>
                <span className="hidden sm:inline">Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} error logs</span>
              </p>
            </div>
            
            {totalPages > 1 && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePreviousPage}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-md"
                >
                  Previous
                </button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`relative inline-flex items-center px-3 py-2 border text-sm font-medium rounded-md ${
                          pageNum === page
                            ? 'border-blue-500 bg-blue-50 text-blue-600'
                            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={handleNextPage}
                  disabled={page === totalPages}
                  className="relative inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-md"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stack Trace Modal */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} size="lg">
        <Modal.Header>
          <Modal.Title>Error Stack Trace</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedError && (
            <div className="space-y-4">
              <div className="border-b pb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(selectedError.severity)}`}>
                    {selectedError.severity}
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(selectedError.occurred_at).toLocaleString()}
                  </span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  {selectedError.error_message}
                </h3>
                {selectedError.component_name && (
                  <p className="text-sm text-gray-600">
                    Component: <span className="font-medium">{selectedError.component_name}</span>
                  </p>
                )}
                {selectedError.file_path && (
                  <p className="text-sm text-gray-600">
                    File: <span className="font-mono text-xs">{selectedError.file_path}</span>
                  </p>
                )}
                {selectedError.user_email && (
                  <p className="text-sm text-gray-600">
                    User: <span className="font-medium">{selectedError.user_email}</span>
                  </p>
                )}
              </div>
              
              {selectedError.stack_trace && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Stack Trace:</h4>
                  <pre className="bg-gray-50 border rounded-md p-3 text-xs overflow-x-auto text-gray-700 whitespace-pre-wrap font-mono">
                    {selectedError.stack_trace}
                  </pre>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <button
            onClick={handleCloseModal}
            className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
          >
            Close
          </button>
        </Modal.Footer>
      </Modal>

    </div>
  );
};