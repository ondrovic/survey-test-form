import { Check, Edit, Plus, Save, Trash2, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { firestoreHelpers } from '../../../config/firebase';
import { useRatingScale } from '../../../contexts/rating-scale-context';
import { useToast } from '../../../contexts/toast-context/index';
import { useModal } from '../../../hooks';
import { RatingScale, RatingScaleOption } from '../../../types/survey.types';
import { Button, ColorSelector, DeleteConfirmationModal, Input } from '../../common';

interface RatingScaleManagerProps {
    isVisible: boolean;
    onClose: () => void;
    onScaleSelect?: (scaleId: string) => void;
}

interface RatingScaleFormData {
    id: string;
    name: string;
    description: string;
    options: RatingScaleOption[];
}

export const RatingScaleManager: React.FC<RatingScaleManagerProps> = ({
    isVisible,
    onClose,
    onScaleSelect
}) => {
    const { showSuccess, showError } = useToast();
    const {
        state: { ratingScales, editingScale: contextEditingScale, isCreating, isLoading },
        setRatingScales,
        setEditingScale,
        setIsCreating,
        setIsLoading,
        addRatingScale,
        updateRatingScale,
        deleteRatingScale,
        resetEditingState
    } = useRatingScale();
    const deleteModal = useModal<{ id: string; name: string }>();
    const [loading, setLoading] = useState(false);
    const [editingScale, setLocalEditingScale] = useState<RatingScaleFormData | null>(null);

    // Load scales when component becomes visible
    useEffect(() => {
        if (isVisible) {
            loadScales();
        }
    }, [isVisible]);

    // Always use internal state for form operations, but initialize from context if needed
    const currentEditingScale = editingScale || (contextEditingScale ? {
        id: contextEditingScale.id,
        name: contextEditingScale.name,
        description: contextEditingScale.description || '',
        options: [...contextEditingScale.options]
    } : null);

    // Sync internal state when context changes, but only on initial load
    useEffect(() => {
        if (contextEditingScale && !editingScale) {
            setLocalEditingScale({
                id: contextEditingScale.id,
                name: contextEditingScale.name,
                description: contextEditingScale.description || '',
                options: [...contextEditingScale.options]
            });
        }
    }, [contextEditingScale, editingScale]);

    const loadScales = async () => {
        setIsLoading(true);
        try {
            console.log('Loading rating scales from database...');
            const loadedScales = await firestoreHelpers.getRatingScales();
            console.log('Loaded rating scales:', loadedScales);
            setRatingScales(loadedScales);
        } catch (error) {
            console.error('Error loading rating scales:', error);
            showError('Failed to load rating scales');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateNew = () => {
        const newScale: RatingScaleFormData = {
            id: '',
            name: '',
            description: '',
            options: [
                { value: 'High', label: 'High', color: 'success', isDefault: false, order: 0 },
                { value: 'Medium', label: 'Medium', color: 'warning', isDefault: false, order: 1 },
                { value: 'Low', label: 'Low', color: 'error', isDefault: false, order: 2 },
                { value: 'Not Important', label: 'Not Important', color: 'transparent', isDefault: false, order: 3 }
            ]
        };
        setLocalEditingScale(newScale);
        setIsCreating(true);
    };

    const handleEdit = (scale: RatingScale) => {
        const formData: RatingScaleFormData = {
            id: scale.id,
            name: scale.name,
            description: scale.description || '',
            options: [...scale.options]
        };
        setLocalEditingScale(formData);
        setEditingScale(scale);
        setIsCreating(false);
    };

    const handleDelete = (scale: RatingScale) => {
        deleteModal.open({ id: scale.id, name: scale.name });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteModal.data) return;

        setLoading(true);
        try {
            console.log('Deleting rating scale with ID:', deleteModal.data.id);
            await firestoreHelpers.deleteRatingScale(deleteModal.data.id);
            console.log('Rating scale deleted successfully from Firebase');
            showSuccess('Rating scale deleted successfully');

            // Update context state
            deleteRatingScale(deleteModal.data.id);
        } catch (err) {
            showError('Failed to delete rating scale');
            console.error('Error deleting rating scale:', err);
        } finally {
            setLoading(false);
        }
        deleteModal.close();
    };

    const handleSave = async () => {
        // Always use the internal editingScale state
        const scaleToSave = editingScale;
        if (!scaleToSave) return;

        if (!scaleToSave.name.trim()) {
            showError('Scale name is required');
            return;
        }

        if (scaleToSave.options.length === 0) {
            showError('At least one option is required');
            return;
        }

        // Note: Default options are now optional - no validation required

        setLoading(true);
        try {
            const scaleData = {
                name: scaleToSave.name.trim(),
                description: scaleToSave.description.trim(),
                options: scaleToSave.options,
                metadata: {
                    createdBy: 'admin',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    isActive: true,
                }
            };

            if (isCreating) {
                const newScale = await firestoreHelpers.addRatingScale(scaleData);
                showSuccess('Rating scale created successfully');

                // Update context state
                if (newScale) {
                    addRatingScale(newScale);
                }
            } else {
                await firestoreHelpers.updateRatingScale(scaleToSave.id, scaleData);
                showSuccess('Rating scale updated successfully');

                // Update context state
                const updatedScale = { ...scaleData, id: scaleToSave.id, metadata: { isActive: true, createdBy: 'admin', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } };
                updateRatingScale(updatedScale);
            }

            setLocalEditingScale(null);
            resetEditingState();
        } catch (err) {
            showError(isCreating ? 'Failed to create rating scale' : 'Failed to update rating scale');
            console.error('Error saving rating scale:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setLocalEditingScale(null);
        resetEditingState();
        // Call onClose to close the modal
        onClose();
    };

    const updateOption = (index: number, field: keyof RatingScaleOption, value: any) => {
        const currentScale = editingScale || currentEditingScale;
        if (!currentScale) return;

        const updatedOptions = [...currentScale.options];
        updatedOptions[index] = { ...updatedOptions[index], [field]: value };

        // If setting this option as default, unset others
        if (field === 'isDefault' && value === true) {
            updatedOptions.forEach((opt, i) => {
                if (i !== index) opt.isDefault = false;
            });
        }

        const updatedScale = { ...currentScale, options: updatedOptions };
        setLocalEditingScale(updatedScale);
    };

    const addOption = () => {
        const currentScale = editingScale || currentEditingScale;
        if (!currentScale) return;

        const newOption: RatingScaleOption = {
            value: '',
            label: '',
            color: 'transparent',
            isDefault: false,
            order: currentScale.options.length
        };

        const updatedScale = {
            ...currentScale,
            options: [...currentScale.options, newOption]
        };

        setLocalEditingScale(updatedScale);
    };

    const removeOption = (index: number) => {
        const currentScale = editingScale || currentEditingScale;
        if (!currentScale || currentScale.options.length <= 1) return;

        const updatedOptions = currentScale.options.filter((_, i) => i !== index);
        // Reorder remaining options
        updatedOptions.forEach((opt, i) => {
            opt.order = i;
        });

        const updatedScale = { ...currentScale, options: updatedOptions };
        setLocalEditingScale(updatedScale);
    };

    const moveOption = (index: number, direction: 'up' | 'down') => {
        const currentScale = editingScale || currentEditingScale;
        if (!currentScale) return;

        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= currentScale.options.length) return;

        const updatedOptions = [...currentScale.options];
        [updatedOptions[index], updatedOptions[newIndex]] = [updatedOptions[newIndex], updatedOptions[index]];

        // Update order values
        updatedOptions.forEach((opt, i) => {
            opt.order = i;
        });

        const updatedScale = { ...currentScale, options: updatedOptions };
        setLocalEditingScale(updatedScale);
    };

    const handleSelectScale = (scaleId: string) => {
        if (onScaleSelect) {
            onScaleSelect(scaleId);
        }
        // Automatically close the modal after selecting a scale
        onClose();
    };

    // Clean up state when modal is closed
    useEffect(() => {
        if (!isVisible) {
            setLocalEditingScale(null);
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
                            Rating Scale Manager
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>



                    {(editingScale || currentEditingScale) ? (
                        // Edit/Create Form
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium text-gray-900">
                                    {isCreating ? 'Create New Rating Scale' : 'Edit Rating Scale'}
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
                                    name="scaleName"
                                    label="Scale Name"
                                    value={editingScale?.name || currentEditingScale?.name || ''}
                                    onChange={(value) => {
                                        const currentScale = editingScale || currentEditingScale;
                                        if (currentScale) {
                                            setEditingScale({ ...currentScale, name: value });
                                        }
                                    }}
                                    placeholder="Enter scale name"
                                    required
                                />
                                <Input
                                    name="description"
                                    label="Description"
                                    value={editingScale?.description || currentEditingScale?.description || ''}
                                    onChange={(value) => {
                                        const currentScale = editingScale || currentEditingScale;
                                        if (currentScale) {
                                            setEditingScale({ ...currentScale, description: value });
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
                                    {(editingScale?.options || currentEditingScale?.options || []).map((option, index) => (
                                        <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                                            <div className="flex-1 grid grid-cols-4 gap-3">
                                                <Input
                                                    name={`option-${index}-value`}
                                                    label="Value"
                                                    value={option.value}
                                                    onChange={(value) => updateOption(index, 'value', value)}
                                                    placeholder="e.g., High"
                                                    required
                                                />
                                                <Input
                                                    name={`option-${index}-label`}
                                                    label="Label"
                                                    value={option.label}
                                                    onChange={(value) => updateOption(index, 'label', value)}
                                                    placeholder="e.g., High"
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
                                                    disabled={index === (editingScale?.options || currentEditingScale?.options || []).length - 1}
                                                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                                                >
                                                    ↓
                                                </button>
                                                <button
                                                    onClick={() => removeOption(index)}
                                                    disabled={(editingScale?.options || currentEditingScale?.options || []).length <= 1}
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
                        // Scale List
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium text-gray-900">Rating Scales</h3>
                                <Button
                                    onClick={handleCreateNew}
                                    variant="primary"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create New Scale
                                </Button>
                            </div>

                            {isLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" />
                                </div>
                            ) : ratingScales.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    No rating scales found. Create your first one!
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {ratingScales.map((scale) => (
                                        <div key={scale.id} className="border border-gray-200 rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <div>
                                                    <h4 className="font-medium text-gray-900">{scale.name}</h4>
                                                    {scale.description && (
                                                        <p className="text-sm text-gray-600 mt-1">{scale.description}</p>
                                                    )}
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    {onScaleSelect && (
                                                        <Button
                                                            onClick={() => handleSelectScale(scale.id)}
                                                            variant="secondary"
                                                            size="sm"
                                                        >
                                                            <Check className="h-4 w-4 mr-2" />
                                                            Use This Scale
                                                        </Button>
                                                    )}
                                                    <Button
                                                        onClick={() => handleEdit(scale)}
                                                        variant="secondary"
                                                        size="sm"
                                                    >
                                                        <Edit className="h-4 w-4 mr-2" />
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleDelete(scale)}
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
                                                {scale.options.map((option, index) => (
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
