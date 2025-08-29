import { Button, CollapsibleSection, GenericImportModal, PaginatedList, SurveyConfigCard } from '@/components/common';
import { PAGINATION_DEFAULTS } from '@/constants/pagination.constants';
import { useGenericImportExport } from '@/hooks';
import { SurveyConfig } from '@/types/framework.types';
import { AlertTriangle, Plus, Upload, X } from 'lucide-react';
import React, { useState } from 'react';

interface SurveyConfigSectionProps {
    title: string;
    configs: SurveyConfig[];
    onCreateNew: () => void;
    onEdit: (config: SurveyConfig) => void;
    onDelete: (config: SurveyConfig) => void;
    onCreateInstance: (config: SurveyConfig) => void;
    createButtonLabel: string;
    emptyMessage: string;
    getInstanceCount?: (configId: string) => number;
    defaultExpanded?: boolean;
    itemsPerPage?: number;
    validationStatus?: { hasErrors: boolean; errorCount: number; lastChecked: Date | null };
    onVerifyConfig?: () => Promise<void>;
    onClearValidationErrors?: () => void;
}

export const SurveyConfigPaginatedSection: React.FC<SurveyConfigSectionProps> = ({
    title,
    configs,
    onCreateNew,
    onEdit,
    onDelete,
    onCreateInstance,
    createButtonLabel,
    emptyMessage,
    getInstanceCount,
    defaultExpanded = false,
    itemsPerPage = PAGINATION_DEFAULTS.ITEMS_PER_PAGE,
    validationStatus,
    onVerifyConfig,
    onClearValidationErrors
}) => {
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const { exportItem, importItem } = useGenericImportExport();

    // Start collapsed by default to show counts before expanding
    const actualDefaultExpanded = defaultExpanded;

    // Search fields - focus on title, description for survey configs
    const searchFields: (keyof SurveyConfig)[] = ['title', 'description'];

    const handleExport = (config: SurveyConfig) => {
        exportItem(config, 'config');
    };

    const handleImport = () => {
        setIsImportModalOpen(true);
    };

    const handleImportFile = async (file: File) => {
        const success = await importItem(file, 'config', () => setIsImportModalOpen(false));
        if (success) {
            setIsImportModalOpen(false);
        }
        return success;
    };

    const renderItem = (config: SurveyConfig) => (
        <SurveyConfigCard
            key={config.id}
            config={config}
            instanceCount={getInstanceCount ? getInstanceCount(config.id) : 0}
            onEdit={onEdit}
            onCreateInstance={onCreateInstance}
            onDelete={onDelete}
            onExport={handleExport}
            validationStatus={validationStatus}
        />
    );

    // Validation messages for header
    const validationMessages = configs.length > 0 && validationStatus ? (
        validationStatus.hasErrors ? (
            <div className="flex items-center gap-2 px-3 py-1 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-700 dark:text-red-300 font-medium">
                    {validationStatus.errorCount} Validation Error{validationStatus.errorCount !== 1 ? 's' : ''}
                </span>
            </div>
        ) : validationStatus.lastChecked ? (
            <div className="flex items-center gap-2 px-3 py-1 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                <span className="text-sm text-green-700 dark:text-green-300 font-medium">✅ All Configurations Valid</span>
            </div>
        ) : null
    ) : null;

    // Validation action buttons
    const validationButtons = (
        <>
            {validationStatus?.hasErrors && onClearValidationErrors && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onClearValidationErrors}
                    className="text-gray-600 dark:text-gray-300 border-gray-600 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700"
                    title="Clear validation error badges (troubleshooting)"
                >
                    <X className="w-4 h-4 mr-1" />
                    Clear Errors
                </Button>
            )}
            {onVerifyConfig && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onVerifyConfig}
                    disabled={configs.length === 0}
                    className={validationStatus?.hasErrors
                        ? "text-red-600 dark:text-red-400 border-red-600 dark:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                        : "text-green-600 dark:text-green-400 border-green-600 dark:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20"
                    }
                >
                    {validationStatus?.hasErrors ? (
                        <>
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            Fix Issues
                        </>
                    ) : (
                        'Validate Config'
                    )}
                </Button>
            )}
        </>
    );

    // Regular action buttons  
    const actionButtons = (
        <>
            <Button onClick={handleImport} size="sm" variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Import
            </Button>
            <Button onClick={onCreateNew} size="sm" className="w-32">
                <Plus className="w-4 h-4 mr-2" />
                {createButtonLabel}
            </Button>
        </>
    );

    const headerActions = (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex flex-col sm:flex-row gap-2">
                {validationButtons}
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
                {actionButtons}
            </div>
        </div>
    );

    return (
        <>
            <CollapsibleSection
                title={title}
                count={configs.length}
                defaultExpanded={actualDefaultExpanded}
                headerContent={validationMessages}
                headerAction={headerActions}
            >
                <div className="space-y-4">
                    <PaginatedList
                        items={configs}
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
                dataType="config"
                title={`Import ${title}`}
            />
        </>
    );
};