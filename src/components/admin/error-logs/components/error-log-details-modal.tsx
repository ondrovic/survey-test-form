/**
 * Error Log Details Modal Component
 * 
 * Comprehensive modal for viewing full error details, updating status,
 * assigning errors, and adding resolution notes
 */

import { clsx } from 'clsx';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ErrorLogDetailsModalProps, ErrorStatus } from '../error-logs.types';
import { ErrorLogStatusBadge } from './error-log-status-badge';

interface StatusUpdateFormData {
  status: ErrorStatus;
  assignedTo: string;
  resolutionNotes: string;
}

export const ErrorLogDetailsModal: React.FC<ErrorLogDetailsModalProps> = ({
  error,
  isOpen,
  onClose,
  onUpdateStatus,
  availableAssignees
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'context' | 'resolution'>('details');

  const { control, handleSubmit, reset, formState: { isDirty } } = useForm<StatusUpdateFormData>({
    defaultValues: {
      status: error?.status || 'open',
      assignedTo: error?.assigned_to || '',
      resolutionNotes: error?.resolution_notes || ''
    }
  });

  useEffect(() => {
    if (error) {
      reset({
        status: error.status,
        assignedTo: error.assigned_to || '',
        resolutionNotes: error.resolution_notes || ''
      });
    }
  }, [error, reset]);

  if (!isOpen || !error) return null;

  const handleStatusUpdate = async (data: StatusUpdateFormData) => {
    if (!error) return;

    setIsUpdating(true);
    try {
      await onUpdateStatus(error.id, data.status, data.assignedTo || undefined, data.resolutionNotes || undefined);
      onClose();
    } catch (err) {
      console.error('Failed to update error status:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatJsonValue = (value: any) => {
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  const tabs = [
    { id: 'details', label: 'Error Details', count: null },
    { id: 'context', label: 'Context & Stack', count: null },
    { id: 'resolution', label: 'Resolution', count: isDirty ? '•' : null }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        />

        {/* Modal positioning wrapper */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b border-gray-200">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-medium text-gray-900" id="modal-title">
                  Error Details
                </h3>
                <ErrorLogStatusBadge
                  status={error.status}
                  severity={error.severity}
                  showSeverity={true}
                />
              </div>
              <div className="text-sm text-gray-500">
                Occurred: {formatDate(error.occurred_at)} • ID: {error.id}
              </div>
            </div>
            <button
              type="button"
              className="bg-white dark:bg-gray-700 rounded-md text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="mt-4">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={clsx(
                      "py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap",
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    )}
                  >
                    {tab.label}
                    {tab.count && (
                      <span className={clsx(
                        "ml-2",
                        activeTab === tab.id ? "text-blue-600" : "text-gray-400"
                      )}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          <div className="mt-6 max-h-96 overflow-y-auto">
            {/* Error Details Tab */}
            {activeTab === 'details' && (
              <div className="space-y-6">
                {/* Error Message */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Error Message</h4>
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm text-red-800 font-mono">{error.error_message}</p>
                  </div>
                </div>

                {/* Basic Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'Error Code', value: error.error_code },
                    { label: 'Component', value: error.component_name },
                    { label: 'File Path', value: error.file_path },
                    { label: 'Line Number', value: error.line_number },
                    { label: 'Function Name', value: error.function_name },
                    { label: 'User Action', value: error.user_action },
                    { label: 'HTTP Method', value: error.http_method },
                    { label: 'URL', value: error.url },
                    { label: 'User ID', value: error.user_id },
                    { label: 'User Email', value: error.user_email },
                    { label: 'Survey Instance', value: error.survey_instance_id },
                    { label: 'Session Token', value: error.session_token }
                  ].filter(item => item.value).map((item, index) => (
                    <div key={index} className="bg-gray-50 px-3 py-2 rounded-md">
                      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {item.label}
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 break-all">
                        {item.value}
                      </dd>
                    </div>
                  ))}
                </div>

                {/* Tags */}
                {error.tags && error.tags.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {error.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Occurrence Info */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <dt className="font-medium text-yellow-800">Occurrences</dt>
                      <dd className="text-yellow-900">{error.occurrence_count}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-yellow-800">First Seen</dt>
                      <dd className="text-yellow-900">{formatDate(error.first_occurrence_at)}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-yellow-800">Last Seen</dt>
                      <dd className="text-yellow-900">{formatDate(error.last_occurrence_at)}</dd>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Context & Stack Tab */}
            {activeTab === 'context' && (
              <div className="space-y-6">
                {/* Stack Trace */}
                {error.stack_trace && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Stack Trace</h4>
                    <div className="bg-gray-900 rounded-md p-4 overflow-x-auto">
                      <pre className="text-sm text-gray-100 whitespace-pre-wrap font-mono">
                        {error.stack_trace}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Browser Info */}
                {error.browser_info && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Browser Information</h4>
                    <div className="bg-gray-50 rounded-md p-3">
                      <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                        {formatJsonValue(error.browser_info)}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Additional Context */}
                {error.additional_context && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Additional Context</h4>
                    <div className="bg-gray-50 rounded-md p-3">
                      <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                        {formatJsonValue(error.additional_context)}
                      </pre>
                    </div>
                  </div>
                )}

                {/* System Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'User Agent', value: error.user_agent },
                    { label: 'IP Address', value: error.ip_address },
                    { label: 'Screen Resolution', value: error.screen_resolution },
                    { label: 'Viewport Size', value: error.viewport_size }
                  ].filter(item => item.value).map((item, index) => (
                    <div key={index} className="bg-gray-50 px-3 py-2 rounded-md">
                      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {item.label}
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 break-all">
                        {item.value}
                      </dd>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resolution Tab */}
            {activeTab === 'resolution' && (
              <form onSubmit={handleSubmit(handleStatusUpdate)} className="space-y-6">
                {/* Current Assignment Info */}
                {(error.assigned_to || error.resolved_by) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {error.assigned_to && (
                        <div>
                          <dt className="font-medium text-blue-800">Assigned To</dt>
                          <dd className="text-blue-900">{error.assigned_to}</dd>
                        </div>
                      )}
                      {error.resolved_by && (
                        <div>
                          <dt className="font-medium text-blue-800">Resolved By</dt>
                          <dd className="text-blue-900">{error.resolved_by}</dd>
                        </div>
                      )}
                    </div>
                    {error.resolved_at && (
                      <div className="mt-2 text-sm">
                        <dt className="font-medium text-blue-800">Resolved At</dt>
                        <dd className="text-blue-900">{formatDate(error.resolved_at)}</dd>
                      </div>
                    )}
                  </div>
                )}

                {/* Status Update Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <Controller
                      name="status"
                      control={control}
                      render={({ field }) => (
                        <select
                          {...field}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                          <option value="open">Open</option>
                          <option value="investigating">Investigating</option>
                          <option value="resolved">Resolved</option>
                          <option value="ignored">Ignored</option>
                        </select>
                      )}
                    />
                  </div>

                  <div>
                    <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 mb-2">
                      Assign To
                    </label>
                    <Controller
                      name="assignedTo"
                      control={control}
                      render={({ field }) => (
                        <select
                          {...field}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                          <option value="">Unassigned</option>
                          {availableAssignees.map((assignee) => (
                            <option key={assignee} value={assignee}>
                              {assignee}
                            </option>
                          ))}
                        </select>
                      )}
                    />
                  </div>
                </div>

                {/* Resolution Notes */}
                <div>
                  <label htmlFor="resolutionNotes" className="block text-sm font-medium text-gray-700 mb-2">
                    Resolution Notes
                  </label>
                  <Controller
                    name="resolutionNotes"
                    control={control}
                    render={({ field }) => (
                      <textarea
                        {...field}
                        rows={4}
                        placeholder="Add notes about the resolution, investigation findings, or next steps..."
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    )}
                  />
                </div>

                {/* Existing Resolution Notes */}
                {error.resolution_notes && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Previous Notes</h4>
                    <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {error.resolution_notes}
                      </p>
                    </div>
                  </div>
                )}

                {/* Update Button */}
                {isDirty && (
                  <div className="pt-4 border-t border-gray-200">
                    <button
                      type="submit"
                      disabled={isUpdating}
                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUpdating ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Updating...
                        </>
                      ) : (
                        'Update Error Status'
                      )}
                    </button>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};