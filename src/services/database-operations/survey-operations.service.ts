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
import { SupabaseClientService } from "../supabase-client.service";
import { ErrorLoggingService } from '../error-logging.service';

/**
 * Service for survey-related database operations
 */
export class SurveyOperationsService {
  constructor(
    private client: SupabaseClient,
    private clientService: SupabaseClientService
  ) {}

  private getClient(): SupabaseClient {
    return this.client;
  }

  private async withAdminPrivileges<T>(
    operation: (client: SupabaseClient) => Promise<T>
  ): Promise<T> {
    return this.clientService.withClient(operation);
  }


  private getRepositories() {
    if (!isRepositoryServiceInitialized()) {
      throw new Error(
        "Repository service not initialized. Please call initialize() first."
      );
    }
    return getRepositoryService();
  }


  // Survey Configs
  async getSurveyConfigs() {
    try {
      const repositories = this.getRepositories();
      return repositories.surveyConfigs.findAll();
    } catch (error) {
      console.error('Error getting survey configs:', error);
      
      await ErrorLoggingService.logError({
        severity: 'medium',
        errorMessage: 'Failed to get survey configs',
        stackTrace: error instanceof Error ? error.stack : String(error),
        componentName: 'SurveyOperationsService',
        functionName: 'getSurveyConfigs',
        userAction: 'Retrieve all survey configurations',
        additionalContext: {
          operation: 'getSurveyConfigs',
          repositoryAction: 'surveyConfigs.findAll'
        },
        tags: ['database', 'survey-operations', 'service', 'config', 'query', 'collection']
      });
      
      throw error;
    }
  }

  async getSurveyConfig(id: string) {
    try {
      const repositories = this.getRepositories();
      return repositories.surveyConfigs.findById(id);
    } catch (error) {
      console.error('Error getting survey config:', error);
      
      await ErrorLoggingService.logError({
        severity: 'medium',
        errorMessage: 'Failed to get survey config by ID',
        stackTrace: error instanceof Error ? error.stack : String(error),
        componentName: 'SurveyOperationsService',
        functionName: 'getSurveyConfig',
        userAction: 'Retrieve specific survey configuration',
        additionalContext: {
          configId: id,
          operation: 'getSurveyConfig',
          repositoryAction: 'surveyConfigs.findById'
        },
        tags: ['database', 'survey-operations', 'service', 'config', 'query']
      });
      
      throw error;
    }
  }

  async addSurveyConfig(config: Omit<SurveyConfig, "id">) {
    try {
      const repositories = this.getRepositories();
      return repositories.surveyConfigs.create(config);
    } catch (error) {
      console.error('Error adding survey config:', error);
      
      await ErrorLoggingService.logError({
        severity: 'high',
        errorMessage: 'Failed to create survey config',
        stackTrace: error instanceof Error ? error.stack : String(error),
        componentName: 'SurveyOperationsService',
        functionName: 'addSurveyConfig',
        userAction: 'Create new survey configuration',
        additionalContext: {
          configName: (config as any).name || 'unknown',
          configType: (config as any).type || 'unknown',
          operation: 'addSurveyConfig',
          repositoryAction: 'surveyConfigs.create'
        },
        tags: ['database', 'survey-operations', 'service', 'config', 'create']
      });
      
      throw error;
    }
  }

  async updateSurveyConfig(id: string, data: Partial<SurveyConfig>) {
    try {
      const repositories = this.getRepositories();
      return repositories.surveyConfigs.update(id, data);
    } catch (error) {
      console.error('Error updating survey config:', error);
      
      await ErrorLoggingService.logError({
        severity: 'high',
        errorMessage: 'Failed to update survey config',
        stackTrace: error instanceof Error ? error.stack : String(error),
        componentName: 'SurveyOperationsService',
        functionName: 'updateSurveyConfig',
        userAction: 'Update existing survey configuration',
        additionalContext: {
          configId: id,
          updateFields: Object.keys(data),
          configName: (data as any).name || 'unknown',
          operation: 'updateSurveyConfig',
          repositoryAction: 'surveyConfigs.update'
        },
        tags: ['database', 'survey-operations', 'service', 'config', 'update']
      });
      
      throw error;
    }
  }

