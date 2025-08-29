/**
 * Error Log Status Badge Component
 * 
 * Displays error status and severity with appropriate color coding
 */

import React from 'react';
import { clsx } from 'clsx';
import { ErrorLogStatusBadgeProps, ErrorSeverity, ErrorStatus } from '../error-logs.types';

const severityConfig = {
  critical: {
    bg: 'bg-red-100 dark:bg-red-900/20',
    text: 'text-red-800 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
    dot: 'bg-red-500 dark:bg-red-400'
  },
  high: {
    bg: 'bg-orange-100 dark:bg-orange-900/20',
    text: 'text-orange-800 dark:text-orange-300',
    border: 'border-orange-200 dark:border-orange-800',
    dot: 'bg-orange-500 dark:bg-orange-400'
  },
  medium: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/20',
    text: 'text-yellow-800 dark:text-yellow-300',
    border: 'border-yellow-200 dark:border-yellow-800',
    dot: 'bg-yellow-500 dark:bg-yellow-400'
  },
  low: {
    bg: 'bg-blue-100 dark:bg-blue-900/20',
    text: 'text-blue-800 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
    dot: 'bg-blue-500 dark:bg-blue-400'
  }
} as const;

const statusConfig = {
  open: {
    bg: 'bg-red-100 dark:bg-red-900/20',
    text: 'text-red-800 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
    label: 'Open'
  },
  investigating: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/20',
    text: 'text-yellow-800 dark:text-yellow-300',
    border: 'border-yellow-200 dark:border-yellow-800',
    label: 'Investigating'
  },
  resolved: {
    bg: 'bg-green-100 dark:bg-green-900/20',
    text: 'text-green-800 dark:text-green-300',
    border: 'border-green-200 dark:border-green-800',
    label: 'Resolved'
  },
  ignored: {
    bg: 'bg-gray-100 dark:bg-gray-700',
    text: 'text-gray-800 dark:text-gray-300',
    border: 'border-gray-200 dark:border-gray-600',
    label: 'Ignored'
  }
} as const;

const sizeConfig = {
  sm: {
    padding: 'px-2 py-1',
    text: 'text-xs',
    dot: 'w-1.5 h-1.5',
    gap: 'gap-1'
  },
  md: {
    padding: 'px-2.5 py-1.5',
    text: 'text-sm',
    dot: 'w-2 h-2',
    gap: 'gap-1.5'
  },
  lg: {
    padding: 'px-3 py-2',
    text: 'text-base',
    dot: 'w-2.5 h-2.5',
    gap: 'gap-2'
  }
} as const;

export const ErrorLogStatusBadge: React.FC<ErrorLogStatusBadgeProps> = ({
  status,
  severity,
  size = 'md',
  showSeverity = true
}) => {
  const statusStyle = statusConfig[status];
  const sizeStyle = sizeConfig[size];
  const severityStyle = severity ? severityConfig[severity] : null;

  if (showSeverity && severity && severityStyle) {
    return (
      <div className={clsx('flex items-center', sizeStyle.gap)}>
        {/* Severity Badge */}
        <span
          className={clsx(
            'inline-flex items-center border rounded-full font-medium',
            sizeStyle.padding,
            sizeStyle.text,
            severityStyle.bg,
            severityStyle.text,
            severityStyle.border,
            sizeStyle.gap
          )}
        >
          <span
            className={clsx(
              'inline-block rounded-full',
              sizeStyle.dot,
              severityStyle.dot
            )}
          />
          {severity.charAt(0).toUpperCase() + severity.slice(1)}
        </span>
        
        {/* Status Badge */}
        <span
          className={clsx(
            'inline-flex items-center border rounded-full font-medium',
            sizeStyle.padding,
            sizeStyle.text,
            statusStyle.bg,
            statusStyle.text,
            statusStyle.border
          )}
        >
          {statusStyle.label}
        </span>
      </div>
    );
  }

  // Status only
  return (
    <span
      className={clsx(
        'inline-flex items-center border rounded-full font-medium',
        sizeStyle.padding,
        sizeStyle.text,
        statusStyle.bg,
        statusStyle.text,
        statusStyle.border
      )}
    >
      {statusStyle.label}
    </span>
  );
};

// Utility function to get severity color classes for other components
export const getSeverityColorClasses = (severity: ErrorSeverity) => {
  return severityConfig[severity];
};

// Utility function to get status color classes for other components
export const getStatusColorClasses = (status: ErrorStatus) => {
  return statusConfig[status];
};