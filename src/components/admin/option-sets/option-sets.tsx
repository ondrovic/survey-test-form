import { Button, DeleteConfirmationModal } from '@/components/common';
import { useSurveyData } from '@/contexts/survey-data-context/index';
import { useToast } from '@/contexts/toast-context/index';
import { useModal } from '@/hooks';
import { MultiSelectOptionSet, RadioOptionSet, RatingScale, SelectOptionSet } from '@/types';
import React from 'react';
import { OptionSetSection } from './option-set-section';

// Define the delete modal data type with proper type safety
type DeleteModalData =
    | { id: string; name: string; type: 'rating' }
    | { id: string; name: string; type: 'radio' }
    | { id: string; name: string; type: 'multi-select' }
    | { id: string; name: string; type: 'select' };

interface AdminOptionSetsProps {
    onShowRatingScaleManager: () => void;
    onEditRatingScale: (scale: RatingScale) => void;
    onDeleteRatingScale: (scaleId: string) => void;
    onCleanupDuplicates: () => void;
    // Radio Option Sets
    onShowRadioOptionSetManager: () => void;
    onEditRadioOptionSet: (optionSet: RadioOptionSet) => void;
    onDeleteRadioOptionSet: (optionSetId: string) => void;
    // Multi-Select Option Sets
    onShowMultiSelectOptionSetManager: () => void;
    onEditMultiSelectOptionSet: (optionSet: MultiSelectOptionSet) => void;
    onDeleteMultiSelectOptionSet: (optionSetId: string) => void;
    // Select Option Sets
    onShowSelectOptionSetManager: () => void;
    onEditSelectOptionSet: (optionSet: SelectOptionSet) => void;
    onDeleteSelectOptionSet: (optionSetId: string) => void;
}

export const AdminOptionSets: React.FC<AdminOptionSetsProps> = ({
    onShowRatingScaleManager,
    onEditRatingScale,
    onDeleteRatingScale,
    onCleanupDuplicates,
    onShowRadioOptionSetManager,
    onEditRadioOptionSet,
    onDeleteRadioOptionSet,
    onShowMultiSelectOptionSetManager,
    onEditMultiSelectOptionSet,
    onDeleteMultiSelectOptionSet,
    onShowSelectOptionSetManager,
    onEditSelectOptionSet,
    onDeleteSelectOptionSet
}) => {
    const { state: { ratingScales, radioOptionSets, multiSelectOptionSets, selectOptionSets } } = useSurveyData();
    const { } = useToast();
    const deleteModal = useModal<DeleteModalData>();

    const handleDeleteConfirm = () => {
        if (!deleteModal.data) {
            console.error('No delete modal data available');
            return;
        }

        // Type-safe deletion based on the item type
        switch (deleteModal.data.type) {
            case 'rating':
                onDeleteRatingScale(deleteModal.data.id);
                break;
            case 'radio':
                onDeleteRadioOptionSet(deleteModal.data.id);
                break;
            case 'multi-select':
                onDeleteMultiSelectOptionSet(deleteModal.data.id);
                break;
            case 'select':
                onDeleteSelectOptionSet(deleteModal.data.id);
                break;
            default:
                console.error('Unknown delete type:', deleteModal.data);
                return;
        }
        deleteModal.close();
    };

    // Helper function to safely open delete modal with proper typing
    const openDeleteModal = (item: { id: string; name: string }, type: DeleteModalData['type']) => {
        if (!item || !item.id || !item.name) {
            console.error('Invalid item data for delete modal:', item);
            return;
        }
        deleteModal.open({ id: item.id, name: item.name, type });
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Option Sets</h2>
                <div className="flex gap-2">
                    <Button
                        onClick={onCleanupDuplicates}
                        variant="outline"
                        size="sm"
                    >
                        Clean Duplicates
                    </Button>
                </div>
            </div>

            {/* Rating Scales Section */}
            <OptionSetSection<RatingScale>
                title="Rating Scales"
                items={ratingScales || []}
                onCreateNew={onShowRatingScaleManager}
                onEdit={onEditRatingScale}
                onDelete={(scale) => openDeleteModal(scale, 'rating')}
                createButtonLabel="Rating"
                emptyMessage="No rating scales found. Create your first rating scale to get started."
            />

            {/* Radio Option Sets Section */}
            <OptionSetSection<RadioOptionSet>
                title="Radio Options"
                items={radioOptionSets || []}
                onCreateNew={onShowRadioOptionSetManager}
                onEdit={onEditRadioOptionSet}
                onDelete={(optionSet) => openDeleteModal(optionSet, 'radio')}
                createButtonLabel="Radio"
                emptyMessage="No radio option sets found. Create your first radio option set to get started."
            />

            {/* Multi-Select Option Sets Section */}
            <OptionSetSection<MultiSelectOptionSet>
                title="Multi-Select Options"
                items={multiSelectOptionSets || []}
                onCreateNew={onShowMultiSelectOptionSetManager}
                onEdit={onEditMultiSelectOptionSet}
                onDelete={(optionSet) => openDeleteModal(optionSet, 'multi-select')}
                createButtonLabel="Multi-Select"
                emptyMessage="No multi-select option sets found. Create your first multi-select option set to get started."
                renderItemDetails={(optionSet) =>
                    optionSet.minSelections && optionSet.maxSelections ? (
                        <span>, {optionSet.minSelections}-{optionSet.maxSelections} selections</span>
                    ) : null
                }
            />

            {/* Select Option Sets Section */}
            <OptionSetSection<SelectOptionSet>
                title="Select Options"
                items={selectOptionSets || []}
                onCreateNew={onShowSelectOptionSetManager}
                onEdit={onEditSelectOptionSet}
                onDelete={(optionSet) => openDeleteModal(optionSet, 'select')}
                createButtonLabel="Select"
                emptyMessage="No select option sets found. Create your first select option set to get started."
                renderItemDetails={(optionSet) =>
                    optionSet.allowMultiple ? (
                        <span>, multiple selections allowed</span>
                    ) : null
                }
            />

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={deleteModal.isOpen}
                itemName={deleteModal.data?.name || ''}
                onConfirm={handleDeleteConfirm}
                onCancel={() => deleteModal.close()}
                message="Are you sure you want to delete '{itemName}'? This action cannot be undone."
            />
        </div>
    );
};
