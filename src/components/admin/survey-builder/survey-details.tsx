import React from 'react';
import { Input } from '../../common';

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
    return (
        <div className="mb-6">
            <h3 className="font-semibold mb-2">Survey Details</h3>
            <div className="space-y-3">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title
                    </label>
                    <Input
                        name="surveyTitle"
                        value={title}
                        onChange={onTitleChange}
                        placeholder="Survey title"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                    </label>
                    <Input
                        name="surveyDescription"
                        value={description}
                        onChange={onDescriptionChange}
                        placeholder="Survey description"
                    />
                </div>
            </div>
        </div>
    );
};
