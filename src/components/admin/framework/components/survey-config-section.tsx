import { SurveyConfigCard, SurveyList } from "@/components/common/framework";
import { SurveyConfig } from "@/types";
import React from "react";

interface SurveyConfigSectionProps {
  surveyConfigs: SurveyConfig[];
  getInstanceCount: (configId: string) => number;
  onEdit: (config: SurveyConfig) => void;
  onCreateInstance: (config: SurveyConfig) => void;
  onDelete: (config: SurveyConfig) => void;
  onExport: (config: SurveyConfig) => void;
}

export const SurveyConfigSection: React.FC<SurveyConfigSectionProps> = ({
  surveyConfigs,
  getInstanceCount,
  onEdit,
  onCreateInstance,
  onDelete,
  onExport,
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
          onDelete={onDelete}
          onExport={onExport}
        />
      ))}
    </SurveyList>
  );
};
