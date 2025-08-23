import { Plus, Save, Trash2, X } from 'lucide-react';
import React from 'react';
import { Button, ColorSelector, Input, SortableList } from '../../common';
import { MultiSelectPreview, RadioSelectPreview, RatingScalePreview, SelectPreview } from './previews';

export type OptionLike = {
    value: string;
    label: string;
    order: number;
    color?: string;
    isDefault?: boolean;
};

export interface OptionSetFormData<TOption extends OptionLike> {
    id: string;
    name: string;
    description: string;
    options: TOption[];
    // Allow additional shape via index signature
    [key: string]: any;
}

interface OptionSetFormProps<TOption extends OptionLike> {
    title: string;
    loading?: boolean;
    isCreating: boolean;
    data: OptionSetFormData<TOption>;
    onChange: (updated: OptionSetFormData<TOption>) => void;
    onSave: () => void;
    onCancel: () => void;
    showDefaultToggle?: boolean;
    showColor?: boolean;
    optionSetType?: 'rating-scale' | 'radio' | 'multi-select' | 'select';
    // Render additional fields (e.g., min/max selections, allowMultiple)
    renderAdditionalFields?: (args: {
        data: OptionSetFormData<TOption>;
        setField: (key: string, value: any) => void;
    }) => React.ReactNode;
}

