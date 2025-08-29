import { Button } from '@/components/common';
import { SurveyConfig, SurveyInstance } from '@/types';
import { isSurveyInstanceActive } from '@/utils';
import { getDisplayDate } from '@/utils/date.utils';
import { BarChart3, Copy, Download, ExternalLink, Settings, Trash2, TrendingUp, Upload } from 'lucide-react';
import React from 'react';

interface SurveyInstanceCardProps {
  instance: SurveyInstance;
  config?: SurveyConfig;
  surveyUrl: string;
  onToggleActive: (instance: SurveyInstance) => void;
  onSettings: (instance: SurveyInstance) => void;
  onDownload: (instanceId: string) => void;
  onVisualize: () => void;
  onAnalytics: () => void;
  onDelete: (instance: SurveyInstance) => void;
  onCopyUrl: (url: string) => void;
  onOpenUrl: (url: string) => void;
  onExport?: (instance: SurveyInstance) => void;
}

export const SurveyInstanceCard: React.FC<SurveyInstanceCardProps> = ({
  instance,
  config,
  surveyUrl,
  onToggleActive,
  onSettings,
  onDownload,
  onVisualize,
  onAnalytics,
  onDelete,
  onCopyUrl,
  onOpenUrl,
  onExport
}) => {
  const isActive = isSurveyInstanceActive(instance);

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 dark:text-white">
              {instance.title}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">{instance.description}</p>
            <span className="text-sm font-normal text-blue-600 dark:text-blue-400">
              {instance.id}
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Config: {config?.title || instance.configId}
            </p>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2">
              <span className={`px-2 py-1 text-xs rounded-full ${isActive ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                }`}>
                {isActive ? 'Active' : 'Inactive'}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Created: {new Date(instance.metadata?.createdAt || instance.createdAt).toLocaleString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric"
                })}
              </span>
              {instance.activeDateRange && instance.activeDateRange.startDate && instance.activeDateRange.endDate && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Active: <span className="text-xs text-green-600 dark:text-green-400">{getDisplayDate(instance.activeDateRange.startDate)} - {getDisplayDate(instance.activeDateRange.endDate)}</span>
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2 w-full sm:w-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onToggleActive(instance)}
              className="w-full sm:w-auto justify-start"
            >
              {instance.isActive ? 'Deactivate' : 'Activate'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onSettings(instance)}
              className="w-full sm:w-auto justify-start"
            >
              <Settings className="w-4 h-4 mr-1" />
              Settings
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDownload(instance.id)}
              className="w-full sm:w-auto justify-start"
            >
              <Download className="w-4 h-4 mr-1" />
              Download
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onVisualize}
              className="w-full sm:w-auto justify-start"
            >
              <BarChart3 className="w-4 h-4 mr-1" />
              Visualize
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onAnalytics}
              className="w-full sm:w-auto justify-start"
            >
              <TrendingUp className="w-4 h-4 mr-1" />
              Analytics
            </Button>
            {onExport && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onExport(instance)}
                className="w-full sm:w-auto justify-start"
              >
                <Upload className="w-4 h-4 mr-1" />
                Export
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete(instance)}
              className="w-full sm:w-auto justify-start"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>

        <div className="w-full">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">URL:</span>
            <code className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-2 py-1 rounded flex-1 min-w-0 break-all">
              {surveyUrl}
            </code>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onCopyUrl(surveyUrl)}
              className={`text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex-shrink-0 ${!isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={isActive ? "Copy URL" : "Survey is inactive - URL disabled"}
              disabled={!isActive}
            >
              <Copy className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onOpenUrl(surveyUrl)}
              className={`text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex-shrink-0 ${!isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={isActive ? "Open survey in new tab" : "Survey is inactive - URL disabled"}
              disabled={!isActive}
            >
              <ExternalLink className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};