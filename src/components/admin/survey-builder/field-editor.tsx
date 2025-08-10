import { Plus, Star, Trash2 } from 'lucide-react';
import React from 'react';
import { FieldType, SurveyField } from '../../../types/framework.types';
import { Button, Input } from '../../common';
import { FIELD_TYPES } from './survey-builder.types';

interface FieldEditorProps {
    field: SurveyField;
    sectionId: string;
    onUpdateField: (sectionId: string, fieldId: string, updates: Partial<SurveyField>) => void;
    onAddFieldOption: (sectionId: string, fieldId: string) => void;
    onUpdateFieldOption: (sectionId: string, fieldId: string, optionIndex: number, updates: { label?: string; value?: string }) => void;
    onDeleteFieldOption: (sectionId: string, fieldId: string, optionIndex: number) => void;
    onShowRatingScaleManager: () => void;
}

export const FieldEditor: React.FC<FieldEditorProps> = ({
    field,
    sectionId,
    onUpdateField,
    onAddFieldOption,
    onUpdateFieldOption,
    onDeleteFieldOption,
    onShowRatingScaleManager
}) => {
    return (
        <div className="border-t pt-6">
            <h4 className="font-semibold mb-4">Field: {field.label}</h4>
            <div className="grid grid-cols-2 gap-4">
                <Input
                    name="fieldLabel"
                    label="Field Label"
                    value={field.label}
                    onChange={(value) => onUpdateField(sectionId, field.id, { label: value })}
                />
                <div>
                    <label htmlFor="field-editor-type" className="block text-sm font-semibold text-gray-800 mb-2">
                        Field Type
                    </label>
                    <select
                        id="field-editor-type"
                        value={field.type}
                        onChange={(e) => onUpdateField(sectionId, field.id, { type: e.target.value as FieldType })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        {FIELD_TYPES.map((type) => (
                            <option key={type.value} value={type.value}>
                                {type.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="mt-4">
                <label className="flex items-center">
                    <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => onUpdateField(sectionId, field.id, { required: e.target.checked })}
                        className="mr-2"
                    />
                    Required field
                </label>
            </div>
            <Input
                name="fieldPlaceholder"
                label="Placeholder"
                value={field.placeholder || ''}
                onChange={(value) => onUpdateField(sectionId, field.id, { placeholder: value })}
                className="mt-4"
            />

            {/* Field Options Configuration */}
            {FIELD_TYPES.find(t => t.value === field.type)?.hasOptions && (
                <div className="mt-6 border-t pt-6">
                    <div className="flex items-center justify-between mb-4">
                        <h5 className="font-semibold text-gray-900">Field Options</h5>
                        <div className="flex space-x-2">
                            {field.type === 'rating' && (
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={onShowRatingScaleManager}
                                    className="text-xs"
                                >
                                    <Star className="w-3 h-3 mr-1" />
                                    Use Rating Scale
                                </Button>
                            )}
                            {!field.ratingScaleId && (
                                <Button
                                    size="sm"
                                    onClick={() => onAddFieldOption(sectionId, field.id)}
                                    className="text-xs"
                                >
                                    <Plus className="w-3 h-3 mr-1" />
                                    Add Option
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="mb-4 p-3 bg-blue-50 rounded-md">
                        <p className="text-xs text-blue-800">
                            <strong>Tip:</strong> Configure the options that users can select from.
                            {field.type === 'radio' && ' Users can select only one option.'}
                            {field.type === 'checkbox' && ' Users can select multiple options.'}
                            {field.type === 'rating' && ' Users can select one rating option.'}
                        </p>
                    </div>

                    <div className="space-y-3">
                        {field.ratingScaleId ? (
                            // Show rating scale options as buttons
                            <div className="p-3 border rounded-md bg-white">
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <h6 className="font-medium text-gray-900">{field.ratingScaleName}</h6>
                                        <p className="text-xs text-gray-500">High, Medium, Low, Not Important Scale</p>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => onUpdateField(sectionId, field.id, {
                                            ratingScaleId: undefined,
                                            ratingScaleName: undefined,
                                            options: []
                                        })}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <span className="px-3 py-1 text-sm rounded border bg-yellow-100 text-yellow-700 border-yellow-200">
                                        High (Default)
                                    </span>
                                    <span className="px-3 py-1 text-sm rounded border bg-gray-100 text-gray-700 border-gray-200">
                                        Medium
                                    </span>
                                    <span className="px-3 py-1 text-sm rounded border bg-gray-100 text-gray-700 border-gray-200">
                                        Low
                                    </span>
                                    <span className="px-3 py-1 text-sm rounded border bg-gray-100 text-gray-700 border-gray-200">
                                        Not Important
                                    </span>
                                </div>
                            </div>
                        ) : (
                            // Show individual options
                            <>
                                {(field.options || []).map((option, index) => (
                                    <div key={index} className="flex items-center space-x-3 p-3 border rounded-md bg-gray-50">
                                        <div className="flex-1 grid grid-cols-2 gap-3">
                                            <div>
                                                <label htmlFor={`option-editor-label-${index}`} className="block text-xs font-medium text-gray-700 mb-1">
                                                    Option Label
                                                </label>
                                                <input
                                                    id={`option-editor-label-${index}`}
                                                    type="text"
                                                    value={option.label}
                                                    onChange={(e) => onUpdateFieldOption(sectionId, field.id, index, { label: e.target.value })}
                                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    placeholder="Option label"
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor={`option-editor-value-${index}`} className="block text-xs font-medium text-gray-700 mb-1">
                                                    Option Value
                                                </label>
                                                <input
                                                    id={`option-editor-value-${index}`}
                                                    type="text"
                                                    value={option.value}
                                                    onChange={(e) => onUpdateFieldOption(sectionId, field.id, index, { value: e.target.value })}
                                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    placeholder="option_value"
                                                />
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => onDeleteFieldOption(sectionId, field.id, index)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
                                    </div>
                                ))}
                                {(field.options || []).length === 0 && (
                                    <div className="text-center text-gray-500 text-sm py-4">
                                        No options configured. Add options to enable selection.
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