export function OptionSetForm<TOption extends OptionLike>(props: OptionSetFormProps<TOption>) {
    const {
        title,
        loading = false,
        isCreating,
        data,
        onChange,
        onSave,
        onCancel,
        showDefaultToggle = false,
        showColor = true,
        optionSetType,
        renderAdditionalFields,
    } = props;

    const setField = (key: string, value: any) => {
        onChange({ ...data, [key]: value });
    };

    const updateOption = (index: number, update: Partial<TOption>) => {
        const updatedOptions = [...data.options];
        const current = updatedOptions[index];
        const next: TOption = { ...(current as any), ...(update as any) };
        if (showDefaultToggle && Object.prototype.hasOwnProperty.call(update, 'isDefault') && (update as any).isDefault === true) {
            // If setting a default, unset others
            for (let i = 0; i < updatedOptions.length; i++) {
                if (i !== index) {
                    (updatedOptions[i] as any).isDefault = false;
                }
            }
        }
        updatedOptions[index] = next;
        onChange({ ...data, options: updatedOptions });
    };

    const addOption = () => {
        const newOption: TOption = {
            value: '',
            label: '',
            color: 'transparent',
            isDefault: false,
            order: data.options.length,
        } as TOption;
        onChange({ ...data, options: [...data.options, newOption] });
    };

    const removeOption = (index: number) => {
        if (data.options.length <= 1) return;
        const updated = data.options.filter((_, i) => i !== index).map((opt, i) => ({ ...opt, order: i })) as TOption[];
        onChange({ ...data, options: updated });
    };

    const reorderOptions = (oldIndex: number, newIndex: number) => {
        const updated = [...data.options] as TOption[];
        const [removed] = updated.splice(oldIndex, 1);
        updated.splice(newIndex, 0, removed);

        // Update order property for all items
        for (let i = 0; i < updated.length; i++) {
            (updated[i] as any).order = i;
        }
        onChange({ ...data, options: updated });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                    {isCreating ? `Create New ${title}` : `Edit ${title}`}
                </h3>
                <div className="flex space-x-2">
                    <Button onClick={onSave} disabled={loading} variant="primary" size="sm">
                        <Save className="h-4 w-4 mr-2" />
                        {loading ? 'Saving...' : 'Save'}
                    </Button>
                    <Button onClick={onCancel} variant="secondary" size="sm">
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Input
                    name="optionSetName"
                    label="Name"
                    value={data.name}
                    onChange={(value) => setField('name', value)}
                    placeholder="Enter name"
                    required
                />
                <Input
                    name="description"
                    label="Description"
                    value={data.description || ''}
                    onChange={(value) => setField('description', value)}
                    placeholder="Enter description (optional)"
                />
            </div>

            {renderAdditionalFields && (
                <div className="grid grid-cols-2 gap-4">
                    {renderAdditionalFields({ data, setField })}
                </div>
            )}

            <div>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900">Options</h4>
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                            {data.options.length} {data.options.length === 1 ? 'option' : 'options'}
                        </span>
                    </div>
                    <Button onClick={addOption} variant="secondary" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Option
                    </Button>
                </div>

                <SortableList
                    items={data.options.map((option, index) => ({ ...option, id: `option-${index}` }))}
                    onReorder={reorderOptions}
                    renderItem={(item, isDragging) => {
                        const option = item as TOption & { id: string };
                        const index = data.options.findIndex((_, i) => i === parseInt(option.id.split('-')[1]));

                        return (
                            <div className={`p-3 border border-gray-200 rounded-lg bg-white ${isDragging ? 'shadow-lg' : ''}`}>
                                <div className="flex items-center justify-between">
                                    <div className={`flex-1 grid ${showDefaultToggle ? 'grid-cols-4' : 'grid-cols-3'} gap-3`}>
                                        <Input
                                            name={`option-${index}-value`}
                                            label="Value"
                                            value={option.value}
                                            onChange={(value) => updateOption(index, { value: String(value) } as Partial<TOption>)}
                                            placeholder="e.g., option_value"
                                            required
                                        />
                                        <Input
                                            name={`option-${index}-label`}
                                            label="Label"
                                            value={option.label}
                                            onChange={(value) => updateOption(index, { label: String(value) } as Partial<TOption>)}
                                            placeholder="e.g., Option label"
                                            required
                                        />
                                        {showColor && (
                                            <div className="space-y-1 space-x-1">
                                                <span className="block text-sm font-semibold text-gray-800 mb-2">Color</span>
                                                <ColorSelector
                                                    value={option.color || 'transparent'}
                                                    onChange={(value) => updateOption(index, { color: String(value) } as Partial<TOption>)}
                                                />
                                            </div>
                                        )}
                                        {showDefaultToggle && (
                                            <div className="flex items-center mt-6">
                                                <label className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={!!option.isDefault}
                                                        onChange={(e) => updateOption(index, { isDefault: e.target.checked } as Partial<TOption>)}
                                                        className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                                                    />
                                                    <span className="ml-2 text-sm text-gray-700">Default</span>
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                    <div className="ml-3">
                                        <button
                                            onClick={() => removeOption(index)}
                                            disabled={data.options.length <= 1}
                                            className="p-2 text-red-400 hover:text-red-600 disabled:opacity-50 hover:bg-red-50 rounded"
                                            title="Delete option"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    }}
                    className="space-y-3"
                />
            </div>

            {/* Preview Section */}
            <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900">Preview</h4>
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                        Live Preview
                    </span>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    {data.options.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                            <p className="text-sm">No options to preview</p>
                            <p className="text-xs mt-1">Add some options above to see how they&apos;ll appear</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Rating Scale Preview */}
                            {optionSetType === 'rating-scale' && (
                                <RatingScalePreview data={data} />
                            )}

                            {/* Radio Preview */}
                            {optionSetType === 'radio' && (
                                <RadioSelectPreview
                                    data={data}
                                    type="radio"
                                />
                            )}

                            {/* Select Preview */}
                            {optionSetType === 'select' && (
                                <SelectPreview
                                    data={data}
                                    allowMultiple={(data as any).allowMultiple}
                                />
                            )}

                            {/* Generic Radio/Select Preview (fallback) */}
                            {(!optionSetType && (showDefaultToggle || !showColor)) && (
                                <RadioSelectPreview
                                    data={data}
                                    type="radio"
                                />
                            )}

                            {/* Multi-select Preview */}
                            {optionSetType === 'multi-select' && (
                                <MultiSelectPreview data={data} minSelections={(data as any).minSelections} maxSelections={(data as any).maxSelections} />
                            )}

                            {/* Summary */}
                            <div className="pt-3 border-t border-gray-200">
                                <div className="flex items-center justify-between text-sm text-gray-600">
                                    <span>Total options: {data.options.length}</span>
                                    <span>Default options: {data.options.filter(opt => opt.isDefault).length}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
