import React, { useEffect, useState } from 'react';
import { SurveyPaginatorConfig, FooterConfig } from '../../../types/framework.types';
import { Input, Collapsible } from '../../common';
import { useValidation } from '../../../contexts/validation-context';

interface SurveyDetailsProps {
    title: string;
    description: string;
    paginatorConfig?: Partial<SurveyPaginatorConfig>;
    footerConfig?: FooterConfig;
    onTitleChange: (value: string) => void;
    onDescriptionChange: (value: string) => void;
    onPaginatorConfigChange: (config: Partial<SurveyPaginatorConfig>) => void;
    onFooterConfigChange: (config: FooterConfig) => void;
}

export const SurveyDetails: React.FC<SurveyDetailsProps> = ({
    title,
    description,
    paginatorConfig = {},
    footerConfig = {},
    onTitleChange,
    onDescriptionChange,
    onPaginatorConfigChange,
    onFooterConfigChange
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
        const updates: Partial<SurveyPaginatorConfig> = {
            [field]: value
        };
        
        // When disabling step indicator, also disable section titles since they depend on it
        if (field === 'showStepIndicator' && !value) {
            updates.showSectionTitles = false;
        }
        
        onPaginatorConfigChange({
            ...paginatorConfig,
            ...updates
        });
    };

    // Handle footer configuration changes
    const handleFooterConfigChange = (updates: Partial<FooterConfig>) => {
        onFooterConfigChange({
            ...footerConfig,
            ...updates
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
                <Collapsible 
                    title="Section Pagination" 
                    defaultExpanded={false}
                >
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
                                <div>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={paginatorConfig.showStepIndicator !== false}
                                            onChange={(e) => handlePaginatorToggle('showStepIndicator', e.target.checked)}
                                            className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <span className="text-xs text-gray-600">Show step indicator</span>
                                    </label>

                                    {/* Nested option - only available when step indicator is enabled */}
                                    <div className="ml-5 mt-1">
                                        <label className={`flex items-center gap-2 ${
                                            paginatorConfig.showStepIndicator === false 
                                                ? 'opacity-50 cursor-not-allowed' 
                                                : 'cursor-pointer'
                                        }`}>
                                            <input
                                                type="checkbox"
                                                checked={paginatorConfig.showStepIndicator !== false && paginatorConfig.showSectionTitles !== false}
                                                onChange={(e) => handlePaginatorToggle('showSectionTitles', e.target.checked)}
                                                disabled={paginatorConfig.showStepIndicator === false}
                                                className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                            />
                                            <span className="text-xs text-gray-600">Show section titles in indicator</span>
                                        </label>
                                    </div>
                                </div>

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
                </Collapsible>

                {/* Footer Configuration */}
                <Collapsible 
                    title="Footer Settings" 
                    defaultExpanded={false}
                >
                    <div className="space-y-3">
                        <label className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                checked={footerConfig.show !== false}
                                onChange={(e) => handleFooterConfigChange({ show: e.target.checked })}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="text-sm font-medium text-gray-700">
                                Show footer
                            </span>
                        </label>
                        <p className="text-xs text-gray-500 ml-7">
                            Display footer at the bottom of the survey
                        </p>

                        {footerConfig.show !== false && (
                            <div className="ml-7 space-y-3 border-l-2 border-blue-100 pl-4">
                                <div>
                                    <Input
                                        name="footerOrganization"
                                        label="Organization Name"
                                        value={footerConfig.organizationName || ''}
                                        onChange={(value) => handleFooterConfigChange({ organizationName: value })}
                                        placeholder="Your Organization Name"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Will be displayed with copyright if enabled
                                    </p>
                                </div>

                                <div>
                                    <Input
                                        name="footerCustomText"
                                        label="Custom Footer Text"
                                        value={footerConfig.text || ''}
                                        onChange={(value) => handleFooterConfigChange({ text: value })}
                                        placeholder="Custom footer text"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Overrides Organization Name.
                                        <br/>Leave empty to use default text.
                                        <br/>Checkboxes below still apply.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={footerConfig.includeCopyright !== false}
                                            onChange={(e) => handleFooterConfigChange({ includeCopyright: e.target.checked })}
                                            className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <span className="text-xs text-gray-600">Prepend copyright symbol and year to any text</span>
                                    </label>

                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={footerConfig.autoUpdateYear !== false}
                                            onChange={(e) => handleFooterConfigChange({ autoUpdateYear: e.target.checked })}
                                            className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <span className="text-xs text-gray-600">Auto-update year (current: {new Date().getFullYear()})</span>
                                    </label>

                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={footerConfig.includeAllRightsReserved || false}
                                            onChange={(e) => handleFooterConfigChange({ includeAllRightsReserved: e.target.checked })}
                                            className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <span className="text-xs text-gray-600">Include "All rights reserved"</span>
                                    </label>
                                    <p className="text-xs text-gray-400 ml-5">
                                        Appends ". All rights reserved" to any footer text (custom or generated)
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </Collapsible>
            </div>
        </div>
    );
};
