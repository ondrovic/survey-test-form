export interface SortableItem {
    id: string;
    [key: string]: any;
}

export interface SortableListProps {
    items: SortableItem[];
    onReorder: (oldIndex: number, newIndex: number) => void;
    renderItem: (item: SortableItem, isDragging: boolean) => React.ReactNode;
    className?: string;
    itemClassName?: string;
    disabled?: boolean;
    droppableId?: string;
}
