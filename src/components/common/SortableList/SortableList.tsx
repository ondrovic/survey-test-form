import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { createPortal } from 'react-dom';
import React, { useState } from 'react';
import { SortableItem } from './SortableItem';
import { SortableListProps } from './SortableList.types';

export const SortableList: React.FC<SortableListProps> = ({
    items,
    onReorder,
    renderItem,
    className = '',
    itemClassName = '',
    disabled = false
}) => {
    const [activeId, setActiveId] = useState<string | null>(null);
    
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (over && active.id !== over.id) {
            const oldIndex = items.findIndex(item => item.id === active.id);
            const newIndex = items.findIndex(item => item.id === over.id);
            
            onReorder(oldIndex, newIndex);
        }
    };

    const activeItem = activeId ? items.find(item => item.id === activeId) : null;

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <SortableContext items={items.map(item => item.id)} strategy={verticalListSortingStrategy}>
                <div className={className}>
                    {items.map((item) => (
                        <SortableItem
                            key={item.id}
                            id={item.id}
                            disabled={disabled}
                            className={itemClassName}
                        >
                            {renderItem(item, false)}
                        </SortableItem>
                    ))}
                </div>
            </SortableContext>

            {createPortal(
                <DragOverlay>
                    {activeItem ? (
                        <div className="opacity-50">
                            {renderItem(activeItem, true)}
                        </div>
                    ) : null}
                </DragOverlay>,
                document.body
            )}
        </DndContext>
    );
};
