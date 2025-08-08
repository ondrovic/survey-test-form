import React from 'react';
import { firestoreHelpers } from '../../../config/firebase';
import { SurveyBuilderProvider, useSurveyBuilder } from '../../../contexts/survey-builder-context/index';
import { useSurveyDataContext } from '../../../contexts/survey-data-context/index';
import { useToast } from '../../../contexts/toast-context/index';
import { FieldType, SurveyField, SurveySection } from '../../../types/survey.types';
import { MultiSelectOptionSetManager } from '../multi-select-option-set-manager';
import { RadioOptionSetManager } from '../radio-option-set-manager';
import { RatingScaleManager } from '../rating-scale-manager';
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
        showFieldEditorModal,
        showRadioOptionSetManager,
        showMultiSelectOptionSetManager,
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
        selectField(newField.id);
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
                <SurveyHeader
                    isEditing={!!editingConfig}
                    isPreviewMode={state.isPreviewMode}
                    loading={state.loading}
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

                {/* Radio Option Set Manager Modal */}
                {state.showRadioOptionSetManager && (
                    <RadioOptionSetManager
                        isVisible={state.showRadioOptionSetManager}
                        onClose={() => showRadioOptionSetManager(false)}
                        onOptionSetSelect={(optionSetId) => {
                            if (selectedField) {
                                handleUpdateField(selectedSection!.id, selectedField.id, {
                                    radioOptionSetId: optionSetId,
                                    radioOptionSetName: `Radio Option Set ${optionSetId}`
                                });
                            }
                            showRadioOptionSetManager(false);
                        }}
                        optionSets={[]} // SurveyBuilder doesn't need to manage option sets, so pass empty array
                    />
                )}

                {/* Multi-Select Option Set Manager Modal */}
                {state.showMultiSelectOptionSetManager && (
                    <MultiSelectOptionSetManager
                        isVisible={state.showMultiSelectOptionSetManager}
                        onClose={() => showMultiSelectOptionSetManager(false)}
                        onOptionSetSelect={(optionSetId) => {
                            console.log('🎯 Selected multi-select option set:', optionSetId);
                            if (selectedField) {
                                handleUpdateField(selectedSection!.id, selectedField.id, {
                                    multiSelectOptionSetId: optionSetId,
                                    multiSelectOptionSetName: `Multi-Select Option Set ${optionSetId}`
                                });
                            }
                            showMultiSelectOptionSetManager(false);
                        }}
                        optionSets={[]} // SurveyBuilder doesn't need to manage option sets, so pass empty array
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
                    />
                )}
            </div>
        </div>
    );
};
