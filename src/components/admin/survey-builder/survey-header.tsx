import { Eye, Settings } from 'lucide-react';
import React from 'react';
import { Button } from '../../common';
import { SurveyConfig } from '../../../types/framework.types';
import { ValidationSummary } from './validation-summary';

interface SurveyHeaderProps {
    isEditing: boolean;
    isPreviewMode: boolean;
    loading: boolean;
    config: SurveyConfig;
    onTogglePreview: () => void;
    onShowMultiSelectEditor: () => void;
    onSave: () => void;
    onClose: () => void;
}

export const SurveyHeader: React.FC<SurveyHeaderProps> = ({
    isEditing,
    isPreviewMode,
    loading,
    config,
    onTogglePreview,
    onShowMultiSelectEditor,
    onSave,
    onClose
}) => {
    return (
        <div className="border-b">
            <div className="flex items-center justify-between p-6">
                <div className="flex-1">
                    <h2 className="text-xl font-semibold mb-2">
                        {isEditing ? 'Edit Survey' : 'Survey Builder'}
                    </h2>
                    <ValidationSummary config={config} />
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={onShowMultiSelectEditor}
                    >
                        <Settings className="w-4 h-4 mr-2" />
                        Multi-Edit Fields
                    </Button>
                    <Button
                        variant="outline"
                        onClick={onTogglePreview}
                    >
                        <Eye className="w-4 h-4 mr-2" />
                        {isPreviewMode ? 'Edit' : 'Preview'}
                    </Button>
                    <Button onClick={onSave} loading={loading}>
                        {isEditing ? 'Update Survey' : 'Save Survey'}
                    </Button>
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
};
