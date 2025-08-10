import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors, closestCenter, pointerWithin } from '@dnd-kit/core';
import { createPortal } from 'react-dom';
import React, { useState, useCallback } from 'react';
import { SurveyField } from '../../../types/framework.types';

interface FieldDragContextProps {
  children: React.ReactNode;
  onFieldMove: (fieldId: string, fromContainer: FieldContainer, toContainer: FieldContainer, newIndex: number) => void;
  renderFieldPreview: (field: SurveyField) => React.ReactNode;
  fields: SurveyField[];
}

export interface FieldContainer {
  type: 'section' | 'subsection';
  sectionId: string;
  subsectionId?: string;
}

// Ref to track field dragging state without causing re-renders
const isFieldDraggingRef = { current: false };

export const useIsFieldDragging = () => isFieldDraggingRef.current;

export const FieldDragContext: React.FC<FieldDragContextProps> = ({
  children,
  onFieldMove,
  renderFieldPreview,
  fields
}) => {
  const [activeField, setActiveField] = useState<SurveyField | null>(null);
  const [dragData, setDragData] = useState<{
    fieldId: string;
    container: FieldContainer;
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 12,
      },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const fieldId = event.active.id as string;
    const field = fields.find(f => `field-${f.id}` === fieldId);
    

    
    if (field) {
      isFieldDraggingRef.current = true;
      setActiveField(field);
      const data = event.active.data.current as { container: FieldContainer };

      setDragData({
        fieldId: field.id,
        container: data.container
      });
    }
  }, [fields]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { over } = event;
    

    
    isFieldDraggingRef.current = false;
    setActiveField(null);
    
    if (!over || !dragData) {
      setDragData(null);
      return;
    }

    const overId = over.id as string;

    
    let targetContainer: FieldContainer | null = null;
    let targetIndex = 0;

    if (overId.startsWith('container-')) {
      const overData = over.data.current as { container: FieldContainer };
      if (overData?.container) {
        targetContainer = overData.container;
        targetIndex = 0;

      }
    } else {

      setDragData(null);
      return;
    }

    if (!targetContainer) {

      setDragData(null);
      return;
    }

    const isSameContainer = 
      dragData.container.type === targetContainer.type &&
      dragData.container.sectionId === targetContainer.sectionId &&
      dragData.container.subsectionId === targetContainer.subsectionId;



    // Allow moves between different containers OR within same container at different position
    if (!isSameContainer) {

      onFieldMove(dragData.fieldId, dragData.container, targetContainer, targetIndex);
    } else {
      // For same container, allow if it's a reorder (different position)
      // Note: We always allow same-container drops since the targetIndex calculation
      // should handle proper positioning and the onFieldMove can determine if it's a no-op

      onFieldMove(dragData.fieldId, dragData.container, targetContainer, targetIndex);
    }

    setDragData(null);
  }, [dragData, onFieldMove]);



  // Custom collision detection that prioritizes smaller containers (subsections over sections)
  const customCollisionDetection = useCallback((args: any) => {
    // Debug: Log ALL droppable containers (including disabled ones)
    console.log('🔍 ALL DROPPABLE CONTAINERS IN DND CONTEXT:');
    console.log('🔍 Total containers:', args.droppableContainers?.length);
    
    args.droppableContainers?.forEach((container: any, index: number) => {
      console.log(`🔍 Container ${index}:`, {
        id: container.id,
        disabled: container.disabled,
        rect: container.rect.current,
        type: container.data?.current?.container?.type,
        sectionId: container.data?.current?.container?.sectionId,
        subsectionId: container.data?.current?.container?.subsectionId,
        hasData: !!container.data?.current,
        hasContainerData: !!container.data?.current?.container,
        fullContainerObject: container.data?.current?.container,
        containerSubsections: container.data?.current?.container?.subsections?.map((sub: any) => ({
          id: sub.id,
          title: sub.title,
          fieldsCount: sub.fields?.length || 0,
          hasFields: !!(sub.fields && sub.fields.length > 0)
        })) || []
      });
    });
    
    // Debug: Log detailed container information
    const containerDetails = args.droppableContainers?.map((container: any) => ({
      id: container.id,
      containerData: container.data?.current?.container,
      fullData: container.data?.current
    }));
    
    console.log('🔍 DETAILED Available containers:', containerDetails);
    
    // First try pointerWithin to get the most precise hit
    const pointerCollisions = pointerWithin(args);
    console.log('🔍 Pointer collisions:', pointerCollisions?.map((c: any) => ({ 
      id: c.id, 
      containerType: c.data?.current?.container?.type,
      sectionId: c.data?.current?.container?.sectionId,
      subsectionId: c.data?.current?.container?.subsectionId
    })));
    
    if (pointerCollisions.length > 0) {
      // If multiple collisions, prefer subsection containers
      // subsection IDs contain '-subsection-' for more specific targeting
      const subsectionCollision = pointerCollisions.find(collision => {
        const id = String(collision.id);
        const isSubsection = id.includes('-subsection-');
        const containerType = collision.data?.current?.container?.type;
        console.log('🔍 Checking collision:', { 
          id, 
          isSubsection, 
          containerType,
          matchesSubsectionPattern: isSubsection,
          hasSubsectionType: containerType === 'subsection'
        });
        return isSubsection;
      });
      
      if (subsectionCollision) {
        console.log('🎯 Using subsection collision:', subsectionCollision.id);
        return [subsectionCollision];
      }
      
      console.log('🔍 Using first collision (no subsections found):', pointerCollisions[0].id);
      return [pointerCollisions[0]];
    }
    
    // Fallback to closest center
    const closestCollisions = closestCenter(args);
    console.log('🔍 Using closest center:', closestCollisions?.map((c: any) => c.id));
    return closestCollisions;
  }, []);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={customCollisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {children}
      
      {createPortal(
        <DragOverlay>
          {activeField && (
            <div className="opacity-75 transform rotate-2 shadow-lg pointer-events-none">
              {renderFieldPreview(activeField)}
            </div>
          )}
        </DragOverlay>,
        document.body
      )}
    </DndContext>
  );
};