  async deleteSurveyConfig(id: string) {
    try {
      const repositories = this.getRepositories();
      return repositories.surveyConfigs.delete(id);
    } catch (error) {
      console.error('Error deleting survey config:', error);
      
      await ErrorLoggingService.logError({
        severity: 'critical',
        errorMessage: 'Failed to delete survey config',
        stackTrace: error instanceof Error ? error.stack : String(error),
        componentName: 'SurveyOperationsService',
        functionName: 'deleteSurveyConfig',
        userAction: 'Delete survey configuration',
        additionalContext: {
          configId: id,
          operation: 'deleteSurveyConfig',
          repositoryAction: 'surveyConfigs.delete'
        },
        tags: ['database', 'survey-operations', 'service', 'config', 'delete']
      });
      
      throw error;
    }
  }

  // Survey Instances
  async getSurveyInstances() {
    try {
      const repositories = this.getRepositories();
      return repositories.surveyInstances.findAll();
    } catch (error) {
      console.error('Error getting survey instances:', error);
      
      await ErrorLoggingService.logError({
        severity: 'medium',
        errorMessage: 'Failed to get survey instances',
        stackTrace: error instanceof Error ? error.stack : String(error),
        componentName: 'SurveyOperationsService',
        functionName: 'getSurveyInstances',
        userAction: 'Retrieve all survey instances',
        additionalContext: {
          operation: 'getSurveyInstances',
          repositoryAction: 'surveyInstances.findAll'
        },
        tags: ['database', 'survey-operations', 'service', 'instance', 'query', 'collection']
      });
      
      throw error;
    }
  }

  async getSurveyInstancesByConfig(configId: string) {
    try {
      const repositories = this.getRepositories();
      return repositories.surveyInstances.findByConfigId(configId);
    } catch (error) {
      console.error('Error getting survey instances by config:', error);
      
      await ErrorLoggingService.logError({
        severity: 'medium',
        errorMessage: 'Failed to get survey instances by config ID',
        stackTrace: error instanceof Error ? error.stack : String(error),
        componentName: 'SurveyOperationsService',
        functionName: 'getSurveyInstancesByConfig',
        userAction: 'Retrieve survey instances for specific configuration',
        additionalContext: {
          configId,
          operation: 'getSurveyInstancesByConfig',
          repositoryAction: 'surveyInstances.findByConfigId'
        },
        tags: ['database', 'survey-operations', 'service', 'instance', 'query', 'config-filter']
      });
      
      throw error;
    }
  }

  async addSurveyInstance(instance: Omit<SurveyInstance, "id">) {
    try {
      const repositories = this.getRepositories();
      return repositories.surveyInstances.create(instance);
    } catch (error) {
      console.error('Error adding survey instance:', error);
      
      await ErrorLoggingService.logError({
        severity: 'high',
        errorMessage: 'Failed to create survey instance',
        stackTrace: error instanceof Error ? error.stack : String(error),
        componentName: 'SurveyOperationsService',
        functionName: 'addSurveyInstance',
        userAction: 'Create new survey instance',
        additionalContext: {
          configId: (instance as any).config_id || (instance as any).configId || 'unknown',
          name: (instance as any).name || 'unknown',
          status: (instance as any).status || 'unknown',
          operation: 'addSurveyInstance',
          repositoryAction: 'surveyInstances.create'
        },
        tags: ['database', 'survey-operations', 'service', 'instance', 'create']
      });
      
      throw error;
    }
  }

  async updateSurveyInstance(id: string, data: Partial<SurveyInstance>) {
    try {
      const repositories = this.getRepositories();
      return repositories.surveyInstances.update(id, data);
    } catch (error) {
      console.error('Error updating survey instance:', error);
      
      await ErrorLoggingService.logError({
        severity: 'high',
        errorMessage: 'Failed to update survey instance',
        stackTrace: error instanceof Error ? error.stack : String(error),
        componentName: 'SurveyOperationsService',
        functionName: 'updateSurveyInstance',
        userAction: 'Update existing survey instance',
        additionalContext: {
          instanceId: id,
          updateFields: Object.keys(data),
          status: (data as any).status || 'unknown',
          operation: 'updateSurveyInstance',
          repositoryAction: 'surveyInstances.update'
        },
        tags: ['database', 'survey-operations', 'service', 'instance', 'update']
      });
      
      throw error;
    }
  }

  async deleteSurveyInstance(id: string) {
    try {
      const repositories = this.getRepositories();
      return repositories.surveyInstances.delete(id);
    } catch (error) {
      console.error('Error deleting survey instance:', error);
      
      await ErrorLoggingService.logError({
        severity: 'critical',
        errorMessage: 'Failed to delete survey instance',
        stackTrace: error instanceof Error ? error.stack : String(error),
        componentName: 'SurveyOperationsService',
        functionName: 'deleteSurveyInstance',
        userAction: 'Delete survey instance',
        additionalContext: {
          instanceId: id,
          operation: 'deleteSurveyInstance',
          repositoryAction: 'surveyInstances.delete'
        },
        tags: ['database', 'survey-operations', 'service', 'instance', 'delete']
      });
      
      throw error;
    }
  }

