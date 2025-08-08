import { Check, Edit, Plus, Save, Trash2, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { firestoreHelpers } from '../../../config/firebase';
import { useOptionSet } from '../../../contexts/option-set-context';
import { useToast } from '../../../contexts/toast-context/index';
import { useModal } from '../../../hooks';
import { MultiSelectOptionSet, OptionSetOption } from '../../../types/survey.types';
import { Button, ColorSelector, DeleteConfirmationModal, Input } from '../../common';

interface MultiSelectOptionSetManagerProps {
    isVisible: boolean;
    onClose: () => void;
    onOptionSetSelect?: (optionSetId: string) => void;
}

interface MultiSelectOptionSetFormData {
    id: string;
    name: string;
    description: string;
    options: OptionSetOption[];
    maxSelections?: number;
    minSelections?: number;
}

export const MultiSelectOptionSetManager: React.FC<MultiSelectOptionSetManagerProps> = ({
    isVisible,
    onClose,
    onOptionSetSelect
}) => {
    const { showSuccess, showError } = useToast();
    const { 
        state: { multiSelectOptionSets, editingMultiSelectOptionSet, isCreating, isLoading },
        dispatch,
        setEditingMultiSelectOptionSet,
        setIsCreating,
        resetEditingState
    } = useOptionSet();
    const deleteModal = useModal<{ id: string; name: string }>();
    const [loading, setLoading] = useState(false);
    const [editingOptionSet, setLocalEditingOptionSet] = useState<MultiSelectOptionSetFormData | null>(null);

    // Load option sets when component becomes visible
    useEffect(() => {
        if (isVisible) {
            loadOptionSets();
        }
    }, [isVisible]);

    // Always use internal state for form operations, but initialize from context if needed
    const currentEditingOptionSet = editingOptionSet || (editingMultiSelectOptionSet ? {
        id: editingMultiSelectOptionSet.id,
        name: editingMultiSelectOptionSet.name,
        description: editingMultiSelectOptionSet.description || '',
        options: [...editingMultiSelectOptionSet.options],
        maxSelections: editingMultiSelectOptionSet.maxSelections,
        minSelections: editingMultiSelectOptionSet.minSelections
    } : null);

    // Sync internal state when context changes, but only on initial load
    useEffect(() => {
        if (editingMultiSelectOptionSet && !editingOptionSet) {
            setLocalEditingOptionSet({
                id: editingMultiSelectOptionSet.id,
                name: editingMultiSelectOptionSet.name,
                description: editingMultiSelectOptionSet.description || '',
                options: [...editingMultiSelectOptionSet.options],
                maxSelections: editingMultiSelectOptionSet.maxSelections,
                minSelections: editingMultiSelectOptionSet.minSelections
            });
        }
    }, [editingMultiSelectOptionSet, editingOptionSet]);

    const loadOptionSets = async () => {
        dispatch({ type: 'SET_IS_LOADING', payload: true });
        try {
            console.log('Loading multi-select option sets from database...');
            const loadedOptionSets = await firestoreHelpers.getMultiSelectOptionSets();
            console.log('Loaded multi-select option sets:', loadedOptionSets);
            console.log('Option set IDs:', loadedOptionSets.map(os => ({ id: os.id, name: os.name })));
            dispatch({ type: 'SET_MULTI_SELECT_OPTION_SETS', payload: loadedOptionSets });
        } catch (error) {
            console.error('Error loading multi-select option sets:', error);
            showError('Failed to load multi-select option sets');
        } finally {
            dispatch({ type: 'SET_IS_LOADING', payload: false });
        }
    };

    const handleCreateNew = () => {
        const newOptionSet: MultiSelectOptionSetFormData = {
            id: '',
            name: '',
            description: '',
            options: [
                { value: 'option1', label: 'Option 1', color: 'transparent', isDefault: false, order: 0 },
                { value: 'option2', label: 'Option 2', color: 'transparent', isDefault: false, order: 1 },
                { value: 'option3', label: 'Option 3', color: 'transparent', isDefault: false, order: 2 }
            ],
            minSelections: 1,
            maxSelections: 3
        };
        setLocalEditingOptionSet(newOptionSet);
        setIsCreating(true);
    };

    const handleEdit = (optionSet: MultiSelectOptionSet) => {
        setLocalEditingOptionSet({
            id: optionSet.id,
            name: optionSet.name,
            description: optionSet.description || '',
            options: [...optionSet.options],
            maxSelections: optionSet.maxSelections,
            minSelections: optionSet.minSelections
        });
        setEditingMultiSelectOptionSet(optionSet);
        setIsCreating(false);
    };

    const handleDelete = (optionSet: MultiSelectOptionSet) => {
        deleteModal.open({ id: optionSet.id, name: optionSet.name });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteModal.data) return;

        setLoading(true);
        try {
            console.log('Deleting multi-select option set with ID:', deleteModal.data.id);
            await firestoreHelpers.deleteMultiSelectOptionSet(deleteModal.data.id);
            console.log('Multi-select option set deleted successfully from Firebase');
            showSuccess('Multi-select option set deleted successfully');

            // Update context state
            dispatch({ type: 'DELETE_MULTI_SELECT_OPTION_SET', payload: deleteModal.data.id });

            // Refresh the option sets list
            try {
                await loadOptionSets();
            } catch (error) {
                console.warn('Failed to refresh option sets after delete:', error);
            }
        } catch (err) {
            showError('Failed to delete multi-select option set');
            console.error('Error deleting multi-select option set:', err);
        } finally {
            setLoading(false);
        }
        deleteModal.close();
    };

    const handleSave = async () => {
        // Always use the internal editingOptionSet state
        const optionSetToSave = editingOptionSet;
        if (!optionSetToSave) return;

        if (!optionSetToSave.name.trim()) {
            showError('Option set name is required');
            return;
        }

        if (optionSetToSave.options.length === 0) {
            showError('At least one option is required');
            return;
        }

        // Validate min/max selections
        if (optionSetToSave.minSelections && optionSetToSave.maxSelections) {
            if (optionSetToSave.minSelections > optionSetToSave.maxSelections) {
                showError('Minimum selections cannot be greater than maximum selections');
                return;
            }
            if (optionSetToSave.minSelections > optionSetToSave.options.length) {
                showError('Minimum selections cannot be greater than the number of options');
                return;
            }
            if (optionSetToSave.maxSelections > optionSetToSave.options.length) {
                showError('Maximum selections cannot be greater than the number of options');
                return;
            }
        }

        setLoading(true);
        try {
            const optionSetData = {
                name: optionSetToSave.name.trim(),
                description: optionSetToSave.description.trim(),
                options: optionSetToSave.options,
                minSelections: optionSetToSave.minSelections,
                maxSelections: optionSetToSave.maxSelections,
                metadata: {
                    createdBy: 'admin',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    isActive: true,
                }
            };

            if (isCreating) {
                const newOptionSet = await firestoreHelpers.addMultiSelectOptionSet(optionSetData);
                showSuccess('Multi-select option set created successfully');

                // Update context state
                if (newOptionSet) {
                    dispatch({ type: 'ADD_MULTI_SELECT_OPTION_SET', payload: newOptionSet });
                }
            } else {
                await firestoreHelpers.updateMultiSelectOptionSet(optionSetToSave.id, optionSetData);
                showSuccess('Multi-select option set updated successfully');

                // Update context state
                const updatedOptionSet = { ...optionSetData, id: optionSetToSave.id };
                dispatch({ type: 'UPDATE_MULTI_SELECT_OPTION_SET', payload: updatedOptionSet });
            }

            // Refresh the option sets list
            try {
                await loadOptionSets();
            } catch (error) {
                console.warn('Failed to refresh option sets after save:', error);
            }
            setLocalEditingOptionSet(null);
            resetEditingState();
        } catch (err) {
            showError(isCreating ? 'Failed to create multi-select option set' : 'Failed to update multi-select option set');
            console.error('Error saving multi-select option set:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setLocalEditingOptionSet(null);
        resetEditingState();
        // Call onClose to close the modal
        onClose();
    };

    const updateOption = (index: number, field: keyof OptionSetOption, value: any) => {
        const currentOptionSet = editingOptionSet || currentEditingOptionSet;
        if (!currentOptionSet) return;

        const updatedOptions = [...currentOptionSet.options];
        updatedOptions[index] = { ...updatedOptions[index], [field]: value };

        const updatedOptionSet = { ...currentOptionSet, options: updatedOptions };
        setLocalEditingOptionSet(updatedOptionSet);
    };

    const addOption = () => {
        const currentOptionSet = editingOptionSet || currentEditingOptionSet;
        if (!currentOptionSet) return;

        const newOption: OptionSetOption = {
            value: '',
            label: '',
            color: 'transparent',
            isDefault: false,
            order: currentOptionSet.options.length
        };

        const updatedOptionSet = {
            ...currentOptionSet,
            options: [...currentOptionSet.options, newOption]
        };

        setLocalEditingOptionSet(updatedOptionSet);
    };

    const removeOption = (index: number) => {
        const currentOptionSet = editingOptionSet || currentEditingOptionSet;
        if (!currentOptionSet || currentOptionSet.options.length <= 1) return;

        const updatedOptions = currentOptionSet.options.filter((_, i) => i !== index);
        // Reorder remaining options
        updatedOptions.forEach((opt, i) => {
            opt.order = i;
        });

        const updatedOptionSet = { ...currentOptionSet, options: updatedOptions };
        setLocalEditingOptionSet(updatedOptionSet);
    };

    const moveOption = (index: number, direction: 'up' | 'down') => {
        const currentOptionSet = editingOptionSet || currentEditingOptionSet;
        if (!currentOptionSet) return;

        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= currentOptionSet.options.length) return;

        const updatedOptions = [...currentOptionSet.options];
        [updatedOptions[index], updatedOptions[newIndex]] = [updatedOptions[newIndex], updatedOptions[index]];

        // Update order values
        updatedOptions.forEach((opt, i) => {
            opt.order = i;
        });

        const updatedOptionSet = { ...currentOptionSet, options: updatedOptions };
        setLocalEditingOptionSet(updatedOptionSet);
    };

    const handleSelectOptionSet = (optionSetId: string) => {
        if (onOptionSetSelect) {
            onOptionSetSelect(optionSetId);
        }
        // Automatically close the modal after selecting an option set
        onClose();
    };

    // Clean up state when modal is closed
    useEffect(() => {
        if (!isVisible) {
            setLocalEditingOptionSet(null);
            resetEditingState();
        }
    }, [isVisible, resetEditingState]);

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-gray-900">
                            Multi-Select Option Set Manager
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {(editingOptionSet || currentEditingOptionSet) ? (
                        // Edit/Create Form
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium text-gray-900">
                                    {isCreating ? 'Create New Multi-Select Option Set' : 'Edit Multi-Select Option Set'}
                                </h3>
                                <div className="flex space-x-2">
                                    <Button
                                        onClick={handleSave}
                                        disabled={loading}
                                        variant="primary"
                                        size="sm"
                                    >
                                        <Save className="h-4 w-4 mr-2" />
                                        {loading ? 'Saving...' : 'Save'}
                                    </Button>
                                    <Button
                                        onClick={handleCancel}
                                        variant="secondary"
                                        size="sm"
                                    >
                                        <X className="h-4 w-4 mr-2" />
                                        Cancel
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    name="optionSetName"
                                    label="Option Set Name"
                                    value={editingOptionSet?.name || currentEditingOptionSet?.name || ''}
                                    onChange={(value) => {
                                        const currentOptionSet = editingOptionSet || currentEditingOptionSet;
                                        if (currentOptionSet) {
                                            setLocalEditingOptionSet({ ...currentOptionSet, name: value });
                                        }
                                    }}
                                    placeholder="Enter option set name"
                                    required
                                />
                                <Input
                                    name="description"
                                    label="Description"
                                    value={editingOptionSet?.description || currentEditingOptionSet?.description || ''}
                                    onChange={(value) => {
                                        const currentOptionSet = editingOptionSet || currentEditingOptionSet;
                                        if (currentOptionSet) {
                                            setLocalEditingOptionSet({ ...currentOptionSet, description: value });
                                        }
                                    }}
                                    placeholder="Enter description (optional)"
                                />
                            </div>

                            {/* Selection Constraints */}
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    name="minSelections"
                                    label="Minimum Selections"
                                    type="number"
                                    value={editingOptionSet?.minSelections || currentEditingOptionSet?.minSelections || 1}
                                    onChange={(value) => {
                                        const currentOptionSet = editingOptionSet || currentEditingOptionSet;
                                        if (currentOptionSet) {
                                            setLocalEditingOptionSet({ ...currentOptionSet, minSelections: parseInt(value.toString()) || 1 });
                                        }
                                    }}
                                    placeholder="1"
                                />
                                <Input
                                    name="maxSelections"
                                    label="Maximum Selections"
                                    type="number"
                                    value={editingOptionSet?.maxSelections || currentEditingOptionSet?.maxSelections || 3}
                                    onChange={(value) => {
                                        const currentOptionSet = editingOptionSet || currentEditingOptionSet;
                                        if (currentOptionSet) {
                                            setLocalEditingOptionSet({ ...currentOptionSet, maxSelections: parseInt(value.toString()) || 3 });
                                        }
                                    }}
                                    placeholder="3"
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="font-medium text-gray-900">Options</h4>
                                    <Button
                                        onClick={addOption}
                                        variant="secondary"
                                        size="sm"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Option
                                    </Button>
                                </div>

                                <div className="space-y-3">
                                    {(editingOptionSet?.options || currentEditingOptionSet?.options || []).map((option, index) => (
                                        <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                                            <div className="flex-1 grid grid-cols-3 gap-3">
                                                <Input
                                                    name={`option-${index}-value`}
                                                    label="Value"
                                                    value={option.value}
                                                    onChange={(value) => updateOption(index, 'value', value)}
                                                    placeholder="e.g., option1"
                                                    required
                                                />
                                                <Input
                                                    name={`option-${index}-label`}
                                                    label="Label"
                                                    value={option.label}
                                                    onChange={(value) => updateOption(index, 'label', value)}
                                                    placeholder="e.g., Option 1"
                                                    required
                                                />
                                                <div className="space-y-1">
                                                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                                                        Color
                                                    </label>
                                                    <ColorSelector
                                                        value={option.color || 'transparent'}
                                                        onChange={(value) => updateOption(index, 'color', value)}
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex flex-col space-y-1">
                                                <button
                                                    onClick={() => moveOption(index, 'up')}
                                                    disabled={index === 0}
                                                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                                                >
                                                    ↑
                                                </button>
                                                <button
                                                    onClick={() => moveOption(index, 'down')}
                                                    disabled={index === (editingOptionSet?.options || currentEditingOptionSet?.options || []).length - 1}
                                                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                                                >
                                                    ↓
                                                </button>
                                                <button
                                                    onClick={() => removeOption(index)}
                                                    disabled={(editingOptionSet?.options || currentEditingOptionSet?.options || []).length <= 1}
                                                    className="p-1 text-red-400 hover:text-red-600 disabled:opacity-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        // Option Set List
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium text-gray-900">Multi-Select Option Sets</h3>
                                <Button
                                    onClick={handleCreateNew}
                                    variant="primary"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create New Option Set
                                </Button>
                            </div>

                            {isLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" />
                                </div>
                            ) : multiSelectOptionSets.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    No multi-select option sets found. Create your first one!
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {multiSelectOptionSets.map((optionSet) => (
                                        <div key={optionSet.id} className="border border-gray-200 rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <div>
                                                    <h4 className="font-medium text-gray-900">{optionSet.name}</h4>
                                                    {optionSet.description && (
                                                        <p className="text-sm text-gray-600 mt-1">{optionSet.description}</p>
                                                    )}
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Min: {optionSet.minSelections || 1}, Max: {optionSet.maxSelections || 'Unlimited'}
                                                    </p>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    {onOptionSetSelect && (
                                                        <Button
                                                            onClick={() => handleSelectOptionSet(optionSet.id)}
                                                            variant="secondary"
                                                            size="sm"
                                                        >
                                                            <Check className="h-4 w-4 mr-2" />
                                                            Use This Option Set
                                                        </Button>
                                                    )}
                                                    <Button
                                                        onClick={() => handleEdit(optionSet)}
                                                        variant="secondary"
                                                        size="sm"
                                                    >
                                                        <Edit className="h-4 w-4 mr-2" />
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleDelete(optionSet)}
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
                                                {optionSet.options.map((option, index) => (
                                                    <span
                                                        key={index}
                                                        className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200"
                                                    >
                                                        {option.label}
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
        </div>
    );
};
