import React from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';

export interface FieldMoveData {
  fieldId: string;
  sourceContainerId: string;
  destinationContainerId: string;
  sourceIndex: number;
  destinationIndex: number;
}

interface FieldDragProviderProps {
  children: React.ReactNode;
  onFieldMove: (moveData: FieldMoveData) => void;
}

export const FieldDragProvider: React.FC<FieldDragProviderProps> = ({
  children,
  onFieldMove,
}) => {
  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // If no destination or dropped in same position
    if (!destination || 
        (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return;
    }

    // Extract field ID (remove 'field-' prefix)
    const fieldId = draggableId.replace('field-', '');

    console.log('🎯 Field moved:', {
      fieldId,
      from: { containerId: source.droppableId, index: source.index },
      to: { containerId: destination.droppableId, index: destination.index }
    });

    onFieldMove({
      fieldId,
      sourceContainerId: source.droppableId,
      destinationContainerId: destination.droppableId,
      sourceIndex: source.index,
      destinationIndex: destination.index,
    });
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      {children}
    </DragDropContext>
  );
};