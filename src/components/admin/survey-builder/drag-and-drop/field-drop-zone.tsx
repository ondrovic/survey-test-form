import React from 'react';
import { Droppable } from '@hello-pangea/dnd';

interface FieldDropZoneProps {
  containerId: string;
  children: React.ReactNode;
  className?: string;
  emptyMessage?: string;
}

export const FieldDropZone: React.FC<FieldDropZoneProps> = ({
  containerId,
  children,
  className = '',
  emptyMessage = 'Drop fields here',
}) => {
  return (
    <Droppable droppableId={containerId}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`
            ${className}
            ${snapshot.isDraggingOver ? 'bg-blue-50 border-blue-400 border-2' : 'border-gray-300 border-2'}
            border-dashed rounded-lg transition-colors duration-200
          `}
        >
          {React.Children.count(children) > 0 ? (
            <>
              {children}
              {provided.placeholder}
            </>
          ) : (
            <div className="flex items-center justify-center p-8 text-gray-500">
              {emptyMessage}
            </div>
          )}
          {React.Children.count(children) > 0 && provided.placeholder}
        </div>
      )}
    </Droppable>
  );
};