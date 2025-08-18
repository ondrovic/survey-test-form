import { useSurveyData } from '@/contexts/survey-data-context/index';
import { useConfirmation } from '@/contexts/modal-context';
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
    onDeleteRatingScale: (scaleId: string, scaleName?: string) => void;
    onCleanupDuplicates: () => void;
    // Radio Option Sets
    onShowRadioOptionSetManager: () => void;
    onEditRadioOptionSet: (optionSet: RadioOptionSet) => void;
    onDeleteRadioOptionSet: (optionSetId: string, optionSetName?: string) => void;
    // Multi-Select Option Sets
    onShowMultiSelectOptionSetManager: () => void;
    onEditMultiSelectOptionSet: (optionSet: MultiSelectOptionSet) => void;
    onDeleteMultiSelectOptionSet: (optionSetId: string, optionSetName?: string) => void;
    // Select Option Sets
    onShowSelectOptionSetManager: () => void;
    onEditSelectOptionSet: (optionSet: SelectOptionSet) => void;
    onDeleteSelectOptionSet: (optionSetId: string, optionSetName?: string) => void;
}

export const AdminOptionSets: React.FC<AdminOptionSetsProps> = ({
    onShowRatingScaleManager,
    onEditRatingScale,
    onDeleteRatingScale,
    // onCleanupDuplicates,
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
    const showConfirmation = useConfirmation();

    // Helper function to create type-safe delete confirmations
    const createDeleteHandler = (type: DeleteModalData['type']) => (item: { id: string; name: string }) => {
        if (!item || !item.id || !item.name) {
            console.error('Invalid item data for delete confirmation:', item);
            return;
        }

        showConfirmation({
            title: `Delete ${type} Option Set`,
            message: `Are you sure you want to delete '${item.name}'? This action cannot be undone.`,
            variant: 'danger',
            onConfirm: () => {
                switch (type) {
                    case 'rating':
                        onDeleteRatingScale(item.id, item.name);
                        break;
                    case 'radio':
                        onDeleteRadioOptionSet(item.id, item.name);
                        break;
                    case 'multi-select':
                        onDeleteMultiSelectOptionSet(item.id, item.name);
                        break;
                    case 'select':
                        onDeleteSelectOptionSet(item.id, item.name);
                        break;
                    default:
                        console.error('Unknown delete type:', type);
                }
            }
        });
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Option Sets</h2>
            </div>

            {/* Rating Scales Section */}
            <OptionSetSection<RatingScale>
                title="Rating Option Sets"
                items={ratingScales || []}
                onCreateNew={onShowRatingScaleManager}
                onEdit={onEditRatingScale}
                onDelete={createDeleteHandler('rating')}
                createButtonLabel="Rating"
                emptyMessage="No rating scales found. Create your first rating scale to get started."
                dataType="rating-scale"
            />

            {/* Radio Option Sets Section */}
            <OptionSetSection<RadioOptionSet>
                title="Radio Option Sets"
                items={radioOptionSets || []}
                onCreateNew={onShowRadioOptionSetManager}
                onEdit={onEditRadioOptionSet}
                onDelete={createDeleteHandler('radio')}
                createButtonLabel="Radio"
                emptyMessage="No radio option sets found. Create your first radio option set to get started."
                dataType="radio-option-set"
            />

            {/* Multi-Select Option Sets Section */}
            <OptionSetSection<MultiSelectOptionSet>
                title="Multi-Select Option Sets"
                items={multiSelectOptionSets || []}
                onCreateNew={onShowMultiSelectOptionSetManager}
                onEdit={onEditMultiSelectOptionSet}
                onDelete={createDeleteHandler('multi-select')}
                createButtonLabel="Multi-Select"
                emptyMessage="No multi-select option sets found. Create your first multi-select option set to get started."
                dataType="multi-select-option-set"
                renderItemDetails={(optionSet) =>
                    optionSet.minSelections && optionSet.maxSelections ? (
                        <span>, {optionSet.minSelections}-{optionSet.maxSelections} selections</span>
                    ) : null
                }
            />

            {/* Select Option Sets Section */}
            <OptionSetSection<SelectOptionSet>
                title="Select Option Sets"
                items={selectOptionSets || []}
                onCreateNew={onShowSelectOptionSetManager}
                onEdit={onEditSelectOptionSet}
                onDelete={createDeleteHandler('select')}
                createButtonLabel="Select"
                emptyMessage="No select option sets found. Create your first select option set to get started."
                dataType="select-option-set"
                renderItemDetails={(optionSet) =>
                    optionSet.allowMultiple ? (
                        <span>, multiple selections allowed</span>
                    ) : (
                        <span>, single selection only</span>
                    )
                }
            />
        </div>
    );
};
