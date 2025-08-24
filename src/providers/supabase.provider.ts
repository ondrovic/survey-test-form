import { OptionSetsOperationsService } from "../services/database-operations/option-sets-operations.service";
import { SurveyOperationsService } from "../services/database-operations/survey-operations.service";
import { AuthHelpers, DatabaseHelpers } from "../types/database.types";
import { BaseDatabaseProvider } from "./base-database.provider";

/**
 * Optimized Supabase provider using the repository pattern
 * Extends BaseDatabaseProvider for common functionality
 */
class SupabaseProviderImpl extends BaseDatabaseProvider {
  private surveyOperations: SurveyOperationsService | null = null;
  private optionSetsOperations: OptionSetsOperationsService | null = null;

  override async initialize(config: any): Promise<void> {
    await super.initialize(config);

    // Initialize operation services after base initialization
    const client = await this.clientService.getClient(config);
    const migrationService = this.ensureMigrationService();

    this.surveyOperations = new SurveyOperationsService(
      client,
      migrationService,
      this.clientService
    );
    this.optionSetsOperations = new OptionSetsOperationsService();
  }

  get authHelpers(): AuthHelpers {
    return {
      async signInAnonymously() {
        try {
          const user = { id: "anonymous", isAnonymous: true };
          return user;
        } catch (error) {
          console.error("Error signing in anonymously:", error);
          throw error;
        }
      },

      getCurrentUser: () => {
        return { id: "anonymous", isAnonymous: true };
      },

      onAuthStateChanged: (callback: (user: any) => void) => {
        const user = { id: "anonymous", isAnonymous: true };
        callback(user);
        return () => {};
      },
    };
  }

  get databaseHelpers(): DatabaseHelpers {
    if (!this.surveyOperations || !this.optionSetsOperations) {
      throw new Error(
        "Provider not properly initialized. Call initialize() first."
      );
    }

    const surveyOps = this.surveyOperations;
    const optionSetsOps = this.optionSetsOperations;

    return {
      // Legacy survey operations (removed - no longer supported)
      getSurveys: () => Promise.resolve([]),
      addSurvey: (_data: any) => Promise.reject(new Error('Legacy surveys no longer supported')),
      updateSurvey: (_id: string, _data: any) => Promise.reject(new Error('Legacy surveys no longer supported')),
      deleteSurvey: (_id: string) => Promise.reject(new Error('Legacy surveys no longer supported')),

      // Survey config operations
      getSurveyConfigs: () => surveyOps.getSurveyConfigs(),
      getSurveyConfig: (id: string) => surveyOps.getSurveyConfig(id),
      addSurveyConfig: (config: any) => surveyOps.addSurveyConfig(config),
      updateSurveyConfig: (id: string, data: any) =>
        surveyOps.updateSurveyConfig(id, data),
      deleteSurveyConfig: (id: string) =>
        surveyOps.deleteSurveyConfig(id),

      // Survey instance operations
      getSurveyInstances: () => surveyOps.getSurveyInstances(),
      getSurveyInstancesByConfig: (configId: string) =>
        surveyOps.getSurveyInstancesByConfig(configId),
      addSurveyInstance: (instance: any) =>
        surveyOps.addSurveyInstance(instance),
      updateSurveyInstance: (id: string, data: any) =>
        surveyOps.updateSurveyInstance(id, data),
      deleteSurveyInstance: (id: string) => surveyOps.deleteSurveyInstance(id),

      // Survey response operations
      addSurveyResponse: (response: any) =>
        surveyOps.addSurveyResponse(response),
      getSurveyResponses: (instanceId?: string) =>
        surveyOps.getSurveyResponses(instanceId),
      getSurveyResponsesFromCollection: (instanceId: string) =>
        surveyOps.getSurveyResponsesFromCollection(instanceId),

      // Status management
      updateSurveyInstanceStatuses: () =>
        surveyOps.updateSurveyInstanceStatuses(),
      clearValidationLocks: () => surveyOps.clearValidationLocks(),
      getUpcomingStatusChanges: (hoursAhead?: number) =>
        surveyOps.getUpcomingStatusChanges(hoursAhead),
      getSurveyInstanceStatusChanges: (instanceId?: string) =>
        surveyOps.getSurveyInstanceStatusChanges(instanceId),

      // Rating scales
      getRatingScales: () => optionSetsOps.getRatingScales(),
      getRatingScale: (id: string) => optionSetsOps.getRatingScale(id),
      addRatingScale: (scale: any) => optionSetsOps.addRatingScale(scale),
      updateRatingScale: (id: string, data: any) =>
        optionSetsOps.updateRatingScale(id, data),
      deleteRatingScale: (id: string) => optionSetsOps.deleteRatingScale(id),

      // Radio option sets
      getRadioOptionSets: () => optionSetsOps.getRadioOptionSets(),
      getRadioOptionSet: (id: string) => optionSetsOps.getRadioOptionSet(id),
      addRadioOptionSet: (optionSet: any) =>
        optionSetsOps.addRadioOptionSet(optionSet),
      updateRadioOptionSet: (id: string, data: any) =>
        optionSetsOps.updateRadioOptionSet(id, data),
      deleteRadioOptionSet: (id: string) =>
        optionSetsOps.deleteRadioOptionSet(id),

      // Multi-select option sets
      getMultiSelectOptionSets: () => optionSetsOps.getMultiSelectOptionSets(),
      getMultiSelectOptionSet: (id: string) =>
        optionSetsOps.getMultiSelectOptionSet(id),
      addMultiSelectOptionSet: (optionSet: any) =>
        optionSetsOps.addMultiSelectOptionSet(optionSet),
      updateMultiSelectOptionSet: (id: string, data: any) =>
        optionSetsOps.updateMultiSelectOptionSet(id, data),
      deleteMultiSelectOptionSet: (id: string) =>
        optionSetsOps.deleteMultiSelectOptionSet(id),

      // Select option sets
      getSelectOptionSets: () => optionSetsOps.getSelectOptionSets(),
      getSelectOptionSet: (id: string) => optionSetsOps.getSelectOptionSet(id),
      addSelectOptionSet: (optionSet: any) =>
        optionSetsOps.addSelectOptionSet(optionSet),
      updateSelectOptionSet: (id: string, data: any) =>
        optionSetsOps.updateSelectOptionSet(id, data),
      deleteSelectOptionSet: (id: string) =>
        optionSetsOps.deleteSelectOptionSet(id),

      // Survey session management
      addSurveySession: (sessionData: any) => surveyOps.addSurveySession(sessionData),
      updateSurveySession: (sessionId: string, data: any) => 
        surveyOps.updateSurveySession(sessionId, data),
      getSurveySessionByToken: (sessionToken: string) => 
        surveyOps.getSurveySessionByToken(sessionToken),
      getSurveySession: (sessionId: string) => surveyOps.getSurveySession(sessionId),
      getSurveySessions: (instanceId?: string) => surveyOps.getSurveySessions(instanceId),
    };
  }
}

export const SupabaseProvider = new SupabaseProviderImpl();
