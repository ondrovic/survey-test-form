import React from 'react';
import { firestoreHelpers } from '../../../config/firebase';
import { SurveyBuilderProvider, useSurveyBuilder } from '../../../contexts/survey-builder-context/index';
import { useSurveyData } from '../../../contexts/survey-data-context/index';
import { useToast } from '../../../contexts/toast-context/index';
import { ValidationProvider, useValidation } from '../../../contexts/validation-context';
import { SurveySection } from '../../../types/framework.types';
import { FieldType, SurveyField } from '../../../types/framework.types';
import { MultiSelectOptionSetManager } from '../multi-select-option-set-manager';
import { RadioOptionSetManager } from '../radio-option-set-manager';
import { RatingScaleManager } from '../rating-scale-manager';
import { SelectOptionSetManager } from '../select-option-set-manager';
import { FieldEditorModal } from './field-editor-modal';
import { MultiSelectFieldEditor } from './multi-select-field-editor';
import { SectionEditor } from './section-editor';
import { SectionList } from './section-list';
import { SurveyBuilderProps } from './survey-builder.types';
import { SurveyDetails } from './survey-details';
import { SurveyHeader } from './survey-header';
import { SurveyPreview } from './survey-preview';

// Wrapper component that provides the context
export const SurveyBuilder: React.FC<SurveyBuilderProps> = ({ onClose, editingConfig }) => {
    return (
        <ValidationProvider>
            <SurveyBuilderProvider initialConfig={editingConfig || undefined}>
                <SurveyBuilderContent onClose={onClose} editingConfig={editingConfig} />
            </SurveyBuilderProvider>
        </ValidationProvider>
    );
};

