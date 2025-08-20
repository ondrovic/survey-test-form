import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { SortableItem } from './sortable-item';
import { SortableListProps } from './sortable-list.types';

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
        const activeId = event.active.id as string;

        // Only handle drags for items that belong to this list
        // Skip field drags (they start with 'field-') and other non-list items
        // Allow content- (subsections) and section- (sections) items
        if (!activeId.startsWith('content-') && !activeId.startsWith('section-')) {
            return;
        }

        setActiveId(activeId);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const activeId = event.active.id as string;

        // Only handle drags for items that belong to this list
        if (!activeId.startsWith('content-') && !activeId.startsWith('section-')) {
            setActiveId(null);
            return;
        }

        const { active, over } = event;
        setActiveId(null);

        if (over && active.id !== over.id) {
            const oldIndex = items.findIndex(item => item.id === active.id);
            const newIndex = items.findIndex(item => item.id === over.id);
            onReorder(oldIndex, newIndex);
        }
    };

    const activeItem = activeId ? items.find(item => item.id === activeId) : null;

    if (disabled) {
        // When disabled, render without DndContext to avoid conflicts
        return (
            <div className={className}>
                {items.map((item) => (
                    <div key={item.id} className={itemClassName}>
                        {renderItem(item, false)}
                    </div>
                ))}
            </div>
        );
    }

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
                <DragOverlay style={{ zIndex: 9998 }}>
                    {activeItem ? (
                        <div className="opacity-75 transform rotate-1 shadow-lg">
                            {renderItem(activeItem, true)}
                        </div>
                    ) : null}
                </DragOverlay>,
                document.body
            )}
        </DndContext>
    );
};
