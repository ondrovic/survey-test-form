import { useDraggable } from '@dnd-kit/core';
import React, { memo, useMemo } from 'react';
import { FieldContainer } from './field-drag-context';

interface DraggableFieldProps {
  fieldId: string;
  container: FieldContainer;
  children: React.ReactNode;
  disabled?: boolean;
}

export const DraggableField: React.FC<DraggableFieldProps> = memo(({
  fieldId,
  container,
  children,
  disabled = false
}) => {
  const dragId = useMemo(() => `field-${fieldId}`, [fieldId]);
  const dragData = useMemo(() => ({ container }), [container]);
  
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    transform,
    isDragging,
  } = useDraggable({
    id: dragId,
    data: dragData,
    disabled
  });

  // Fields should only be draggable, not droppable
  // Containers handle dropping functionality
  const setRefs = useMemo(() => (node: HTMLDivElement | null) => {
    setDragRef(node);
  }, [setDragRef]);

  const style = useMemo(() => transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined, [transform]);

  const className = useMemo(() => 
    `${isDragging ? 'opacity-50' : ''}`,
    [isDragging]
  );

  return (
    <div
      ref={setRefs}
      style={style}
      {...attributes}
      className={className}
      data-drag-handle
      {...listeners}
    >
      {children}
    </div>
  );
});

DraggableField.displayName = 'DraggableField';