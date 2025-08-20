import { SupabaseClient } from '@supabase/supabase-js';
import { SurveyInstance } from '../types/framework.types';
import { SurveyInstanceRow } from '../types/database-rows.types';
import { SurveyInstanceMapper } from '../mappers/survey-instance.mapper';
import { BaseRepository } from './base.repository';
import { updateMetadata, createMetadata, mergeMetadata } from '../utils/metadata.utils';

export class SurveyInstanceRepository extends BaseRepository {
  constructor(supabase: SupabaseClient) {
    super(supabase);
  }

  async findAll(): Promise<SurveyInstance[]> {
    const rows = await this.handleQueryArray<SurveyInstanceRow>(
      this.supabase
        .from('survey_instances')
        .select('*')
        .order('created_at', { ascending: false }),
      'findAll survey instances'
    );

    return rows.map(SurveyInstanceMapper.toDomain);
  }

  async findById(id: string): Promise<SurveyInstance | null> {
    this.validateId(id, 'findById survey instance');

    try {
      const { data, error } = await this.supabase
        .from('survey_instances')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return data ? SurveyInstanceMapper.toDomain(data) : null;
    } catch (error) {
      this.handleError(error, 'findById survey instance');
    }
  }

  async findByConfigId(configId: string): Promise<SurveyInstance[]> {
    this.validateId(configId, 'findByConfigId survey instances');

    const rows = await this.handleQueryArray<SurveyInstanceRow>(
      this.supabase
        .from('survey_instances')
        .select('*')
        .eq('config_id', configId)
        .order('created_at', { ascending: false }),
      'findByConfigId survey instances'
    );

    return rows.map(SurveyInstanceMapper.toDomain);
  }

  async findBySlug(slug: string): Promise<SurveyInstance | null> {
    if (!slug || slug.trim() === '') {
      throw new Error('Invalid slug: cannot be empty');
    }

    try {
      const { data, error } = await this.supabase
        .from('survey_instances')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return data ? SurveyInstanceMapper.toDomain(data) : null;
    } catch (error) {
      this.handleError(error, 'findBySlug survey instance');
    }
  }

  async create(instance: Omit<SurveyInstance, 'id'>): Promise<SurveyInstance> {
    const instanceWithMetadata = {
      ...instance,
      metadata: await mergeMetadata(instance.metadata)
    };

    const dbData = SurveyInstanceMapper.toDatabase(instanceWithMetadata as SurveyInstance);
    
    const row = await this.handleQuery<SurveyInstanceRow>(
      this.supabase
        .from('survey_instances')
        .insert(dbData)
        .select()
        .single(),
      'create survey instance'
    );

    return SurveyInstanceMapper.toDomain(row);
  }

  async update(id: string, data: Partial<SurveyInstance>): Promise<void> {
    this.validateId(id, 'update survey instance');

    const updateData = SurveyInstanceMapper.toPartialDatabase(data);
    
    // Update metadata timestamp
    if (data.metadata) {
      updateData.metadata = updateMetadata(data.metadata as any);
    } else {
      updateData.metadata = updateMetadata(await createMetadata());
    }

    await this.handleMutation(
      this.supabase
        .from('survey_instances')
        .update(updateData)
        .eq('id', id),
      'update survey instance'
    );
  }

  async delete(id: string): Promise<void> {
    this.validateId(id, 'delete survey instance');

    await this.handleMutation(
      this.supabase
        .from('survey_instances')
        .delete()
        .eq('id', id),
      'delete survey instance'
    );
  }

  async findActive(): Promise<SurveyInstance[]> {
    const rows = await this.handleQueryArray<SurveyInstanceRow>(
      this.supabase
        .from('survey_instances')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false }),
      'findActive survey instances'
    );

    return rows.map(SurveyInstanceMapper.toDomain);
  }

  // Status management methods
  async updateStatuses(): Promise<{ success: boolean; activated: number; deactivated: number; message: string }> {
    try {
      const { data, error } = await this.supabase.rpc('update_survey_instance_statuses');

      if (error) throw error;

      return {
        success: data?.success || false,
        activated: data?.activated || 0,
        deactivated: data?.deactivated || 0,
        message: data?.message || 'Status update completed',
      };
    } catch (error) {
      this.handleError(error, 'updateStatuses survey instances');
    }
  }

  async clearValidationLocks(): Promise<{ success: boolean; cleared_locks: number; message: string }> {
    try {
      const { data, error } = await this.supabase.rpc('clear_validation_locks');

      if (error) throw error;

      return {
        success: data?.success || false,
        cleared_locks: data?.cleared_locks || 0,
        message: data?.message || 'Validation locks cleared',
      };
    } catch (error) {
      this.handleError(error, 'clearValidationLocks survey instances');
    }
  }

  async getUpcomingStatusChanges(hoursAhead = 24): Promise<{
    upcoming_activations: Array<{ id: string; title: string; slug?: string; active_date_range: any }>;
    upcoming_deactivations: Array<{ id: string; title: string; slug?: string; active_date_range: any }>;
    check_time: string;
    hours_ahead: number;
  }> {
    try {
      const { data, error } = await this.supabase.rpc(
        'get_upcoming_status_changes',
        { hours_ahead: hoursAhead }
      );

      if (error) throw error;

      return {
        upcoming_activations: data?.upcoming_activations || [],
        upcoming_deactivations: data?.upcoming_deactivations || [],
        check_time: data?.check_time || new Date().toISOString(),
        hours_ahead: data?.hours_ahead || hoursAhead,
      };
    } catch (error) {
      this.handleError(error, 'getUpcomingStatusChanges survey instances');
    }
  }
}