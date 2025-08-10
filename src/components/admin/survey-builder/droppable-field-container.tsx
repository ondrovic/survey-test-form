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
  const containerId = useMemo(() => {
    const id = `container-${container.sectionId}${container.subsectionId ? `-${container.subsectionId}` : ''}`;
    console.log('🏗️ Creating container ID:', {
      containerId: id,
      containerType: container.type,
      sectionId: container.sectionId,
      subsectionId: container.subsectionId,
      isSubsection: !!container.subsectionId
    });
    return id;
  }, [container.sectionId, container.subsectionId]);
  
  const containerData = useMemo(() => ({ container }), [container]);
  const hasChildren = useMemo(() => React.Children.count(children) > 0, [children]);
  
  const { isOver, setNodeRef } = useDroppable({
    id: containerId,
    data: containerData
  });

  console.log('🔧 useDroppable hook called:', {
    containerId,
    containerType: container.type,
    sectionId: container.sectionId,
    subsectionId: container.subsectionId,
    hasSubsections: !!(container as any).subsections?.length,
    subsectionsCount: (container as any).subsections?.length || 0,
    fullContainer: container,
    isOver
  });

  const debugRef = React.useCallback((node: HTMLElement | null) => {
    setNodeRef(node);
  }, [setNodeRef]);

  // Global registry for debugging
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!window._dropzoneRegistry) window._dropzoneRegistry = new Set();
      window._dropzoneRegistry.add(containerId);
    }
    
    return () => {
      if (typeof window !== 'undefined' && window._dropzoneRegistry) {
        window._dropzoneRegistry.delete(containerId);
      }
    };
  }, [containerId]);





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
      ref={debugRef}
      className={containerClassName}
      data-container-type={container.type}
    >
      {/* Always show a header to identify the drop zone type */}
      <div className="text-xs mb-2 px-2 py-1 bg-gray-100 rounded font-mono flex justify-between items-center">
        <span>{container.type === 'subsection' ? `SUBSECTION DROP ZONE` : `SECTION DROP ZONE`}</span>
        <span className="text-gray-400">
          {container.type === 'subsection' ? container.subsectionId?.slice(-8) : container.sectionId}
        </span>
      </div>
      
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