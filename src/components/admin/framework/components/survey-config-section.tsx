import { SurveyConfigCard, SurveyList } from "@/components/common";
import { SurveyConfig } from "@/types";
import React from "react";

interface SurveyConfigSectionProps {
  surveyConfigs: SurveyConfig[];
  getInstanceCount: (configId: string) => number;
  onEdit: (config: SurveyConfig) => void;
  onCreateInstance: (config: SurveyConfig) => void;
  onDelete: (config: SurveyConfig, validationResetCallback?: () => void) => void;
  onExport: (config: SurveyConfig) => void;
  validationStatus?: { hasErrors: boolean; errorCount: number };
  validationResetCallback?: () => void;
}

export const SurveyConfigSection: React.FC<SurveyConfigSectionProps> = ({
  surveyConfigs,
  getInstanceCount,
  onEdit,
  onCreateInstance,
  onDelete,
  onExport,
  validationStatus,
  validationResetCallback,
}) => {
  return (
    <SurveyList
      title="Survey Configurations"
      emptyMessage="No survey configurations found."
    >
      {surveyConfigs.map((config) => (
        <SurveyConfigCard
          key={config.id}
          config={config}
          instanceCount={getInstanceCount(config.id)}
          onEdit={onEdit}
          onCreateInstance={onCreateInstance}
          onDelete={(config) => onDelete(config, validationResetCallback)}
          onExport={onExport}
          validationStatus={validationStatus}
        />
      ))}
    </SurveyList>
  );
};
