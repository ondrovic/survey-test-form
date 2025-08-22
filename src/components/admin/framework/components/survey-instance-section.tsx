import { Button, SurveyInstanceCard, SurveyList } from "@/components/common";
import { useSurveyOperations, useSurveyUrls } from "@/hooks";
import { SurveyConfig, SurveyInstance } from "@/types";
import { Upload } from "lucide-react";
import React from "react";

interface SurveyInstanceSectionProps {
  surveyInstances: SurveyInstance[];
  getInstanceConfig: (instance: SurveyInstance) => SurveyConfig | undefined;
  onToggleActive: (instance: SurveyInstance) => void;
  onSettings: (instance: SurveyInstance) => void;
  onDelete: (instance: SurveyInstance, validationResetCallback?: () => void) => void;
  onVisualize: (instance: SurveyInstance) => void;
  onAnalytics: (instance: SurveyInstance) => void;
  onExport: (instance: SurveyInstance) => void;
  onImportInstance: () => void;
  validationResetCallback?: () => void;
}

export const SurveyInstanceSection: React.FC<SurveyInstanceSectionProps> = ({
  surveyInstances,
  getInstanceConfig,
  onToggleActive,
  onSettings,
  onDelete,
  onVisualize,
  onAnalytics,
  onExport,
  onImportInstance,
  validationResetCallback,
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
          onAnalytics={() => onAnalytics(instance)}
          onDelete={(instance) => onDelete(instance, validationResetCallback)}
          onCopyUrl={copySurveyUrl}
          onOpenUrl={openSurveyInNewTab}
          onExport={onExport}
        />
      ))}
    </SurveyList>
  );
};
