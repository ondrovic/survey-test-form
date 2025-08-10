import { Button } from '@/components/common';
import { useSurveyData } from '@/contexts/survey-data-context/index';
import { useModal } from '@/hooks';
import { RatingScale } from '@/types';
import { Edit, Plus, Trash2 } from 'lucide-react';
import React from 'react';

interface AdminRatingOptionsSetsProps {
    onShowRatingScaleManager: () => void;
    onEditRatingScale: (scale: RatingScale) => void;
    onDeleteRatingScale: (scaleId: string) => void;
    // onCleanupDuplicates: () => void;
}

export const AdminRatingOptionsSets: React.FC<AdminRatingOptionsSetsProps> = ({
    onShowRatingScaleManager,
    onEditRatingScale,
    onDeleteRatingScale,
    // onCleanupDuplicates
}) => {
    const { state: { ratingScales } } = useSurveyData();
    const deleteModal = useModal<{ id: string; name: string }>();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Rating Option Sets</h2>
                <div className="flex gap-2">
                    {/* <Button
                        onClick={onCleanupDuplicates}
                        variant="outline"
                        size="sm"
                    >
                        Clean Duplicates
                    </Button> */}
                    <Button onClick={onShowRatingScaleManager}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create New Rating Scale
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b">
                    <h3 className="text-lg font-semibold">Rating Scale Configurations</h3>
                </div>
                <div className="p-6">
                    {ratingScales && ratingScales.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No rating scales found. Create your first rating scale to get started.</p>
                    ) : (
                        <div className="space-y-4">
                            {ratingScales?.map((scale) => (
                                <div key={scale.id} className="border rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-semibold">{scale.name}</h4>
                                            <p className="text-sm text-gray-600">{scale.description || 'No description'}</p>
                                            <p className="text-xs text-gray-500">
                                                {scale.options.length} options,
                                                {scale.options.filter(opt => opt.isDefault).length} default
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => onEditRatingScale(scale)}
                                            >
                                                <Edit className="w-4 h-4 mr-1" />
                                                Edit
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => deleteModal.open({ id: scale.id, name: scale.name })}
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
                            Are you sure you want to delete &quot;{deleteModal.data.name}&quot;?
                            This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <Button
                                onClick={() => {
                                    onDeleteRatingScale(deleteModal.data!.id);
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
