import { Button } from '@/components/common';
import { SurveyConfig } from '@/types';
import { AlertTriangle, Plus, Upload, X } from 'lucide-react';
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
  onClearValidationErrors?: () => void;
}

export const FrameworkHeader: React.FC<FrameworkHeaderProps> = ({
  surveyConfigs,
  onCreateNewSurvey,
  onImportConfig,
  validationStatus,
  onVerifyConfig,
  onClearValidationErrors
}) => {
  // Debug logging to see if component re-renders when validation status changes
  console.log("🖼️ FrameworkHeader rendering with validation status:", {
    hasErrors: validationStatus.hasErrors,
    errorCount: validationStatus.errorCount,
    lastChecked: validationStatus.lastChecked,
    object: validationStatus
  });
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
          {validationStatus.hasErrors && onClearValidationErrors && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearValidationErrors}
              className="text-gray-600 border-gray-600 hover:bg-gray-50"
              title="Clear validation error badges (troubleshooting)"
            >
              <X className="w-4 h-4 mr-1" />
              Clear Errors
            </Button>
          )}
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