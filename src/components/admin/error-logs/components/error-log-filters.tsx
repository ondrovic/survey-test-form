/**
 * Error Log Filters Component
 * 
 * Comprehensive filtering interface for error logs with search, severity, status,
 * date range, and component filtering capabilities
 */

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { clsx } from 'clsx';
import { ErrorLogFiltersProps, ErrorSeverity, ErrorStatus } from '../error-logs.types';

interface FilterFormData {
  search: string;
  severity: ErrorSeverity[];
  status: ErrorStatus[];
  componentName: string;
  assignedTo: string;
  dateStart: string;
  dateEnd: string;
  tags: string;
}

const severityOptions: { value: ErrorSeverity; label: string; color: string }[] = [
  { value: 'critical', label: 'Critical', color: 'text-red-600' },
  { value: 'high', label: 'High', color: 'text-orange-600' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
  { value: 'low', label: 'Low', color: 'text-blue-600' }
];

const statusOptions: { value: ErrorStatus; label: string; color: string }[] = [
  { value: 'open', label: 'Open', color: 'text-red-600' },
  { value: 'investigating', label: 'Investigating', color: 'text-yellow-600' },
  { value: 'resolved', label: 'Resolved', color: 'text-green-600' },
  { value: 'ignored', label: 'Ignored', color: 'text-gray-600' }
];

export const ErrorLogFilters: React.FC<ErrorLogFiltersProps> = ({
  filters,
  onFiltersChange,
  onReset,
  availableComponents,
  availableAssignees,
  availableTags: _availableTags
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { control, handleSubmit, reset } = useForm<FilterFormData>({
    defaultValues: {
      search: filters.search,
      severity: filters.severity,
      status: filters.status,
      componentName: filters.componentName,
      assignedTo: filters.assignedTo,
      dateStart: filters.dateRange.start,
      dateEnd: filters.dateRange.end,
      tags: filters.tags.join(', ')
    }
  });


  const handleFormSubmit = (data: FilterFormData) => {
    const updatedFilters = {
      search: data.search,
      severity: data.severity,
      status: data.status,
      componentName: data.componentName,
      assignedTo: data.assignedTo,
      dateRange: {
        start: data.dateStart,
        end: data.dateEnd
      },
      tags: data.tags.split(',').map(tag => tag.trim()).filter(Boolean)
    };
    onFiltersChange(updatedFilters);
  };

  const handleReset = () => {
    reset({
      search: '',
      severity: [],
      status: [],
      componentName: '',
      assignedTo: '',
      dateStart: '',
      dateEnd: '',
      tags: ''
    });
    onReset();
  };

  const handleQuickSearch = (search: string) => {
    onFiltersChange({ search });
  };

  // Quick filter buttons for common scenarios
  const quickFilters = [
    { label: 'Critical Only', filters: { severity: ['critical'] as ErrorSeverity[] } },
    { label: 'High & Critical', filters: { severity: ['critical', 'high'] as ErrorSeverity[] } },
    { label: 'Unresolved', filters: { status: ['open', 'investigating'] as ErrorStatus[] } },
    { label: 'Recent (24h)', filters: { 
      dateRange: { 
        start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
        end: new Date().toISOString().split('T')[0] 
      }
    }}
  ];

  const activeFiltersCount = [
    filters.search && 1,
    filters.severity.length,
    filters.status.length,
    filters.componentName && 1,
    filters.assignedTo && 1,
    (filters.dateRange.start || filters.dateRange.end) && 1,
    filters.tags.length
  ].filter(Boolean).length;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Search Bar and Quick Actions */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <Controller
              name="search"
              control={control}
              render={({ field }) => (
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    {...field}
                    type="text"
                    placeholder="Search error messages, components, or file paths..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    onChange={(e) => {
                      field.onChange(e);
                      handleQuickSearch(e.target.value);
                    }}
                  />
                </div>
              )}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className={clsx(
                "inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
                isExpanded ? "text-blue-600 border-blue-300" : "text-gray-700"
              )}
            >
              <svg className={clsx("mr-2 h-4 w-4 transition-transform", isExpanded ? "rotate-180" : "")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              Filters
              {activeFiltersCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-blue-600 bg-blue-100 rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={handleReset}
              disabled={activeFiltersCount === 0}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Quick Filter Buttons */}
        <div className="mt-3 flex flex-wrap gap-2">
          {quickFilters.map((quickFilter, index) => (
            <button
              key={index}
              type="button"
              onClick={() => onFiltersChange(quickFilter.filters)}
              className="inline-flex items-center px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {quickFilter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-4 space-y-4 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Severity Filter */}
            <div>
              <fieldset>
                <legend className="block text-sm font-medium text-gray-700 mb-2">
                  Severity Level
                </legend>
              <Controller
                name="severity"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    {severityOptions.map((option) => (
                      <label key={option.value} className="flex items-center">
                        <input
                          type="checkbox"
                          value={option.value}
                          checked={field.value.includes(option.value)}
                          onChange={(e) => {
                            const newValue = e.target.checked
                              ? [...field.value, option.value]
                              : field.value.filter(v => v !== option.value);
                            field.onChange(newValue);
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className={clsx("ml-2 text-sm", option.color)}>
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              />
              </fieldset>
            </div>

            {/* Status Filter */}
            <div>
              <fieldset>
                <legend className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </legend>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    {statusOptions.map((option) => (
                      <label key={option.value} className="flex items-center">
                        <input
                          type="checkbox"
                          value={option.value}
                          checked={field.value.includes(option.value)}
                          onChange={(e) => {
                            const newValue = e.target.checked
                              ? [...field.value, option.value]
                              : field.value.filter(v => v !== option.value);
                            field.onChange(newValue);
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className={clsx("ml-2 text-sm", option.color)}>
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              />
              </fieldset>
            </div>

            {/* Component Filter */}
            <div>
              <label htmlFor="componentName" className="block text-sm font-medium text-gray-700 mb-2">
                Component
              </label>
              <Controller
                name="componentName"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    id="componentName"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">All Components</option>
                    {availableComponents.map((component) => (
                      <option key={component} value={component}>
                        {component}
                      </option>
                    ))}
                  </select>
                )}
              />
            </div>

            {/* Assigned To Filter */}
            <div>
              <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 mb-2">
                Assigned To
              </label>
              <Controller
                name="assignedTo"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    id="assignedTo"
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

            {/* Date Range */}
            <div>
              <fieldset>
                <legend className="block text-sm font-medium text-gray-700 mb-2">
                  Date Range
                </legend>
              <div className="grid grid-cols-2 gap-2">
                <Controller
                  name="dateStart"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="date"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  )}
                />
                <Controller
                  name="dateEnd"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="date"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  )}
                />
              </div>
              </fieldset>
            </div>

            {/* Tags Filter */}
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                Tags (comma-separated)
              </label>
              <Controller
                name="tags"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    id="tags"
                    type="text"
                    placeholder="api, network, critical"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                )}
              />
            </div>
          </div>

          {/* Apply Filters Button */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Apply Filters
            </button>
          </div>
        </form>
      )}
    </div>
  );
};