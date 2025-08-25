import React, { useEffect, useState } from 'react';
import { databaseHelpers } from '../../../../config/database';
import { MultiSelectOptionSet, RadioOptionSet, RatingScale, SelectOptionSet } from '../../../../types/framework.types';
import { RATING_OPTION_BUTTON_NAME, RADIO_OPTION_BUTTON_NAME, MULTISELECT_OPTION_BUTTON_NAME, SELECT_OPTION_BUTTON_NAME } from '@/constants/options-sets.constants';

interface OptionSetPreviewProps {
    type: 'rating' | 'radio' | 'multiselect' | 'select';
    optionSetId: string;
    optionSetName: string;
    className?: string;
    hideLabel?: boolean;
}

export const OptionSetPreview: React.FC<OptionSetPreviewProps> = ({
    type,
    optionSetId,
    // optionSetName,
    className = '',
    hideLabel = false
}) => {
    const [ratingScale, setRatingScale] = useState<RatingScale | null>(null);
    const [radioOptionSet, setRadioOptionSet] = useState<RadioOptionSet | null>(null);
    const [multiSelectOptionSet, setMultiSelectOptionSet] = useState<MultiSelectOptionSet | null>(null);
    const [selectOptionSet, setSelectOptionSet] = useState<SelectOptionSet | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const loadOptionSet = async () => {
            if (!optionSetId) return;

            setIsLoading(true);
            // Clear previous state to prevent showing old data while loading new data
            setRatingScale(null);
            setRadioOptionSet(null);
            setMultiSelectOptionSet(null);
            setSelectOptionSet(null);

            try {
                switch (type) {
                    case 'rating': {
                        const scale = await databaseHelpers.getRatingScale(optionSetId);
                        setRatingScale(scale);
                        break;
                    }
                    case 'radio': {
                        const radioSet = await databaseHelpers.getRadioOptionSet(optionSetId);
                        setRadioOptionSet(radioSet);
                        break;
                    }
                    case 'multiselect': {
                        const multiSet = await databaseHelpers.getMultiSelectOptionSet(optionSetId);
                        setMultiSelectOptionSet(multiSet);
                        break;
                    }
                    case 'select': {
                        const selectSet = await databaseHelpers.getSelectOptionSet(optionSetId);
                        setSelectOptionSet(selectSet);
                        break;
                    }
                }
            } catch (error) {
                console.error(`Error loading ${type} option set for preview:`, error);
            } finally {
                setIsLoading(false);
            }
        };

        loadOptionSet();
    }, [type, optionSetId]);

    const getTypeLabel = () => {
        switch (type) {
            case 'rating':
                return `${RATING_OPTION_BUTTON_NAME} Scale Options:`;
            case 'radio':
                return `${RADIO_OPTION_BUTTON_NAME} Option Set Options:`;
            case 'multiselect':
                return `${MULTISELECT_OPTION_BUTTON_NAME} Option Set Options:`;
            case 'select':
                return `${SELECT_OPTION_BUTTON_NAME} Option Set Options:`;
            default:
                return 'Options:';
        }
    };

    // const getOptionSetName = () => {
    //     // Remove ID from name (everything after 'x')
    //     return optionSetName?.split('x')[0] || optionSetName;
    // };

    // const getOptionSetTypeText = () => {
    //     switch (type) {
    //         case 'rating':
    //             return 'rating scale';
    //         case 'radio':
    //             return 'option set';
    //         case 'multiselect':
    //             return 'option set';
    //         case 'select':
    //             return 'option set';
    //         default:
    //             return 'option set';
    //     }
    // };

    const renderOptions = () => {
        if (isLoading) {
            return <div className="text-sm text-gray-500">Loading options...</div>;
        }

        switch (type) {
            case 'rating':
                if (!ratingScale) {
                    return <div className="text-sm text-gray-500">Failed to load options</div>;
                }
                return (
                    <div className="flex flex-wrap gap-2">
                        {ratingScale.options.map((option, index) => (
                            <span
                                key={index}
                                className={`px-2 py-1 text-xs rounded border ${option.isDefault
                                    ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                                    : 'bg-gray-100 text-gray-700 border-gray-200'
                                    }`}
                            >
                                {option.label}
                            </span>
                        ))}
                    </div>
                );

            case 'radio':
                if (!radioOptionSet) {
                    return <div className="text-sm text-gray-500">Failed to load options</div>;
                }
                return (
                    <div className="flex flex-wrap gap-2">
                        {radioOptionSet.options.map((option, index) => (
                            <span
                                key={index}
                                className={`px-2 py-1 text-xs rounded border ${option.isDefault
                                    ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                                    : 'bg-gray-100 text-gray-700 border-gray-200'
                                    }`}
                            >
                                {option.label}
                            </span>
                        ))}
                    </div>
                );

            case 'multiselect':
                if (!multiSelectOptionSet) {
                    return <div className="text-sm text-gray-500">Failed to load options</div>;
                }
                return (
                    <div className="flex flex-wrap gap-2">
                        {multiSelectOptionSet.options.map((option, index) => (
                            <span
                                key={index}
                                className={`px-2 py-1 text-xs rounded border ${option.isDefault
                                    ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                                    : 'bg-gray-100 text-gray-700 border-gray-200'
                                    }`}
                            >
                                {option.label}
                            </span>
                        ))}
                    </div>
                );

            case 'select':
                if (!selectOptionSet) {
                    return <div className="text-sm text-gray-500">Failed to load options</div>;
                }
                return (
                    <select
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-gray-50"
                    >
                        <option value="">Select an option...</option>
                        {selectOptionSet.options.map((option, index) => (
                            <option key={index} value={option.value}>
                                {option.label}
                                {option.isDefault ? ' (Default)' : ''}
                            </option>
                        ))}
                    </select>
                );

            default:
                return <div className="text-sm text-gray-500">Unknown option set type</div>;
        }
    };

    return (
        <div className={`mt-3 ${className}`}>
            {!hideLabel && (
                <div className="text-xs text-green-600 mb-2">{getTypeLabel()}</div>
            )}
            {renderOptions()}
        </div>
    );
};
