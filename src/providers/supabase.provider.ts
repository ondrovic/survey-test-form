import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  DatabaseConfig,
  DatabaseProvider_Interface,
  AuthHelpers,
  DatabaseHelpers,
} from '../types/database.types';
import {
  MultiSelectOptionSet,
  RadioOptionSet,
  RatingScale,
  SelectOptionSet,
  SurveyConfig,
  SurveyInstance,
  SurveyResponse,
} from '../types/framework.types';
import {
  createMetadata,
  mergeMetadata,
  updateMetadata,
} from '../utils/metadata.utils';

export class SupabaseProvider implements DatabaseProvider_Interface {
  private supabase: SupabaseClient | null = null;
  private initialized = false;
  private currentUser: any = null;

  async initialize(config: DatabaseConfig): Promise<void> {
    if (!config.supabase) {
      throw new Error('Supabase configuration is required');
    }

    this.supabase = createClient(config.supabase.url, config.supabase.anonKey);
    this.initialized = true;
    console.log('Supabase provider initialized');
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  get authHelpers(): AuthHelpers {
    return {
      async signInAnonymously() {
        try {
          // Supabase doesn't have anonymous auth like Firebase, 
          // so we'll create a simple guest user session
          this.currentUser = { id: 'anonymous', isAnonymous: true };
          return this.currentUser;
        } catch (error) {
          console.error('Error signing in anonymously:', error);
          throw error;
        }
      },

      getCurrentUser: () => {
        return this.currentUser;
      },

      onAuthStateChanged: (callback: (user: any) => void) => {
        // Simple implementation - just call with current user
        callback(this.currentUser);
        return () => {}; // Return unsubscribe function
      },
    };
  }

  get databaseHelpers(): DatabaseHelpers {
    return {
      // Legacy survey functions
      async getSurveys() {
        try {
          const { data, error } = await this.supabase!
            .from('surveys')
            .select('*')
            .order('submitted_at', { ascending: false });

          if (error) throw error;
          return data || [];
        } catch (error) {
          console.error('Error getting surveys:', error);
          throw error;
        }
      },

      async addSurvey(surveyData: any) {
        try {
          const { data, error } = await this.supabase!
            .from('surveys')
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
          console.error('Error adding survey:', error);
          throw error;
        }
      },

      async updateSurvey(id: string, data: any) {
        try {
          const updateData = { ...data };
          if (data.metadata) {
            updateData.metadata = updateMetadata(data.metadata);
          } else {
            updateData.metadata = updateMetadata(await createMetadata());
          }

          const { error } = await this.supabase!
            .from('surveys')
            .update(updateData)
            .eq('id', id);

          if (error) throw error;
        } catch (error) {
          console.error('Error updating survey:', error);
          throw error;
        }
      },

      async deleteSurvey(id: string) {
        try {
          const { error } = await this.supabase!
            .from('surveys')
            .delete()
            .eq('id', id);

          if (error) throw error;
        } catch (error) {
          console.error('Error deleting survey:', error);
          throw error;
        }
      },

      // Survey Configs
      async getSurveyConfigs() {
        try {
          const { data, error } = await this.supabase!
            .from('survey_configs')
            .select('*')
            .order('metadata->createdAt', { ascending: false });

          if (error) throw error;
          return data || [];
        } catch (error) {
          console.error('Error getting survey configs:', error);
          throw error;
        }
      },

      async getSurveyConfig(id: string) {
        try {
          const { data, error } = await this.supabase!
            .from('survey_configs')
            .select('*')
            .eq('id', id)
            .single();

          if (error) {
            if (error.code === 'PGRST116') return null; // Not found
            throw error;
          }
          return data;
        } catch (error) {
          console.error('Error getting survey config:', error);
          throw error;
        }
      },

      async addSurveyConfig(config: Omit<SurveyConfig, 'id'>) {
        try {
          const configId = this.createKebabCaseId(config.title);
          const configData = {
            ...config,
            id: configId,
            is_active: config.isActive ?? true,
            version: config.version || '1.0.0',
            metadata: await mergeMetadata(config.metadata),
          };

          const { data, error } = await this.supabase!
            .from('survey_configs')
            .insert(configData)
            .select()
            .single();

          if (error) throw error;
          return data;
        } catch (error) {
          console.error('Error adding survey config:', error);
          throw error;
        }
      },

      async updateSurveyConfig(id: string, data: Partial<SurveyConfig>) {
        try {
          const updateData = { ...data };
          if (data.metadata) {
            updateData.metadata = updateMetadata(data.metadata as any);
          } else {
            updateData.metadata = updateMetadata(await createMetadata());
          }

          const { error } = await this.supabase!
            .from('survey_configs')
            .update(updateData)
            .eq('id', id);

          if (error) throw error;
        } catch (error) {
          console.error('Error updating survey config:', error);
          throw error;
        }
      },

      async deleteSurveyConfig(id: string) {
        try {
          const { error } = await this.supabase!
            .from('survey_configs')
            .delete()
            .eq('id', id);

          if (error) throw error;
        } catch (error) {
          console.error('Error deleting survey config:', error);
          throw error;
        }
      },

      // Survey Instances
      async getSurveyInstances() {
        try {
          const { data, error } = await this.supabase!
            .from('survey_instances')
            .select('*');

          if (error) throw error;
          return data || [];
        } catch (error) {
          console.error('Error getting survey instances:', error);
          throw error;
        }
      },

      async getSurveyInstancesByConfig(configId: string) {
        try {
          const { data, error } = await this.supabase!
            .from('survey_instances')
            .select('*')
            .eq('config_id', configId);

          if (error) throw error;
          return data || [];
        } catch (error) {
          console.error('Error getting survey instances by config:', error);
          throw error;
        }
      },

      async addSurveyInstance(instance: Omit<SurveyInstance, 'id'>) {
        try {
          const instanceId = await this.createUniqueInstanceId(instance.title);
          const instanceData = {
            ...instance,
            id: instanceId,
            config_id: instance.configId,
            is_active: instance.isActive,
            active_date_range: instance.activeDateRange,
            metadata: await mergeMetadata(instance.metadata),
          };

          const { data, error } = await this.supabase!
            .from('survey_instances')
            .insert(instanceData)
            .select()
            .single();

          if (error) throw error;
          return this.transformInstanceFromDb(data);
        } catch (error) {
          console.error('Error adding survey instance:', error);
          throw error;
        }
      },

      async updateSurveyInstance(id: string, data: Partial<SurveyInstance>) {
        try {
          const updateData: any = { ...data };
          if (data.metadata) {
            updateData.metadata = updateMetadata(data.metadata as any);
          } else {
            updateData.metadata = updateMetadata(await createMetadata());
          }

          // Transform field names for database
          if (data.configId) updateData.config_id = data.configId;
          if (data.isActive !== undefined) updateData.is_active = data.isActive;
          if (data.activeDateRange) updateData.active_date_range = data.activeDateRange;

          const { error } = await this.supabase!
            .from('survey_instances')
            .update(updateData)
            .eq('id', id);

          if (error) throw error;
        } catch (error) {
          console.error('Error updating survey instance:', error);
          throw error;
        }
      },

      async deleteSurveyInstance(id: string) {
        try {
          const { error } = await this.supabase!
            .from('survey_instances')
            .delete()
            .eq('id', id);

          if (error) throw error;
        } catch (error) {
          console.error('Error deleting survey instance:', error);
          throw error;
        }
      },

      // Survey Responses
      async addSurveyResponse(response: Omit<SurveyResponse, 'id'>) {
        try {
          // Check if survey instance exists
          const { data: instance, error: instanceError } = await this.supabase!
            .from('survey_instances')
            .select('id')
            .eq('id', response.surveyInstanceId)
            .single();

          if (instanceError || !instance) {
            throw new Error(`Survey instance ${response.surveyInstanceId} not found`);
          }

          // Insert into instance-specific table
          const tableName = `survey_responses_${response.surveyInstanceId.replace(/-/g, '_')}`;
          const { data, error } = await this.supabase!
            .from(tableName)
            .insert({
              ...response,
              survey_instance_id: response.surveyInstanceId,
              config_version: response.configVersion,
              submitted_at: response.submittedAt || new Date().toISOString(),
              metadata: response.metadata,
            })
            .select()
            .single();

          if (error) throw error;
          return this.transformResponseFromDb(data);
        } catch (error) {
          console.error('Error adding survey response:', error);
          throw error;
        }
      },

      async getSurveyResponses(instanceId?: string) {
        try {
          let query = this.supabase!
            .from('survey_responses')
            .select('*')
            .order('submitted_at', { ascending: false });

          if (instanceId) {
            query = query.eq('survey_instance_id', instanceId);
          }

          const { data, error } = await query;
          if (error) throw error;
          return (data || []).map(this.transformResponseFromDb);
        } catch (error) {
          console.error('Error getting survey responses:', error);
          throw error;
        }
      },

      async getSurveyResponsesFromCollection(instanceId: string) {
        try {
          // Check if survey instance exists
          const { data: instance, error: instanceError } = await this.supabase!
            .from('survey_instances')
            .select('id')
            .eq('id', instanceId)
            .single();

          if (instanceError || !instance) {
            throw new Error(`Survey instance ${instanceId} not found`);
          }

          const tableName = `survey_responses_${instanceId.replace(/-/g, '_')}`;
          const { data, error } = await this.supabase!
            .from(tableName)
            .select('*')
            .order('submitted_at', { ascending: false });

          if (error) throw error;
          return (data || []).map(this.transformResponseFromDb);
        } catch (error) {
          console.error('Error getting survey responses from collection:', error);
          throw error;
        }
      },

      // Rating Scales
      async getRatingScales() {
        try {
          const { data, error } = await this.supabase!
            .from('rating_scales')
            .select('*')
            .order('metadata->createdAt', { ascending: false });

          if (error) throw error;
          return (data || []).map(this.transformRatingScaleFromDb);
        } catch (error) {
          console.error('Error getting rating scales:', error);
          throw error;
        }
      },

      async getRatingScale(id: string) {
        try {
          const { data, error } = await this.supabase!
            .from('rating_scales')
            .select('*')
            .eq('id', id)
            .single();

          if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
          }
          return this.transformRatingScaleFromDb(data);
        } catch (error) {
          console.error('Error getting rating scale:', error);
          throw error;
        }
      },

      async addRatingScale(scale: Omit<RatingScale, 'id'>) {
        try {
          const scaleId = this.createKebabCaseId(scale.name);
          const scaleData = {
            id: scaleId,
            name: scale.name,
            description: scale.description,
            options: scale.options,
            is_active: scale.isActive ?? true,
            metadata: await mergeMetadata(scale.metadata),
          };

          const { data, error } = await this.supabase!
            .from('rating_scales')
            .insert(scaleData)
            .select()
            .single();

          if (error) throw error;
          return this.transformRatingScaleFromDb(data);
        } catch (error) {
          console.error('Error adding rating scale:', error);
          throw error;
        }
      },

      async updateRatingScale(id: string, data: Partial<RatingScale>) {
        try {
          const updateData: any = { ...data };
          if (data.metadata) {
            updateData.metadata = updateMetadata(data.metadata as any);
          } else {
            updateData.metadata = updateMetadata(await createMetadata());
          }

          if (data.isActive !== undefined) updateData.is_active = data.isActive;

          const { error } = await this.supabase!
            .from('rating_scales')
            .update(updateData)
            .eq('id', id);

          if (error) throw error;
        } catch (error) {
          console.error('Error updating rating scale:', error);
          throw error;
        }
      },

      async deleteRatingScale(id: string) {
        try {
          const { error } = await this.supabase!
            .from('rating_scales')
            .delete()
            .eq('id', id);

          if (error) throw error;
        } catch (error) {
          console.error('Error deleting rating scale:', error);
          throw error;
        }
      },

      // Radio Option Sets - Similar pattern
      async getRadioOptionSets() {
        try {
          const { data, error } = await this.supabase!
            .from('radio_option_sets')
            .select('*')
            .order('metadata->createdAt', { ascending: false });

          if (error) throw error;
          return (data || []).map(this.transformOptionSetFromDb);
        } catch (error) {
          console.error('Error getting radio option sets:', error);
          throw error;
        }
      },

      async getRadioOptionSet(id: string) {
        try {
          const { data, error } = await this.supabase!
            .from('radio_option_sets')
            .select('*')
            .eq('id', id)
            .single();

          if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
          }
          return this.transformOptionSetFromDb(data);
        } catch (error) {
          console.error('Error getting radio option set:', error);
          throw error;
        }
      },

      async addRadioOptionSet(optionSet: Omit<RadioOptionSet, 'id'>) {
        try {
          const setId = this.createKebabCaseId(optionSet.name);
          const setData = {
            id: setId,
            name: optionSet.name,
            description: optionSet.description,
            options: optionSet.options,
            is_active: optionSet.isActive ?? true,
            metadata: await mergeMetadata(optionSet.metadata),
          };

          const { data, error } = await this.supabase!
            .from('radio_option_sets')
            .insert(setData)
            .select()
            .single();

          if (error) throw error;
          return this.transformOptionSetFromDb(data);
        } catch (error) {
          console.error('Error adding radio option set:', error);
          throw error;
        }
      },

      async updateRadioOptionSet(id: string, data: Partial<RadioOptionSet>) {
        try {
          const updateData: any = { ...data };
          if (data.metadata) {
            updateData.metadata = updateMetadata(data.metadata as any);
          } else {
            updateData.metadata = updateMetadata(await createMetadata());
          }

          if (data.isActive !== undefined) updateData.is_active = data.isActive;

          const { error } = await this.supabase!
            .from('radio_option_sets')
            .update(updateData)
            .eq('id', id);

          if (error) throw error;
        } catch (error) {
          console.error('Error updating radio option set:', error);
          throw error;
        }
      },

      async deleteRadioOptionSet(id: string) {
        try {
          const { error } = await this.supabase!
            .from('radio_option_sets')
            .delete()
            .eq('id', id);

          if (error) throw error;
        } catch (error) {
          console.error('Error deleting radio option set:', error);
          throw error;
        }
      },

      // Multi-Select Option Sets
      async getMultiSelectOptionSets() {
        try {
          const { data, error } = await this.supabase!
            .from('multi_select_option_sets')
            .select('*')
            .order('metadata->createdAt', { ascending: false });

          if (error) throw error;
          return (data || []).map(this.transformMultiSelectOptionSetFromDb);
        } catch (error) {
          console.error('Error getting multi-select option sets:', error);
          throw error;
        }
      },

      async getMultiSelectOptionSet(id: string) {
        try {
          const { data, error } = await this.supabase!
            .from('multi_select_option_sets')
            .select('*')
            .eq('id', id)
            .single();

          if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
          }
          return this.transformMultiSelectOptionSetFromDb(data);
        } catch (error) {
          console.error('Error getting multi-select option set:', error);
          throw error;
        }
      },

