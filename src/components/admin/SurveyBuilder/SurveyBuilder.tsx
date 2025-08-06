import { clsx } from 'clsx';
import { Eye, Plus, Settings, Star, Trash2 } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { firestoreHelpers } from '../../../config/firebase';
import { FieldType, SectionType, SurveyConfig, SurveyField, SurveySection } from '../../../types/survey.types';
import { Alert, Button, Input, SortableList } from '../../common';
import { RatingScaleManager } from '../RatingScaleManager';
import { MultiSelectFieldEditor } from './MultiSelectFieldEditor';

interface SurveyBuilderProps {
    onClose: () => void;
    editingConfig?: SurveyConfig | null;
}

interface BuilderState {
    config: SurveyConfig;
    selectedSection: string | null;
    selectedField: string | null;
    isPreviewMode: boolean;
    error: string | null;
    success: string | null;
    loading: boolean;
    showRatingScaleManager: boolean;
    showMultiSelectEditor: boolean;
    ratingScaleOptions: Record<string, number>; // Store option counts for rating scales
    ratingScales: Record<string, RatingScale>; // Store actual rating scale data for preview
}

const FIELD_TYPES: { value: FieldType; label: string; hasOptions: boolean }[] = [
    { value: 'text', label: 'Text Input', hasOptions: false },
    { value: 'email', label: 'Email Input', hasOptions: false },
    { value: 'textarea', label: 'Text Area', hasOptions: false },
    { value: 'radio', label: 'Radio Buttons (Single Select)', hasOptions: true },
    { value: 'multiselect', label: 'Checkboxes (Multi Select)', hasOptions: true },
    { value: 'rating', label: 'Rating', hasOptions: true },
    { value: 'number', label: 'Number Input', hasOptions: false },
];

const SECTION_TYPES: { value: SectionType; label: string }[] = [
    { value: 'personal_info', label: 'Personal Information' },
    { value: 'business_info', label: 'Business Information' },
    { value: 'rating_section', label: 'Rating Section' },
    { value: 'checkbox_section', label: 'Checkbox Section' },
    { value: 'radio_section', label: 'Radio Section' },
    { value: 'text_input', label: 'Text Input Section' },
    { value: 'custom', label: 'Custom Section' },
];

