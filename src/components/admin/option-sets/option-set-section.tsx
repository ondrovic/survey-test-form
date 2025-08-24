import { Button, CollapsibleSection, PaginatedList, GenericImportModal } from '@/components/common';
import { Edit, Plus, Trash2, Upload } from 'lucide-react';
import React, { useState } from 'react';
import { useGenericImportExport } from '@/hooks';
import { ExportableDataType } from '@/utils/generic-import-export.utils';

// Base interface for all option set items
interface BaseOptionSetItem {
    id: string;
    name: string;
    description?: string;
    options: any[];
    isActive: boolean;
    metadata?: {
        createdBy?: string;
        createdAt: string;
        updatedAt: string;
    };
    [key: string]: any;
}

interface OptionSetSectionProps<T extends BaseOptionSetItem = BaseOptionSetItem> {
    title: string;
    items: T[];
    onCreateNew: () => void;
    onEdit: (item: T) => void;
    onDelete: (item: T) => void;
    createButtonLabel: string;
    emptyMessage: string;
    renderItemDetails?: (item: T) => React.ReactNode;
    defaultExpanded?: boolean;
    itemsPerPage?: number;
    dataType: ExportableDataType; // Add data type for import/export
}

export const OptionSetSection = <T extends BaseOptionSetItem = BaseOptionSetItem>({
    title,
    items,
    onCreateNew,
    onEdit,
    onDelete,
    createButtonLabel,
    emptyMessage,
    renderItemDetails,
    defaultExpanded = false,
    itemsPerPage = 3,
    dataType
}: OptionSetSectionProps<T>) => {
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const { exportItem, importItem } = useGenericImportExport();
    
    // Start collapsed by default to show counts before expanding
    const actualDefaultExpanded = defaultExpanded;

    // Search fields - focus on name, description for option sets
    const searchFields: (keyof T)[] = ['name' as keyof T, 'description' as keyof T];

    const handleExport = (item: T) => {
        exportItem(item, dataType);
    };

    const handleImport = () => {
        setIsImportModalOpen(true);
    };

    const handleImportFile = async (file: File) => {
        const success = await importItem(file, dataType);
        if (success) {
            setIsImportModalOpen(false);
        }
        return success;
    };
    const renderItem = (item: T) => (
        <div key={item.id} className="border rounded-lg p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                    <h4 className="font-semibold">{item.name}</h4>
                    <p className="text-sm text-gray-600">{item.description || 'No description'}</p>
                    <p className="text-xs text-gray-500">
                        {item.options.length} options,
                        {item.options.filter(opt => opt.isDefault).length} default
                        {renderItemDetails && renderItemDetails(item)}
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2 w-full sm:w-auto">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEdit(item)}
                        className="w-full sm:w-auto justify-start"
                    >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExport(item)}
                        className="w-full sm:w-auto justify-start"
                    >
                        <Upload className="w-4 h-4 mr-1" />
                        Export
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDelete(item)}
                        className="w-full sm:w-auto justify-start"
                    >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                    </Button>
                </div>
            </div>
        </div>
    );

    const headerActions = (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Button onClick={handleImport} size="sm" variant="outline" className="w-full sm:w-auto">
                <Upload className="w-4 h-4 mr-2" />
                Import
            </Button>
            <Button onClick={onCreateNew} size="sm" className="w-full sm:w-32">
                <Plus className="w-4 h-4 mr-2" />
                {createButtonLabel}
            </Button>
        </div>
    );

    return (
        <>
        <CollapsibleSection
            title={title}
            count={items.length}
            defaultExpanded={actualDefaultExpanded}
            headerAction={headerActions}
        >
            <div className="space-y-4">
                <PaginatedList
                    items={items}
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
            dataType={dataType}
            title={`Import ${title}`}
        />
        </>
    );
};