      async addMultiSelectOptionSet(optionSet: Omit<MultiSelectOptionSet, 'id'>) {
        try {
          const setId = this.createKebabCaseId(optionSet.name);
          const setData = {
            id: setId,
            name: optionSet.name,
            description: optionSet.description,
            options: optionSet.options,
            max_selections: optionSet.maxSelections,
            min_selections: optionSet.minSelections,
            is_active: optionSet.isActive ?? true,
            metadata: await mergeMetadata(optionSet.metadata),
          };

          const { data, error } = await this.supabase!
            .from('multi_select_option_sets')
            .insert(setData)
            .select()
            .single();

          if (error) throw error;
          return this.transformMultiSelectOptionSetFromDb(data);
        } catch (error) {
          console.error('Error adding multi-select option set:', error);
          throw error;
        }
      },

      async updateMultiSelectOptionSet(id: string, data: Partial<MultiSelectOptionSet>) {
        try {
          const updateData: any = { ...data };
          if (data.metadata) {
            updateData.metadata = updateMetadata(data.metadata as any);
          } else {
            updateData.metadata = updateMetadata(await createMetadata());
          }

          if (data.isActive !== undefined) updateData.is_active = data.isActive;
          if (data.maxSelections !== undefined) updateData.max_selections = data.maxSelections;
          if (data.minSelections !== undefined) updateData.min_selections = data.minSelections;

          const { error } = await this.supabase!
            .from('multi_select_option_sets')
            .update(updateData)
            .eq('id', id);

          if (error) throw error;
        } catch (error) {
          console.error('Error updating multi-select option set:', error);
          throw error;
        }
      },

