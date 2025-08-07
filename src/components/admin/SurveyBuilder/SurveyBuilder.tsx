import { clsx } from 'clsx';
import { Eye, Plus, Settings, Star, Trash2 } from 'lucide-react';
import React, { useEffect } from 'react';
import { firestoreHelpers } from '../../../config/firebase';
import { SurveyBuilderProvider, useSurveyBuilder } from '../../../contexts/SurveyBuilderContext';
import { useSurveyDataContext } from '../../../contexts/SurveyDataContext';
import { useToast } from '../../../contexts/ToastContext';
import { FieldType, SurveyField, SurveySection } from '../../../types/survey.types';
import { Button, Input, SortableList } from '../../common';
import { RatingScaleManager } from '../RatingScaleManager';
import { MultiSelectFieldEditor } from './MultiSelectFieldEditor';
import { FIELD_TYPES, SECTION_TYPES, SurveyBuilderProps } from './SurveyBuilder.types';

// Wrapper component that provides the context
export const SurveyBuilder: React.FC<SurveyBuilderProps> = ({ onClose, editingConfig }) => {
    return (
        <SurveyBuilderProvider initialConfig={editingConfig || undefined}>
            <SurveyBuilderContent onClose={onClose} editingConfig={editingConfig} />
        </SurveyBuilderProvider>
    );
};

