import React from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';

export interface FieldMoveData {
  fieldId: string;
  sourceContainerId: string;
  destinationContainerId: string;
  sourceIndex: number;
  destinationIndex: number;
}

export interface SortableListMoveData {
  droppableId: string;
  oldIndex: number;
  newIndex: number;
}

interface FieldDragProviderProps {
  children: React.ReactNode;
  onFieldMove: (moveData: FieldMoveData) => void;
  onSortableListMove?: (moveData: SortableListMoveData) => void;
}

export const FieldDragProvider: React.FC<FieldDragProviderProps> = ({
  children,
  onFieldMove,
  onSortableListMove,
}) => {
  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // If no destination or dropped in same position
    if (!destination || 
        (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return;
    }

    // Handle field moves (draggableId starts with 'field-')
    if (draggableId.startsWith('field-')) {
      const fieldId = draggableId.replace('field-', '');

      onFieldMove({
        fieldId,
        sourceContainerId: source.droppableId,
        destinationContainerId: destination.droppableId,
        sourceIndex: source.index,
        destinationIndex: destination.index,
      });
      return;
    }

    // Handle sortable list moves (sections/subsections/content)
    // Check if it's within the same droppable and not a field
    if (source.droppableId === destination.droppableId && 
        !draggableId.startsWith('field-')) {
      
      if (onSortableListMove) {
        onSortableListMove({
          droppableId: source.droppableId,
          oldIndex: source.index,
          newIndex: destination.index,
        });
      }
      return;
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      {children}
    </DragDropContext>
  );
};