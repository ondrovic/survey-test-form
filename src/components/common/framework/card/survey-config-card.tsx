import { Button } from '@/components/common';
import { SurveyConfig } from '@/types';
import { getSurveyStats } from '@/utils/section-content.utils';
import { Edit, Plus, Trash2, Download } from 'lucide-react';
import React from 'react';

interface SurveyConfigCardProps {
  config: SurveyConfig;
  instanceCount: number;
  onEdit: (config: SurveyConfig) => void;
  onCreateInstance: (config: SurveyConfig) => void;
  onDelete: (config: SurveyConfig) => void;
  onExport: (config: SurveyConfig) => void;
}

export const SurveyConfigCard: React.FC<SurveyConfigCardProps> = ({
  config,
  instanceCount,
  onEdit,
  onCreateInstance,
  onDelete,
  onExport
}) => {
  const stats = getSurveyStats(config.sections);
  
  const formatStats = () => {
    const parts: string[] = [];
    
    parts.push(`${stats.sections} section${stats.sections !== 1 ? 's' : ''}`);
    
    if (stats.totalFields > 0) {
      if (stats.totalSectionFields > 0 && stats.totalSubsectionFields > 0) {
        parts.push(`${stats.totalFields} fields (${stats.totalSectionFields} section, ${stats.totalSubsectionFields} in subsections)`);
      } else if (stats.totalSectionFields > 0) {
        parts.push(`${stats.totalSectionFields} fields`);
      } else {
        parts.push(`${stats.totalSubsectionFields} fields in subsections`);
      }
    } else {
      parts.push('0 fields');
    }
    
    if (stats.totalSubsections > 0) {
      parts.push(`${stats.totalSubsections} subsection${stats.totalSubsections !== 1 ? 's' : ''}`);
    }
    
    return parts.join(', ');
  };

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold">{config.title}</h4>
          <p className="text-sm text-gray-600">{config.description}</p>
          <p className="text-xs text-gray-500">
            {formatStats()} • {instanceCount} instances
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(config)}
          >
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onCreateInstance(config)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Create Instance
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onExport(config)}
          >
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDelete(config)}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};