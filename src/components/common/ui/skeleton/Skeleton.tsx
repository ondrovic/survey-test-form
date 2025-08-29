/**
 * Reusable Skeleton Components
 * Based on Pagedone.io templates for consistent loading states
 */

import React from 'react';
import { clsx } from 'clsx';

interface SkeletonBaseProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  animate?: boolean;
}

const SkeletonBase: React.FC<SkeletonBaseProps> = ({
  className,
  animate = true,
  ...props
}) => {
  return (
    <div
      className={clsx(
        'bg-gray-200 dark:bg-gray-700 rounded',
        animate && 'animate-pulse',
        className
      )}
      {...props}
    />
  );
};

// Default Placeholder Component
export interface SkeletonProps {
  lines?: number;
  className?: string;
  animate?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  lines = 3,
  className,
  animate = true
}) => {
  return (
    <div className={clsx('space-y-3', className)}>
      {Array.from({ length: lines }, (_, i) => (
        <SkeletonBase
          key={i}
          className={clsx(
            'h-4',
            i === lines - 1 ? 'w-3/4' : 'w-full'
          )}
          animate={animate}
        />
      ))}
    </div>
  );
};

// Image Placeholder Component
export interface SkeletonImageProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  animate?: boolean;
  showIcon?: boolean;
}

export const SkeletonImage: React.FC<SkeletonImageProps> = ({
  width,
  height,
  className,
  animate = true,
  showIcon = true
}) => {
  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div
      className={clsx(
        'bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center',
        animate && 'animate-pulse',
        !width && 'w-full',
        !height && 'h-48',
        className
      )}
      style={style}
    >
      {showIcon && (
        <svg
          className="w-10 h-10 text-gray-300 dark:text-gray-600"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 20 18"
        >
          <path d="M18 0H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2Zm-5.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm4.376 10.481A1 1 0 0 1 16 15H4a1 1 0 0 1-.895-1.447l3.5-7A1 1 0 0 1 7.468 6a.965.965 0 0 1 .9.5l2.775 4.757 1.546-1.887a1 1 0 0 1 1.618.1l2.541 4a1 1 0 0 1 .028 1.011Z" />
        </svg>
      )}
    </div>
  );
};