export const SurveyBuilder: React.FC<SurveyBuilderProps> = ({ onClose, editingConfig }) => {
    const [state, setState] = useState<BuilderState>({
        config: editingConfig || {
            id: '',
            title: 'New Survey',
            description: '',
            sections: [],
            metadata: {
                createdBy: 'admin',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                version: '1.0.0',
                isActive: true,
            },
        },
        selectedSection: null,
        selectedField: null,
        isPreviewMode: false,
        error: null,
        success: null,
        loading: false,
        showRatingScaleManager: false,
        showMultiSelectEditor: false,
        ratingScaleOptions: {},
        ratingScales: {},
    });

    const updateConfig = (updates: Partial<SurveyConfig>) => {
        setState(prev => ({
            ...prev,
            config: { ...prev.config, ...updates },
        }));
    };

    const addSection = () => {
        const newSection: SurveySection = {
            id: `section-${Date.now()}`,
            title: 'New Section',
            type: 'custom',
            order: state.config.sections.length + 1,
            fields: [],
        };

        updateConfig({
            sections: [...state.config.sections, newSection],
        });
        setState(prev => ({ ...prev, selectedSection: newSection.id }));
    };

    const updateSection = (sectionId: string, updates: Partial<SurveySection>) => {
        updateConfig({
            sections: state.config.sections.map(section =>
                section.id === sectionId ? { ...section, ...updates } : section
            ),
        });
    };

    const deleteSection = (sectionId: string) => {
        updateConfig({
            sections: state.config.sections.filter(section => section.id !== sectionId),
        });
        setState(prev => ({ ...prev, selectedSection: null, selectedField: null }));
    };

    const reorderSections = (oldIndex: number, newIndex: number) => {
        const newSections = [...state.config.sections];
        const [movedSection] = newSections.splice(oldIndex, 1);
        newSections.splice(newIndex, 0, movedSection);

        // Update order numbers
        const updatedSections = newSections.map((section, index) => ({
            ...section,
            order: index + 1
        }));

        updateConfig({
            sections: updatedSections,
        });
    };

    const addField = (sectionId: string) => {
        const newField: SurveyField = {
            id: `field-${Date.now()}`,
            label: 'New Field',
            type: 'text',
            required: false,
            options: [],
        };

        updateSection(sectionId, {
            fields: [...(state.config.sections.find(s => s.id === sectionId)?.fields || []), newField],
        });
        setState(prev => ({ ...prev, selectedField: newField.id }));
    };

    const updateField = (sectionId: string, fieldId: string, updates: Partial<SurveyField>) => {
        updateSection(sectionId, {
            fields: state.config.sections
                .find(s => s.id === sectionId)
                ?.fields.map(field =>
                    field.id === fieldId ? { ...field, ...updates } : field
                ) || [],
        });
    };

    const deleteField = (sectionId: string, fieldId: string) => {
        updateSection(sectionId, {
            fields: state.config.sections
                .find(s => s.id === sectionId)
                ?.fields.filter(field => field.id !== fieldId) || [],
        });
        setState(prev => ({ ...prev, selectedField: null }));
    };

    const reorderFields = (sectionId: string, oldIndex: number, newIndex: number) => {
        const section = state.config.sections.find(s => s.id === sectionId);
        if (!section) return;

        const newFields = [...section.fields];
        const [movedField] = newFields.splice(oldIndex, 1);
        newFields.splice(newIndex, 0, movedField);

        updateSection(sectionId, {
            fields: newFields,
        });
    };

    const addFieldOption = (sectionId: string, fieldId: string) => {
        const field = state.config.sections
            .find(s => s.id === sectionId)
            ?.fields.find(f => f.id === fieldId);

        if (!field) return;

        const newOption = {
            value: `option-${Date.now()}`,
            label: 'New Option',
        };

        updateField(sectionId, fieldId, {
            options: [...(field.options || []), newOption],
        });
    };

    const updateFieldOption = (sectionId: string, fieldId: string, optionIndex: number, updates: Partial<{ value: string; label: string }>) => {
        const field = state.config.sections
            .find(s => s.id === sectionId)
            ?.fields.find(f => f.id === fieldId);

        if (!field || !field.options) return;

        const updatedOptions = [...field.options];
        updatedOptions[optionIndex] = { ...updatedOptions[optionIndex], ...updates };

        updateField(sectionId, fieldId, { options: updatedOptions });
    };

    const deleteFieldOption = (sectionId: string, fieldId: string, optionIndex: number) => {
        const field = state.config.sections
            .find(s => s.id === sectionId)
            ?.fields.find(f => f.id === fieldId);

        if (!field || !field.options) return;

        const updatedOptions = field.options.filter((_, index) => index !== optionIndex);
        updateField(sectionId, fieldId, { options: updatedOptions });
    };

    const handleShowRatingScaleManager = () => {
        setState(prev => ({ ...prev, showRatingScaleManager: true }));
    };

    const handleCloseRatingScaleManager = () => {
        setState(prev => ({ ...prev, showRatingScaleManager: false }));
    };

    const loadRatingScaleOptions = useCallback(async (scaleId: string) => {
        if (state.ratingScaleOptions[scaleId] && state.ratingScales[scaleId]) return;

        try {
            const scale = await firestoreHelpers.getRatingScale(scaleId);
            if (scale) {
                setState(prev => ({
                    ...prev,
                    ratingScaleOptions: {
                        ...prev.ratingScaleOptions,
                        [scaleId]: scale.options.length
                    },
                    ratingScales: {
                        ...prev.ratingScales,
                        [scaleId]: scale
                    }
                }));
            }
        } catch (error) {
            console.error('Error loading rating scale options:', error);
        }
    }, [state.ratingScaleOptions, state.ratingScales]);

    const handleRatingScaleSelect = (scaleId: string) => {
        const selectedSection = state.config.sections.find(s => s.id === state.selectedSection);
        const selectedField = selectedSection?.fields.find(f => f.id === state.selectedField);

        if (!selectedSection || !selectedField || selectedField.type !== 'rating') return;

        // Load the selected rating scale and save its reference
        firestoreHelpers.getRatingScale(scaleId).then((scale) => {
            if (scale) {
                // Save the scale reference instead of individual options
                updateField(selectedSection.id, selectedField.id, {
                    ratingScaleId: scaleId,
                    ratingScaleName: scale.name,
                    options: [] // Clear any existing individual options
                });
                // Load the option count for display
                loadRatingScaleOptions(scaleId);
                setState(prev => ({ ...prev, showRatingScaleManager: false }));
            }
        }).catch((error) => {
            console.error('Error loading rating scale:', error);
        });
    };

    // Load rating scale option counts when config changes
    useEffect(() => {
        const scalesToLoad: string[] = [];
        state.config.sections.forEach(section => {
            section.fields.forEach(field => {
                if (field.type === 'rating' && field.ratingScaleId &&
                    (!state.ratingScaleOptions[field.ratingScaleId] || !state.ratingScales[field.ratingScaleId])) {
                    scalesToLoad.push(field.ratingScaleId);
                }
            });
        });

        scalesToLoad.forEach(scaleId => loadRatingScaleOptions(scaleId));
    }, [state.config, loadRatingScaleOptions]);

    const handleSave = async () => {
        setState(prev => ({ ...prev, loading: true, error: null, success: null }));

        try {
            // Validate that fields with options have at least one option OR a rating scale
            const fieldsWithOptions = state.config.sections.flatMap(section =>
                section.fields.filter(field => {
                    const hasOptions = FIELD_TYPES.find(t => t.value === field.type)?.hasOptions;
                    if (!hasOptions) return false;

                    // If field has a rating scale, it's valid
                    if (field.ratingScaleId) return false;

                    // If field has individual options, it's valid
                    if (field.options && field.options.length > 0) return false;

                    // Field needs either a rating scale or individual options
                    return true;
                })
            );

            if (fieldsWithOptions.length > 0) {
                setState(prev => ({
                    ...prev,
                    loading: false,
                    error: `Fields with options must have at least one option configured: ${fieldsWithOptions.map(f => f.label).join(', ')}`
                }));
                return;
            }

            // Update metadata
            const updatedConfig = {
                ...state.config,
                metadata: {
                    ...state.config.metadata,
                    updatedAt: new Date().toISOString(),
                }
            };

            if (state.config.id) {
                // Update existing survey
                await firestoreHelpers.updateSurveyConfig(state.config.id, updatedConfig);
                setState(prev => ({
                    ...prev,
                    config: updatedConfig,
                    loading: false,
                    success: 'Survey configuration updated successfully!'
                }));
            } else {
                // Create new survey
                const savedConfig = await firestoreHelpers.addSurveyConfig(updatedConfig);
                setState(prev => ({
                    ...prev,
                    config: { ...updatedConfig, id: savedConfig.id },
                    loading: false,
                    success: 'Survey configuration created successfully!'
                }));
            }
        } catch (error) {
            setState(prev => ({
                ...prev,
                loading: false,
                error: 'Failed to save survey configuration'
            }));
        }
    };

    const selectedSection = state.config.sections.find(s => s.id === state.selectedSection);
    const selectedField = selectedSection?.fields.find(f => f.id === state.selectedField);

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
                            onClick={() => setState(prev => ({ ...prev, showMultiSelectEditor: true }))}
                        >
                            <Settings className="w-4 h-4 mr-2" />
                            Multi-Edit Fields
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setState(prev => ({ ...prev, isPreviewMode: !prev.isPreviewMode }))}
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

                {/* Alerts */}
                {(state.error || state.success) && (
                    <Alert
                        type={state.error ? 'error' : 'success'}
                        message={state.error || state.success || ''}
                        onDismiss={() => setState(prev => ({ ...prev, error: null, success: null }))}
                        className="mx-6 mt-4"
                    />
                )}

                <div className="flex-1 flex overflow-hidden">
                    {/* Sidebar */}
                    <div className="w-80 border-r bg-gray-50 p-4 overflow-y-auto">
                        <div className="mb-6">
                            <h3 className="font-semibold mb-2">Survey Details</h3>
                            <Input
                                name="surveyTitle"
                                label="Title"
                                value={state.config.title}
                                onChange={(value) => updateConfig({ title: value })}
                                className="mb-2"
                            />
                            <Input
                                name="surveyDescription"
                                label="Description"
                                value={state.config.description}
                                onChange={(value) => updateConfig({ description: value })}
                            />
                        </div>

                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold">Sections</h3>
                                <Button size="sm" onClick={addSection}>
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>
                            <SortableList
                                items={state.config.sections}
                                onReorder={reorderSections}
                                className="space-y-2"
                                itemClassName="p-3 rounded border cursor-pointer"
                                renderItem={(section, isDragging) => (
                                    <div
                                        className={clsx(
                                            state.selectedSection === section.id
                                                ? "border-blue-500 bg-blue-50"
                                                : "border-gray-200 hover:border-gray-300"
                                        )}
                                        onClick={() => setState(prev => ({ ...prev, selectedSection: section.id }))}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium">{section.title}</span>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteSection(section.id);
                                                }}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {section.fields.length} fields
                                        </p>
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

                                                    {/* Show field options or rating scale options */}
                                                    {field.type === 'rating' && field.ratingScaleId && (
                                                        <div className="mt-3">
                                                            <div className="text-xs text-gray-500 mb-2">Rating Scale Options:</div>
                                                            <div className="flex flex-wrap gap-2 mb-3">
                                                                {state.ratingScales[field.ratingScaleId] ? (
                                                                    state.ratingScales[field.ratingScaleId].options.map((option, index) => (
                                                                        <span
                                                                            key={index}
                                                                            className={clsx(
                                                                                "px-2 py-1 text-xs rounded border",
                                                                                option.color === 'success' ? "bg-green-100 text-green-700 border-green-200" :
                                                                                    option.color === 'warning' ? "bg-yellow-100 text-yellow-700 border-yellow-200" :
                                                                                        option.color === 'error' ? "bg-red-100 text-red-700 border-red-200" :
                                                                                            option.color === 'default' ? "bg-blue-100 text-blue-700 border-blue-200" :
                                                                                                "bg-gray-100 text-gray-700 border-gray-200"
                                                                            )}
                                                                        >
                                                                            {option.label}
                                                                            {option.isDefault && (
                                                                                <span className="ml-1 text-xs text-gray-500">(Default)</span>
                                                                            )}
                                                                        </span>
                                                                    ))
                                                                ) : state.ratingScaleOptions[field.ratingScaleId] ? (
                                                                    <span className="text-sm text-blue-600">
                                                                        {state.ratingScaleOptions[field.ratingScaleId]} options loaded
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-sm text-gray-400">
                                                                        Loading rating scale options...
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {/* Preview dropdown */}
                                                            {state.ratingScales[field.ratingScaleId] && (
                                                                <div className="relative">
                                                                    <select
                                                                        disabled
                                                                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-gray-50"
                                                                        defaultValue=""
                                                                    >
                                                                        <option value="" disabled>
                                                                            Select rating...
                                                                        </option>
                                                                        {state.ratingScales[field.ratingScaleId].options.map((option, index) => (
                                                                            <option key={index} value={option.value}>
                                                                                {option.label}
                                                                                {option.isDefault ? ' (Default)' : ''}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {field.type === 'rating' && !field.ratingScaleId && field.options && field.options.length > 0 && (
                                                        <div className="mt-3">
                                                            <div className="text-xs text-gray-500 mb-2">Rating Options:</div>
                                                            <div className="flex flex-wrap gap-2 mb-3">
                                                                {field.options.map((option, index) => (
                                                                    <span
                                                                        key={index}
                                                                        className={clsx(
                                                                            "px-2 py-1 text-xs rounded border",
                                                                            option.color === 'success' ? "bg-green-100 text-green-700 border-green-200" :
                                                                                option.color === 'warning' ? "bg-yellow-100 text-yellow-700 border-yellow-200" :
                                                                                    option.color === 'error' ? "bg-red-100 text-red-700 border-red-200" :
                                                                                        option.color === 'default' ? "bg-blue-100 text-blue-700 border-blue-200" :
                                                                                            "bg-gray-100 text-gray-700 border-gray-200"
                                                                        )}
                                                                    >
                                                                        {option.label}
                                                                        {option.isDefault && (
                                                                            <span className="ml-1 text-xs text-gray-500">(Default)</span>
                                                                        )}
                                                                    </span>
                                                                ))}
                                                            </div>

                                                            {/* Preview dropdown */}
                                                            <div className="relative">
                                                                <select
                                                                    disabled
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-gray-50"
                                                                    defaultValue=""
                                                                >
                                                                    <option value="" disabled>
                                                                        Select rating...
                                                                    </option>
                                                                    {field.options.map((option, index) => (
                                                                        <option key={index} value={option.value}>
                                                                            {option.label}
                                                                            {option.isDefault ? ' (Default)' : ''}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {field.type === 'radio' && field.options && field.options.length > 0 && (
                                                        <div className="mt-3">
                                                            <div className="text-xs text-gray-500 mb-2">Radio Options:</div>
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
                                                        </div>
                                                    )}

                                                    {field.type === 'multiselect' && field.options && field.options.length > 0 && (
                                                        <div className="mt-3">
                                                            <div className="text-xs text-gray-500 mb-2">Checkbox Options:</div>
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
                                                        </div>
                                                    )}

                                                    {field.type === 'text' && (
                                                        <div className="mt-3">
                                                            <input
                                                                type="text"
                                                                placeholder={field.placeholder || "Text input"}
                                                                disabled
                                                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-gray-50"
                                                            />
                                                        </div>
                                                    )}

                                                    {field.type === 'email' && (
                                                        <div className="mt-3">
                                                            <input
                                                                type="email"
                                                                placeholder={field.placeholder || "Email input"}
                                                                disabled
                                                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-gray-50"
                                                            />
                                                        </div>
                                                    )}

                                                    {field.type === 'textarea' && (
                                                        <div className="mt-3">
                                                            <textarea
                                                                placeholder={field.placeholder || "Text area"}
                                                                disabled
                                                                rows={3}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-gray-50"
                                                            />
                                                        </div>
                                                    )}

                                                    {field.type === 'number' && (
                                                        <div className="mt-3">
                                                            <input
                                                                type="number"
                                                                placeholder={field.placeholder || "Number input"}
                                                                disabled
                                                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-gray-50"
                                                            />
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
                                            onChange={(value) => updateSection(selectedSection.id, { title: value })}
                                        />
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-800 mb-2">
                                                Section Type
                                            </label>
                                            <select
                                                id="sectionType"
                                                name="sectionType"
                                                value={selectedSection.type}
                                                onChange={(e) => updateSection(selectedSection.id, { type: e.target.value as SectionType })}
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
                                        onChange={(value) => updateSection(selectedSection.id, { description: value })}
                                        className="mt-4"
                                    />
                                </div>

                                <div className="mb-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="font-semibold">Fields</h4>
                                        <Button size="sm" onClick={() => addField(selectedSection.id)}>
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
                                                onClick={() => setState(prev => ({ ...prev, selectedField: field.id }))}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <span className="font-medium">{field.label}</span>
                                                        <span className="text-sm text-gray-500 ml-2">({field.type})</span>
                                                        {FIELD_TYPES.find(t => t.value === field.type)?.hasOptions && (
                                                            <span className="text-xs text-blue-600 ml-2">
                                                                {field.ratingScaleId && state.ratingScaleOptions[field.ratingScaleId]
                                                                    ? `${state.ratingScaleOptions[field.ratingScaleId]} options`
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
                                                            deleteField(selectedSection.id, field.id);
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
                                                onChange={(value) => updateField(selectedSection.id, selectedField.id, { label: value })}
                                            />
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-800 mb-2">
                                                    Field Type
                                                </label>
                                                <select
                                                    id="fieldType"
                                                    name="fieldType"
                                                    value={selectedField.type}
                                                    onChange={(e) => updateField(selectedSection.id, selectedField.id, { type: e.target.value as FieldType })}
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
                                                    id="fieldRequired"
                                                    name="fieldRequired"
                                                    type="checkbox"
                                                    checked={selectedField.required}
                                                    onChange={(e) => updateField(selectedSection.id, selectedField.id, { required: e.target.checked })}
                                                    className="mr-2"
                                                />
                                                Required field
                                            </label>
                                        </div>
                                        <Input
                                            name="fieldPlaceholder"
                                            label="Placeholder"
                                            value={selectedField.placeholder || ''}
                                            onChange={(value) => updateField(selectedSection.id, selectedField.id, { placeholder: value })}
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
                                                                onClick={handleShowRatingScaleManager}
                                                                className="text-xs"
                                                            >
                                                                <Star className="w-3 h-3 mr-1" />
                                                                Use Rating Scale
                                                            </Button>
                                                        )}
                                                        {!selectedField.ratingScaleId && (
                                                            <Button
                                                                size="sm"
                                                                onClick={() => addFieldOption(selectedSection.id, selectedField.id)}
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
                                                        {selectedField.type === 'multiselect' && ' Users can select multiple options.'}
                                                        {selectedField.type === 'rating' && ' Users can select one rating option.'}
                                                    </p>
                                                </div>

                                                <div className="space-y-3">
                                                    {selectedField.ratingScaleId ? (
                                                        // Show rating scale reference
                                                        <div className="flex items-center justify-between p-3 border rounded-md bg-green-50">
                                                            <div className="flex items-center space-x-3">
                                                                <Star className="w-4 h-4 text-green-600" />
                                                                <div>
                                                                    <p className="text-sm font-medium text-green-800">
                                                                        Using Rating Scale: {selectedField.ratingScaleName}
                                                                    </p>
                                                                    <p className="text-xs text-green-600">
                                                                        Scale ID: {selectedField.ratingScaleId}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => updateField(selectedSection.id, selectedField.id, {
                                                                    ratingScaleId: undefined,
                                                                    ratingScaleName: undefined,
                                                                    options: []
                                                                })}
                                                                className="text-red-500 hover:text-red-700"
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                            </Button>
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
                                                                                onChange={(e) => updateFieldOption(selectedSection.id, selectedField.id, index, { label: e.target.value })}
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
                                                                                onChange={(e) => updateFieldOption(selectedSection.id, selectedField.id, index, { value: e.target.value })}
                                                                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                                                placeholder="option_value"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        onClick={() => deleteFieldOption(selectedSection.id, selectedField.id, index)}
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
            </div>

            {/* Rating Scale Manager Modal */}
            {state.showRatingScaleManager && (
                <RatingScaleManager
                    isVisible={state.showRatingScaleManager}
                    onClose={handleCloseRatingScaleManager}
                    onScaleSelect={handleRatingScaleSelect}
                    scales={[]} // SurveyBuilder doesn't need to manage scales, so pass empty array
                />
            )}

            {/* Multi-Select Field Editor Modal */}
            {state.showMultiSelectEditor && (
                <MultiSelectFieldEditor
                    config={state.config}
                    onConfigUpdate={(updatedConfig) => {
                        setState(prev => ({
                            ...prev,
                            config: updatedConfig,
                            showMultiSelectEditor: false
                        }));
                    }}
                    onClose={() => setState(prev => ({ ...prev, showMultiSelectEditor: false }))}
                />
            )}
        </div>
    );
};
