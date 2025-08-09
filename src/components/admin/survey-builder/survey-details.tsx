import React, { useEffect, useState } from 'react';
import { Input } from '../../common';
import { useValidation } from '../../../contexts/validation-context';

interface SurveyDetailsProps {
    title: string;
    description: string;
    onTitleChange: (value: string) => void;
    onDescriptionChange: (value: string) => void;
}

export const SurveyDetails: React.FC<SurveyDetailsProps> = ({
    title,
    description,
    onTitleChange,
    onDescriptionChange
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
            </div>
        </div>
    );
};
