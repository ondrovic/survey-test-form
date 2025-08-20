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
                        className="p-2 hover:bg-gray-100 hover:text-gray-600 rounded-md cursor-grab active:cursor-grabbing transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1"
                        type="button"
                        title="Drag to reorder"
                        aria-label="Drag to reorder"
                    >
                        <GripVertical className="w-4 h-4 text-gray-400" />
                    </button>
                )}
                {disabled && (
                    <div className="p-2 w-8 flex items-center justify-center">
                        <div className="w-4 h-4" /> {/* Spacer to maintain layout */}
                    </div>
                )}
                <div className="flex-1">
                    {children}
                </div>
            </div>
        </div>
    );
};
