import { closestCenter, DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, pointerWithin, useSensor, useSensors } from '@dnd-kit/core';
import React, { createContext, useCallback, useContext, useState } from 'react';
import { createPortal } from 'react-dom';
import { SurveyField } from '../../../../types/framework.types';

interface FieldDragContextProps {
  children: React.ReactNode;
  onFieldMove: (fieldId: string, fromContainer: FieldContainer, toContainer: FieldContainer, newIndex: number) => void;
  renderFieldPreview?: (field: SurveyField) => React.ReactNode;
  fields: SurveyField[];
}

export interface FieldContainer {
  type: 'section' | 'subsection';
  sectionId: string;
  subsectionId?: string;
}

// Context to track field dragging state
const FieldDragStateContext = createContext<boolean>(false);

export const useIsFieldDragging = () => useContext(FieldDragStateContext);

export const FieldDragContext: React.FC<FieldDragContextProps> = React.memo(({
  children,
  onFieldMove,
  fields
}) => {
  // Debug field drag context rendering
  if (process.env.NODE_ENV === 'development') {
    console.log('🎭 FIELD DRAG CONTEXT RENDER:', {
      fieldsCount: fields.length,
      fieldIds: fields.map(f => f.id),
      hasOnFieldMove: !!onFieldMove,
      childrenCount: React.Children.count(children)
    });
  }
  const [activeField, setActiveField] = useState<SurveyField | null>(null);
  const [isFieldDragging, setIsFieldDragging] = useState<boolean>(false);
  const [dragData, setDragData] = useState<{
    fieldId: string;
    container: FieldContainer;
  } | null>(null);
  const [lastDragOverY, setLastDragOverY] = useState<number>(0);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const fieldId = event.active.id as string;
    const field = fields.find(f => `field-${f.id}` === fieldId || f.id === fieldId.replace('field-', ''));

    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 FIELD DRAG START:', {
        event,
        activeId: event.active.id,
        activeData: event.active.data.current,
        fieldsCount: fields.length,
        foundField: !!field
      });
    }

    if (field) {
      setIsFieldDragging(true);
      setActiveField(field);
      const data = event.active.data.current as { container: FieldContainer };

      setDragData({
        fieldId: field.id,
        container: data.container
      });

      // Add global mouse listener to track cursor position during drag
      const handleGlobalMouseMove = (e: MouseEvent) => {
        setLastDragOverY(e.clientY);
      };
      
      document.addEventListener('mousemove', handleGlobalMouseMove);
      
      // Store cleanup function in a ref or state if needed - for now we'll clean up in dragEnd
      (window as any)._cleanupMouseListener = () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
      };
    }
  }, [fields]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { over } = event;

    // Always clean up state first
    setIsFieldDragging(false);
    setActiveField(null);
    setLastDragOverY(0);
    
    // Clean up global mouse listener
    if ((window as any)._cleanupMouseListener) {
      (window as any)._cleanupMouseListener();
      (window as any)._cleanupMouseListener = null;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('🏁 FIELD DRAG END:', {
        over: over?.id,
        dragData,
        activeId: event.active.id,
        hasDragData: !!dragData,
        hasOver: !!over
      });
    }

    if (!over || !dragData) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Missing requirements - ending drag');
      }
      setDragData(null);
      return;
    }

    const overId = over.id as string;
    let targetContainer: FieldContainer | null = null;
    let targetIndex = 0;

    if (overId.startsWith('container-')) {
      const overData = over.data.current as {
        container: FieldContainer;
        calculateDropIndex?: (clientY: number) => number;
      };

      if (overData?.container) {
        targetContainer = overData.container;

        // Calculate the target index based on cursor position
        if (overData.calculateDropIndex) {
          // Use the last tracked Y position during drag over
          targetIndex = overData.calculateDropIndex(lastDragOverY);
        } else {
          targetIndex = 0;
        }

        if (process.env.NODE_ENV === 'development') {
          console.log('🎯 Container drop found:', {
            containerId: overId,
            containerType: targetContainer.type,
            sectionId: targetContainer.sectionId,
            subsectionId: targetContainer.subsectionId,
            targetIndex,
            lastDragOverY
          });
        }
      }
    }

    if (!targetContainer) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ No target container found');
      }
      setDragData(null);
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Calling onFieldMove:', {
        fieldId: dragData.fieldId,
        from: dragData.container,
        to: targetContainer,
        targetIndex
      });
    }

    // Execute the move
    onFieldMove(dragData.fieldId, dragData.container, targetContainer, targetIndex);
    setDragData(null);
  }, [dragData, onFieldMove, lastDragOverY]);

  // Custom collision detection that prioritizes smaller containers (subsections over sections)
  const customCollisionDetection = useCallback((args: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 COLLISION DETECTION for:', args.active.id);
      console.log('🔍 Available containers:', args.droppableContainers?.length);
      
      // Group containers by type to see what's actually available
      const sectionContainers = [];
      const subsectionContainers = [];
      const unknownContainers = [];
      
      args.droppableContainers?.forEach((container: any, index: number) => {
        const containerInfo = {
          id: container.id,
          disabled: container.disabled,
          type: container.data?.current?.container?.type,
          sectionId: container.data?.current?.container?.sectionId,
          subsectionId: container.data?.current?.container?.subsectionId,
          rect: container.rect.current
        };
        
        console.log(`🔍 Container ${index}:`, containerInfo);
        
        if (containerInfo.type === 'section') {
          sectionContainers.push(containerInfo);
        } else if (containerInfo.type === 'subsection') {
          subsectionContainers.push(containerInfo);
        } else {
          unknownContainers.push(containerInfo);
        }
      });
      
      console.log('📊 CONTAINER SUMMARY:', {
        total: args.droppableContainers?.length || 0,
        sections: sectionContainers.length,
        subsections: subsectionContainers.length,
        unknown: unknownContainers.length
      });
      
      if (sectionContainers.length > 0) {
        console.log('📄 Section containers:', sectionContainers.map(c => ({ id: c.id, sectionId: c.sectionId })));
      }
      if (subsectionContainers.length > 0) {
        console.log('📁 Subsection containers:', subsectionContainers.map(c => ({ id: c.id, sectionId: c.sectionId, subsectionId: c.subsectionId })));
      }
    }
    
    // First try pointerWithin to get the most precise hit
    const pointerCollisions = pointerWithin(args);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Pointer collisions:', pointerCollisions?.map((c: any) => ({ 
        id: c.id, 
        containerType: c.data?.current?.container?.type,
        sectionId: c.data?.current?.container?.sectionId,
        subsectionId: c.data?.current?.container?.subsectionId
      })));
    }
    
    if (pointerCollisions.length > 0) {
      // If multiple collisions, prefer subsection containers
      // subsection IDs contain the subsectionId for more specific targeting
      const subsectionCollision = pointerCollisions.find(collision => {
        const id = String(collision.id);
        const containerType = collision.data?.current?.container?.type;
        const hasSubsectionId = !!collision.data?.current?.container?.subsectionId;
        
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 Checking collision:', { 
            id, 
            containerType,
            hasSubsectionId,
            isSubsectionType: containerType === 'subsection'
          });
        }
        
        return containerType === 'subsection' && hasSubsectionId;
      });
      
      if (subsectionCollision) {
        if (process.env.NODE_ENV === 'development') {
          console.log('🎯 Using subsection collision:', subsectionCollision.id);
        }
        return [subsectionCollision];
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Using first collision (no subsections found):', pointerCollisions[0].id);
      }
      return [pointerCollisions[0]];
    }
    
    // Fallback to closest center
    const closestCollisions = closestCenter(args);
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Using closest center:', closestCollisions?.map((c: any) => c.id));
    }
    return closestCollisions;
  }, []);

  return (
    <FieldDragStateContext.Provider value={isFieldDragging}>
      <DndContext
        sensors={sensors}
        collisionDetection={customCollisionDetection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {children}

        {createPortal(
          <DragOverlay style={{ zIndex: 9999 }}>
            {activeField && (
              <div className="opacity-90 transform rotate-1 shadow-xl pointer-events-none bg-white border border-blue-300 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="font-medium text-sm text-gray-800">{activeField.label}</span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {activeField.type}
                  </span>
                </div>
              </div>
            )}
          </DragOverlay>,
          document.body
        )}
      </DndContext>
    </FieldDragStateContext.Provider>
  );
});