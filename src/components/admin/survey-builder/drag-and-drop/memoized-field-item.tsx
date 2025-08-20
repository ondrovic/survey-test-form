import React, { memo, useMemo } from 'react';
import { Edit, Trash2, GripVertical } from 'lucide-react';
import { SurveyField } from '../../../../types/framework.types';
import { FieldContainer } from './field-drag-context';
import { DraggableField } from './draggable-field';
import { Button } from '../../../common';
import { FIELD_TYPES } from '../survey-builder.types';

interface MemoizedFieldItemProps {
  field: SurveyField;
  container: FieldContainer;
  isSelected: boolean;
  onSelectField: (fieldId: string) => void;
  onOpenFieldEditor: (fieldId: string) => void;
  onDeleteField: (sectionId: string, fieldId: string, subsectionId?: string) => void;
  sectionId: string;
  subsectionId?: string;
  getOptionCount: (field: SurveyField) => string;
  isSubsection?: boolean;
}

export const MemoizedFieldItem: React.FC<MemoizedFieldItemProps> = memo(({
  field,
  container,
  isSelected,
  onSelectField,
  onOpenFieldEditor,
  onDeleteField,
  sectionId,
  subsectionId,
  getOptionCount,
  isSubsection = false
}) => {
  const className = useMemo(() => {
    const baseClasses = `${isSubsection ? 'p-3' : 'p-4'} border rounded-lg ${isSubsection ? 'bg-white' : 'bg-gray-50'} transition-all duration-200 cursor-pointer hover:shadow-sm`;
    const selectionClasses = isSelected
      ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200 shadow-sm"
      : "border-gray-200 hover:border-blue-300 hover:bg-blue-25";
    return `${baseClasses} ${selectionClasses}`;
  }, [isSelected, isSubsection]);

  const handleSelect = useMemo(() => 
    () => onSelectField(field.id),
    [onSelectField, field.id]
  );

  const handleEdit = useMemo(() => 
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      onOpenFieldEditor(field.id);
    },
    [onOpenFieldEditor, field.id]
  );

  const handleDelete = useMemo(() => 
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      onDeleteField(sectionId, field.id, subsectionId);
    },
    [onDeleteField, sectionId, field.id, subsectionId]
  );

  const fieldType = useMemo(() => 
    FIELD_TYPES.find(t => t.value === field.type),
    [field.type]
  );

  return (
    <DraggableField
      fieldId={field.id}
      container={container}
    >
      <div className={className}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div 
              className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-blue-500 transition-colors"
              data-drag-handle="true"
            >
              <GripVertical className={isSubsection ? "w-3 h-3" : "w-4 h-4"} />
            </div>
            <div 
              className="flex items-center gap-2 flex-1 cursor-pointer" 
              onClick={handleSelect}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSelect();
                }
              }}
              role="button"
              tabIndex={0}
            >
              <span className={`font-medium ${isSubsection ? 'text-sm' : ''} text-gray-800`}>{field.label}</span>
              <span className={`text-gray-500 ${isSubsection ? 'text-xs' : 'text-sm'} bg-gray-100 px-2 py-1 rounded font-mono`}>
                {field.type}
              </span>
              {field.required && (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                  Required
                </span>
              )}
              {fieldType?.hasOptions && (
                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  {getOptionCount(field)}
                </span>
              )}
            </div>
          </div>
          <div 
            className="flex items-center gap-1" 
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            data-no-drag
          >
            <Button
              size="sm"
              variant="ghost"
              onClick={handleEdit}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              data-no-drag
            >
              <Edit className={isSubsection ? "w-3 h-3" : "w-4 h-4"} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDelete}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              data-no-drag
            >
              <Trash2 className={isSubsection ? "w-3 h-3" : "w-4 h-4"} />
            </Button>
          </div>
        </div>
      </div>
    </DraggableField>
  );
});

MemoizedFieldItem.displayName = 'MemoizedFieldItem';