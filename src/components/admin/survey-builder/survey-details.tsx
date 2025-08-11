import React, { useEffect, useState } from 'react';
import { SurveyPaginatorConfig } from '../../../types/framework.types';
import { Input } from '../../common';
import { useValidation } from '../../../contexts/validation-context';

interface SurveyDetailsProps {
    title: string;
    description: string;
    paginatorConfig?: Partial<SurveyPaginatorConfig>;
    onTitleChange: (value: string) => void;
    onDescriptionChange: (value: string) => void;
    onPaginatorConfigChange: (config: Partial<SurveyPaginatorConfig>) => void;
}

export const SurveyDetails: React.FC<SurveyDetailsProps> = ({
    title,
    description,
    paginatorConfig = {},
    onTitleChange,
    onDescriptionChange,
    onPaginatorConfigChange
}) => {
    const { validateSurveyTitle, validateSurveyDescription } = useValidation();
    const [titleError, setTitleError] = useState<string>('');
    const [descriptionError, setDescriptionError] = useState<string>('');

    // Validate title on change
    const handleTitleChange = (value: string) => {
        const validation = validateSurveyTitle(value);
        setTitleError(validation.isValid ? '' : validation.error || '');
        onTitleChange(value);
    };

    // Validate description on change
    const handleDescriptionChange = (value: string) => {
        const validation = validateSurveyDescription(value);
        setDescriptionError(validation.isValid ? '' : validation.error || '');
        onDescriptionChange(value);
    };

    // Handle paginator configuration changes
    const handlePaginatorToggle = (field: keyof SurveyPaginatorConfig, value: boolean) => {
        onPaginatorConfigChange({
            ...paginatorConfig,
            [field]: value
        });
    };

    // Validate on mount
    useEffect(() => {
        const titleValidation = validateSurveyTitle(title);
        setTitleError(titleValidation.isValid ? '' : titleValidation.error || '');
        
        const descValidation = validateSurveyDescription(description);
        setDescriptionError(descValidation.isValid ? '' : descValidation.error || '');
    }, [title, description, validateSurveyTitle, validateSurveyDescription]);

    return (
        <div className="mb-6">
            <h3 className="font-semibold mb-2">Survey Details</h3>
            <div className="space-y-3">
                <div>
                    <Input
                        name="surveyTitle"
                        label="Title *"
                        value={title}
                        onChange={handleTitleChange}
                        placeholder="Enter survey title (3-100 characters)"
                        error={titleError}
                    />
                </div>
                <div>
                    <Input
                        name="surveyDescription"
                        label="Description"
                        value={description}
                        onChange={handleDescriptionChange}
                        placeholder="Enter survey description (optional, max 500 characters)"
                        error={descriptionError}
                    />
                </div>
                
                {/* Pagination Configuration */}
                <div className="border-t pt-4">
                    <h4 className="font-medium mb-3 text-gray-700">Section Pagination</h4>
                    <div className="space-y-3">
                        <label className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                checked={paginatorConfig.renderSectionsAsPages || false}
                                onChange={(e) => handlePaginatorToggle('renderSectionsAsPages', e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="text-sm font-medium text-gray-700">
                                Render sections as pages
                            </span>
                        </label>
                        <p className="text-xs text-gray-500 ml-7">
                            Enable to display each section on its own page with navigation
                        </p>

                        {paginatorConfig.renderSectionsAsPages && (
                            <div className="ml-7 space-y-2 border-l-2 border-blue-100 pl-4">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={paginatorConfig.showStepIndicator !== false}
                                        onChange={(e) => handlePaginatorToggle('showStepIndicator', e.target.checked)}
                                        className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <span className="text-xs text-gray-600">Show step indicator</span>
                                </label>

                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={paginatorConfig.showSectionTitles !== false}
                                        onChange={(e) => handlePaginatorToggle('showSectionTitles', e.target.checked)}
                                        className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <span className="text-xs text-gray-600">Show section titles in indicator</span>
                                </label>

                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={paginatorConfig.allowBackNavigation !== false}
                                        onChange={(e) => handlePaginatorToggle('allowBackNavigation', e.target.checked)}
                                        className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <span className="text-xs text-gray-600">Allow back navigation</span>
                                </label>

                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={paginatorConfig.showProgressBar !== false}
                                        onChange={(e) => handlePaginatorToggle('showProgressBar', e.target.checked)}
                                        className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <span className="text-xs text-gray-600">Show progress bar</span>
                                </label>

                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={paginatorConfig.showProgressText !== false}
                                        onChange={(e) => handlePaginatorToggle('showProgressText', e.target.checked)}
                                        className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <span className="text-xs text-gray-600">Show progress text</span>
                                </label>

                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={paginatorConfig.showSectionPagination !== false}
                                        onChange={(e) => handlePaginatorToggle('showSectionPagination', e.target.checked)}
                                        className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <span className="text-xs text-gray-600">Show section pagination (Section x of xx)</span>
                                </label>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
