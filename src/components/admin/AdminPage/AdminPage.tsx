import { AdminAuth, AdminFramework, AdminHeader, AdminLegacy, AdminOverview, AdminRatingScales, RatingScaleManager, SurveyBuilder } from '@/components/admin';
import { useAdminTab } from '@/contexts/AdminTabContext';
import { useSurveyDataContext } from '@/contexts/SurveyDataContext';
import { useAdminOperations, useAuth, useModal } from '@/hooks';
import { RatingScale, SurveyConfig } from '@/types';
import { clsx } from 'clsx';
import React, { useEffect } from 'react';

interface AdminPageProps {
    onBack: () => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onBack }) => {
    const { isAuthenticated, logout } = useAuth();
    const { activeTab, setActiveTab } = useAdminTab();
    const { refreshAll } = useSurveyDataContext();
    const adminOperations = useAdminOperations();

    // Modal states
    const surveyBuilderModal = useModal<SurveyConfig>();
    const ratingScaleManagerModal = useModal<RatingScale>();

    // Check for existing authentication on component mount
    useEffect(() => {
        if (isAuthenticated) {
            refreshAll();
        }
    }, [isAuthenticated, refreshAll]);

    const handleLogout = () => {
        logout();
    };

    const handleSetActiveTab = (tab: 'overview' | 'framework' | 'legacy' | 'rating-scales') => {
        setActiveTab(tab);
    };

    const handleCreateNewSurvey = () => {
        surveyBuilderModal.open();
    };

    const handleCloseSurveyBuilder = () => {
        surveyBuilderModal.close();
        refreshAll();
    };

    const handleEditSurveyConfig = (config: SurveyConfig) => {
        surveyBuilderModal.open(config);
    };

    const handleShowRatingScaleManager = () => {
        ratingScaleManagerModal.open();
    };

    const handleCloseRatingScaleManager = () => {
        ratingScaleManagerModal.close();
    };

    const handleEditRatingScale = (scale: RatingScale) => {
        ratingScaleManagerModal.open(scale);
    };

    const handleDownloadAllData = () => {
        adminOperations.downloadFrameworkData();
    };

    // Authentication screen
    if (!isAuthenticated) {
        return <AdminAuth onAuthenticated={() => { }} />;
    }

    return (
        <div className="min-h-screen bg-amber-50/30">
            {/* Header */}
            <AdminHeader onLogout={handleLogout} />

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Tab Navigation */}
                <div className="border-b border-gray-200 mb-8">
                    <nav className="-mb-px flex space-x-8">
                        {[
                            { id: 'overview', label: 'Overview' },
                            { id: 'framework', label: 'Survey Framework' },
                            { id: 'rating-scales', label: 'Rating Scales' },
                            // { id: 'legacy', label: 'Legacy Surveys' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => handleSetActiveTab(tab.id as any)}
                                className={clsx(
                                    "py-2 px-1 border-b-2 font-medium text-sm",
                                    activeTab === tab.id
                                        ? "border-blue-500 text-blue-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Tab Content */}
                {activeTab === 'overview' && (
                    <AdminOverview
                        onCreateNewSurvey={handleCreateNewSurvey}
                        onDownloadAllData={handleDownloadAllData}
                        onNavigateToTab={handleSetActiveTab}
                    />
                )}

                {activeTab === 'framework' && (
                    <AdminFramework
                        onCreateNewSurvey={handleCreateNewSurvey}
                        onEditSurveyConfig={handleEditSurveyConfig}
                        onDeleteSurveyConfig={adminOperations.deleteSurveyConfig}
                        onDeleteSurveyInstance={adminOperations.permanentlyDeleteSurveyInstance}
                        onToggleInstanceActive={adminOperations.toggleInstanceActive}
                        onUpdateInstanceDateRange={adminOperations.updateInstanceDateRange}
                    />
                )}

                {activeTab === 'rating-scales' && (
                    <AdminRatingScales
                        onShowRatingScaleManager={handleShowRatingScaleManager}
                        onEditRatingScale={handleEditRatingScale}
                        onDeleteRatingScale={adminOperations.deleteRatingScale}
                        onCleanupDuplicates={adminOperations.cleanupDuplicateRatingScales}
                    />
                )}

                {activeTab === 'legacy' && (
                    <AdminLegacy
                        onDeleteSurvey={adminOperations.deleteSurvey}
                    />
                )}
            </main>

            {/* Survey Builder Modal */}
            {surveyBuilderModal.isOpen && (
                <SurveyBuilder
                    onClose={handleCloseSurveyBuilder}
                    editingConfig={surveyBuilderModal.data}
                />
            )}

            {/* Rating Scale Manager Modal */}
            {ratingScaleManagerModal.isOpen && (
                <RatingScaleManager
                    isVisible={ratingScaleManagerModal.isOpen}
                    onClose={handleCloseRatingScaleManager}
                    onScaleSelect={() => { }}
                    editingScale={ratingScaleManagerModal.data}
                    isCreating={!ratingScaleManagerModal.data}
                    scales={[]} // This will be handled by the RatingScaleManager internally
                    onScaleDeleted={(scaleId) => {
                        adminOperations.deleteRatingScale(scaleId);
                    }}
                    onScaleCreated={(newScale) => {
                        refreshAll();
                    }}
                    onScaleUpdated={(updatedScale) => {
                        refreshAll();
                    }}
                />
            )}
        </div>
    );
};