// Main component that uses the context
const SurveyBuilderContent: React.FC<SurveyBuilderProps> = ({ onClose, editingConfig }) => {
    const { showSuccess, showError } = useToast();
    const { refreshAll } = useSurveyDataContext();
    const {
        state,
        updateConfig,
        selectSection,
        selectField,
        togglePreviewMode,
        setLoading,
        showRatingScaleManager,
        showMultiSelectEditor,
        addSection,
        updateSection,
        deleteSection,
        reorderSections,
        addField,
        updateField,
        deleteField,
        reorderFields,
        addFieldOption,
        updateFieldOption,
        deleteFieldOption,
        updateEntireConfig
    } = useSurveyBuilder();

    // Initialize config if editing
    useEffect(() => {
        if (editingConfig) {
            // The context will handle this automatically
        }
    }, [editingConfig]);

    const handleTitleChange = (value: string) => {
        updateConfig({ title: value });
    };

    const handleDescriptionChange = (value: string) => {
        updateConfig({ description: value });
    };

    const handleAddSection = () => {
        const newSection: SurveySection = {
            id: `section-${Date.now()}`,
            title: 'New Section',
            type: 'custom',
            order: state.config.sections.length + 1,
            fields: [],
        };
        addSection(newSection);
        selectSection(newSection.id);
    };

    const handleUpdateSection = (sectionId: string, updates: Partial<SurveySection>) => {
        updateSection(sectionId, updates);
    };

    const handleDeleteSection = (sectionId: string) => {
        deleteSection(sectionId);
    };

    const handleAddField = (sectionId: string, fieldType: FieldType) => {
        const newField: SurveyField = {
            id: `${fieldType}_new_field_${Date.now()}`,
            label: `New ${fieldType} Field`,
            type: fieldType,
            required: false,
        };
        addField(sectionId, newField);
        selectField(newField.id);
    };

    const handleUpdateField = (sectionId: string, fieldId: string, updates: Partial<SurveyField>) => {
        updateField(sectionId, fieldId, updates);
    };

    const handleDeleteField = (sectionId: string, fieldId: string) => {
        deleteField(sectionId, fieldId);
    };

    const handleAddFieldOption = (sectionId: string, fieldId: string) => {
        addFieldOption(sectionId, fieldId, { label: 'New Option', value: 'new_option' });
    };

    const handleUpdateFieldOption = (sectionId: string, fieldId: string, optionIndex: number, updates: { label?: string; value?: string }) => {
        updateFieldOption(sectionId, fieldId, optionIndex, updates);
    };

    const handleDeleteFieldOption = (sectionId: string, fieldId: string, optionIndex: number) => {
        deleteFieldOption(sectionId, fieldId, optionIndex);
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            const updatedConfig = { ...state.config };

            if (editingConfig) {
                await firestoreHelpers.updateSurveyConfig(editingConfig.id, updatedConfig);
                showSuccess('Survey configuration updated successfully!');
            } else {
                await firestoreHelpers.addSurveyConfig(updatedConfig);
                showSuccess('Survey configuration created successfully!');
            }

            await refreshAll();
            onClose();
        } catch (error) {
            showError('Failed to save survey configuration');
        } finally {
            setLoading(false);
        }
    };

    const selectedSection = state.config.sections.find(s => s.id === state.selectedSection);
    const selectedField = selectedSection?.fields.find(f => f.id === state.selectedField);

    console.log('🎯 SurveyBuilder render called:', {
        configTitle: state.config.title,
        sectionsCount: state.config.sections.length,
        selectedSectionId: state.selectedSection,
        selectedFieldId: state.selectedField,
        isPreviewMode: state.isPreviewMode
    });

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-semibold">
                        {editingConfig ? 'Edit Survey' : 'Survey Builder'}
                    </h2>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => showMultiSelectEditor(true)}
                        >
                            <Settings className="w-4 h-4 mr-2" />
                            Multi-Edit Fields
                        </Button>
                        <Button
                            variant="outline"
                            onClick={togglePreviewMode}
                        >
                            <Eye className="w-4 h-4 mr-2" />
                            {state.isPreviewMode ? 'Edit' : 'Preview'}
                        </Button>
                        <Button onClick={handleSave} loading={state.loading}>
                            {editingConfig ? 'Update Survey' : 'Save Survey'}
                        </Button>
                        <Button variant="outline" onClick={onClose}>
                            Close
                        </Button>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Sidebar */}
                    <div className="w-80 border-r bg-gray-50 p-4 overflow-y-auto">
                        <div className="mb-6">
                            <h3 className="font-semibold mb-2">Survey Details</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Title
                                    </label>
                                    <Input
                                        name="surveyTitle"
                                        value={state.config.title}
                                        onChange={handleTitleChange}
                                        placeholder="Survey title"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description
                                    </label>
                                    <Input
                                        name="surveyDescription"
                                        value={state.config.description}
                                        onChange={handleDescriptionChange}
                                        placeholder="Survey description"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold">Sections</h3>
                                <Button
                                    size="sm"
                                    onClick={handleAddSection}
                                >
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>
                            <SortableList
                                items={state.config.sections}
                                onReorder={reorderSections}
                                className="space-y-2"
                                itemClassName="p-3 border rounded-lg cursor-pointer transition-colors"
                                renderItem={(section, isDragging) => (
                                    <div
                                        className={clsx(
                                            state.selectedSection === section.id
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                        )}
                                        onClick={() => selectSection(section.id)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium">{section.title}</span>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteSection(section.id);
                                                }}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                        <div className="text-sm text-gray-500 mt-1">
                                            {section.fields.length} fields
                                        </div>
                                    </div>
                                )}
                            />
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 p-6 overflow-y-auto">
                        {state.isPreviewMode ? (
                            <div className="max-w-2xl mx-auto">
                                <h2 className="text-2xl font-bold mb-4">{state.config.title}</h2>
                                {state.config.description && (
                                    <p className="text-gray-600 mb-6">{state.config.description}</p>
                                )}
                                {state.config.sections.map((section) => (
                                    <div key={section.id} className="mb-8">
                                        <h3 className="text-lg font-semibold mb-4">{section.title}</h3>
                                        {section.description && (
                                            <p className="text-gray-600 mb-4">{section.description}</p>
                                        )}
                                        <div className="space-y-4">
                                            {section.fields.map((field) => (
                                                <div key={field.id} className="p-4 border rounded">
                                                    <label className="block text-sm font-medium mb-2">
                                                        {field.label}
                                                        {field.required && <span className="text-red-500 ml-1">*</span>}
                                                    </label>
                                                    <div className="text-gray-500 text-sm mb-2">
                                                        Type: {field.type}
                                                        {field.ratingScaleId && (
                                                            <span className="ml-2 text-green-600">
                                                                (Using rating scale: {field.ratingScaleName})
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Preview field based on type */}
                                                    {field.type === 'text' && (
                                                        <input
                                                            type="text"
                                                            placeholder={field.placeholder || "Text input"}
                                                            disabled
                                                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-gray-50"
                                                        />
                                                    )}

                                                    {field.type === 'textarea' && (
                                                        <textarea
                                                            placeholder={field.placeholder || "Text area"}
                                                            disabled
                                                            rows={3}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-gray-50"
                                                        />
                                                    )}

                                                    {field.type === 'email' && (
                                                        <input
                                                            type="email"
                                                            placeholder={field.placeholder || "Enter your email address"}
                                                            disabled
                                                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-gray-50"
                                                        />
                                                    )}

                                                    {field.type === 'multiselect' && field.options && field.options.length > 0 && (
                                                        <div className="space-y-2">
                                                            {field.options.map((option, index) => (
                                                                <div key={index} className="flex items-center">
                                                                    <input
                                                                        type="checkbox"
                                                                        disabled
                                                                        className="mr-2"
                                                                    />
                                                                    <span className="text-sm">{option.label}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {field.type === 'radio' && field.options && field.options.length > 0 && (
                                                        <div className="space-y-1">
                                                            {field.options.map((option, index) => (
                                                                <div key={index} className="flex items-center">
                                                                    <input
                                                                        type="radio"
                                                                        name={`preview-${field.id}`}
                                                                        disabled
                                                                        className="mr-2"
                                                                    />
                                                                    <span className="text-sm">{option.label}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {field.type === 'checkbox' && field.options && field.options.length > 0 && (
                                                        <div className="space-y-1">
                                                            {field.options.map((option, index) => (
                                                                <div key={index} className="flex items-center">
                                                                    <input
                                                                        type="checkbox"
                                                                        disabled
                                                                        className="mr-2"
                                                                    />
                                                                    <span className="text-sm">{option.label}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {field.type === 'rating' && field.ratingScaleId && (
                                                        <div className="mt-3">
                                                            <div className="text-xs text-gray-500 mb-2">Rating Scale Options:</div>
                                                            <div className="flex flex-wrap gap-2 mb-3">
                                                                <span className="text-sm text-blue-600">
                                                                    Using rating scale: {field.ratingScaleName}
                                                                </span>
                                                            </div>
                                                            {/* Preview dropdown for rating scale */}
                                                            <div className="relative">
                                                                <select
                                                                    disabled
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-gray-50"
                                                                    defaultValue=""
                                                                >
                                                                    <option value="" disabled>
                                                                        Select rating...
                                                                    </option>
                                                                    <option value="high">High (Default)</option>
                                                                    <option value="medium">Medium</option>
                                                                    <option value="low">Low</option>
                                                                    <option value="not_important">Not Important</option>
                                                                </select>
                                                            </div>
                                                            {/* Show rating scale options as badges */}
                                                            <div className="flex flex-wrap gap-2 mt-2">
                                                                <span className="px-2 py-1 text-xs rounded border bg-yellow-100 text-yellow-700 border-yellow-200">
                                                                    High (Default)
                                                                </span>
                                                                <span className="px-2 py-1 text-xs rounded border bg-gray-100 text-gray-700 border-gray-200">
                                                                    Medium
                                                                </span>
                                                                <span className="px-2 py-1 text-xs rounded border bg-gray-100 text-gray-700 border-gray-200">
                                                                    Low
                                                                </span>
                                                                <span className="px-2 py-1 text-xs rounded border bg-gray-100 text-gray-700 border-gray-200">
                                                                    Not Important
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {field.type === 'rating' && !field.ratingScaleId && field.options && field.options.length > 0 && (
                                                        <div className="flex flex-wrap gap-2">
                                                            {field.options.map((option, index) => (
                                                                <span
                                                                    key={index}
                                                                    className="px-2 py-1 text-xs rounded border bg-gray-100 text-gray-700 border-gray-200"
                                                                >
                                                                    {option.label}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : selectedSection ? (
                            <div>
                                <div className="mb-6">
                                    <h3 className="text-lg font-semibold mb-4">Section: {selectedSection.title}</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input
                                            name="sectionTitle"
                                            label="Section Title"
                                            value={selectedSection.title}
                                            onChange={(value) => handleUpdateSection(selectedSection.id, { title: value })}
                                        />
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-800 mb-2">
                                                Section Type
                                            </label>
                                            <select
                                                value={selectedSection.type}
                                                onChange={(e) => handleUpdateSection(selectedSection.id, { type: e.target.value as any })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                {SECTION_TYPES.map((type) => (
                                                    <option key={type.value} value={type.value}>
                                                        {type.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <Input
                                        name="sectionDescription"
                                        label="Description"
                                        value={selectedSection.description || ''}
                                        onChange={(value) => handleUpdateSection(selectedSection.id, { description: value })}
                                        className="mt-4"
                                    />
                                </div>

                                <div className="mb-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="font-semibold">Fields</h4>
                                        <Button size="sm" onClick={() => handleAddField(selectedSection.id, 'text')}>
                                            <Plus className="w-4 h-4 mr-2" />
                                            Add Field
                                        </Button>
                                    </div>
                                    <SortableList
                                        items={selectedSection.fields}
                                        onReorder={(oldIndex, newIndex) => reorderFields(selectedSection.id, oldIndex, newIndex)}
                                        className="space-y-4"
                                        itemClassName="p-4 border rounded cursor-pointer"
                                        renderItem={(field, isDragging) => (
                                            <div
                                                className={clsx(
                                                    state.selectedField === field.id
                                                        ? "border-blue-500 bg-blue-50"
                                                        : "border-gray-200 hover:border-gray-300"
                                                )}
                                                onClick={() => selectField(field.id)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">{field.label}</span>
                                                        <span className="text-sm text-gray-500">({field.type})</span>
                                                        {field.required && (
                                                            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                                                                Required
                                                            </span>
                                                        )}
                                                        {FIELD_TYPES.find(t => t.value === field.type)?.hasOptions && (
                                                            <span className="text-xs text-blue-600">
                                                                {field.ratingScaleId
                                                                    ? '4 options'  // Rating scale has 4 options: High, Medium, Low, Not Important
                                                                    : field.options && field.options.length > 0
                                                                        ? `${field.options.length} options`
                                                                        : 'No options'
                                                                }
                                                            </span>
                                                        )}
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteField(selectedSection.id, field.id);
                                                        }}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    />
                                </div>

                                {selectedField && (
                                    <div className="border-t pt-6">
                                        <h4 className="font-semibold mb-4">Field: {selectedField.label}</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <Input
                                                name="fieldLabel"
                                                label="Field Label"
                                                value={selectedField.label}
                                                onChange={(value) => handleUpdateField(selectedSection.id, selectedField.id, { label: value })}
                                            />
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-800 mb-2">
                                                    Field Type
                                                </label>
                                                <select
                                                    value={selectedField.type}
                                                    onChange={(e) => handleUpdateField(selectedSection.id, selectedField.id, { type: e.target.value as FieldType })}
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
                                                    checked={selectedField.required}
                                                    onChange={(e) => handleUpdateField(selectedSection.id, selectedField.id, { required: e.target.checked })}
                                                    className="mr-2"
                                                />
                                                Required field
                                            </label>
                                        </div>
                                        <Input
                                            name="fieldPlaceholder"
                                            label="Placeholder"
                                            value={selectedField.placeholder || ''}
                                            onChange={(value) => handleUpdateField(selectedSection.id, selectedField.id, { placeholder: value })}
                                            className="mt-4"
                                        />

                                        {/* Field Options Configuration */}
                                        {FIELD_TYPES.find(t => t.value === selectedField.type)?.hasOptions && (
                                            <div className="mt-6 border-t pt-6">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h5 className="font-semibold text-gray-900">Field Options</h5>
                                                    <div className="flex space-x-2">
                                                        {selectedField.type === 'rating' && (
                                                            <Button
                                                                size="sm"
                                                                variant="secondary"
                                                                onClick={() => showRatingScaleManager(true)}
                                                                className="text-xs"
                                                            >
                                                                <Star className="w-3 h-3 mr-1" />
                                                                Use Rating Scale
                                                            </Button>
                                                        )}
                                                        {!selectedField.ratingScaleId && (
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleAddFieldOption(selectedSection.id, selectedField.id)}
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
                                                        {selectedField.type === 'radio' && ' Users can select only one option.'}
                                                        {selectedField.type === 'checkbox' && ' Users can select multiple options.'}
                                                        {selectedField.type === 'rating' && ' Users can select one rating option.'}
                                                    </p>
                                                </div>

                                                <div className="space-y-3">
                                                    {selectedField.ratingScaleId ? (
                                                        // Show rating scale options as buttons
                                                        <div className="p-3 border rounded-md bg-white">
                                                            <div className="flex items-center justify-between mb-3">
                                                                <div>
                                                                    <h6 className="font-medium text-gray-900">{selectedField.ratingScaleName}</h6>
                                                                    <p className="text-xs text-gray-500">High, Medium, Low, Not Important Scale</p>
                                                                </div>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => handleUpdateField(selectedSection.id, selectedField.id, {
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
                                                            {(selectedField.options || []).map((option, index) => (
                                                                <div key={index} className="flex items-center space-x-3 p-3 border rounded-md bg-gray-50">
                                                                    <div className="flex-1 grid grid-cols-2 gap-3">
                                                                        <div>
                                                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                                                Option Label
                                                                            </label>
                                                                            <input
                                                                                type="text"
                                                                                value={option.label}
                                                                                onChange={(e) => handleUpdateFieldOption(selectedSection.id, selectedField.id, index, { label: e.target.value })}
                                                                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                                                placeholder="Option label"
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                                                Option Value
                                                                            </label>
                                                                            <input
                                                                                type="text"
                                                                                value={option.value}
                                                                                onChange={(e) => handleUpdateFieldOption(selectedSection.id, selectedField.id, index, { value: e.target.value })}
                                                                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                                                placeholder="option_value"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        onClick={() => handleDeleteFieldOption(selectedSection.id, selectedField.id, index)}
                                                                        className="text-red-500 hover:text-red-700"
                                                                    >
                                                                        <Trash2 className="w-3 h-3" />
                                                                    </Button>
                                                                </div>
                                                            ))}
                                                            {(selectedField.options || []).length === 0 && (
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
                                )}
                            </div>
                        ) : (
                            <div className="text-center text-gray-500 mt-8">
                                Select a section to edit its configuration
                            </div>
                        )}
                    </div>
                </div>

                {/* Rating Scale Manager Modal */}
                {state.showRatingScaleManager && (
                    <RatingScaleManager
                        isVisible={state.showRatingScaleManager}
                        onClose={() => showRatingScaleManager(false)}
                        onScaleSelect={(scaleId) => {
                            if (selectedField) {
                                handleUpdateField(selectedSection!.id, selectedField.id, {
                                    ratingScaleId: scaleId,
                                    ratingScaleName: `Rating Scale ${scaleId}`
                                });
                            }
                            showRatingScaleManager(false);
                        }}
                        scales={[]} // SurveyBuilder doesn't need to manage scales, so pass empty array
                    />
                )}

                {/* Multi-Select Field Editor Modal */}
                {state.showMultiSelectEditor && (
                    <MultiSelectFieldEditor
                        config={state.config}
                        onConfigUpdate={(updatedConfig) => {
                            updateEntireConfig(updatedConfig);
                        }}
                        onClose={() => showMultiSelectEditor(false)}
                    />
                )}
            </div>
        </div>
    );
};
