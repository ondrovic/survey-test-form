import { Plus, Save, Trash2, X } from 'lucide-react';
import React from 'react';
import { Button, ColorSelector, Input } from '../../common';

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

    const moveOption = (index: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= data.options.length) return;
        const updated = [...data.options] as TOption[];
        [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
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
                    <h4 className="font-medium text-gray-900">Options</h4>
                    <Button onClick={addOption} variant="secondary" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Option
                    </Button>
                </div>

                <div className="space-y-3">
                    {data.options.map((option, index) => (
                        <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
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
                                    <div className="space-y-1">
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
                                    disabled={index === data.options.length - 1}
                                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                                >
                                    ↓
                                </button>
                                <button
                                    onClick={() => removeOption(index)}
                                    disabled={data.options.length <= 1}
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
    );
}
