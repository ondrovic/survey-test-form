import { Check, Edit, Plus, Trash2, Upload, X } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BaseOptionSet, OptionSetConfig, useOptionSetCrud } from '../../../contexts/option-set-crud-context';
import { useSurveyData } from '../../../contexts/survey-data-context';
import { useModal } from '../../../hooks';
import { useGenericImportExport } from '../../../hooks';
import { Button, DeleteConfirmationModal, GenericImportModal } from '../../common';
import { OptionSetForm, OptionSetFormData } from '../option-set-shared/option-set-form';
import { ExportableDataType } from '../../../utils/generic-import-export.utils';

interface GenericOptionSetManagerProps<T extends BaseOptionSet> {
  isVisible: boolean;
  onClose: () => void;
  config: OptionSetConfig<T>;
  onOptionSetSelect?: (optionSetId: string) => void;
  editingOptionSet?: T | null;
  isCreating?: boolean;
  renderAdditionalFields?: (props: {
    data: any;
    setField: (field: string, value: any) => void;
  }) => React.ReactNode;
}

export const GenericOptionSetManager = <T extends BaseOptionSet>({
  isVisible,
  onClose,
  config,
  onOptionSetSelect,
  editingOptionSet: propEditingOptionSet,
  isCreating: propIsCreating,
  renderAdditionalFields,
}: GenericOptionSetManagerProps<T>) => {
  const { loadItems, createItem, updateItem, deleteItem, isLoading } = useOptionSetCrud();
  const { refreshAll } = useSurveyData();
  const { exportItem, importItem } = useGenericImportExport();
  const deleteModal = useModal<{ id: string; name: string }>();
  const importModal = useModal();
  const [items, setItems] = useState<T[]>([]);
  const [editingItem, setEditingItem] = useState<Partial<T> | null>(null);

  const hasSeededRef = useRef(false);
  const selectionMode = !!onOptionSetSelect;

  // Define loadItemsData function before using it in useEffect
  const loadItemsData = useCallback(async () => {
    console.log('🔄 Loading items for:', config.displayName, 'in selection mode:', selectionMode);
    const loadedItems = await loadItems(config);
    console.log('📊 Loaded items:', loadedItems.length, 'items for', config.displayName);
    setItems(loadedItems);
  }, [selectionMode, loadItems]);

  // Load items when component becomes visible, but only in selection mode
  // In creation mode, we don't need to load existing items
  useEffect(() => {
    console.log('🔍 Rating scale manager effect:', { isVisible, selectionMode, displayName: config.displayName });
    if (isVisible && selectionMode) {
      console.log('✅ Triggering loadItemsData for', config.displayName);
      loadItemsData();
    } else {
      console.log('❌ Not loading items:', { isVisible, selectionMode, reason: !isVisible ? 'not visible' : !selectionMode ? 'not in selection mode' : 'unknown' });
    }
  }, [isVisible, selectionMode, loadItemsData]);

  // Seed from props/context once per open to support direct-to-form flows
  useEffect(() => {
    if (!isVisible || hasSeededRef.current) return;

    // Non-selection mode: prefer prop editing, else auto-create
    if (!selectionMode) {
      if (propEditingOptionSet) {
        setEditingItem({
          ...propEditingOptionSet,
        });
      } else {
        const defaultItem = config.defaultItem();
        setEditingItem(defaultItem as Partial<T>);
      }
      hasSeededRef.current = true;
      return;
    }

    // Selection mode: seed from props when provided
    if (propEditingOptionSet && !editingItem) {
      setEditingItem({
        ...propEditingOptionSet,
      });
      hasSeededRef.current = true;
    }
  }, [isVisible, selectionMode, propEditingOptionSet, editingItem, config]);

  // Reset per-open seed guard on close
  useEffect(() => {
    if (!isVisible) {
      hasSeededRef.current = false;
    }
  }, [isVisible]);

  // Clean up state when modal is closed
  useEffect(() => {
    if (!isVisible) {
      setEditingItem(null);
    }
  }, [isVisible]);

  const handleCreateNew = () => {
    const defaultItem = config.defaultItem();
    setEditingItem(defaultItem as Partial<T>);
  };

  const handleEdit = (item: T) => {
    setEditingItem({
      ...item,
    });
  };

  const handleDelete = (item: T) => {
    deleteModal.open({ id: item.id, name: item.name || `Unnamed ${config.displayName}` });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.data) return;

    const success = await deleteItem(config, deleteModal.data.id, deleteModal.data.name);
    if (success) {
      // Update local state
      setItems(prev => prev.filter(item => item.id !== deleteModal.data!.id));
    }
    deleteModal.close();
  };

  const handleSave = async () => {
    if (!editingItem) return;

    const isCreating = propIsCreating !== undefined ? propIsCreating : !editingItem.id;
    let success = false;

    if (isCreating) {
      const newItem = await createItem(config, editingItem as Omit<T, 'id'>);
      if (newItem) {
        // Update local state
        setItems(prev => [...prev, newItem]);
        success = true;
      }
    } else {
      success = await updateItem(config, editingItem.id!, editingItem);
      if (success) {
        // Update local state
        setItems(prev => prev.map(item =>
          item.id === editingItem.id ? { ...item, ...editingItem } as T : item
        ));
      }
    }

    if (success) {
      // Refresh global survey data context to update all tabs
      await refreshAll();
      // Clear editing state and close modal after successful save
      setEditingItem(null);
      onClose();
    }
  };

  const handleCancel = () => {
    setEditingItem(null);
    onClose();
  };

  const handleSelectOptionSet = (itemId: string) => {
    if (onOptionSetSelect) {
      onOptionSetSelect(itemId);
    }
    onClose();
  };


  // Map config type to export data type
  const getExportDataType = (): ExportableDataType => {
    switch (config.type) {
      case 'rating-scale':
        return 'rating-scale';
      case 'radio':
        return 'radio-option-set';
      case 'multi-select':
        return 'multi-select-option-set';
      case 'select':
        return 'select-option-set';
      default:
        throw new Error(`Unknown option set type: ${config.type}`);
    }
  };

  const handleExport = (item: T) => {
    const dataType = getExportDataType();
    exportItem(item, dataType);
  };

  const handleImport = () => {
    importModal.open();
  };

  const handleImportFile = async (file: File) => {
    const dataType = getExportDataType();
    const success = await importItem(file, dataType);
    if (success) {
      // Refresh local items
      await loadItemsData();
      importModal.close();
    }
    return success;
  };

  // Prepare current editing data for form
  const currentEditingData = editingItem || (propEditingOptionSet ? {
    ...propEditingOptionSet,
  } : null);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {config.displayName} Manager
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {(!selectionMode) ? (
            <OptionSetForm
              title={config.displayName}
              loading={isLoading}
              isCreating={propIsCreating !== undefined ? propIsCreating : !editingItem?.id}
              data={(currentEditingData || config.defaultItem()) as unknown as OptionSetFormData<any>}
              onChange={(updated) => setEditingItem(updated as any)}
              onSave={handleSave}
              onCancel={handleCancel}
              showDefaultToggle={config.type === 'rating-scale' || config.type === 'radio' || config.type === 'select' || config.type === 'multi-select'}
              showColor={true}
              renderAdditionalFields={renderAdditionalFields}
            />
          ) : (editingItem || currentEditingData) ? (
            <OptionSetForm
              title={config.displayName}
              loading={isLoading}
              isCreating={!editingItem?.id}
              data={(editingItem || currentEditingData) as unknown as OptionSetFormData<any>}
              onChange={(updated) => setEditingItem(updated as any)}
              onSave={handleSave}
              onCancel={handleCancel}
              showDefaultToggle={config.type === 'rating-scale' || config.type === 'radio' || config.type === 'select' || config.type === 'multi-select'}
              showColor={true}
              renderAdditionalFields={renderAdditionalFields}
            />
          ) : (
            // Items List
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">{config.displayName}s</h3>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleImport}
                    variant="outline"
                    size="sm"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Import {config.displayName}
                  </Button>
                  <Button
                    onClick={handleCreateNew}
                    variant="primary"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create New {config.displayName}
                  </Button>
                </div>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" />
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No {config.displayName.toLowerCase()}s found. Create your first one!
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">{item.name}</h4>
                          {item.description && (
                            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                          )}
                          {/* Multi-select specific info */}
                          {config.type === 'multi-select' && (item as any).minSelections && (
                            <p className="text-xs text-gray-500 mt-1">
                              Min: {(item as any).minSelections}, Max: {(item as any).maxSelections || 'Unlimited'}
                            </p>
                          )}
                          {/* Select specific info */}
                          {config.type === 'select' && (
                            <p className="text-xs text-gray-500 mt-1">
                              {(item as any).allowMultiple ? 'Multiple selections allowed' : 'Single selection only'}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {selectionMode && (
                            <Button
                              onClick={() => handleSelectOptionSet(item.id)}
                              variant="secondary"
                              size="sm"
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Use This {config.displayName}
                            </Button>
                          )}
                          <Button
                            onClick={() => handleEdit(item)}
                            variant="secondary"
                            size="sm"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            onClick={() => handleExport(item)}
                            variant="secondary"
                            size="sm"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Export
                          </Button>
                          <Button
                            onClick={() => handleDelete(item)}
                            variant="secondary"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {item.options.map((option: any, index: number) => (
                          <span
                            key={index}
                            className={`px-2 py-1 rounded text-xs font-medium ${option.isDefault
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-gray-100 text-gray-700 border border-gray-200'
                              }`}
                          >
                            {option.label}
                            {option.isDefault && ' (Default)'}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        itemName={deleteModal.data?.name || ''}
        onConfirm={handleDeleteConfirm}
        onCancel={() => deleteModal.close()}
        message="Are you sure you want to delete '{itemName}'? This action cannot be undone."
      />

      {/* Import Modal */}
      <GenericImportModal
        isOpen={importModal.isOpen}
        onClose={importModal.close}
        onImport={handleImportFile}
        dataType={getExportDataType()}
        title={`Import ${config.displayName}`}
      />
    </div>
  );
};