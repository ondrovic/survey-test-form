import React from 'react';
import { firestoreHelpers } from '../../../config/firebase';
import { SurveyBuilderProvider, useSurveyBuilder } from '../../../contexts/survey-builder-context/index';
import { useSurveyData } from '../../../contexts/survey-data-context/index';
import { useToast } from '../../../contexts/toast-context/index';
import { ValidationProvider, useValidation } from '../../../contexts/validation-context';
import { FieldType, SurveyField, SurveySection, SurveySubsection } from '../../../types/framework.types';
import { generateFieldId, generateSectionId, updateFieldId, updateSectionId } from '../../../utils/id.utils';
import { updateMetadata } from '../../../utils/metadata.utils';
import { MultiSelectOptionSetManager } from '../multi-select-option-set-manager';
import { RadioOptionSetManager } from '../radio-option-set-manager';
import { RatingScaleManager } from '../rating-option-set-manager';
import { SelectOptionSetManager } from '../select-option-set-manager';
import { FieldContainer, FieldDragContext } from './field-drag-context';
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
        selectSubsection,
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
        addSubsection,
        updateSubsection,
        deleteSubsection,
        reorderSubsections,
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
        const existingSectionIds = state.config.sections.map(s => s.id);
        const newSection: SurveySection = {
            id: generateSectionId('New Section', existingSectionIds),
            title: 'New Section',
            type: 'custom',
            order: state.config.sections.length + 1,
            fields: [],
            subsections: [],
        };
        addSection(newSection);
        selectSection(newSection.id);
    };

    const handleUpdateSection = (sectionId: string, updates: Partial<SurveySection>) => {
        // If title is being updated, consider updating the ID
        if (updates.title) {
            const existingSectionIds = state.config.sections
                .map(s => s.id)
                .filter(id => id !== sectionId); // Exclude current section ID

            const newId = updateSectionId(sectionId, updates.title, existingSectionIds);
            if (newId !== sectionId) {
                updates.id = newId;
            }
        }

        updateSection(sectionId, updates);
    };

    const handleDeleteSection = (sectionId: string) => {
        deleteSection(sectionId);
    };

    // Subsection handlers
    const handleAddSubsection = (sectionId: string, subsection: SurveySubsection) => {
        addSubsection(sectionId, subsection);
    };

    const handleUpdateSubsection = (sectionId: string, subsectionId: string, updates: Partial<SurveySubsection>) => {
        updateSubsection(sectionId, subsectionId, updates);
    };

    const handleDeleteSubsection = (sectionId: string, subsectionId: string) => {
        deleteSubsection(sectionId, subsectionId);
    };

    const handleReorderSubsections = (sectionId: string, oldIndex: number, newIndex: number) => {
        reorderSubsections(sectionId, oldIndex, newIndex);
    };

    const handleAddField = (sectionId: string, fieldType: FieldType, subsectionId?: string) => {
        // Get all existing field IDs across all sections and subsections for collision detection
        const existingFieldIds = state.config.sections
            .flatMap(section => [
                ...section.fields,
                ...(section.subsections || []).flatMap(subsection => subsection.fields)
            ])
            .map(field => field.id);

        const fieldLabel = `New ${fieldType} Field`;
        const newField: SurveyField = {
            id: generateFieldId(fieldType, fieldLabel, existingFieldIds),
            label: fieldLabel,
            type: fieldType,
            required: false,
        };
        console.log('📝 Adding field and opening editor:', {
            sectionId,
            fieldId: newField.id,
            subsectionId,
            field: newField
        });
        addField(sectionId, newField, subsectionId);
        handleOpenFieldEditor(newField.id);
    };

    const handleUpdateField = (sectionId: string, fieldId: string, updates: Partial<SurveyField>, subsectionId?: string) => {
        console.log('🔄 Updating field:', {
            sectionId,
            fieldId,
            updates,
            subsectionId,
            isSubsectionField: !!subsectionId
        });

        // If label is being updated, consider updating the ID
        if (updates.label) {
            // Find the current field to get its type
            let currentField: SurveyField | undefined;
            const section = state.config.sections.find(section => section.id === sectionId);

            if (section) {
                if (subsectionId) {
                    const subsection = (section.subsections || []).find(sub => sub.id === subsectionId);
                    currentField = subsection?.fields.find(field => field.id === fieldId);
                } else {
                    currentField = section.fields.find(field => field.id === fieldId);
                }
            }

            if (currentField) {
                const existingFieldIds = state.config.sections
                    .flatMap(section => [
                        ...section.fields,
                        ...(section.subsections || []).flatMap(subsection => subsection.fields)
                    ])
                    .map(field => field.id)
                    .filter(id => id !== fieldId); // Exclude current field ID

                const newId = updateFieldId(fieldId, currentField.type, updates.label, existingFieldIds);
                if (newId !== fieldId) {
                    updates.id = newId;
                }
            }
        }

        updateField(sectionId, fieldId, updates, subsectionId);
    };

    const handleDeleteField = (sectionId: string, fieldId: string, subsectionId?: string) => {
        deleteField(sectionId, fieldId, subsectionId);
    };

    const handleReorderFields = (sectionId: string, oldIndex: number, newIndex: number, subsectionId?: string) => {
        reorderFields(sectionId, oldIndex, newIndex, subsectionId);
    };

    const handleAddFieldOption = (sectionId: string, fieldId: string, subsectionId?: string) => {
        addFieldOption(sectionId, fieldId, { label: 'New Option', value: 'new_option', color: 'transparent' }, subsectionId);
    };

    const handleUpdateFieldOption = (sectionId: string, fieldId: string, optionIndex: number, updates: { label?: string; value?: string; color?: string }, subsectionId?: string) => {
        updateFieldOption(sectionId, fieldId, optionIndex, updates, subsectionId);
    };

    const handleDeleteFieldOption = (sectionId: string, fieldId: string, optionIndex: number, subsectionId?: string) => {
        deleteFieldOption(sectionId, fieldId, optionIndex, subsectionId);
    };

    const handleMoveField = (fieldId: string, fromContainer: FieldContainer, toContainer: FieldContainer, newIndex: number) => {
        console.log('🚀 HANDLE MOVE FIELD called:', {
            fieldId,
            fromContainer,
            toContainer,
            newIndex
        });

        // Create a single config update that moves the field atomically
        const currentConfig = state.config;
        const newSections = currentConfig.sections.map(section => {
            const newSection = { ...section };

            // Initialize subsections if they don't exist
            if (!newSection.subsections) {
                newSection.subsections = [];
            }

            // Remove field from source
            if (section.id === fromContainer.sectionId) {
                if (fromContainer.type === 'section') {
                    newSection.fields = section.fields.filter(f => f.id !== fieldId);
                } else if (fromContainer.subsectionId) {
                    newSection.subsections = (section.subsections || []).map(sub =>
                        sub.id === fromContainer.subsectionId
                            ? { ...sub, fields: sub.fields.filter(f => f.id !== fieldId) }
                            : sub
                    );
                }
            }

            return newSection;
        });

        // Find the field to move
        const sourceSection = currentConfig.sections.find(s => s.id === fromContainer.sectionId);
        let field: SurveyField | undefined;

        if (fromContainer.type === 'section') {
            field = sourceSection?.fields.find(f => f.id === fieldId);
        } else if (fromContainer.subsectionId) {
            const subsection = sourceSection?.subsections?.find(sub => sub.id === fromContainer.subsectionId);
            field = subsection?.fields.find(f => f.id === fieldId);
        }

        if (!field) {
            return;
        }

        // Add field to target
        const finalSections = newSections.map(section => {
            if (section.id === toContainer.sectionId) {
                const newSection = { ...section };
                if (toContainer.type === 'section') {
                    newSection.fields = [...section.fields, { ...field }];
                } else if (toContainer.subsectionId) {
                    newSection.subsections = (section.subsections || []).map(sub =>
                        sub.id === toContainer.subsectionId
                            ? { ...sub, fields: [...sub.fields, { ...field }] }
                            : sub
                    );
                }
                return newSection;
            }
            return section;
        });

        // Update the entire config at once
        updateConfig({
            sections: finalSections,
            metadata: updateMetadata(currentConfig.metadata)
        });
    };

    const handleOpenFieldEditor = (fieldId: string) => {
        console.log('📝 Opening field editor for:', fieldId);
        selectField(fieldId);
        showFieldEditorModal(true);

        // Debug: Check state after setting
        setTimeout(() => {
            console.log('🔍 Modal state check:', {
                showFieldEditorModal: state.showFieldEditorModal,
                selectedField: selectedField ? { id: selectedField.id, label: selectedField.label } : null,
                selectedSection: selectedSection ? { id: selectedSection.id, title: selectedSection.title } : null,
                selectedFieldSubsectionId: selectedFieldSubsectionId,
                shouldShowModal: state.showFieldEditorModal && selectedField && selectedSection
            });
        }, 100);
    };

    // Get all fields for the drag context
    const getAllFields = () => {
        const allFields: SurveyField[] = [];
        state.config.sections.forEach(section => {
            allFields.push(...section.fields);
            section.subsections?.forEach(subsection => {
                allFields.push(...subsection.fields);
            });
        });

        return allFields;
    };

    const renderFieldPreview = (field: SurveyField) => (
        <div className="p-3 border rounded bg-white shadow-lg">
            <span className="font-medium text-sm">{field.label}</span>
            <span className="text-xs text-gray-500 ml-2">({field.type})</span>
        </div>
    );

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

    // Find the selected field and determine if it's in a subsection
    let selectedField: SurveyField | undefined;
    let selectedFieldSubsectionId: string | undefined;

    if (selectedSection && state.selectedField) {
        // First check main section fields
        selectedField = selectedSection.fields.find(f => f.id === state.selectedField);

        // If not found in main section, check subsections
        if (!selectedField) {
            for (const subsection of (selectedSection.subsections || [])) {
                const field = subsection.fields.find(f => f.id === state.selectedField);
                if (field) {
                    console.log('🔍 Found field in subsection:', {
                        fieldId: field.id,
                        subsectionId: subsection.id,
                        subsectionTitle: subsection.title
                    });
                    selectedField = field;
                    selectedFieldSubsectionId = subsection.id;
                    break;
                }
            }
        }
    }

    console.log('🎯 SurveyBuilder render called:', {
        configTitle: state.config.title,
        sectionsCount: state.config.sections.length,
        selectedSectionId: state.selectedSection,
        selectedFieldId: state.selectedField,
        selectedFieldSubsectionId: selectedFieldSubsectionId,
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

                <FieldDragContext
                    onFieldMove={handleMoveField}
                    renderFieldPreview={renderFieldPreview}
                    fields={getAllFields()}
                >
                    <div className="flex-1 flex overflow-hidden">
                        {/* Sidebar */}
                        <div className="w-80 border-r bg-gray-50 p-4 overflow-y-auto">
                            <SurveyDetails
                                title={state.config.title}
                                description={state.config.description || ''}
                                paginatorConfig={state.config.paginatorConfig}
                                onTitleChange={handleTitleChange}
                                onDescriptionChange={handleDescriptionChange}
                                onPaginatorConfigChange={(paginatorConfig) => updateConfig({ paginatorConfig })}
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
                                        selectedSubsectionId={state.selectedSubsection}
                                        onUpdateSection={handleUpdateSection}
                                        onAddSubsection={handleAddSubsection}
                                        onUpdateSubsection={handleUpdateSubsection}
                                        onDeleteSubsection={handleDeleteSubsection}
                                        onReorderSubsections={handleReorderSubsections}
                                        onSelectSubsection={selectSubsection}
                                        onAddField={handleAddField}
                                        onSelectField={selectField}
                                        onOpenFieldEditor={handleOpenFieldEditor}
                                        onDeleteField={handleDeleteField}
                                        onReorderFields={handleReorderFields}
                                        onMoveField={handleMoveField}
                                    />
                                </div>
                            ) : (
                                <div className="text-center text-gray-500 mt-8">
                                    Select a section to edit its configuration
                                </div>
                            )}
                        </div>
                    </div>
                </FieldDragContext>

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
                                }, selectedFieldSubsectionId);
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
                                    }, selectedFieldSubsectionId);
                                } catch (error) {
                                    console.error('Error fetching option set name:', error);
                                    // Fallback to generic name if fetch fails
                                    handleUpdateField(selectedSection!.id, selectedField.id, {
                                        radioOptionSetId: optionSetId,
                                        radioOptionSetName: `Radio Option Set ${optionSetId}`
                                    }, selectedFieldSubsectionId);
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
                                    }, selectedFieldSubsectionId);
                                } catch (error) {
                                    console.error('Error fetching option set name:', error);
                                    // Fallback to generic name if fetch fails
                                    handleUpdateField(selectedSection!.id, selectedField.id, {
                                        multiSelectOptionSetId: optionSetId,
                                        multiSelectOptionSetName: `Multi-Select Option Set ${optionSetId}`
                                    }, selectedFieldSubsectionId);
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
                                    }, selectedFieldSubsectionId);
                                } catch (error) {
                                    console.error('Error fetching option set name:', error);
                                    // Fallback to generic name if fetch fails
                                    handleUpdateField(selectedSection!.id, selectedField.id, {
                                        selectOptionSetId: optionSetId,
                                        selectOptionSetName: `Select Option Set ${optionSetId}`
                                    }, selectedFieldSubsectionId);
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
                        onUpdateField={(sectionId: string, fieldId: string, updates: Partial<SurveyField>) => {
                            console.log('🔧 Update wrapper - using selectedFieldSubsectionId:', selectedFieldSubsectionId);
                            handleUpdateField(sectionId, fieldId, updates, selectedFieldSubsectionId);
                        }}
                        onAddFieldOption={(sectionId: string, fieldId: string) => {
                            console.log('🔧 Add field option wrapper - using selectedFieldSubsectionId:', selectedFieldSubsectionId);
                            handleAddFieldOption(sectionId, fieldId, selectedFieldSubsectionId);
                        }}
                        onUpdateFieldOption={(sectionId: string, fieldId: string, optionIndex: number, updates: { label?: string; value?: string; color?: string }) => {
                            console.log('🔧 Update field option wrapper - using selectedFieldSubsectionId:', selectedFieldSubsectionId);
                            handleUpdateFieldOption(sectionId, fieldId, optionIndex, updates, selectedFieldSubsectionId);
                        }}
                        onDeleteFieldOption={(sectionId: string, fieldId: string, optionIndex: number) => {
                            console.log('🔧 Delete field option wrapper - using selectedFieldSubsectionId:', selectedFieldSubsectionId);
                            handleDeleteFieldOption(sectionId, fieldId, optionIndex, selectedFieldSubsectionId);
                        }}
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
