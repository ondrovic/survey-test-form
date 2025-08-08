import { Button, CollapsibleSection, PaginatedList } from '@/components/common';
import { Edit, Plus, Trash2 } from 'lucide-react';
import React from 'react';

// Base interface for all option set items
interface BaseOptionSetItem {
    id: string;
    name: string;
    description?: string;
    options: any[];
    metadata?: {
        createdBy: string;
        createdAt: string;
        updatedAt: string;
        isActive: boolean;
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
    defaultExpanded = true,
    itemsPerPage = 3
}: OptionSetSectionProps<T>) => {
    // Start expanded if there are items, collapsed if empty
    const actualDefaultExpanded = items.length > 0 ? defaultExpanded : false;
    const renderItem = (item: T) => (
        <div key={item.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="font-semibold">{item.name}</h4>
                    <p className="text-sm text-gray-600">{item.description || 'No description'}</p>
                    <p className="text-xs text-gray-500">
                        {item.options.length} options,
                        {item.options.filter(opt => opt.isDefault).length} default
                        {renderItemDetails && renderItemDetails(item)}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEdit(item)}
                    >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDelete(item)}
                    >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                    </Button>
                </div>
            </div>
        </div>
    );

    const createButton = (
        <Button onClick={onCreateNew} size="sm" className="w-32">
            <Plus className="w-4 h-4 mr-2" />
            {createButtonLabel}
        </Button>
    );

    return (
        <CollapsibleSection
            title={title}
            defaultExpanded={actualDefaultExpanded}
            headerAction={createButton}
        >
            <div className="space-y-4">
                <PaginatedList
                    items={items}
                    itemsPerPage={itemsPerPage}
                    renderItem={renderItem}
                    emptyMessage={emptyMessage}
                />
            </div>
        </CollapsibleSection>
    );
};
