import React from 'react';
import { AdaptiveSparkline as Sparkline } from '../charts';

interface StatsPanelProps {
  instanceId?: string;
  instance?: any;
  totalResponses: number;
  startDate: string;
  endDate: string;
  submissionsByDay: Array<{ x: string; y: number }>;
  todayCount: number;
  totalFiltered: number;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({
  instanceId,
  instance,
  totalResponses,
  startDate,
  endDate,
  submissionsByDay,
  todayCount,
  totalFiltered
}) => {

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 flex-shrink-0">
      <div className="p-4 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
        <div className="text-xs text-gray-500 dark:text-gray-400">Instance</div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate" title={instance?.title || instanceId}>
          {instance?.title || instanceId || 'Unknown'}
        </div>
        {instance?.description && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate" title={instance.description}>
            {instance.description}
          </div>
        )}
        {instance && (
          <div className="text-xs text-blue-500 dark:text-blue-400 mt-1">
            {instance.id}
          </div>
        )}
      </div>

      <div className="p-4 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
        <div className="text-xs text-gray-500 dark:text-gray-400">Responses</div>
        <div className="text-2xl font-semibold text-gray-900 dark:text-white">{totalResponses}</div>
      </div>

      <div className="p-4 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
        <div className="text-xs text-gray-500 dark:text-gray-400">Filtered range</div>
        <div className="text-sm text-gray-700 dark:text-gray-300 min-h-[1.5rem]">
          {startDate || endDate
            ? `${startDate ? new Date(`${startDate}T00:00:00`).toLocaleString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric"
            }) : '—'} → ${endDate ? new Date(`${endDate}T00:00:00`).toLocaleString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric"
            }) : '—'}`
            : 'All time'
          }
        </div>
      </div>

      <div className="p-4 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
        <div className="text-xs text-gray-500 dark:text-gray-400">Daily submissions</div>
        <Sparkline data={submissionsByDay} />
        <div className="text-xs text-gray-700 dark:text-gray-300 mt-2">
          Today: {todayCount} • In range: {totalFiltered}
        </div>
      </div>
    </div>
  );
};