import React from 'react';
import { Sparkline } from './charts';

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
      <div className="p-4 border rounded-lg">
        <div className="text-xs text-gray-500">Instance</div>
        <div className="text-sm bg-gray-50 px-2 py-1 rounded mt-1 truncate" title={instance?.title || instanceId}>
          {instance?.title || instanceId || 'Unknown'}
        </div>
        {instance?.description && (
          <div className="text-xs text-gray-500 mt-1 truncate" title={instance.description}>
            {instance.description}
          </div>
        )}
      </div>
      
      <div className="p-4 border rounded-lg">
        <div className="text-xs text-gray-500">Responses</div>
        <div className="text-2xl font-semibold">{totalResponses}</div>
      </div>
      
      <div className="p-4 border rounded-lg">
        <div className="text-xs text-gray-500">Filtered range</div>
        <div className="text-sm text-gray-700 min-h-[1.5rem]">
          {startDate || endDate 
            ? `${startDate ? new Date(`${startDate}T00:00:00`).toLocaleDateString() : '—'} → ${endDate ? new Date(`${endDate}T00:00:00`).toLocaleDateString() : '—'}` 
            : 'All time'
          }
        </div>
      </div>
      
      <div className="p-4 border rounded-lg">
        <div className="text-xs text-gray-500">Daily submissions</div>
        <Sparkline data={submissionsByDay} />
        <div className="text-xs text-gray-700 mt-2">
          Today: {todayCount} • In range: {totalFiltered}
        </div>
      </div>
    </div>
  );
};