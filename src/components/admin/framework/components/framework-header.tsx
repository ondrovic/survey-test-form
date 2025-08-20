import { Button } from '@/components/common';
import { SurveyConfig } from '@/types';
import { AlertTriangle, Plus, Upload } from 'lucide-react';
import React from 'react';

interface ValidationStatus {
  hasErrors: boolean;
  errorCount: number;
  lastChecked: Date | null;
}

interface FrameworkHeaderProps {
  surveyConfigs: SurveyConfig[];
  onCreateNewSurvey: () => void;
  onImportConfig: () => void;
  validationStatus: ValidationStatus;
  onVerifyConfig: () => Promise<void>;
}

export const FrameworkHeader: React.FC<FrameworkHeaderProps> = ({
  surveyConfigs,
  onCreateNewSurvey,
  onImportConfig,
  validationStatus,
  onVerifyConfig
}) => {
  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">Survey Framework</h2>
          {surveyConfigs.length > 0 && validationStatus.hasErrors && (
            <div className="flex items-center gap-2 px-3 py-1 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-700 font-medium">
                {validationStatus.errorCount} Validation Error{validationStatus.errorCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}
          {surveyConfigs.length > 0 && validationStatus.lastChecked && !validationStatus.hasErrors && (
            <div className="flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-lg">
              <span className="text-sm text-green-700 font-medium">✅ All Configurations Valid</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onVerifyConfig}
            disabled={surveyConfigs.length === 0}
            className={validationStatus.hasErrors
              ? "text-red-600 border-red-600 hover:bg-red-50"
              : "text-green-600 border-green-600 hover:bg-green-50"
            }
          >
            {validationStatus.hasErrors ? (
              <>
                <AlertTriangle className="w-4 h-4 mr-2" />
                Fix Issues
              </>
            ) : (
              'Validate Config'
            )}
          </Button>
          <Button
            variant="outline"
            onClick={onImportConfig}
          >
            <Upload className="w-4 h-4 mr-2" />
            Import Config
          </Button>
          <Button onClick={onCreateNewSurvey}>
            <Plus className="w-4 h-4 mr-2" />
            Create New Survey
          </Button>
        </div>
      </div>
    </>
  );
};