// Main component that uses the context
const SurveyBuilderContent: React.FC<SurveyBuilderProps> = ({ onClose, editingConfig }) => {
    const { showSuccess, showError } = useToast();
    const { refreshAll } = useSurveyData();
    const { validateSurvey } = useValidation();
    const {
        state,
        updateConfig,
        selectSection,
        selectField,
        togglePreviewMode,
        setLoading,
        showRatingScaleManager,
        showMultiSelectEditor,
        showFieldEditorModal,
        showRadioOptionSetManager,
        showMultiSelectOptionSetManager,
        showSelectOptionSetManager,
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
        handleOpenFieldEditor(newField.id);
    };

    const handleUpdateField = (sectionId: string, fieldId: string, updates: Partial<SurveyField>) => {
        console.log('🔄 Updating field:', { sectionId, fieldId, updates });
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

    const handleOpenFieldEditor = (fieldId: string) => {
        selectField(fieldId);
        showFieldEditorModal(true);
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            const updatedConfig = { ...state.config };

            // Validate the entire survey before saving
            const validation = validateSurvey(updatedConfig);
            if (!validation.isValid) {
                const errorMessage = validation.errors.length > 0 
                    ? `Validation failed:\n${validation.errors.slice(0, 3).join('\n')}${validation.errors.length > 3 ? '\n...and more' : ''}`
                    : 'Survey validation failed. Please check all fields.';
                
                showError(errorMessage);
                setLoading(false);
                return;
            }

            if (editingConfig) {
                await firestoreHelpers.updateSurveyConfig(editingConfig.id, updatedConfig);
                showSuccess(`Survey configuration "${updatedConfig.title}" updated!`);
            } else {
                await firestoreHelpers.addSurveyConfig(updatedConfig);
                showSuccess(`Survey configuration "${updatedConfig.title}" created!`);
            }

            await refreshAll();
            onClose();
        } catch (error) {
            const configTitle = state.config.title || 'Survey configuration';
            showError(`Failed to save survey configuration "${configTitle}"`);
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
                <SurveyHeader
                    isEditing={!!editingConfig}
                    isPreviewMode={state.isPreviewMode}
                    loading={state.loading}
                    config={state.config}
                    onTogglePreview={togglePreviewMode}
                    onShowMultiSelectEditor={() => showMultiSelectEditor(true)}
                    onSave={handleSave}
                    onClose={onClose}
                />

                <div className="flex-1 flex overflow-hidden">
                    {/* Sidebar */}
                    <div className="w-80 border-r bg-gray-50 p-4 overflow-y-auto">
                        <SurveyDetails
                            title={state.config.title}
                            description={state.config.description || ''}
                            onTitleChange={handleTitleChange}
                            onDescriptionChange={handleDescriptionChange}
                        />
                        <SectionList
                            sections={state.config.sections}
                            selectedSectionId={state.selectedSection}
                            onAddSection={handleAddSection}
                            onSelectSection={selectSection}
                            onDeleteSection={handleDeleteSection}
                            onReorderSections={reorderSections}
                        />
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 p-6 overflow-y-auto">
                        {state.isPreviewMode ? (
                            <SurveyPreview config={state.config} />
                        ) : selectedSection ? (
                            <div>
                                <SectionEditor
                                    section={selectedSection}
                                    selectedFieldId={state.selectedField}
                                    onUpdateSection={handleUpdateSection}
                                    onAddField={handleAddField}
                                    onSelectField={selectField}
                                    onOpenFieldEditor={handleOpenFieldEditor}
                                    onDeleteField={handleDeleteField}
                                    onReorderFields={reorderFields}
                                />
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

                {/* Radio Option Set Manager Modal */}
                {state.showRadioOptionSetManager && (
                    <RadioOptionSetManager
                        isVisible={state.showRadioOptionSetManager}
                        onClose={() => showRadioOptionSetManager(false)}
                        onOptionSetSelect={async (optionSetId) => {
                            if (selectedField) {
                                try {
                                    // Fetch the actual option set to get its name
                                    const optionSet = await firestoreHelpers.getRadioOptionSet(optionSetId);
                                    handleUpdateField(selectedSection!.id, selectedField.id, {
                                        radioOptionSetId: optionSetId,
                                        radioOptionSetName: optionSet?.name || `Radio Option Set ${optionSetId}`
                                    });
                                } catch (error) {
                                    console.error('Error fetching option set name:', error);
                                    // Fallback to generic name if fetch fails
                                    handleUpdateField(selectedSection!.id, selectedField.id, {
                                        radioOptionSetId: optionSetId,
                                        radioOptionSetName: `Radio Option Set ${optionSetId}`
                                    });
                                }
                            }
                            showRadioOptionSetManager(false);
                        }}
                    />
                )}

                {/* Multi-Select Option Set Manager Modal */}
                {state.showMultiSelectOptionSetManager && (
                    <MultiSelectOptionSetManager
                        isVisible={state.showMultiSelectOptionSetManager}
                        onClose={() => showMultiSelectOptionSetManager(false)}
                        onOptionSetSelect={async (optionSetId) => {
                            console.log('🎯 Selected multi-select option set:', optionSetId);
                            if (selectedField) {
                                try {
                                    // Fetch the actual option set to get its name
                                    const optionSet = await firestoreHelpers.getMultiSelectOptionSet(optionSetId);
                                    handleUpdateField(selectedSection!.id, selectedField.id, {
                                        multiSelectOptionSetId: optionSetId,
                                        multiSelectOptionSetName: optionSet?.name || `Multi-Select Option Set ${optionSetId}`
                                    });
                                } catch (error) {
                                    console.error('Error fetching option set name:', error);
                                    // Fallback to generic name if fetch fails
                                    handleUpdateField(selectedSection!.id, selectedField.id, {
                                        multiSelectOptionSetId: optionSetId,
                                        multiSelectOptionSetName: `Multi-Select Option Set ${optionSetId}`
                                    });
                                }
                            }
                            showMultiSelectOptionSetManager(false);
                        }}
                    />
                )}

                {/* Select Option Set Manager Modal */}
                {state.showSelectOptionSetManager && (
                    <SelectOptionSetManager
                        isVisible={state.showSelectOptionSetManager}
                        onClose={() => showSelectOptionSetManager(false)}
                        filterMultiple={selectedField?.type === 'multiselectdropdown' ? true : selectedField?.type === 'select' ? false : undefined}
                        onOptionSetSelect={async (optionSetId) => {
                            if (selectedField) {
                                try {
                                    // Fetch the actual option set to get its name
                                    const optionSet = await firestoreHelpers.getSelectOptionSet(optionSetId);
                                    handleUpdateField(selectedSection!.id, selectedField.id, {
                                        selectOptionSetId: optionSetId,
                                        selectOptionSetName: optionSet?.name || `Select Option Set ${optionSetId}`
                                    });
                                } catch (error) {
                                    console.error('Error fetching option set name:', error);
                                    // Fallback to generic name if fetch fails
                                    handleUpdateField(selectedSection!.id, selectedField.id, {
                                        selectOptionSetId: optionSetId,
                                        selectOptionSetName: `Select Option Set ${optionSetId}`
                                    });
                                }
                            }
                            showSelectOptionSetManager(false);
                        }}
                    />
                )}

                {/* Field Editor Modal */}
                {state.showFieldEditorModal && selectedField && selectedSection && (
                    <FieldEditorModal
                        isOpen={state.showFieldEditorModal}
                        onClose={() => showFieldEditorModal(false)}
                        onSave={() => {
                            // Save is handled automatically as changes are applied in real-time
                            showFieldEditorModal(false);
                        }}
                        field={selectedField}
                        sectionId={selectedSection.id}
                        onUpdateField={handleUpdateField}
                        onAddFieldOption={handleAddFieldOption}
                        onUpdateFieldOption={handleUpdateFieldOption}
                        onDeleteFieldOption={handleDeleteFieldOption}
                        onShowRatingScaleManager={() => showRatingScaleManager(true)}
                        onShowRadioOptionSetManager={() => showRadioOptionSetManager(true)}
                        onShowMultiSelectOptionSetManager={() => showMultiSelectOptionSetManager(true)}
                        onShowSelectOptionSetManager={() => showSelectOptionSetManager(true)}
                    />
                )}
            </div>
        </div>
    );
};
