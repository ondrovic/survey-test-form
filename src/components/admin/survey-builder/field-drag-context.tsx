import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { createPortal } from 'react-dom';
import React, { useState, useMemo, useCallback } from 'react';
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
        distance: 8,
      },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const fieldId = event.active.id as string;
    const field = fields.find(f => `field-${f.id}` === fieldId);
    
    console.log('🎯 DRAG START:', {
      fieldId,
      activeId: event.active.id,
      field: field ? { id: field.id, label: field.label, type: field.type } : 'NOT FOUND',
      dragData: event.active.data.current
    });
    
    if (field) {
      setActiveField(field);
      const data = event.active.data.current as { container: FieldContainer };
      console.log('🎯 Setting drag data:', {
        fieldId: field.id,
        container: data.container
      });
      setDragData({
        fieldId: field.id,
        container: data.container
      });
    }
  }, [fields]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { over } = event;
    
    console.log('🎯 DRAG END:', {
      over: over ? {
        id: over.id,
        data: over.data.current
      } : 'NO OVER',
      dragData: dragData
    });
    
    setActiveField(null);
    
    if (!over || !dragData) {
      console.log('❌ DRAG END EARLY EXIT:', { hasOver: !!over, hasDragData: !!dragData });
      setDragData(null);
      return;
    }

    const overId = over.id as string;
    console.log('🎯 Processing drop on ID:', overId);
    
    let targetContainer: FieldContainer | null = null;
    let targetIndex = 0;

    if (overId.startsWith('container-')) {
      console.log('📦 Dropping on CONTAINER');
      const overData = over.data.current as { container: FieldContainer };
      console.log('📦 Container data:', overData);
      if (overData?.container) {
        targetContainer = overData.container;
        targetIndex = 0;
        console.log('📦 Target container set:', targetContainer);
      }
    } else if (overId.startsWith('field-')) {
      console.log('🏷️ Dropping on FIELD');
      const overData = over.data.current as { container: FieldContainer };
      console.log('🏷️ Field data:', overData);
      if (overData?.container) {
        targetContainer = overData.container;
        targetIndex = 999;
        console.log('🏷️ Target container set:', targetContainer);
      }
    } else {
      console.log('❓ Unknown drop target type:', overId);
    }

    if (!targetContainer) {
      console.log('❌ NO TARGET CONTAINER FOUND');
      setDragData(null);
      return;
    }

    const isSameContainer = 
      dragData.container.type === targetContainer.type &&
      dragData.container.sectionId === targetContainer.sectionId &&
      dragData.container.subsectionId === targetContainer.subsectionId;

    console.log('🔄 Container comparison:', {
      source: dragData.container,
      target: targetContainer,
      isSameContainer
    });

    if (!isSameContainer) {
      console.log('✅ CALLING onFieldMove');
      onFieldMove(dragData.fieldId, dragData.container, targetContainer, targetIndex);
    } else {
      console.log('⏭️ SKIPPING - Same container');
    }

    setDragData(null);
  }, [dragData, onFieldMove]);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {children}
      
      {createPortal(
        <DragOverlay>
          {activeField && (
            <div className="opacity-75 transform rotate-2 shadow-lg">
              {renderFieldPreview(activeField)}
            </div>
          )}
        </DragOverlay>,
        document.body
      )}
    </DndContext>
  );
};