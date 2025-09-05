import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { GripVertical } from 'lucide-react';

interface DraggableFieldProps {
  fieldId: string;
  index: number;
  children: React.ReactNode;
}

export const DraggableField: React.FC<DraggableFieldProps> = React.memo(({
  fieldId,
  index,
  children,
}) => {
  return (
    <Draggable draggableId={`field-${fieldId}`} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`
            ${snapshot.isDragging ? 'shadow-lg rotate-1 z-50' : ''}
            transition-transform duration-200
          `}
        >
          <div className="group relative">
            {/* Drag Handle */}
            <div
              {...provided.dragHandleProps}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-20 bg-white dark:bg-gray-800 rounded p-1 shadow-sm"
            >
              <GripVertical className="w-4 h-4 text-gray-400 hover:text-blue-500" />
            </div>
            
            {/* Field Content */}
            <div className={`${snapshot.isDragging ? 'opacity-50' : ''} pl-8`}>
              {children}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
});

DraggableField.displayName = 'DraggableField';