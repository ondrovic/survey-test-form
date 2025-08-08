import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import React from 'react';
import { GripVertical } from 'lucide-react';

interface SortableItemProps {
    id: string;
    children: React.ReactNode;
    className?: string;
    disabled?: boolean;
}

export const SortableItem: React.FC<SortableItemProps> = ({
    id,
    children,
    className = '',
    disabled = false
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id, disabled });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`${className} ${isDragging ? 'z-50' : ''}`}
        >
            <div className="flex items-center gap-2">
                {!disabled && (
                    <button
                        {...attributes}
                        {...listeners}
                        className="p-1 hover:bg-gray-100 rounded cursor-grab active:cursor-grabbing"
                        type="button"
                    >
                        <GripVertical className="w-4 h-4 text-gray-400" />
                    </button>
                )}
                <div className="flex-1">
                    {children}
                </div>
            </div>
        </div>
    );
};
