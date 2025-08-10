import { useDroppable } from '@dnd-kit/core';
import React, { memo, useMemo } from 'react';
import { FieldContainer } from './field-drag-context';

interface DroppableFieldContainerProps {
  container: FieldContainer;
  children: React.ReactNode;
  className?: string;
  emptyMessage?: string;
}

export const DroppableFieldContainer: React.FC<DroppableFieldContainerProps> = memo(({
  container,
  children,
  className = '',
  emptyMessage = 'Drop fields here'
}) => {
  const containerId = useMemo(() => 
    `container-${container.sectionId}${container.subsectionId ? `-${container.subsectionId}` : ''}`,
    [container.sectionId, container.subsectionId]
  );
  
  const containerData = useMemo(() => ({ container }), [container]);
  const hasChildren = useMemo(() => React.Children.count(children) > 0, [children]);
  
  const { isOver, setNodeRef } = useDroppable({
    id: containerId,
    data: containerData
  });

  const containerClassName = useMemo(() => 
    `${className} ${isOver ? 'bg-blue-50 border-blue-300 border-2 border-dashed' : 'border-transparent border-2'} transition-all duration-200 min-h-[60px] rounded-lg`,
    [className, isOver]
  );

  return (
    <div
      ref={setNodeRef}
      className={containerClassName}
    >
      {children}
      {!hasChildren && (
        <div className="flex items-center justify-center h-16 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
          {emptyMessage}
        </div>
      )}
    </div>
  );
});

DroppableFieldContainer.displayName = 'DroppableFieldContainer';