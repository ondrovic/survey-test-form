import {
    ADD_OPTION_BUTTON_LABEL,
    CANCEL_BUTTON_LABEL,
    COLOR_FIELD_LABEL,
    CREATE_NEW_PREFIX,
    DEFAULT_FIELD_LABEL,
    DEFAULT_OPTIONS_LABEL,
    DELETE_OPTION_TOOLTIP,
    DESCRIPTION_FIELD_LABEL,
    DESCRIPTION_FIELD_PLACEHOLDER,
    EDIT_PREFIX,
    LABEL_FIELD_LABEL,
    LABEL_FIELD_PLACEHOLDER,
    LIVE_PREVIEW_BADGE,
    NAME_FIELD_LABEL,
    NAME_FIELD_PLACEHOLDER,
    NO_OPTIONS_PREVIEW_SUBTITLE,
    NO_OPTIONS_PREVIEW_TITLE,
    OPTION_COUNT_PLURAL,
    OPTION_COUNT_SINGLE,
    OPTIONS_SECTION_TITLE,
    PREVIEW_SECTION_TITLE,
    SAVE_BUTTON_LABEL,
    SAVING_BUTTON_LABEL,
    TOTAL_OPTIONS_LABEL,
    VALUE_FIELD_LABEL,
    VALUE_FIELD_PLACEHOLDER
} from '@/constants/options-sets.constants';
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

export const OptionSetForm = <TOption extends OptionLike>(props: OptionSetFormProps<TOption>) => {
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
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {isCreating ? `${CREATE_NEW_PREFIX} ${title}` : `${EDIT_PREFIX} ${title}`}
                </h3>
                <div className="flex space-x-2">
                    <Button onClick={onSave} disabled={loading} variant="primary" size="sm">
                        <Save className="h-4 w-4 mr-2" />
                        {loading ? SAVING_BUTTON_LABEL : SAVE_BUTTON_LABEL}
                    </Button>
                    <Button onClick={onCancel} variant="secondary" size="sm">
                        <X className="h-4 w-4 mr-2" />
                        {CANCEL_BUTTON_LABEL}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                    name="optionSetName"
                    label={NAME_FIELD_LABEL}
                    value={data.name}
                    onChange={(value) => setField('name', value)}
                    placeholder={NAME_FIELD_PLACEHOLDER}
                    required
                />
                <Input
                    name="description"
                    label={DESCRIPTION_FIELD_LABEL}
                    value={data.description || ''}
                    onChange={(value) => setField('description', value)}
                    placeholder={DESCRIPTION_FIELD_PLACEHOLDER}
                />
            </div>

            {renderAdditionalFields && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderAdditionalFields({ data, setField })}
                </div>
            )}

            <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">{OPTIONS_SECTION_TITLE}</h4>
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">
                            {data.options.length} {data.options.length === 1 ? OPTION_COUNT_SINGLE : OPTION_COUNT_PLURAL}
                        </span>
                    </div>
                    <Button onClick={addOption} variant="secondary" size="sm" className="w-full sm:w-auto">
                        <Plus className="h-4 w-4 mr-2" />
                        {ADD_OPTION_BUTTON_LABEL}
                    </Button>
                </div>

                <SortableList
                    items={data.options.map((option, index) => ({ ...option, id: `option-${index}` }))}
                    onReorder={reorderOptions}
                    renderItem={(item, isDragging) => {
                        const option = item as TOption & { id: string };
                        const index = data.options.findIndex((_, i) => i === parseInt(option.id.split('-')[1]));

                        return (
                            <div className={`p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 ${isDragging ? 'shadow-lg' : ''}`}>
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                                    <div className={`flex-1 grid ${showDefaultToggle ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'} gap-3`}>
                                        <Input
                                            name={`option-${index}-value`}
                                            label={VALUE_FIELD_LABEL}
                                            value={option.value}
                                            onChange={(value) => updateOption(index, { value: String(value) } as Partial<TOption>)}
                                            placeholder={VALUE_FIELD_PLACEHOLDER}
                                            required
                                        />
                                        <Input
                                            name={`option-${index}-label`}
                                            label={LABEL_FIELD_LABEL}
                                            value={option.label}
                                            onChange={(value) => updateOption(index, { label: String(value) } as Partial<TOption>)}
                                            placeholder={LABEL_FIELD_PLACEHOLDER}
                                            required
                                        />
                                        {showColor && (
                                            <div className="space-y-1 space-x-1">
                                                <span className="block text-sm font-semibold text-gray-800 dark:text-white mb-2">{COLOR_FIELD_LABEL}</span>
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
                                                        className="rounded border-gray-300 text-amber-600 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                                                    />
                                                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{DEFAULT_FIELD_LABEL}</span>
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex justify-end lg:ml-3">
                                        <button
                                            onClick={() => removeOption(index)}
                                            disabled={data.options.length <= 1}
                                            className="p-2 text-red-400 dark:text-red-500 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                                            title={DELETE_OPTION_TOOLTIP}
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
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <h4 className="font-medium text-gray-900 dark:text-white">{PREVIEW_SECTION_TITLE}</h4>
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full self-start">
                        {LIVE_PREVIEW_BADGE}
                    </span>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    {data.options.length === 0 ? (
                        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                            <p className="text-sm">{NO_OPTIONS_PREVIEW_TITLE}</p>
                            <p className="text-xs mt-1">{NO_OPTIONS_PREVIEW_SUBTITLE}</p>
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
                            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-gray-600 dark:text-gray-400">
                                    <span>{TOTAL_OPTIONS_LABEL} {data.options.length}</span>
                                    <span>{DEFAULT_OPTIONS_LABEL} {data.options.filter(opt => opt.isDefault).length}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
