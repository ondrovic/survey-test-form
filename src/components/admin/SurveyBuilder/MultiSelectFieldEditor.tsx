import { clsx } from 'clsx';
import { CheckSquare, Square, Star, Trash2 } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { firestoreHelpers } from '../../../config/firebase';
import { RatingScale, SurveyConfig, SurveyField, SurveySection } from '../../../types/survey.types';
import { Alert, Button, Input } from '../../common';
import { RatingScaleManager } from '../RatingScaleManager';

interface MultiSelectFieldEditorProps {
    config: SurveyConfig;
    onConfigUpdate: (updatedConfig: SurveyConfig) => void;
    onClose: () => void;
}

interface FieldSelection {
    sectionId: string;
    fieldId: string;
    field: SurveyField;
    section: SurveySection;
}

interface BulkUpdateOptions {
    ratingScaleId?: string;
    ratingScaleName?: string;
    required?: boolean;
    placeholder?: string;
}

export const MultiSelectFieldEditor: React.FC<MultiSelectFieldEditorProps> = ({
    config,
    onConfigUpdate,
    onClose
}) => {
    const [selectedFields, setSelectedFields] = useState<FieldSelection[]>([]);
    const [bulkUpdateOptions, setBulkUpdateOptions] = useState<BulkUpdateOptions>({});
    const [showRatingScaleManager, setShowRatingScaleManager] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [ratingScales, setRatingScales] = useState<RatingScale[]>([]);

    // Load available rating scales
    useEffect(() => {
        const loadRatingScales = async () => {
            try {
                const scales = await firestoreHelpers.getRatingScales();
                setRatingScales(scales);
            } catch (error) {
                console.error('Error loading rating scales:', error);
            }
        };
        loadRatingScales();
    }, []);

    const analyzeSelectedFields = useCallback((fields: FieldSelection[]) => {
        if (fields.length === 0) {
            setBulkUpdateOptions({});
            return;
        }

        const options: BulkUpdateOptions = {};

        // Check if all fields have the same required status
        const allRequired = fields.every(f => f.field.required);
        const allNotRequired = fields.every(f => !f.field.required);

        if (allRequired) {
            options.required = true;
        } else if (allNotRequired) {
            options.required = false;
        }
        // If mixed, leave required undefined (user can choose)

        // Check if all fields have the same placeholder
        const placeholders = [...new Set(fields.map(f => f.field.placeholder || ''))];
        if (placeholders.length === 1 && placeholders[0] !== '') {
            options.placeholder = placeholders[0];
        }

        // Check if all rating fields have the same rating scale
        const ratingFields = fields.filter(f => f.field.type === 'rating');
        if (ratingFields.length > 0) {
            const ratingScaleIds = [...new Set(ratingFields.map(f => f.field.ratingScaleId || ''))];
            if (ratingScaleIds.length === 1 && ratingScaleIds[0] !== '') {
                const firstField = ratingFields[0];
                options.ratingScaleId = firstField.field.ratingScaleId;
                options.ratingScaleName = firstField.field.ratingScaleName;
            }
        }

        setBulkUpdateOptions(options);
    }, []);

    const toggleFieldSelection = useCallback((sectionId: string, fieldId: string, field: SurveyField, section: SurveySection) => {
        setSelectedFields(prev => {
            const existingIndex = prev.findIndex(f => f.sectionId === sectionId && f.fieldId === fieldId);
            if (existingIndex >= 0) {
                const newSelection = prev.filter((_, index) => index !== existingIndex);
                analyzeSelectedFields(newSelection);
                return newSelection;
            } else {
                const newSelection = [...prev, { sectionId, fieldId, field, section }];
                analyzeSelectedFields(newSelection);
                return newSelection;
            }
        });
    }, [analyzeSelectedFields]);

    const isFieldSelected = useCallback((sectionId: string, fieldId: string) => {
        return selectedFields.some(f => f.sectionId === sectionId && f.fieldId === fieldId);
    }, [selectedFields]);

    const handleBulkUpdate = useCallback(async () => {
        if (selectedFields.length === 0) {
            setError('Please select at least one field to update');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const updatedConfig = { ...config };

            selectedFields.forEach(({ sectionId, fieldId }) => {
                const sectionIndex = updatedConfig.sections.findIndex(s => s.id === sectionId);
                if (sectionIndex >= 0) {
                    const fieldIndex = updatedConfig.sections[sectionIndex].fields.findIndex(f => f.id === fieldId);
                    if (fieldIndex >= 0) {
                        const updatedField = { ...updatedConfig.sections[sectionIndex].fields[fieldIndex] };

                        // Apply bulk updates - only update if explicitly set
                        if (bulkUpdateOptions.ratingScaleId !== undefined) {
                            updatedField.ratingScaleId = bulkUpdateOptions.ratingScaleId;
                            updatedField.ratingScaleName = bulkUpdateOptions.ratingScaleName;
                            // Clear individual options when using rating scale
                            if (bulkUpdateOptions.ratingScaleId) {
                                updatedField.options = [];
                            }
                        }

                        if (bulkUpdateOptions.required !== undefined) {
                            updatedField.required = bulkUpdateOptions.required;
                        }

                        if (bulkUpdateOptions.placeholder !== undefined) {
                            updatedField.placeholder = bulkUpdateOptions.placeholder;
                        }

                        updatedConfig.sections[sectionIndex].fields[fieldIndex] = updatedField;
                    }
                }
            });

            // Update metadata
            updatedConfig.metadata = {
                ...updatedConfig.metadata,
                updatedAt: new Date().toISOString(),
            };

            onConfigUpdate(updatedConfig);
            setSuccess(`Successfully updated ${selectedFields.length} field(s)`);
            setSelectedFields([]);
            setBulkUpdateOptions({});
        } catch (error) {
            setError('Failed to update fields');
        } finally {
            setLoading(false);
        }
    }, [selectedFields, bulkUpdateOptions, config, onConfigUpdate]);

    const handleRatingScaleSelect = useCallback((scaleId: string) => {
        const selectedScale = ratingScales.find(scale => scale.id === scaleId);
        if (selectedScale) {
            setBulkUpdateOptions(prev => ({
                ...prev,
                ratingScaleId: scaleId,
                ratingScaleName: selectedScale.name
            }));
            setShowRatingScaleManager(false);
        }
    }, [ratingScales]);

    const clearRatingScale = useCallback(() => {
        setBulkUpdateOptions(prev => ({
            ...prev,
            ratingScaleId: undefined,
            ratingScaleName: undefined
        }));
    }, []);

    const getFieldTypeLabel = (type: string) => {
        const typeLabels: Record<string, string> = {
            text: 'Text Input',
            email: 'Email Input',
            textarea: 'Text Area',
            radio: 'Radio Buttons',
            multiselect: 'Checkboxes',
            rating: 'Rating',
            number: 'Number Input'
        };
        return typeLabels[type] || type;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-semibold">
                        Multi-Select Field Editor
                    </h2>
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                </div>

                {/* Alerts */}
                {(error || success) && (
                    <Alert
                        type={error ? 'error' : 'success'}
                        message={error || success || ''}
                        onDismiss={() => {
                            setError(null);
                            setSuccess(null);
                        }}
                        className="mx-6 mt-4"
                    />
                )}

                <div className="flex-1 flex overflow-hidden">
                    {/* Left Panel - Field Selection */}
                    <div className="w-1/2 border-r p-6 overflow-y-auto">
                        <div className="mb-6">
                            <h3 className="font-semibold mb-4">Select Fields to Update</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Click on fields to select/deselect them for bulk updates
                            </p>
                            <div className="text-sm text-blue-600 mb-4">
                                Selected: {selectedFields.length} field(s)
                            </div>
                        </div>

                        <div className="space-y-4">
                            {config.sections.map(section => (
                                <div key={section.id} className="border rounded-lg p-4">
                                    <h4 className="font-medium text-gray-900 mb-3">{section.title}</h4>
                                    <div className="space-y-2">
                                        {section.fields.map(field => (
                                            <div
                                                key={field.id}
                                                className={clsx(
                                                    "flex items-center p-3 rounded border cursor-pointer transition-colors",
                                                    isFieldSelected(section.id, field.id)
                                                        ? "border-blue-500 bg-blue-50"
                                                        : "border-gray-200 hover:border-gray-300"
                                                )}
                                                onClick={() => toggleFieldSelection(section.id, field.id, field, section)}
                                            >
                                                <div className="flex items-center mr-3">
                                                    {isFieldSelected(section.id, field.id) ? (
                                                        <CheckSquare className="w-4 h-4 text-blue-600" />
                                                    ) : (
                                                        <Square className="w-4 h-4 text-gray-400" />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-medium text-sm">{field.label}</div>
                                                    <div className="text-xs text-gray-500">
                                                        Type: {getFieldTypeLabel(field.type)}
                                                        {field.ratingScaleId && (
                                                            <span className="ml-2 text-green-600">
                                                                Uses scale: {field.ratingScaleName}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Panel - Bulk Update Options */}
                    <div className="w-1/2 p-6 overflow-y-auto">
                        <div className="mb-6">
                            <h3 className="font-semibold mb-4">Bulk Update Options</h3>
                            {selectedFields.length === 0 ? (
                                <p className="text-gray-500">Select fields from the left panel to configure bulk updates</p>
                            ) : (
                                <div className="space-y-6">
                                    {/* Rating Scale Selection */}
                                    <div className="border rounded-lg p-4">
                                        <h4 className="font-medium mb-3">Rating Scale</h4>
                                        {selectedFields.length > 0 && (
                                            <div className="mb-3">
                                                <div className="text-xs text-gray-500 mb-2">
                                                    Rating fields: {selectedFields.filter(f => f.field.type === 'rating').length}
                                                    {selectedFields.filter(f => f.field.type === 'rating' && f.field.ratingScaleId).length > 0 && (
                                                        <span className="ml-2">
                                                            ({selectedFields.filter(f => f.field.type === 'rating' && f.field.ratingScaleId).length} using scales)
                                                        </span>
                                                    )}
                                                </div>
                                                {selectedFields.filter(f => f.field.type === 'rating').some(f => f.field.ratingScaleId) !==
                                                    selectedFields.filter(f => f.field.type === 'rating').every(f => f.field.ratingScaleId) && (
                                                        <div className="text-xs text-orange-600 mb-2">
                                                            ⚠️ Mixed rating scale usage
                                                        </div>
                                                    )}
                                            </div>
                                        )}
                                        {bulkUpdateOptions.ratingScaleId ? (
                                            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded">
                                                <div className="flex items-center space-x-2">
                                                    <Star className="w-4 h-4 text-green-600" />
                                                    <span className="text-sm font-medium">
                                                        {bulkUpdateOptions.ratingScaleName}
                                                    </span>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={clearRatingScale}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={() => setShowRatingScaleManager(true)}
                                                >
                                                    <Star className="w-3 h-3 mr-1" />
                                                    Select Rating Scale
                                                </Button>
                                                <p className="text-xs text-gray-500">
                                                    Apply a rating scale to selected rating fields
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Required Field Toggle */}
                                    <div className="border rounded-lg p-4">
                                        <h4 className="font-medium mb-3">Required Field</h4>
                                        {selectedFields.length > 0 && (
                                            <div className="mb-3">
                                                <div className="text-xs text-gray-500 mb-2">
                                                    Current selection: {selectedFields.filter(f => f.field.required).length} required, {selectedFields.filter(f => !f.field.required).length} not required
                                                </div>
                                                {selectedFields.some(f => f.field.required) !== selectedFields.every(f => f.field.required) && (
                                                    <div className="text-xs text-orange-600 mb-2">
                                                        ⚠️ Mixed required status - check to make all required, uncheck to make all optional
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={bulkUpdateOptions.required || false}
                                                onChange={(e) => setBulkUpdateOptions(prev => ({
                                                    ...prev,
                                                    required: e.target.checked
                                                }))}
                                                className="mr-2"
                                            />
                                            Make selected fields required
                                        </label>
                                    </div>

                                    {/* Placeholder Text */}
                                    <div className="border rounded-lg p-4">
                                        <h4 className="font-medium mb-3">Placeholder Text</h4>
                                        {selectedFields.length > 0 && (
                                            <div className="mb-3">
                                                <div className="text-xs text-gray-500 mb-2">
                                                    Fields with placeholders: {selectedFields.filter(f => f.field.placeholder).length}
                                                </div>
                                                {selectedFields.filter(f => f.field.placeholder).length > 0 &&
                                                    selectedFields.filter(f => f.field.placeholder).length < selectedFields.length && (
                                                        <div className="text-xs text-orange-600 mb-2">
                                                            ⚠️ Mixed placeholder usage
                                                        </div>
                                                    )}
                                            </div>
                                        )}
                                        <Input
                                            name="placeholder"
                                            label="Placeholder"
                                            value={bulkUpdateOptions.placeholder || ''}
                                            onChange={(value) => setBulkUpdateOptions(prev => ({
                                                ...prev,
                                                placeholder: value
                                            }))}
                                            placeholder="Enter placeholder text"
                                        />
                                    </div>

                                    {/* Apply Updates Button */}
                                    <div className="border-t pt-4">
                                        <Button
                                            onClick={handleBulkUpdate}
                                            loading={loading}
                                            disabled={selectedFields.length === 0}
                                            className="w-full"
                                        >
                                            Apply Updates to {selectedFields.length} Field(s)
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Rating Scale Manager Modal */}
            {showRatingScaleManager && (
                <RatingScaleManager
                    isVisible={showRatingScaleManager}
                    onClose={() => setShowRatingScaleManager(false)}
                    onScaleSelect={handleRatingScaleSelect}
                    scales={ratingScales}
                />
            )}
        </div>
    );
};
