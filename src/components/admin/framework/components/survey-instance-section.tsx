import { Button } from "@/components/common";
import { SurveyInstanceCard, SurveyList } from "@/components/common/framework";
import { useSurveyOperations, useSurveyUrls } from "@/hooks";
import { SurveyConfig, SurveyInstance } from "@/types";
import { Upload } from "lucide-react";
import React from "react";

interface SurveyInstanceSectionProps {
  surveyInstances: SurveyInstance[];
  getInstanceConfig: (instance: SurveyInstance) => SurveyConfig | undefined;
  onToggleActive: (instance: SurveyInstance) => void;
  onSettings: (instance: SurveyInstance) => void;
  onDelete: (instance: SurveyInstance) => void;
  onVisualize: (instance: SurveyInstance) => void;
  onExport: (instance: SurveyInstance) => void;
  onImportInstance: () => void;
}

export const SurveyInstanceSection: React.FC<SurveyInstanceSectionProps> = ({
  surveyInstances,
  getInstanceConfig,
  onToggleActive,
  onSettings,
  onDelete,
  onVisualize,
  onExport,
  onImportInstance,
}) => {
  const { downloadSurveyData } = useSurveyOperations();
  const { generateSurveyUrl, copySurveyUrl, openSurveyInNewTab } =
    useSurveyUrls();

  return (
    <SurveyList
      title="Survey Instances"
      emptyMessage="No survey instances found."
      headerActions={
        <Button variant="outline" size="sm" onClick={onImportInstance}>
          <Upload className="w-4 h-4 mr-2" />
          Import Instance
        </Button>
      }
    >
      {surveyInstances.map((instance) => (
        <SurveyInstanceCard
          key={instance.id}
          instance={instance}
          config={getInstanceConfig(instance)}
          surveyUrl={generateSurveyUrl(instance)}
          onToggleActive={onToggleActive}
          onSettings={onSettings}
          onDownload={downloadSurveyData}
          onVisualize={() => onVisualize(instance)}
          onDelete={onDelete}
          onCopyUrl={copySurveyUrl}
          onOpenUrl={openSurveyInNewTab}
          onExport={onExport}
        />
      ))}
    </SurveyList>
  );
};
