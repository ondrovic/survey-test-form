import { AdminAuth } from "@/components/admin/auth";
import { SimpleErrorLogsPage } from "@/components/admin/error-logs/simple-error-logs-page";
import { AdminFramework } from "@/components/admin/framework";
import { AppDrawer, DrawerPage } from "@/components/admin/layout";
import {
  MultiSelectOptionSetManager,
  RadioOptionSetManager,
  RatingScaleManager,
  SelectOptionSetManager,
} from "@/components/admin/option-set-manager";
import { AdminOptionSets } from "@/components/admin/option-sets";
import { AdminOverview } from "@/components/admin/overview";
import { SurveyBuilder } from "@/components/admin/survey-builder";
import { useAdminPage } from "@/contexts/admin-page-context/index";
import { useAuth } from "@/contexts/auth-context/index";
import { useModal } from "@/contexts/modal-context";
import { useSurveyData } from "@/contexts/survey-data-context/index";
import { ValidationStatusProvider } from "@/contexts/validation-status-context";
import { useAdminOperations } from "@/hooks";
import { RatingScale, SurveyConfig } from "@/types";
import React, { useState } from "react";
import { AdminPageProps } from "./page.types";

export const AdminPage: React.FC<AdminPageProps> = ({ onBack: _onBack }) => {
  const { isAuthenticated, logout } = useAuth();
  const { activePage, setActivePage } = useAdminPage();
  const { refreshAll } = useSurveyData();
  const adminOperations = useAdminOperations();
  const { openModal, closeModal } = useModal();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDrawerCollapsed, setIsDrawerCollapsed] = useState(false);

  // Get page title based on active page
  const getPageTitle = (page: DrawerPage): string => {
    switch (page) {
      case "overview":
        return "Overview";
      case "framework":
        return "Framework";
      case "option-sets":
        return "Option Sets";
      case "error-logs":
        return "Error Logs";
      default:
        return "Overview";
    }
  };

  // Data loading is handled automatically by the survey data context
  // No need to manually refresh on authentication change

  const handleLogout = () => {
    logout();
  };

  const handleSetActivePage = (page: DrawerPage) => {
    setActivePage(page);
  };

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  const handleCreateNewSurvey = () => {
    openModal(
      "survey-builder",
      <SurveyBuilder
        onClose={handleCloseSurveyBuilder}
        editingConfig={undefined}
      />
    );
  };

  const handleCloseSurveyBuilder = () => {
    closeModal("survey-builder");
    refreshAll();
  };

  const handleEditSurveyConfig = (config: SurveyConfig) => {
    openModal(
      "survey-builder",
      <SurveyBuilder
        onClose={handleCloseSurveyBuilder}
        editingConfig={config}
      />
    );
  };

  const handleShowRatingScaleManager = () => {
    openModal(
      "rating-scale-manager",
      <RatingScaleManager
        isVisible={true}
        onClose={handleCloseRatingScaleManager}
        editingScale={undefined}
        isCreating={true}
      />
    );
  };

  const handleCloseRatingScaleManager = () => {
    closeModal("rating-scale-manager");
  };

  const handleEditRatingScale = (scale: RatingScale) => {
    openModal(
      "rating-scale-manager",
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
      "radio-option-set-manager",
      <RadioOptionSetManager
        isVisible={true}
        onClose={handleCloseRadioOptionSetManager}
        editingOptionSet={undefined}
        isCreating={true}
      />
    );
  };

  const handleCloseRadioOptionSetManager = () => {
    closeModal("radio-option-set-manager");
  };

  const handleShowMultiSelectOptionSetManager = () => {
    openModal(
      "multi-select-option-set-manager",
      <MultiSelectOptionSetManager
        isVisible={true}
        onClose={handleCloseMultiSelectOptionSetManager}
        editingOptionSet={undefined}
        isCreating={true}
      />
    );
  };

  const handleCloseMultiSelectOptionSetManager = () => {
    closeModal("multi-select-option-set-manager");
  };

  const handleShowSelectOptionSetManager = () => {
    openModal(
      "select-option-set-manager",
      <SelectOptionSetManager
        isVisible={true}
        onClose={handleCloseSelectOptionSetManager}
        editingOptionSet={undefined}
        isCreating={true}
      />
    );
  };

  const handleCloseSelectOptionSetManager = () => {
    closeModal("select-option-set-manager");
  };

  // Radio Option Set handlers
  const handleEditRadioOptionSet = (optionSet: any) => {
    openModal(
      "radio-option-set-manager",
      <RadioOptionSetManager
        isVisible={true}
        onClose={handleCloseRadioOptionSetManager}
        editingOptionSet={optionSet}
        isCreating={false}
      />
    );
  };

  const handleDeleteRadioOptionSet = (
    optionSetId: string,
    optionSetName?: string
  ) => {
    adminOperations.deleteRadioOptionSet(optionSetId, optionSetName);
  };

  // Multi-Select Option Set handlers
  const handleEditMultiSelectOptionSet = (optionSet: any) => {
    openModal(
      "multi-select-option-set-manager",
      <MultiSelectOptionSetManager
        isVisible={true}
        onClose={handleCloseMultiSelectOptionSetManager}
        editingOptionSet={optionSet}
        isCreating={false}
      />
    );
  };

  const handleDeleteMultiSelectOptionSet = (
    optionSetId: string,
    optionSetName?: string
  ) => {
    adminOperations.deleteMultiSelectOptionSet(optionSetId, optionSetName);
  };

  // Select Option Set handlers
  const handleEditSelectOptionSet = (optionSet: any) => {
    openModal(
      "select-option-set-manager",
      <SelectOptionSetManager
        isVisible={true}
        onClose={handleCloseSelectOptionSetManager}
        editingOptionSet={optionSet}
        isCreating={false}
      />
    );
  };

  const handleDeleteSelectOptionSet = (
    optionSetId: string,
    optionSetName?: string
  ) => {
    adminOperations.deleteSelectOptionSet(optionSetId, optionSetName);
  };

  // Authentication screen
  if (!isAuthenticated) {
    return <AdminAuth onAuthenticated={() => {}} />;
  }

  return (
    <ValidationStatusProvider>
      <div className="min-h-screen bg-blue-50/30 flex">
        {/* App Drawer */}
        <AppDrawer
          activePage={activePage as DrawerPage}
          onPageChange={handleSetActivePage}
          isOpen={isDrawerOpen}
          onToggle={toggleDrawer}
          isCollapsed={isDrawerCollapsed}
          onCollapsedChange={setIsDrawerCollapsed}
          onLogout={handleLogout}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Header with page title and mobile menu button */}
          <div className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
              <div className="flex items-center">
                <button
                  onClick={toggleDrawer}
                  className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 lg:hidden mr-2"
                  aria-label="Open navigation drawer"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
                <h1 className="text-xl font-semibold text-gray-900">
                  {getPageTitle(activePage as DrawerPage)}
                </h1>
              </div>
            </div>
          </div>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto bg-blue-50/30">
            <div className="max-w-7xl mx-auto px-1 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-8 w-full min-w-0">
              {activePage === "overview" && (
                <AdminOverview
                  onCreateNewSurvey={handleCreateNewSurvey}
                  onNavigateToTab={handleSetActivePage}
                />
              )}

              {activePage === "framework" && (
                <AdminFramework
                  onCreateNewSurvey={handleCreateNewSurvey}
                  onEditSurveyConfig={handleEditSurveyConfig}
                  onDeleteSurveyConfig={adminOperations.deleteSurveyConfig}
                  onDeleteSurveyInstance={
                    adminOperations.permanentlyDeleteSurveyInstance
                  }
                  onToggleInstanceActive={adminOperations.toggleInstanceActive}
                  onUpdateInstanceDateRange={
                    adminOperations.updateInstanceDateRange
                  }
                />
              )}

              {activePage === "option-sets" && (
                <AdminOptionSets
                  onShowRatingScaleManager={handleShowRatingScaleManager}
                  onEditRatingScale={handleEditRatingScale}
                  onDeleteRatingScale={adminOperations.deleteRatingScale}
                  onCleanupDuplicates={
                    adminOperations.cleanupDuplicateRatingScales
                  }
                  onShowRadioOptionSetManager={handleShowRadioOptionSetManager}
                  onEditRadioOptionSet={handleEditRadioOptionSet}
                  onDeleteRadioOptionSet={handleDeleteRadioOptionSet}
                  onShowMultiSelectOptionSetManager={
                    handleShowMultiSelectOptionSetManager
                  }
                  onEditMultiSelectOptionSet={handleEditMultiSelectOptionSet}
                  onDeleteMultiSelectOptionSet={
                    handleDeleteMultiSelectOptionSet
                  }
                  onShowSelectOptionSetManager={
                    handleShowSelectOptionSetManager
                  }
                  onEditSelectOptionSet={handleEditSelectOptionSet}
                  onDeleteSelectOptionSet={handleDeleteSelectOptionSet}
                />
              )}

              {activePage === "error-logs" && <SimpleErrorLogsPage />}
            </div>
          </main>
        </div>
      </div>
    </ValidationStatusProvider>
  );
};