  // Survey Responses
  async addSurveyResponse(response: Omit<SurveyResponse, "id">) {
    try {
      const repositories = this.getRepositories();
      return repositories.surveyResponses.create(response);
    } catch (error) {
      console.error('Error adding survey response:', error);
      
      await ErrorLoggingService.logError({
        severity: 'high',
        errorMessage: 'Failed to create survey response',
        stackTrace: error instanceof Error ? error.stack : String(error),
        componentName: 'SurveyOperationsService',
        functionName: 'addSurveyResponse',
        userAction: 'Create new survey response',
        additionalContext: {
          instanceId: (response as any).instance_id || (response as any).instanceId || 'unknown',
          sessionId: (response as any).session_id || (response as any).sessionId || 'unknown',
          responseDataLength: (response as any).response_data ? Object.keys((response as any).response_data).length : ((response as any).responseData ? Object.keys((response as any).responseData).length : 0),
          operation: 'addSurveyResponse',
          repositoryAction: 'surveyResponses.create'
        },
        tags: ['database', 'survey-operations', 'service', 'response', 'create']
      });
      
      throw error;
    }
  }

  async getSurveyResponses(instanceId?: string) {
    try {
      const repositories = this.getRepositories();
      if (instanceId) {
        return repositories.surveyResponses.findByInstanceId(instanceId);
      }
      return repositories.surveyResponses.findAll();
    } catch (error) {
      console.error('Error getting survey responses:', error);
      
      await ErrorLoggingService.logError({
        severity: 'medium',
        errorMessage: 'Failed to get survey responses',
        stackTrace: error instanceof Error ? error.stack : String(error),
        componentName: 'SurveyOperationsService',
        functionName: 'getSurveyResponses',
        userAction: instanceId ? 'Retrieve survey responses for specific instance' : 'Retrieve all survey responses',
        additionalContext: {
          instanceId: instanceId || 'all',
          operation: 'getSurveyResponses',
          repositoryAction: instanceId ? 'surveyResponses.findByInstanceId' : 'surveyResponses.findAll'
        },
        tags: ['database', 'survey-operations', 'service', 'response', 'query', instanceId ? 'instance-filter' : 'collection']
      });
      
      throw error;
    }
  }

  async getSurveyResponsesFromCollection(instanceId: string) {
    try {
      const repositories = this.getRepositories();
      return repositories.surveyResponses.findFromCollection(instanceId);
    } catch (error) {
      console.error('Error getting survey responses from collection:', error);
      
      await ErrorLoggingService.logError({
        severity: 'medium',
        errorMessage: 'Failed to get survey responses from collection',
        stackTrace: error instanceof Error ? error.stack : String(error),
        componentName: 'SurveyOperationsService',
        functionName: 'getSurveyResponsesFromCollection',
        userAction: 'Retrieve survey responses from collection',
        additionalContext: {
          instanceId,
          operation: 'getSurveyResponsesFromCollection',
          repositoryAction: 'surveyResponses.findFromCollection'
        },
        tags: ['database', 'survey-operations', 'service', 'response', 'query', 'collection']
      });
      
      throw error;
    }
  }

  // Survey Instance Status Management
  async updateSurveyInstanceStatuses() {
    try {
      const repositories = this.getRepositories();
      return repositories.surveyInstances.updateStatuses();
    } catch (error) {
      console.error('Error updating survey instance statuses:', error);
      
      await ErrorLoggingService.logError({
        severity: 'high',
        errorMessage: 'Failed to update survey instance statuses',
        stackTrace: error instanceof Error ? error.stack : String(error),
        componentName: 'SurveyOperationsService',
        functionName: 'updateSurveyInstanceStatuses',
        userAction: 'Update statuses for all survey instances',
        additionalContext: {
          operation: 'updateSurveyInstanceStatuses',
          repositoryAction: 'surveyInstances.updateStatuses'
        },
        tags: ['database', 'survey-operations', 'service', 'instance', 'status-update', 'batch']
      });
      
      throw error;
    }
  }