// Card Placeholder Component
export interface SkeletonCardProps {
  hasImage?: boolean;
  imageHeight?: string;
  titleLines?: number;
  contentLines?: number;
  hasActions?: boolean;
  className?: string;
  animate?: boolean;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  hasImage = true,
  imageHeight = 'h-48',
  titleLines = 1,
  contentLines = 3,
  hasActions = false,
  className,
  animate = true
}) => {
  return (
    <div className={clsx(
      'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden',
      className
    )}>
      {hasImage && (
        <SkeletonImage
          className={clsx('w-full rounded-t-lg rounded-b-none', imageHeight)}
          animate={animate}
          showIcon={false}
        />
      )}
      
      <div className="p-6">
        {/* Title skeleton */}
        <div className="space-y-2 mb-4">
          {Array.from({ length: titleLines }, (_, i) => (
            <SkeletonBase
              key={`title-${i}`}
              className={clsx(
                'h-5',
                i === 0 ? 'w-3/4' : 'w-1/2'
              )}
              animate={animate}
            />
          ))}
        </div>

        {/* Content skeleton */}
        <div className="space-y-2 mb-4">
          {Array.from({ length: contentLines }, (_, i) => (
            <SkeletonBase
              key={`content-${i}`}
              className={clsx(
                'h-4',
                i === contentLines - 1 ? 'w-2/3' : 'w-full'
              )}
              animate={animate}
            />
          ))}
        </div>

        {/* Actions skeleton */}
        {hasActions && (
          <div className="flex space-x-3 mt-6">
            <SkeletonBase
              className="h-10 w-20"
              animate={animate}
            />
            <SkeletonBase
              className="h-10 w-16"
              animate={animate}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// Table Row Skeleton
export interface SkeletonTableRowProps {
  columns?: number;
  className?: string;
  animate?: boolean;
}

export const SkeletonTableRow: React.FC<SkeletonTableRowProps> = ({
  columns = 4,
  className,
  animate = true
}) => {
  return (
    <tr className={className}>
      {Array.from({ length: columns }, (_, i) => (
        <td key={i} className="px-6 py-4 whitespace-nowrap">
          <SkeletonBase
            className="h-4 w-full"
            animate={animate}
          />
        </td>
      ))}
    </tr>
  );
};

// List Item Skeleton
export interface SkeletonListItemProps {
  hasAvatar?: boolean;
  hasSecondaryText?: boolean;
  hasActions?: boolean;
  className?: string;
  animate?: boolean;
}

export const SkeletonListItem: React.FC<SkeletonListItemProps> = ({
  hasAvatar = false,
  hasSecondaryText = true,
  hasActions = false,
  className,
  animate = true
}) => {
  return (
    <div className={clsx('flex items-center space-x-4 p-4', className)}>
      {hasAvatar && (
        <SkeletonBase
          className="h-10 w-10 rounded-full flex-shrink-0"
          animate={animate}
        />
      )}
      
      <div className="flex-1 space-y-2">
        <SkeletonBase
          className="h-4 w-3/4"
          animate={animate}
        />
        {hasSecondaryText && (
          <SkeletonBase
            className="h-3 w-1/2"
            animate={animate}
          />
        )}
      </div>
      
      {hasActions && (
        <SkeletonBase
          className="h-8 w-16"
          animate={animate}
        />
      )}
    </div>
  );
};

// Chart Skeleton
export interface SkeletonChartProps {
  type?: 'bar' | 'line' | 'pie' | 'donut';
  height?: string;
  hasLegend?: boolean;
  className?: string;
  animate?: boolean;
}

export const SkeletonChart: React.FC<SkeletonChartProps> = ({
  type = 'bar',
  height = 'h-64',
  hasLegend = false,
  className,
  animate = true
}) => {
  return (
    <div className={clsx('space-y-4', className)}>
      {/* Chart area */}
      <div className={clsx('bg-gray-100 dark:bg-gray-800 rounded-lg p-6', height)}>
        {type === 'bar' && (
          <div className="flex items-end justify-between space-x-2 h-full">
            {Array.from({ length: 6 }, (_, i) => (
              <SkeletonBase
                key={i}
                className="w-full bg-gray-200 dark:bg-gray-700"
                style={{ height: `${Math.random() * 80 + 20}%` }}
                animate={animate}
              />
            ))}
          </div>
        )}
        
        {type === 'line' && (
          <div className="relative h-full">
            <SkeletonBase
              className="absolute inset-0 bg-gray-200 dark:bg-gray-700"
              animate={animate}
            />
            <svg className="absolute inset-0 w-full h-full">
              <path
                d="M 0,50 Q 25,25 50,35 T 100,40"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                className="text-gray-300 dark:text-gray-600"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>
        )}
        
        {(type === 'pie' || type === 'donut') && (
          <div className="flex items-center justify-center h-full">
            <SkeletonBase
              className="w-32 h-32 rounded-full"
              animate={animate}
            />
          </div>
        )}
      </div>
      
      {/* Legend */}
      {hasLegend && (
        <div className="flex flex-wrap gap-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex items-center space-x-2">
              <SkeletonBase
                className="w-3 h-3 rounded-full"
                animate={animate}
              />
              <SkeletonBase
                className="h-4 w-16"
                animate={animate}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Stats Card Skeleton
export interface SkeletonStatsCardProps {
  hasIcon?: boolean;
  hasChart?: boolean;
  className?: string;
  animate?: boolean;
}

export const SkeletonStatsCard: React.FC<SkeletonStatsCardProps> = ({
  hasIcon = true,
  hasChart = false,
  className,
  animate = true
}) => {
  return (
    <div className={clsx(
      'bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700',
      className
    )}>
      <div className="flex items-center">
        {hasIcon && (
          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg mr-4">
            <SkeletonBase
              className="w-6 h-6"
              animate={animate}
            />
          </div>
        )}
        <div className="flex-1">
          <SkeletonBase
            className="h-4 w-20 mb-2"
            animate={animate}
          />
          <SkeletonBase
            className="h-8 w-16"
            animate={animate}
          />
        </div>
      </div>
      
      {hasChart && (
        <div className="mt-4">
          <SkeletonBase
            className="h-16 w-full"
            animate={animate}
          />
        </div>
      )}
    </div>
  );
};

// Long Running Activity Skeleton
export interface SkeletonLongRunningProps {
  title?: string;
  description?: string;
  progress?: number; // 0-100 percentage
  showProgress?: boolean;
  className?: string;
  animate?: boolean;
}

export const SkeletonLongRunning: React.FC<SkeletonLongRunningProps> = ({
  title = "Processing...",
  description = "This may take a few moments",
  progress,
  showProgress = false,
  className,
  animate = true
}) => {
  return (
    <div className={clsx(
      'bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8',
      className
    )}>
      <div className="flex flex-col items-center justify-center space-y-6">
        {/* Animated spinner */}
        <div className="relative">
          <div className={clsx(
            'w-12 h-12 border-4 border-gray-200 dark:border-gray-600 rounded-full',
            animate && 'animate-spin'
          )}>
            <div className="absolute top-0 left-0 w-12 h-12 border-4 border-transparent border-t-blue-600 rounded-full"></div>
          </div>
          {progress !== undefined && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                {Math.round(progress)}%
              </span>
            </div>
          )}
        </div>

        {/* Title and description */}
        <div className="text-center space-y-2">
          <div className="text-lg font-medium text-gray-900 dark:text-white">
            {title}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {description}
          </div>
        </div>

        {/* Progress bar */}
        {showProgress && (
          <div className="w-full max-w-sm">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className={clsx(
                  'bg-blue-600 h-2 rounded-full transition-all duration-300',
                  progress === undefined && animate && 'animate-pulse'
                )}
                style={{ 
                  width: progress !== undefined ? `${progress}%` : '60%' 
                }}
              />
            </div>
          </div>
        )}

        {/* Activity indicators */}
        <div className="flex space-x-1">
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={i}
              className={clsx(
                'w-2 h-2 bg-blue-600 rounded-full',
                animate && 'animate-bounce'
              )}
              style={{ 
                animationDelay: animate ? `${i * 0.1}s` : undefined 
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Full page loading skeleton
export interface SkeletonPageProps {
  hasHeader?: boolean;
  hasNavigation?: boolean;
  contentType?: 'table' | 'cards' | 'list';
  itemCount?: number;
  className?: string;
  animate?: boolean;
}

export const SkeletonPage: React.FC<SkeletonPageProps> = ({
  hasHeader = true,
  hasNavigation = false,
  contentType = 'cards',
  itemCount = 6,
  className,
  animate = true
}) => {
  return (
    <div className={clsx('space-y-6', className)}>
      {/* Page header */}
      {hasHeader && (
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <SkeletonBase className="h-8 w-48" animate={animate} />
            <SkeletonBase className="h-4 w-64" animate={animate} />
          </div>
          <div className="flex space-x-3">
            <SkeletonBase className="h-10 w-20" animate={animate} />
            <SkeletonBase className="h-10 w-24" animate={animate} />
          </div>
        </div>
      )}

      {/* Navigation/filters */}
      {hasNavigation && (
        <div className="flex space-x-4">
          {Array.from({ length: 4 }, (_, i) => (
            <SkeletonBase
              key={i}
              className="h-10 w-20"
              animate={animate}
            />
          ))}
        </div>
      )}

      {/* Content */}
      {contentType === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: itemCount }, (_, i) => (
            <SkeletonCard
              key={i}
              animate={animate}
              hasImage={i % 3 === 0}
              hasActions={i % 2 === 0}
            />
          ))}
        </div>
      )}

      {contentType === 'table' && (
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                {Array.from({ length: 4 }, (_, i) => (
                  <th key={i} className="px-6 py-3">
                    <SkeletonBase className="h-4 w-20" animate={animate} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {Array.from({ length: itemCount }, (_, i) => (
                <SkeletonTableRow
                  key={i}
                  columns={4}
                  animate={animate}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {contentType === 'list' && (
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
          {Array.from({ length: itemCount }, (_, i) => (
            <SkeletonListItem
              key={i}
              hasAvatar={i % 2 === 0}
              hasActions={i % 3 === 0}
              animate={animate}
            />
          ))}
        </div>
      )}
    </div>
  );
};