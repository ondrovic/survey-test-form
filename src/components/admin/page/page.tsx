import { AdminAuth } from '@/components/admin/auth';
import { AdminFramework } from '@/components/admin/framework';
import { AdminHeader } from '@/components/admin/header';
import { AdminOptionSets } from '@/components/admin/option-sets';
import { AdminOverview } from '@/components/admin/overview';
import { MultiSelectOptionSetManager } from '@/components/admin/multi-select-option-set-manager';
import { RadioOptionSetManager } from '@/components/admin/radio-option-set-manager';
import { SelectOptionSetManager } from '@/components/admin/select-option-set-manager';
import { SurveyBuilder } from '@/components/admin/survey-builder';
import { RatingScaleManager } from '@/components/admin/rating-scale-manager';
import { useAdminTab } from '@/contexts/admin-tab-context/index';
import { useAuth } from '@/contexts/auth-context/index';
import { useSurveyDataContext } from '@/contexts/survey-data-context/index';
import { useAdminOperations, useModal } from '@/hooks';
import { RatingScale, SurveyConfig } from '@/types';
import { clsx } from 'clsx';
import React, { useEffect } from 'react';
import { AdminPageProps } from './page.types';

export const AdminPage: React.FC<AdminPageProps> = ({ }) => {
    const { isAuthenticated, logout } = useAuth();
    const { activeTab, setActiveTab } = useAdminTab();
    const { refreshAll } = useSurveyDataContext();
    const adminOperations = useAdminOperations();

    // Modal states
    const surveyBuilderModal = useModal<SurveyConfig>();
    const ratingScaleManagerModal = useModal<RatingScale>();
    const radioOptionSetManagerModal = useModal<any>();
    const multiSelectOptionSetManagerModal = useModal<any>();
    const selectOptionSetManagerModal = useModal<any>();

    // Check for existing authentication on component mount
    useEffect(() => {
        if (isAuthenticated) {
            refreshAll();
        }
    }, [isAuthenticated, refreshAll]);

    const handleLogout = () => {
        logout();
    };

    const handleSetActiveTab = (tab: 'overview' | 'framework' | 'legacy' | 'option-sets') => {
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

    const handleShowRadioOptionSetManager = () => {
        radioOptionSetManagerModal.open();
    };

    const handleShowMultiSelectOptionSetManager = () => {
        multiSelectOptionSetManagerModal.open();
    };

    const handleShowSelectOptionSetManager = () => {
        selectOptionSetManagerModal.open();
    };

    // Radio Option Set handlers
    const handleEditRadioOptionSet = (optionSet: any) => {
        radioOptionSetManagerModal.open(optionSet);
    };

    const handleDeleteRadioOptionSet = (optionSetId: string) => {
        adminOperations.deleteRadioOptionSet(optionSetId);
    };

    // Multi-Select Option Set handlers
    const handleEditMultiSelectOptionSet = (optionSet: any) => {
        multiSelectOptionSetManagerModal.open(optionSet);
    };

    const handleDeleteMultiSelectOptionSet = (optionSetId: string) => {
        adminOperations.deleteMultiSelectOptionSet(optionSetId);
    };

    // Select Option Set handlers
    const handleEditSelectOptionSet = (optionSet: any) => {
        selectOptionSetManagerModal.open(optionSet);
    };

    const handleDeleteSelectOptionSet = (optionSetId: string) => {
        adminOperations.deleteSelectOptionSet(optionSetId);
    };

    // Close handler functions for option set managers
    const handleCloseRadioOptionSetManager = () => {
        radioOptionSetManagerModal.close();
    };

    const handleCloseMultiSelectOptionSetManager = () => {
        multiSelectOptionSetManagerModal.close();
    };

    const handleCloseSelectOptionSetManager = () => {
        selectOptionSetManagerModal.close();
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
                            { id: 'option-sets', label: 'Option Sets' },
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

                {activeTab === 'option-sets' && (
                    <AdminOptionSets
                        onShowRatingScaleManager={handleShowRatingScaleManager}
                        onEditRatingScale={handleEditRatingScale}
                        onDeleteRatingScale={adminOperations.deleteRatingScale}
                        onCleanupDuplicates={adminOperations.cleanupDuplicateRatingScales}
                        onShowRadioOptionSetManager={handleShowRadioOptionSetManager}
                        onEditRadioOptionSet={handleEditRadioOptionSet}
                        onDeleteRadioOptionSet={handleDeleteRadioOptionSet}
                        onShowMultiSelectOptionSetManager={handleShowMultiSelectOptionSetManager}
                        onEditMultiSelectOptionSet={handleEditMultiSelectOptionSet}
                        onDeleteMultiSelectOptionSet={handleDeleteMultiSelectOptionSet}
                        onShowSelectOptionSetManager={handleShowSelectOptionSetManager}
                        onEditSelectOptionSet={handleEditSelectOptionSet}
                        onDeleteSelectOptionSet={handleDeleteSelectOptionSet}
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
                    onScaleCreated={() => {
                        refreshAll();
                    }}
                    onScaleUpdated={() => {
                        refreshAll();
                    }}
                />
            )}

            {/* Radio Option Set Manager Modal */}
            {radioOptionSetManagerModal.isOpen && (
                <RadioOptionSetManager
                    isVisible={radioOptionSetManagerModal.isOpen}
                    onClose={handleCloseRadioOptionSetManager}
                    onOptionSetSelect={() => { }}
                    editingOptionSet={radioOptionSetManagerModal.data}
                    isCreating={!radioOptionSetManagerModal.data}
                    optionSets={[]} // This will be handled by the RadioOptionSetManager internally
                    onOptionSetDeleted={(optionSetId) => {
                        adminOperations.deleteRadioOptionSet(optionSetId);
                    }}
                    onOptionSetCreated={() => {
                        refreshAll();
                    }}
                    onOptionSetUpdated={() => {
                        refreshAll();
                    }}
                />
            )}

            {/* Multi-Select Option Set Manager Modal */}
            {multiSelectOptionSetManagerModal.isOpen && (
                <MultiSelectOptionSetManager
                    isVisible={multiSelectOptionSetManagerModal.isOpen}
                    onClose={handleCloseMultiSelectOptionSetManager}
                    onOptionSetSelect={() => { }}
                    editingOptionSet={multiSelectOptionSetManagerModal.data}
                    isCreating={!multiSelectOptionSetManagerModal.data}
                    optionSets={[]} // This will be handled by the MultiSelectOptionSetManager internally
                    onOptionSetDeleted={(optionSetId) => {
                        adminOperations.deleteMultiSelectOptionSet(optionSetId);
                    }}
                    onOptionSetCreated={() => {
                        refreshAll();
                    }}
                    onOptionSetUpdated={() => {
                        refreshAll();
                    }}
                />
            )}

            {/* Select Option Set Manager Modal */}
            {selectOptionSetManagerModal.isOpen && (
                <SelectOptionSetManager
                    isVisible={selectOptionSetManagerModal.isOpen}
                    onClose={handleCloseSelectOptionSetManager}
                    onOptionSetSelect={() => { }}
                    editingOptionSet={selectOptionSetManagerModal.data}
                    isCreating={!selectOptionSetManagerModal.data}
                    optionSets={[]} // This will be handled by the SelectOptionSetManager internally
                    onOptionSetDeleted={(optionSetId) => {
                        adminOperations.deleteSelectOptionSet(optionSetId);
                    }}
                    onOptionSetCreated={() => {
                        refreshAll();
                    }}
                    onOptionSetUpdated={() => {
                        refreshAll();
                    }}
                />
            )}
        </div>
    );
};

