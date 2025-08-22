import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { GripVertical } from 'lucide-react';

interface SortableItemProps {
    id: string;
    index: number;
    children: React.ReactNode;
    className?: string;
    disabled?: boolean;
}

export const SortableItem: React.FC<SortableItemProps> = ({
    id,
    index,
    children,
    className = '',
    disabled = false
}) => {
    if (disabled) {
        // When disabled, render without Draggable to avoid conflicts
        return (
            <div className={className}>
                <div className="flex items-center gap-2">
                    <div className="p-2 w-8 flex items-center justify-center">
                        <div className="w-4 h-4" /> {/* Spacer to maintain layout */}
                    </div>
                    <div className="flex-1">
                        {children}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <Draggable draggableId={id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={`${className} ${snapshot.isDragging ? 'z-50 opacity-75 transform rotate-1 shadow-lg' : ''}`}
                >
                    <div className="flex items-center gap-2">
                        <button
                            {...provided.dragHandleProps}
                            className="p-2 hover:bg-gray-100 hover:text-gray-600 rounded-md cursor-grab active:cursor-grabbing transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1"
                            type="button"
                            title="Drag to reorder"
                            aria-label="Drag to reorder"
                        >
                            <GripVertical className="w-4 h-4 text-gray-400" />
                        </button>
                        <div className="flex-1">
                            {children}
                        </div>
                    </div>
                </div>
            )}
        </Draggable>
    );
};
