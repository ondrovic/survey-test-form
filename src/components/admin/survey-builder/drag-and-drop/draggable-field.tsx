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

  if (process.env.NODE_ENV === 'development') {
    console.log('🎭 DRAGGABLE FIELD:', {
      dragId,
      isDragging,
      transform,
      disabled,
      fieldId,
      container,
      hasListeners: !!listeners,
      hasAttributes: !!attributes
    });
  }



  const style = useMemo(() => {
    if (transform) {
      return {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: isDragging ? 999 : 'auto',
      };
    }
    return undefined;
  }, [transform, isDragging]);

  const className = useMemo(() =>
    `${isDragging ? 'opacity-50 pointer-events-none' : 'pointer-events-auto'}`,
    [isDragging]
  );

  return (
    <div
      ref={setDragRef}
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