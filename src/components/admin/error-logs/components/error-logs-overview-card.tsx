/**
 * Error Logs Overview Card Component
 * 
 * Dashboard card showing error log statistics and quick navigation to error logs page
 */

import React, { useEffect, useState } from 'react';
import { ErrorLoggingService } from '@/services/error-logging.service';
import { ErrorLogOverviewCardProps } from '../error-logs.types';
import { getSeverityColorClasses } from './error-log-status-badge';

interface ErrorStats {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  unresolved: number;
}

export const ErrorLogsOverviewCard: React.FC<ErrorLogOverviewCardProps> = ({
  onNavigateToErrorLogs,
  errorStats
}) => {
  const [stats, setStats] = useState<ErrorStats>({
    total: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    unresolved: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (errorStats) {
        setStats({
          total: errorStats.total,
          critical: errorStats.critical,
          high: errorStats.high,
          medium: errorStats.medium,
          low: errorStats.low,
          unresolved: errorStats.unresolved
        });
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const statistics = await ErrorLoggingService.getErrorStatistics(24); // Last 24 hours
        
        if (statistics) {
          setStats({
            total: statistics.totalErrors,
            critical: statistics.criticalErrors,
            high: statistics.highErrors,
            medium: statistics.mediumErrors,
            low: statistics.lowErrors,
            unresolved: statistics.openErrors + statistics.investigatingErrors
          });
        }
      } catch (err) {
        console.error('Failed to fetch error statistics:', err);
        setError('Failed to load error statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [errorStats]);

  const criticalColors = getSeverityColorClasses('critical');
  const highColors = getSeverityColorClasses('high');
  const mediumColors = getSeverityColorClasses('medium');
  const lowColors = getSeverityColorClasses('low');

  const severityStats = [
    { 
      label: 'Critical', 
      value: stats.critical, 
      colors: criticalColors,
      priority: 1
    },
    { 
      label: 'High', 
      value: stats.high, 
      colors: highColors,
      priority: 2
    },
    { 
      label: 'Medium', 
      value: stats.medium, 
      colors: mediumColors,
      priority: 3
    },
    { 
      label: 'Low', 
      value: stats.low, 
      colors: lowColors,
      priority: 4
    }
  ];

  const hasErrors = stats.total > 0;
  const hasCriticalErrors = stats.critical > 0;
  const hasUnresolvedErrors = stats.unresolved > 0;

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          {/* Header skeleton */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse flex-shrink-0"></div>
              <div className="ml-3">
                <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Statistics skeleton */}
          <div className="space-y-6">
            {/* Total errors */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
              <div>
                <div className="h-8 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
              <div className="text-right">
                <div className="h-6 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1"></div>
                <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
            </div>

            {/* Severity breakdown skeleton */}
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="flex items-center">
                  <div className="w-3 h-3 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse mr-2"></div>
                  <div className="flex-1 space-y-1">
                    <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action button skeleton */}
          <div className="mt-6">
            <div className="w-full h-10 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
          </div>

          {/* Last updated skeleton */}
          <div className="mt-3 text-center">
            <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 rounded-md flex items-center justify-center">
                <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Error Logs</h3>
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={onNavigateToErrorLogs}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              View Error Logs
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center ${
              hasCriticalErrors 
                ? 'bg-red-100 dark:bg-red-900/20' 
                : hasUnresolvedErrors 
                  ? 'bg-yellow-100 dark:bg-yellow-900/20' 
                  : hasErrors 
                    ? 'bg-blue-100 dark:bg-blue-900/20' 
                    : 'bg-green-100 dark:bg-green-900/20'
            }`}>
              {hasCriticalErrors ? (
                <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              ) : hasUnresolvedErrors ? (
                <svg className="h-4 w-4 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : hasErrors ? (
                <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              ) : (
                <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Error Logs</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Application error monitoring and tracking
              </p>
            </div>
          </div>
          
          {/* Status Indicator */}
          {hasCriticalErrors && (
            <div className="flex-shrink-0">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5 animate-pulse" />
                Critical
              </span>
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="mt-6">
          {!hasErrors ? (
            <div className="text-center py-4">
              <svg className="mx-auto h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="mt-2 text-sm font-medium text-green-600 dark:text-green-400">No errors detected</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">System running smoothly</p>
            </div>
          ) : (
            <>
              {/* Total Errors */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.total}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Errors (24h)</p>
                </div>
                {hasUnresolvedErrors && (
                  <div className="text-right">
                    <p className="text-lg font-semibold text-red-600 dark:text-red-400">{stats.unresolved}</p>
                    <p className="text-xs text-red-500 dark:text-red-400">Unresolved</p>
                  </div>
                )}
              </div>

              {/* Severity Breakdown */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                {severityStats.filter(stat => stat.value > 0).map((stat) => (
                  <div key={stat.label} className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${stat.colors.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {stat.label}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{stat.value} errors</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Priority Alert */}
              {hasCriticalErrors && (
                <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
                  <div className="flex">
                    <svg className="flex-shrink-0 h-4 w-4 text-red-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div className="ml-2">
                      <p className="text-xs font-medium text-red-800 dark:text-red-300">
                        Critical errors detected - immediate attention required
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Action Button */}
        <div className="mt-6">
          <button
            onClick={onNavigateToErrorLogs}
            className={`w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
              hasCriticalErrors
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                : hasUnresolvedErrors
                  ? 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
                  : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
            }`}
          >
            {hasCriticalErrors ? (
              <>
                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                Resolve Critical Errors
              </>
            ) : hasUnresolvedErrors ? (
              <>
                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Manage Error Logs
              </>
            ) : (
              <>
                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                View Error Logs
              </>
            )}
          </button>
        </div>

        {/* Last Updated */}
        <div className="mt-3 text-center">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Last updated: {new Date().toLocaleString(undefined, { 
              hour: '2-digit', 
              minute: '2-digit',
              second: '2-digit'
            })}
          </p>
        </div>
      </div>
    </div>
  );
};