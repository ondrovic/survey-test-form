
import { AdminAuth } from '@/components/admin/auth';
import { AdminFramework } from '@/components/admin/framework';
import { AdminHeader } from '@/components/admin/header';
import {
    MultiSelectOptionSetManager,
    RadioOptionSetManager,
    RatingScaleManager,
    SelectOptionSetManager
} from '@/components/admin/option-set-manager';
import { AdminOptionSets } from '@/components/admin/option-sets';
import { AdminOverview } from '@/components/admin/overview';
import { SurveyBuilder } from '@/components/admin/survey-builder';
import { useAdminTab } from '@/contexts/admin-tab-context/index';
import { useAuth } from '@/contexts/auth-context/index';
import { useModal } from '@/contexts/modal-context';
import { useSurveyData } from '@/contexts/survey-data-context/index';
import { ValidationStatusProvider } from '@/contexts/validation-status-context';
import { useAdminOperations } from '@/hooks';
import { RatingScale, SurveyConfig } from '@/types';
import { clsx } from 'clsx';
import React, { useEffect } from 'react';
import { AdminPageProps } from './page.types';

export const AdminPage: React.FC<AdminPageProps> = ({ onBack: _onBack }) => {
    const { isAuthenticated, logout } = useAuth();
    const { activeTab, setActiveTab } = useAdminTab();
    const { refreshAll } = useSurveyData();
    const adminOperations = useAdminOperations();
    const { openModal, closeModal } = useModal();

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
        openModal(
            'survey-builder',
            <SurveyBuilder
                onClose={handleCloseSurveyBuilder}
                editingConfig={undefined}
            />
        );
    };

    const handleCloseSurveyBuilder = () => {
        closeModal('survey-builder');
        refreshAll();
    };

    const handleEditSurveyConfig = (config: SurveyConfig) => {
        openModal(
            'survey-builder',
            <SurveyBuilder
                onClose={handleCloseSurveyBuilder}
                editingConfig={config}
            />
        );
    };

    const handleShowRatingScaleManager = () => {
        openModal(
            'rating-scale-manager',
            <RatingScaleManager
                isVisible={true}
                onClose={handleCloseRatingScaleManager}
                editingScale={undefined}
                isCreating={true}
            />
        );
    };

    const handleCloseRatingScaleManager = () => {
        closeModal('rating-scale-manager');
    };

    const handleEditRatingScale = (scale: RatingScale) => {
        openModal(
            'rating-scale-manager',
            <RatingScaleManager
                isVisible={true}
                onClose={handleCloseRatingScaleManager}
                editingScale={scale}
                isCreating={false}
            />
        );
    };

    const handleShowRadioOptionSetManager = () => {
        openModal(
            'radio-option-set-manager',
            <RadioOptionSetManager
                isVisible={true}
                onClose={handleCloseRadioOptionSetManager}
                editingOptionSet={undefined}
                isCreating={true}
            />
        );
    };

    const handleCloseRadioOptionSetManager = () => {
        closeModal('radio-option-set-manager');
    };

    const handleShowMultiSelectOptionSetManager = () => {
        openModal(
            'multi-select-option-set-manager',
            <MultiSelectOptionSetManager
                isVisible={true}
                onClose={handleCloseMultiSelectOptionSetManager}
                editingOptionSet={undefined}
                isCreating={true}
            />
        );
    };

    const handleCloseMultiSelectOptionSetManager = () => {
        closeModal('multi-select-option-set-manager');
    };

    const handleShowSelectOptionSetManager = () => {
        openModal(
            'select-option-set-manager',
            <SelectOptionSetManager
                isVisible={true}
                onClose={handleCloseSelectOptionSetManager}
                editingOptionSet={undefined}
                isCreating={true}
            />
        );
    };

    const handleCloseSelectOptionSetManager = () => {
        closeModal('select-option-set-manager');
    };

    // Radio Option Set handlers
    const handleEditRadioOptionSet = (optionSet: any) => {
        openModal(
            'radio-option-set-manager',
            <RadioOptionSetManager
                isVisible={true}
                onClose={handleCloseRadioOptionSetManager}
                editingOptionSet={optionSet}
                isCreating={false}
            />
        );
    };

    const handleDeleteRadioOptionSet = (optionSetId: string, optionSetName?: string) => {
        adminOperations.deleteRadioOptionSet(optionSetId, optionSetName);
    };

    // Multi-Select Option Set handlers
    const handleEditMultiSelectOptionSet = (optionSet: any) => {
        openModal(
            'multi-select-option-set-manager',
            <MultiSelectOptionSetManager
                isVisible={true}
                onClose={handleCloseMultiSelectOptionSetManager}
                editingOptionSet={optionSet}
                isCreating={false}
            />
        );
    };

    const handleDeleteMultiSelectOptionSet = (optionSetId: string, optionSetName?: string) => {
        adminOperations.deleteMultiSelectOptionSet(optionSetId, optionSetName);
    };

    // Select Option Set handlers
    const handleEditSelectOptionSet = (optionSet: any) => {
        openModal(
            'select-option-set-manager',
            <SelectOptionSetManager
                isVisible={true}
                onClose={handleCloseSelectOptionSetManager}
                editingOptionSet={optionSet}
                isCreating={false}
            />
        );
    };

    const handleDeleteSelectOptionSet = (optionSetId: string, optionSetName?: string) => {
        adminOperations.deleteSelectOptionSet(optionSetId, optionSetName);
    };

    const handleDownloadAllData = () => {
        adminOperations.downloadFrameworkData();
    };

    // Authentication screen
    if (!isAuthenticated) {
        return <AdminAuth onAuthenticated={() => { }} />;
    }

    return (
        <ValidationStatusProvider>
            <div className="min-h-screen bg-amber-50/30 flex flex-col">
                {/* Header */}
                <AdminHeader onLogout={handleLogout} />

                {/* Main Content */}
                <main className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 min-h-0">
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
                <div className="flex-1 min-h-0 overflow-hidden">
                    <div className="h-full overflow-y-auto">
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
                    </div>
                </div>



                </main>
            </div>
        </ValidationStatusProvider>
    );
};

