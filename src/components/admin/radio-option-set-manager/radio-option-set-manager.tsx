import { Check, Edit, Plus, Save, Trash2, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { firestoreHelpers } from '../../../config/firebase';
import { useToast } from '../../../contexts/toast-context/index';
import { useModal } from '../../../hooks';
import { OptionSetOption, RadioOptionSet } from '../../../types/survey.types';
import { Button, ColorSelector, DeleteConfirmationModal, Input } from '../../common';

interface RadioOptionSetManagerProps {
    isVisible: boolean;
    onClose: () => void;
    onOptionSetSelect?: (optionSetId: string) => void;
    editingOptionSet?: RadioOptionSet | null;
    isCreating?: boolean;
    optionSets: RadioOptionSet[];
    onOptionSetDeleted?: (optionSetId: string) => void;
    onOptionSetCreated?: (optionSet: RadioOptionSet) => void;
    onOptionSetUpdated?: (optionSet: RadioOptionSet) => void;
}

interface RadioOptionSetFormData {
    id: string;
    name: string;
    description: string;
    options: OptionSetOption[];
}

export const RadioOptionSetManager: React.FC<RadioOptionSetManagerProps> = ({
    isVisible,
    onClose,
    onOptionSetSelect,
    editingOptionSet: propEditingOptionSet,
    isCreating: propIsCreating,
    optionSets: [],
    onOptionSetDeleted,
    onOptionSetCreated,
    onOptionSetUpdated
}) => {
    const { showSuccess, showError } = useToast();
    const deleteModal = useModal<{ id: string; name: string }>();
    const [loading, setLoading] = useState(false);
    const [editingOptionSet, setEditingOptionSet] = useState<RadioOptionSetFormData | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [optionSets, setOptionSets] = useState<RadioOptionSet[]>([]);
    const [isLoadingOptionSets, setIsLoadingOptionSets] = useState(false);

    // Load option sets when component becomes visible
    useEffect(() => {
        if (isVisible) {
            loadOptionSets();
        }
    }, [isVisible]);

    // Always use internal state for form operations, but initialize from props if needed
    const currentEditingOptionSet = editingOptionSet || (propEditingOptionSet ? {
        id: propEditingOptionSet.id,
        name: propEditingOptionSet.name,
        description: propEditingOptionSet.description || '',
        options: [...propEditingOptionSet.options]
    } : null);

    const currentIsCreating = propIsCreating !== undefined ? propIsCreating : isCreating;

    // Sync internal state when props change
    useEffect(() => {
        if (propEditingOptionSet) {
            setEditingOptionSet({
                id: propEditingOptionSet.id,
                name: propEditingOptionSet.name,
                description: propEditingOptionSet.description || '',
                options: [...propEditingOptionSet.options]
            });
            setIsCreating(false);
        } else if (propEditingOptionSet === null) {
            // Clear internal state when props are cleared
            setEditingOptionSet(null);
            setIsCreating(false);
        }
    }, [propEditingOptionSet]);

    const loadOptionSets = async () => {
        setIsLoadingOptionSets(true);
        try {
            console.log('Loading radio option sets from database...');
            const loadedOptionSets = await firestoreHelpers.getRadioOptionSets();
            console.log('Loaded radio option sets:', loadedOptionSets);
            setOptionSets(loadedOptionSets);
        } catch (error) {
            console.error('Error loading radio option sets:', error);
            showError('Failed to load radio option sets');
        } finally {
            setIsLoadingOptionSets(false);
        }
    };

    const handleCreateNew = () => {
        const newOptionSet: RadioOptionSetFormData = {
            id: '',
            name: '',
            description: '',
            options: [
                { value: 'option1', label: 'Option 1', color: 'transparent', isDefault: true, order: 0 },
                { value: 'option2', label: 'Option 2', color: 'transparent', isDefault: false, order: 1 },
                { value: 'option3', label: 'Option 3', color: 'transparent', isDefault: false, order: 2 }
            ]
        };
        setEditingOptionSet(newOptionSet);
        setIsCreating(true);
    };

    const handleEdit = (optionSet: RadioOptionSet) => {
        setEditingOptionSet({
            id: optionSet.id,
            name: optionSet.name,
            description: optionSet.description || '',
            options: [...optionSet.options]
        });
        setIsCreating(false);
    };

    const handleDelete = (optionSet: RadioOptionSet) => {
        deleteModal.open({ id: optionSet.id, name: optionSet.name });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteModal.data) return;

        setLoading(true);
        try {
            console.log('Deleting radio option set with ID:', deleteModal.data.id);
            await firestoreHelpers.deleteRadioOptionSet(deleteModal.data.id);
            console.log('Radio option set deleted successfully from Firebase');
            showSuccess('Radio option set deleted successfully');

            // Notify parent component about the deletion
            if (onOptionSetDeleted) {
                onOptionSetDeleted(deleteModal.data.id);
            }

            // Refresh the option sets list
            try {
                await loadOptionSets();
            } catch (error) {
                console.warn('Failed to refresh option sets after delete:', error);
            }
        } catch (err) {
            showError('Failed to delete radio option set');
            console.error('Error deleting radio option set:', err);
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

        const defaultOptions = optionSetToSave.options.filter(opt => opt.isDefault);
        if (defaultOptions.length === 0) {
            showError('At least one option must be marked as default');
            return;
        }

        setLoading(true);
        try {
            const optionSetData = {
                name: optionSetToSave.name.trim(),
                description: optionSetToSave.description.trim(),
                options: optionSetToSave.options,
                metadata: {
                    createdBy: 'admin',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    isActive: true,
                }
            };

            if (currentIsCreating) {
                const newOptionSet = await firestoreHelpers.addRadioOptionSet(optionSetData);
                showSuccess('Radio option set created successfully');

                // Notify parent component about the creation
                if (onOptionSetCreated && newOptionSet) {
                    onOptionSetCreated(newOptionSet);
                }
            } else {
                await firestoreHelpers.updateRadioOptionSet(optionSetToSave.id, optionSetData);
                showSuccess('Radio option set updated successfully');

                // Notify parent component about the update
                if (onOptionSetUpdated) {
                    const updatedOptionSet = { ...optionSetData, id: optionSetToSave.id };
                    onOptionSetUpdated(updatedOptionSet);
                }
            }

            // Refresh the option sets list
            try {
                await loadOptionSets();
            } catch (error) {
                console.warn('Failed to refresh option sets after save:', error);
            }
            setEditingOptionSet(null);
            setIsCreating(false);
        } catch (err) {
            showError(currentIsCreating ? 'Failed to create radio option set' : 'Failed to update radio option set');
            console.error('Error saving radio option set:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setEditingOptionSet(null);
        setIsCreating(false);
        // Call onClose to close the modal
        onClose();
    };

    const updateOption = (index: number, field: keyof OptionSetOption, value: any) => {
        const currentOptionSet = editingOptionSet || currentEditingOptionSet;
        if (!currentOptionSet) return;

        const updatedOptions = [...currentOptionSet.options];
        updatedOptions[index] = { ...updatedOptions[index], [field]: value };

        // If setting this option as default, unset others
        if (field === 'isDefault' && value === true) {
            updatedOptions.forEach((opt, i) => {
                if (i !== index) opt.isDefault = false;
            });
        }

        const updatedOptionSet = { ...currentOptionSet, options: updatedOptions };
        setEditingOptionSet(updatedOptionSet);
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

        setEditingOptionSet(updatedOptionSet);
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
        setEditingOptionSet(updatedOptionSet);
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
        setEditingOptionSet(updatedOptionSet);
    };

    const handleSelectOptionSet = (optionSetId: string) => {
        if (onOptionSetSelect) {
            onOptionSetSelect(optionSetId);
        }
        // Automatically close the modal after selecting an option set
        onClose();
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-gray-900">
                            Radio Option Set Manager
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
                                    {currentIsCreating ? 'Create New Radio Option Set' : 'Edit Radio Option Set'}
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
                                            setEditingOptionSet({ ...currentOptionSet, name: value });
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
                                            setEditingOptionSet({ ...currentOptionSet, description: value });
                                        }
                                    }}
                                    placeholder="Enter description (optional)"
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
                                            <div className="flex-1 grid grid-cols-4 gap-3">
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
                                                        value={option.color}
                                                        onChange={(value) => updateOption(index, 'color', value)}
                                                    />
                                                </div>
                                                <div className="flex items-center mt-6">
                                                    <label className="flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={option.isDefault}
                                                            onChange={(e) => updateOption(index, 'isDefault', e.target.checked)}
                                                            className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                                                        />
                                                        <span className="ml-2 text-sm text-gray-700">Default</span>
                                                    </label>
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
                                <h3 className="text-lg font-medium text-gray-900">Radio Option Sets</h3>
                                <Button
                                    onClick={handleCreateNew}
                                    variant="primary"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create New Option Set
                                </Button>
                            </div>

                            {isLoadingOptionSets ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" />
                                </div>
                            ) : optionSets.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    No radio option sets found. Create your first one!
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {optionSets.map((optionSet) => (
                                        <div key={optionSet.id} className="border border-gray-200 rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <div>
                                                    <h4 className="font-medium text-gray-900">{optionSet.name}</h4>
                                                    {optionSet.description && (
                                                        <p className="text-sm text-gray-600 mt-1">{optionSet.description}</p>
                                                    )}
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
        </div>
    );
};
