import { Button, CollapsibleSection, GenericImportModal, PaginatedList, SurveyInstanceCard } from '@/components/common';
import { useGenericImportExport, useSurveyOperations, useSurveyUrls } from '@/hooks';
import { SurveyConfig, SurveyInstance } from '@/types/framework.types';
import { Upload } from 'lucide-react';
import React, { useState } from 'react';

interface SurveyInstanceSectionProps {
    title: string;
    instances: SurveyInstance[];
    onSettings: (instance: SurveyInstance) => void;
    onDelete: (instance: SurveyInstance) => void;
    onToggleActive: (instance: SurveyInstance) => void;
    onVisualize: (instance: SurveyInstance) => void;
    onAnalytics: (instance: SurveyInstance) => void;
    emptyMessage: string;
    getInstanceConfig?: (instance: SurveyInstance) => SurveyConfig | undefined;
    defaultExpanded?: boolean;
    itemsPerPage?: number;
}

export const SurveyInstancePaginatedSection: React.FC<SurveyInstanceSectionProps> = ({
    title,
    instances,
    onSettings,
    onDelete,
    onToggleActive,
    onVisualize,
    onAnalytics,
    emptyMessage,
    getInstanceConfig,
    defaultExpanded = false,
    itemsPerPage = 3
}) => {
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const { exportItem, importItem } = useGenericImportExport();
    const { generateSurveyUrl, copySurveyUrl, openSurveyInNewTab } = useSurveyUrls();
    const { downloadSurveyData } = useSurveyOperations();

    // Start collapsed by default to show counts before expanding
    const actualDefaultExpanded = defaultExpanded;

    // Search fields - focus on title, description, slug for survey instances
    const searchFields: (keyof SurveyInstance)[] = ['title', 'description', 'slug'];

    const handleExport = (instance: SurveyInstance) => {
        exportItem(instance, 'instance');
    };

    const handleImport = () => {
        setIsImportModalOpen(true);
    };

    const handleImportFile = async (file: File) => {
        const success = await importItem(file, 'instance', () => setIsImportModalOpen(false));
        if (success) {
            setIsImportModalOpen(false);
        }
        return success;
    };

    const renderItem = (instance: SurveyInstance) => {
        const config = getInstanceConfig?.(instance);
        const surveyUrl = generateSurveyUrl(instance);

        return (
            <SurveyInstanceCard
                key={instance.id}
                instance={instance}
                config={config}
                surveyUrl={surveyUrl}
                onToggleActive={onToggleActive}
                onSettings={onSettings}
                onDownload={downloadSurveyData}
                onVisualize={() => onVisualize(instance)}
                onAnalytics={() => onAnalytics(instance)}
                onDelete={onDelete}
                onCopyUrl={copySurveyUrl}
                onOpenUrl={openSurveyInNewTab}
                onExport={handleExport}
            />
        );
    };

    const headerActions = (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Button onClick={handleImport} size="sm" variant="outline" className="hover:bg-gray-50 dark:hover:bg-gray-700 w-full sm:w-auto">
                <Upload className="w-4 h-4 mr-2" />
                Import
            </Button>
        </div>
    );

    return (
        <>
            <CollapsibleSection
                title={title}
                count={instances.length}
                defaultExpanded={actualDefaultExpanded}
                headerAction={headerActions}
            >
                <div className="space-y-4">
                    <PaginatedList
                        items={instances}
                        itemsPerPage={itemsPerPage}
                        renderItem={renderItem}
                        emptyMessage={emptyMessage}
                        searchable={true}
                        searchPlaceholder={`Search ${title.toLowerCase()}...`}
                        searchFields={searchFields}
                    />
                </div>
            </CollapsibleSection>

            {/* Import Modal */}
            <GenericImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={handleImportFile}
                dataType="instance"
                title={`Import ${title}`}
            />
        </>
    );
};