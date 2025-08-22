import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { SortableItem } from './sortable-item';
import { SortableListProps } from './sortable-list.types';

export const SortableList: React.FC<SortableListProps> = ({
    items,
    onReorder: _onReorder,
    renderItem,
    className = '',
    itemClassName = '',
    disabled = false,
    droppableId = 'sortable-list'
}) => {
    if (disabled) {
        // When disabled, render without drag functionality
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
        <Droppable droppableId={droppableId}>
            {(provided, snapshot) => (
                <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={className}
                >
                    {items.map((item, index) => (
                        <SortableItem
                            key={item.id}
                            id={item.id}
                            index={index}
                            disabled={disabled}
                            className={itemClassName}
                        >
                            {renderItem(item, snapshot.isDraggingOver)}
                        </SortableItem>
                    ))}
                    {provided.placeholder}
                </div>
            )}
        </Droppable>
    );
};