  async clearValidationLocks() {
    try {
      console.log('🔓 Clearing validation locks...');
      const result = await this.getRepositories().surveyInstances.clearValidationLocks();
      
      console.log('✅ Validation locks cleared:', result);
      return result;
    } catch (error) {
      console.error('❌ Failed to clear validation locks:', error);
      
      await ErrorLoggingService.logError({
        severity: 'medium',
        errorMessage: 'Failed to clear validation locks',
        stackTrace: error instanceof Error ? error.stack : String(error),
        componentName: 'SurveyOperationsService',
        functionName: 'clearValidationLocks',
        userAction: 'Clear validation locks for survey instances',
        additionalContext: {
          operation: 'clearValidationLocks',
          repositoryAction: 'surveyInstances.clearValidationLocks'
        },
        tags: ['database', 'survey-operations', 'service', 'validation', 'locks']
      });
      
      return { success: false, cleared_locks: 0, message: 'Failed to clear validation locks' };
    }
  }

  async getUpcomingStatusChanges(hoursAhead = 24) {
    try {
      const repositories = this.getRepositories();
      return repositories.surveyInstances.getUpcomingStatusChanges(hoursAhead);
    } catch (error) {
      console.error('Error getting upcoming status changes:', error);
      
      await ErrorLoggingService.logError({
        severity: 'low',
        errorMessage: 'Failed to get upcoming status changes',
        stackTrace: error instanceof Error ? error.stack : String(error),
        componentName: 'SurveyOperationsService',
        functionName: 'getUpcomingStatusChanges',
        userAction: 'Retrieve upcoming survey instance status changes',
        additionalContext: {
          hoursAhead,
          operation: 'getUpcomingStatusChanges',
          repositoryAction: 'surveyInstances.getUpcomingStatusChanges'
        },
        tags: ['database', 'survey-operations', 'service', 'instance', 'status-changes', 'upcoming']
      });
      
      throw error;
    }
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
      
      await ErrorLoggingService.logError({
        severity: 'medium',
        errorMessage: 'Failed to get survey instance status changes',
        stackTrace: error instanceof Error ? error.stack : String(error),
        componentName: 'SurveyOperationsService',
        functionName: 'getSurveyInstanceStatusChanges',
        userAction: 'Retrieve survey instance status change history',
        additionalContext: {
          instanceId: instanceId || 'all',
          operation: 'getSurveyInstanceStatusChanges',
          table: 'survey_instance_status_changes'
        },
        tags: ['database', 'survey-operations', 'service', 'status-changes', 'query']
      });
      
      throw error;
    }
  }

  // Survey Session Management
  async addSurveySession(sessionData: any) {
    try {
      // Map camelCase to snake_case for database
      const dbData = {
        survey_instance_id: sessionData.surveyInstanceId,
        session_token: sessionData.sessionToken,
        started_at: sessionData.startedAt,
        last_activity_at: sessionData.lastActivityAt,
        current_section: sessionData.currentSection || 0,
        total_sections: sessionData.totalSections || 1,
        status: sessionData.status || 'started',
        user_agent: sessionData.userAgent,
        ip_address: sessionData.ipAddress, // Add IP address mapping
        metadata: sessionData.metadata || {},
        created_at: new Date().toISOString(),
      };

      // Use admin privileges for survey sessions due to RLS policy complexity
      // TODO: Fix RLS policies to allow proper anonymous access in the future
      return await this.withAdminPrivileges(async (client) => {
        const { data, error } = await client
          .from("survey_sessions")
          .insert(dbData)
          .select()
          .single();

        if (error) throw error;
        return data;
      });
    } catch (error) {
      console.error("Error adding survey session:", error);
      
      await ErrorLoggingService.logError({
        severity: 'high',
        errorMessage: 'Failed to add survey session',
        stackTrace: error instanceof Error ? error.stack : String(error),
        componentName: 'SurveyOperationsService',
        functionName: 'addSurveySession',
        userAction: 'Create new survey session',
        additionalContext: {
          surveyInstanceId: sessionData?.surveyInstanceId,
          sessionToken: sessionData?.sessionToken ? 'present' : 'missing',
          status: sessionData?.status,
          operation: 'addSurveySession',
          table: 'survey_sessions',
          useAdminPrivileges: true
        },
        tags: ['database', 'survey-operations', 'service', 'session', 'create']
      });
      
      throw error;
    }
  }

  async updateSurveySession(sessionId: string, data: any) {
    try {
      // Map camelCase to snake_case for database
      const dbData: any = {
        updated_at: new Date().toISOString(),
      };
      
      if (data.lastActivityAt) dbData.last_activity_at = data.lastActivityAt;
      if (data.currentSection !== undefined) dbData.current_section = data.currentSection;
      if (data.status) dbData.status = data.status;
      if (data.metadata) dbData.metadata = data.metadata;
      if (data.ipAddress) dbData.ip_address = data.ipAddress;

      // Use admin privileges for survey sessions due to RLS policy complexity
      await this.withAdminPrivileges(async (client) => {
        const { error } = await client
          .from("survey_sessions")
          .update(dbData)
          .eq("id", sessionId);

        if (error) throw error;
      });
    } catch (error) {
      console.error("Error updating survey session:", error);
      
      await ErrorLoggingService.logError({
        severity: 'high',
        errorMessage: 'Failed to update survey session',
        stackTrace: error instanceof Error ? error.stack : String(error),
        componentName: 'SurveyOperationsService',
        functionName: 'updateSurveySession',
        userAction: 'Update existing survey session',
        additionalContext: {
          sessionId,
          updateFields: Object.keys(data || {}),
          status: data?.status,
          currentSection: data?.currentSection,
          operation: 'updateSurveySession',
          table: 'survey_sessions',
          useAdminPrivileges: true
        },
        tags: ['database', 'survey-operations', 'service', 'session', 'update']
      });
      
      throw error;
    }
  }

  async getSurveySessionByToken(sessionToken: string) {
    try {
      // Use admin privileges for survey sessions due to RLS policy complexity
      return await this.withAdminPrivileges(async (client) => {
        const { data, error } = await client
          .from("survey_sessions")
          .select("*")
          .eq("session_token", sessionToken) // Use snake_case column name
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            return null; // No session found
          }
          throw error;
        }
        
        return data;
      });
    } catch (error) {
      console.error("Error getting survey session by token:", error);
      
      await ErrorLoggingService.logError({
        severity: 'medium',
        errorMessage: 'Failed to get survey session by token',
        stackTrace: error instanceof Error ? error.stack : String(error),
        componentName: 'SurveyOperationsService',
        functionName: 'getSurveySessionByToken',
        userAction: 'Retrieve survey session using session token',
        additionalContext: {
          sessionToken: sessionToken ? 'present' : 'missing',
          operation: 'getSurveySessionByToken',
          table: 'survey_sessions',
          useAdminPrivileges: true
        },
        tags: ['database', 'survey-operations', 'service', 'session', 'query', 'token']
      });
      
      throw error;
    }
  }

  async getSurveySession(sessionId: string) {
    try {
      // Use admin privileges for reading individual session data
      return await this.withAdminPrivileges(async (client) => {
        const { data, error } = await client
          .from("survey_sessions")
          .select("*")
          .eq("id", sessionId)
          .single();

        if (error) throw error;
        return data;
      });
    } catch (error) {
      console.error("Error getting survey session:", error);
      
      await ErrorLoggingService.logError({
        severity: 'medium',
        errorMessage: 'Failed to get survey session by ID',
        stackTrace: error instanceof Error ? error.stack : String(error),
        componentName: 'SurveyOperationsService',
        functionName: 'getSurveySession',
        userAction: 'Retrieve individual survey session',
        additionalContext: {
          sessionId,
          operation: 'getSurveySession',
          table: 'survey_sessions',
          useAdminPrivileges: true
        },
        tags: ['database', 'survey-operations', 'service', 'session', 'query']
      });
      
      throw error;
    }
  }

  async getSurveySessions(instanceId?: string) {
    try {
      // Use admin privileges for reading session collections
      return await this.withAdminPrivileges(async (client) => {
        let query = client
          .from("survey_sessions")
          .select("*")
          .order("created_at", { ascending: false });

        if (instanceId) {
          query = query.eq("survey_instance_id", instanceId); // Use snake_case column name
        }

        const { data, error } = await query;

        if (error) throw error;
        return data || [];
      });
    } catch (error) {
      console.error("Error getting survey sessions:", error);
      
      await ErrorLoggingService.logError({
        severity: 'medium',
        errorMessage: 'Failed to get survey sessions',
        stackTrace: error instanceof Error ? error.stack : String(error),
        componentName: 'SurveyOperationsService',
        functionName: 'getSurveySessions',
        userAction: 'Retrieve collection of survey sessions',
        additionalContext: {
          instanceId: instanceId || 'all',
          operation: 'getSurveySessions',
          table: 'survey_sessions',
          useAdminPrivileges: true
        },
        tags: ['database', 'survey-operations', 'service', 'session', 'query', 'collection']
      });
      
      throw error;
    }
  }
}