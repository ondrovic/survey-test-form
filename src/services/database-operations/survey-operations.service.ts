import { SupabaseClient } from "@supabase/supabase-js";
import {
  SurveyConfig,
  SurveyInstance,
  SurveyResponse,
} from "../../types/framework.types";
import {
  getRepositoryService,
  isRepositoryServiceInitialized,
} from "../repository.service";
import { MigrationService } from "../migration.service";
import { SupabaseClientService } from "../supabase-client.service";

/**
 * Service for survey-related database operations
 */
export class SurveyOperationsService {
  constructor(
    private client: SupabaseClient,
    private migrationService: MigrationService,
    private clientService: SupabaseClientService
  ) {}

  private getClient(): SupabaseClient {
    return this.client;
  }

  private async withAdminPrivileges<T>(
    operation: (client: SupabaseClient) => Promise<T>
  ): Promise<T> {
    return this.clientService.withElevatedPrivileges(operation);
  }

  private getRepositories() {
    if (!isRepositoryServiceInitialized()) {
      throw new Error(
        "Repository service not initialized. Please call initialize() first."
      );
    }
    return getRepositoryService();
  }

  // Legacy survey functions
  async getSurveys() {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from("surveys")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error getting surveys:", error);
      throw error;
    }
  }

  async addSurvey(surveyData: any) {
    try {
      const { data, error } = await this.getClient()
        .from("surveys")
        .insert({
          ...surveyData,
          submitted_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error adding survey:", error);
      throw error;
    }
  }

  async updateSurvey(id: string, data: any) {
    try {
      await this.withAdminPrivileges(async (client) => {
        const { error } = await client
          .from("surveys")
          .update(data)
          .eq("id", id);

        if (error) throw error;
      });
    } catch (error) {
      console.error("Error updating survey:", error);
      throw error;
    }
  }

  async deleteSurvey(id: string) {
    try {
      await this.withAdminPrivileges(async (client) => {
        const { error } = await client
          .from("surveys")
          .delete()
          .eq("id", id);

        if (error) throw error;
      });
    } catch (error) {
      console.error("Error deleting survey:", error);
      throw error;
    }
  }

  // Survey Configs
  async getSurveyConfigs() {
    const repositories = this.getRepositories();
    const migrationsComplete = await this.migrationService.areAllMigrationsComplete();
    
    if (migrationsComplete) {
      return repositories.surveyConfigs.findAll();
    } else {
      return repositories.surveyConfigs.findAll();
    }
  }

  async getSurveyConfig(id: string) {
    const repositories = this.getRepositories();
    return repositories.surveyConfigs.findById(id);
  }

  async addSurveyConfig(config: Omit<SurveyConfig, "id">) {
    const repositories = this.getRepositories();
    return repositories.surveyConfigs.create(config);
  }

  async updateSurveyConfig(id: string, data: Partial<SurveyConfig>) {
    const repositories = this.getRepositories();
    return repositories.surveyConfigs.update(id, data);
  }

  async deleteSurveyConfig(id: string) {
    const repositories = this.getRepositories();
    return repositories.surveyConfigs.delete(id);
  }

  // Survey Instances
  async getSurveyInstances() {
    const repositories = this.getRepositories();
    return repositories.surveyInstances.findAll();
  }

  async getSurveyInstancesByConfig(configId: string) {
    const repositories = this.getRepositories();
    return repositories.surveyInstances.findByConfigId(configId);
  }

  async addSurveyInstance(instance: Omit<SurveyInstance, "id">) {
    const repositories = this.getRepositories();
    return repositories.surveyInstances.create(instance);
  }

  async updateSurveyInstance(id: string, data: Partial<SurveyInstance>) {
    const repositories = this.getRepositories();
    return repositories.surveyInstances.update(id, data);
  }

  async deleteSurveyInstance(id: string) {
    const repositories = this.getRepositories();
    return repositories.surveyInstances.delete(id);
  }

  // Survey Responses
  async addSurveyResponse(response: Omit<SurveyResponse, "id">) {
    const repositories = this.getRepositories();
    
    const createdResponse = await repositories.surveyResponses.create(response);
    
    const instanceMigrated = await this.migrationService.areResponsesMigrated(
      response.surveyInstanceId
    );
    
    if (instanceMigrated && response.responses) {
      // TODO: Create normalized field responses
    }
    
    return createdResponse;
  }

  async getSurveyResponses(instanceId?: string) {
    const repositories = this.getRepositories();
    if (instanceId) {
      return repositories.surveyResponses.findByInstanceId(instanceId);
    }
    return repositories.surveyResponses.findAll();
  }

  async getSurveyResponsesFromCollection(instanceId: string) {
    const repositories = this.getRepositories();
    return repositories.surveyResponses.findFromCollection(instanceId);
  }

  // Survey Instance Status Management
  async updateSurveyInstanceStatuses() {
    const repositories = this.getRepositories();
    return repositories.surveyInstances.updateStatuses();
  }

  async clearValidationLocks() {
    try {
      console.log('🔓 Clearing validation locks...');
      const result = await this.getRepositories().surveyInstances.clearValidationLocks();
      
      console.log('✅ Validation locks cleared:', result);
      return result;
    } catch (error) {
      console.error('❌ Failed to clear validation locks:', error);
      return { success: false, cleared_locks: 0, message: 'Failed to clear validation locks' };
    }
  }

  async getUpcomingStatusChanges(hoursAhead = 24) {
    const repositories = this.getRepositories();
    return repositories.surveyInstances.getUpcomingStatusChanges(hoursAhead);
  }

  async getSurveyInstanceStatusChanges(instanceId?: string) {
    try {
      let query = this.getClient()
        .from("survey_instance_status_changes")
        .select("*")
        .order("changed_at", { ascending: false });

      if (instanceId) {
        query = query.eq("instance_id", instanceId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (
        data?.map((row: any) => ({
          id: row.id,
          instance_id: row.instance_id,
          old_status: row.old_status,
          new_status: row.new_status,
          reason: row.reason,
          changed_at: row.changed_at,
          changed_by: row.changed_by,
          details: row.details,
        })) || []
      );
    } catch (error) {
      console.error("Error getting survey instance status changes:", error);
      throw error;
    }
  }
}