      async deleteMultiSelectOptionSet(id: string) {
        try {
          const { error } = await this.supabase!
            .from('multi_select_option_sets')
            .delete()
            .eq('id', id);

          if (error) throw error;
        } catch (error) {
          console.error('Error deleting multi-select option set:', error);
          throw error;
        }
      },

      // Select Option Sets
      async getSelectOptionSets() {
        try {
          const { data, error } = await this.supabase!
            .from('select_option_sets')
            .select('*')
            .order('metadata->createdAt', { ascending: false });

          if (error) throw error;
          return (data || []).map(this.transformSelectOptionSetFromDb);
        } catch (error) {
          console.error('Error getting select option sets:', error);
          throw error;
        }
      },

      async getSelectOptionSet(id: string) {
        try {
          const { data, error } = await this.supabase!
            .from('select_option_sets')
            .select('*')
            .eq('id', id)
            .single();

          if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
          }
          return this.transformSelectOptionSetFromDb(data);
        } catch (error) {
          console.error('Error getting select option set:', error);
          throw error;
        }
      },

      async addSelectOptionSet(optionSet: Omit<SelectOptionSet, 'id'>) {
        try {
          const setId = this.createKebabCaseId(optionSet.name);
          const setData = {
            id: setId,
            name: optionSet.name,
            description: optionSet.description,
            options: optionSet.options,
            allow_multiple: optionSet.allowMultiple,
            is_active: optionSet.isActive ?? true,
            metadata: await mergeMetadata(optionSet.metadata),
          };

          const { data, error } = await this.supabase!
            .from('select_option_sets')
            .insert(setData)
            .select()
            .single();

          if (error) throw error;
          return this.transformSelectOptionSetFromDb(data);
        } catch (error) {
          console.error('Error adding select option set:', error);
          throw error;
        }
      },

      async updateSelectOptionSet(id: string, data: Partial<SelectOptionSet>) {
        try {
          const updateData: any = { ...data };
          if (data.metadata) {
            updateData.metadata = updateMetadata(data.metadata as any);
          } else {
            updateData.metadata = updateMetadata(await createMetadata());
          }

          if (data.isActive !== undefined) updateData.is_active = data.isActive;
          if (data.allowMultiple !== undefined) updateData.allow_multiple = data.allowMultiple;

          const { error } = await this.supabase!
            .from('select_option_sets')
            .update(updateData)
            .eq('id', id);

          if (error) throw error;
        } catch (error) {
          console.error('Error updating select option set:', error);
          throw error;
        }
      },

      async deleteSelectOptionSet(id: string) {
        try {
          const { error } = await this.supabase!
            .from('select_option_sets')
            .delete()
            .eq('id', id);

          if (error) throw error;
        } catch (error) {
          console.error('Error deleting select option set:', error);
          throw error;
        }
      },
    };
  }

  // Helper methods
  private createKebabCaseId(name: string): string {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private async createUniqueInstanceId(baseTitle: string): Promise<string> {
    const baseId = this.createKebabCaseId(baseTitle);

    const { data: existingInstances } = await this.supabase!
      .from('survey_instances')
      .select('id');

    const existingIds = (existingInstances || []).map((instance: any) => instance.id);
    const matchingIds = existingIds.filter((id: string) => id.startsWith(baseId));

    if (matchingIds.length === 0) {
      return `${baseId}-001`;
    }

    const counters = matchingIds
      .map((id: string) => {
        const match = id.match(new RegExp(`^${baseId}-(\\d{3})$`));
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((counter: number) => counter > 0);

    const nextCounter = counters.length > 0 ? Math.max(...counters) + 1 : 1;
    return `${baseId}-${nextCounter.toString().padStart(3, '0')}`;
  }

  // Transform database rows to application types
  private transformInstanceFromDb(dbRow: any): SurveyInstance {
    return {
      id: dbRow.id,
      configId: dbRow.config_id,
      title: dbRow.title,
      description: dbRow.description,
      isActive: dbRow.is_active,
      activeDateRange: dbRow.active_date_range,
      metadata: dbRow.metadata,
    };
  }

  private transformResponseFromDb(dbRow: any): SurveyResponse {
    return {
      id: dbRow.id,
      surveyInstanceId: dbRow.survey_instance_id,
      configVersion: dbRow.config_version,
      responses: dbRow.responses,
      submittedAt: dbRow.submitted_at,
      metadata: dbRow.metadata,
    };
  }

  private transformRatingScaleFromDb(dbRow: any): RatingScale {
    return {
      id: dbRow.id,
      name: dbRow.name,
      description: dbRow.description,
      options: dbRow.options,
      isActive: dbRow.is_active,
      metadata: dbRow.metadata,
    };
  }

  private transformOptionSetFromDb(dbRow: any): RadioOptionSet {
    return {
      id: dbRow.id,
      name: dbRow.name,
      description: dbRow.description,
      options: dbRow.options,
      isActive: dbRow.is_active,
      metadata: dbRow.metadata,
    };
  }

  private transformMultiSelectOptionSetFromDb(dbRow: any): MultiSelectOptionSet {
    return {
      id: dbRow.id,
      name: dbRow.name,
      description: dbRow.description,
      options: dbRow.options,
      maxSelections: dbRow.max_selections,
      minSelections: dbRow.min_selections,
      isActive: dbRow.is_active,
      metadata: dbRow.metadata,
    };
  }

  private transformSelectOptionSetFromDb(dbRow: any): SelectOptionSet {
    return {
      id: dbRow.id,
      name: dbRow.name,
      description: dbRow.description,
      options: dbRow.options,
      allowMultiple: dbRow.allow_multiple,
      isActive: dbRow.is_active,
      metadata: dbRow.metadata,
    };
  }
}