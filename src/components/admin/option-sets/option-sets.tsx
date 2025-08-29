import { useSurveyData } from '@/contexts/survey-data-context/index';
import { useConfirmation } from '@/contexts/modal-context';
import { MultiSelectOptionSet, RadioOptionSet, RatingScale, SelectOptionSet, DeleteModalData } from '@/types';
import React from 'react';
import { OptionSetSection } from './option-set-section';
import {
    RATING_OPTION_SET_NAME,
    RATING_OPTION_BUTTON_NAME,
    RADIO_OPTION_SET_NAME,
    RADIO_OPTION_BUTTON_NAME,
    MULTISELECT_OPTION_SET_NAME,
    MULTISELECT_OPTION_BUTTON_NAME,
    SELECT_OPTION_SET_NAME,
    SELECT_OPTION_BUTTON_NAME,
    DELETE_OPTION_SET_TITLE_PREFIX,
    DELETE_CONFIRMATION_MESSAGE,
    RATING_EMPTY_MESSAGE,
    RADIO_EMPTY_MESSAGE,
    MULTISELECT_EMPTY_MESSAGE,
    SELECT_EMPTY_MESSAGE,
} from '@/constants/options-sets.constants';

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
        if (!item?.id || !item?.name) {
            console.error('Invalid item data for delete confirmation:', item);
            return;
        }

        showConfirmation({
            title: `${DELETE_OPTION_SET_TITLE_PREFIX} ${type} Option Set`,
            message: DELETE_CONFIRMATION_MESSAGE(item.name),
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
        <div className="space-y-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
            {/* Title removed - displayed in top navigation bar */}

            {/* Rating Scales Section */}
            <OptionSetSection<RatingScale>
                title={RATING_OPTION_SET_NAME}
                items={ratingScales || []}
                onCreateNew={onShowRatingScaleManager}
                onEdit={onEditRatingScale}
                onDelete={createDeleteHandler('rating')}
                createButtonLabel={RATING_OPTION_BUTTON_NAME}
                emptyMessage={RATING_EMPTY_MESSAGE}
                dataType="rating-scale"
            />

            {/* Radio Option Sets Section */}
            <OptionSetSection<RadioOptionSet>
                title={RADIO_OPTION_SET_NAME}
                items={radioOptionSets || []}
                onCreateNew={onShowRadioOptionSetManager}
                onEdit={onEditRadioOptionSet}
                onDelete={createDeleteHandler('radio')}
                createButtonLabel={RADIO_OPTION_BUTTON_NAME}
                emptyMessage={RADIO_EMPTY_MESSAGE}
                dataType="radio-option-set"
            />

            {/* Multi-Select Option Sets Section */}
            <OptionSetSection<MultiSelectOptionSet>
                title={MULTISELECT_OPTION_SET_NAME}
                items={multiSelectOptionSets || []}
                onCreateNew={onShowMultiSelectOptionSetManager}
                onEdit={onEditMultiSelectOptionSet}
                onDelete={createDeleteHandler('multi-select')}
                createButtonLabel={MULTISELECT_OPTION_BUTTON_NAME}
                emptyMessage={MULTISELECT_EMPTY_MESSAGE}
                dataType="multi-select-option-set"
                renderItemDetails={(optionSet) =>
                    optionSet.minSelections && optionSet.maxSelections ? (
                        <span>, {optionSet.minSelections}-{optionSet.maxSelections} selections</span>
                    ) : null
                }
            />

            {/* Select Option Sets Section */}
            <OptionSetSection<SelectOptionSet>
                title={SELECT_OPTION_SET_NAME}
                items={selectOptionSets || []}
                onCreateNew={onShowSelectOptionSetManager}
                onEdit={onEditSelectOptionSet}
                onDelete={createDeleteHandler('select')}
                createButtonLabel={SELECT_OPTION_BUTTON_NAME}
                emptyMessage={SELECT_EMPTY_MESSAGE}
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
