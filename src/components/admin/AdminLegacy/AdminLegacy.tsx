import { Button } from '@/components/common';
import { useSurveyDataContext } from '@/contexts/SurveyDataContext';
import { useToast } from '@/contexts/ToastContext';
import { useModal } from '@/hooks';
import { downloadSurveyDataAsExcel } from '@/utils/excel.utils';
import { Download, Trash2 } from 'lucide-react';
import React from 'react';

interface AdminLegacyProps {
    onDeleteSurvey: (surveyId: string) => void;
}

export const AdminLegacy: React.FC<AdminLegacyProps> = ({
    onDeleteSurvey
}) => {
    const { surveys } = useSurveyDataContext();
    const { showSuccess, showError } = useToast();
    const deleteModal = useModal<{ id: string; name: string }>();

    const handleDownloadData = async (surveyId?: string) => {
        try {
            if (surveyId) {
                // Download specific survey data
                const survey = surveys.find(s => s.id === surveyId);
                if (survey) {
                    await downloadSurveyDataAsExcel([survey], survey.title || 'Survey');
                }
            } else {
                // Download all survey data
                await downloadSurveyDataAsExcel(surveys);
            }
            showSuccess('Survey data downloaded successfully!');
        } catch (error) {
            showError('Failed to download survey data');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Legacy Surveys</h2>
                <Button
                    onClick={() => handleDownloadData()}
                    variant="outline"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Download All Data
                </Button>
            </div>

            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b">
                    <h3 className="text-lg font-semibold">Survey Data</h3>
                </div>
                <div className="p-6">
                    {surveys.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No legacy surveys found.</p>
                    ) : (
                        <div className="space-y-4">
                            {surveys.map((survey) => (
                                <div key={survey.id} className="border rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-semibold">{survey.title || 'Untitled Survey'}</h4>
                                            <p className="text-sm text-gray-600">
                                                {survey.responses?.length || 0} responses
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Created: {new Date(survey.createdAt || survey.submittedAt || Date.now()).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleDownloadData(survey.id)}
                                            >
                                                <Download className="w-4 h-4 mr-1" />
                                                Download
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => deleteModal.open({ id: survey.id, name: survey.title || 'Untitled Survey' })}
                                            >
                                                <Trash2 className="w-4 h-4 mr-1" />
                                                Delete
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteModal.isOpen && deleteModal.data && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold mb-4">Confirm Deletion</h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete "{deleteModal.data.name}"?
                            This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <Button
                                onClick={() => {
                                    onDeleteSurvey(deleteModal.data!.id);
                                    deleteModal.close();
                                }}
                                variant="secondary"
                                className="flex-1 bg-red-600 hover:bg-red-700 focus:ring-red-500"
                            >
                                Delete
                            </Button>
                            <Button
                                onClick={() => deleteModal.close()}
                                variant="outline"
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
