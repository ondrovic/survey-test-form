import { Eye, Settings } from 'lucide-react';
import React from 'react';
import { Button } from '../../common';

interface SurveyHeaderProps {
    isEditing: boolean;
    isPreviewMode: boolean;
    loading: boolean;
    onTogglePreview: () => void;
    onShowMultiSelectEditor: () => void;
    onSave: () => void;
    onClose: () => void;
}

export const SurveyHeader: React.FC<SurveyHeaderProps> = ({
    isEditing,
    isPreviewMode,
    loading,
    onTogglePreview,
    onShowMultiSelectEditor,
    onSave,
    onClose
}) => {
    return (
        <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold">
                {isEditing ? 'Edit Survey' : 'Survey Builder'}
            </h2>
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
    );
};
