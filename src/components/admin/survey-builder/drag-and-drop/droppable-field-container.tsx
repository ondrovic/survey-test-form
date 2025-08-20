import { useDroppable } from '@dnd-kit/core';
import React, { memo, useCallback, useMemo, useRef, useEffect } from 'react';
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
  const containerRef = useRef<HTMLDivElement>(null);

  const containerId = useMemo(() => {
    return `container-${container.sectionId}${container.subsectionId ? `-subsection-${container.subsectionId}` : ''}`;
  }, [container.sectionId, container.subsectionId]);

  // Calculate the insertion index based on cursor position
  const calculateDropIndex = useCallback((clientY: number): number => {
    if (!containerRef.current) return 0;

    const fieldElements = containerRef.current.querySelectorAll('[data-drag-handle]');
    if (fieldElements.length === 0) return 0;

    for (let i = 0; i < fieldElements.length; i++) {
      const element = fieldElements[i] as HTMLElement;
      const rect = element.getBoundingClientRect();
      const midPoint = rect.top + rect.height / 2;

      if (clientY < midPoint) {
        return i;
      }
    }

    return fieldElements.length;
  }, []);

  const containerData = useMemo(() => ({
    container,
    calculateDropIndex
  }), [container, calculateDropIndex]);

  const hasChildren = useMemo(() => React.Children.count(children) > 0, [children]);

  const { isOver, setNodeRef } = useDroppable({
    id: containerId,
    data: containerData
  });

  // Effect to log container lifecycle  
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ CONTAINER ${container.type.toUpperCase()} EFFECT MOUNT:`, {
        id: containerId,
        section: container.sectionId,
        subsection: container.subsectionId
      });
    }
    
    return () => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`❌ CONTAINER ${container.type.toUpperCase()} EFFECT UNMOUNT:`, {
          id: containerId,
          section: container.sectionId,
          subsection: container.subsectionId
        });
      }
    };
  }, [containerId, container.type, container.sectionId, container.subsectionId]);

  if (process.env.NODE_ENV === 'development') {
    console.log('🎯 DROPPABLE CONTAINER RENDER:', {
      containerId,
      isOver,
      containerData: {
        container: containerData.container,
        hasCalculateDropIndex: !!containerData.calculateDropIndex
      },
      hasChildren,
      containerType: container.type,
      sectionId: container.sectionId,
      subsectionId: container.subsectionId,
      isRegistered: true,
      timestamp: Date.now()
    });
    
    // Log container mounting/unmounting
    console.log(`🔧 CONTAINER ${container.type.toUpperCase()} MOUNTED:`, {
      id: containerId,
      section: container.sectionId,
      subsection: container.subsectionId
    });
  }



  const setRefs = React.useCallback((node: HTMLDivElement | null) => {
    if (containerRef.current !== node) {
      (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    }
    setNodeRef(node);
  }, [setNodeRef]);





  const containerClassName = useMemo(() => {
    const baseClasses = `${className} transition-all duration-200 min-h-[80px] rounded-lg relative`;
    // Subsections need higher z-index to be detected over sections
    const zIndexClass = container.type === 'subsection' ? 'z-20' : 'z-10';
    const borderClasses = isOver
      ? `bg-green-50 border-green-400 border-4 border-dashed shadow-lg ${zIndexClass}`
      : `border-gray-300 border-2 border-dashed hover:border-blue-400 hover:bg-blue-50 ${zIndexClass}`;
    return `${baseClasses} ${borderClasses}`;
  }, [className, isOver, container.type]);

  return (
    <div
      ref={setRefs}
      className={containerClassName}
      data-container-type={container.type}
      data-container-id={containerId}
    >
      {/* Always show a header to identify the drop zone type */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs mb-2 px-2 py-1 bg-gray-100 rounded font-mono flex justify-between items-center">
          <span>{container.type === 'subsection' ? `SUBSECTION DROP ZONE` : `SECTION DROP ZONE`}</span>
          <span className="text-gray-400">
            {container.type === 'subsection' ? container.subsectionId?.slice(-8) : container.sectionId}
          </span>
        </div>
      )}

      {children}

      {!hasChildren && (
        <div className="flex flex-col items-center justify-center h-16 text-gray-500 text-sm">
          <div className="font-medium">{emptyMessage}</div>
        </div>
      )}
    </div>
  );
});

DroppableFieldContainer.displayName = 'DroppableFieldContainer';