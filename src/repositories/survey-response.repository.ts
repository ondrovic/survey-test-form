import { SupabaseClient } from '@supabase/supabase-js';
import { SurveyResponse } from '../types/framework.types';
import { SurveyResponseRow } from '../types/database-rows.types';
import { SurveyResponseMapper } from '../mappers/survey-response.mapper';
import { BaseRepository } from './base.repository';

export class SurveyResponseRepository extends BaseRepository {
  constructor(supabase: SupabaseClient) {
    super(supabase);
  }

  async findAll(): Promise<SurveyResponse[]> {
    const rows = await this.handleQueryArray<SurveyResponseRow>(
      this.supabase
        .from('survey_responses')
        .select('*')
        .order('submitted_at', { ascending: false }),
      'findAll survey responses'
    );

    return rows.map(SurveyResponseMapper.toDomain);
  }

  async findById(id: string): Promise<SurveyResponse | null> {
    this.validateId(id, 'findById survey response');

    try {
      const { data, error } = await this.supabase
        .from('survey_responses')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return data ? SurveyResponseMapper.toDomain(data) : null;
    } catch (error) {
      this.handleError(error, 'findById survey response');
    }
  }

  async findByInstanceId(instanceId: string): Promise<SurveyResponse[]> {
    this.validateId(instanceId, 'findByInstanceId survey responses');

    const rows = await this.handleQueryArray<SurveyResponseRow>(
      this.supabase
        .from('survey_responses')
        .select('*')
        .eq('survey_instance_id', instanceId)
        .order('submitted_at', { ascending: false }),
      'findByInstanceId survey responses'
    );

    return rows.map(SurveyResponseMapper.toDomain);
  }

  async create(response: Omit<SurveyResponse, 'id'>): Promise<SurveyResponse> {
    // Check if survey instance exists
    const { data: instance, error: instanceError } = await this.supabase
      .from('survey_instances')
      .select('id')
      .eq('id', response.surveyInstanceId)
      .single();

    if (instanceError || !instance) {
      throw new Error(`Survey instance ${response.surveyInstanceId} not found`);
    }

    const dbData = SurveyResponseMapper.toDatabase(response as SurveyResponse);
    
    const row = await this.handleQuery<SurveyResponseRow>(
      this.supabase
        .from('survey_responses')
        .insert(dbData)
        .select()
        .single(),
      'create survey response'
    );

    return SurveyResponseMapper.toDomain(row);
  }

  async countByInstanceId(instanceId: string): Promise<number> {
    this.validateId(instanceId, 'countByInstanceId survey responses');

    try {
      const { count, error } = await this.supabase
        .from('survey_responses')
        .select('*', { count: 'exact', head: true })
        .eq('survey_instance_id', instanceId);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      this.handleError(error, 'countByInstanceId survey responses');
    }
  }

  async findByDateRange(
    startDate: string,
    endDate: string,
    instanceId?: string
  ): Promise<SurveyResponse[]> {
    let query = this.supabase
      .from('survey_responses')
      .select('*')
      .gte('submitted_at', startDate)
      .lte('submitted_at', endDate)
      .order('submitted_at', { ascending: false });

    if (instanceId) {
      this.validateId(instanceId, 'findByDateRange survey responses');
      query = query.eq('survey_instance_id', instanceId);
    }

    const rows = await this.handleQueryArray<SurveyResponseRow>(
      query,
      'findByDateRange survey responses'
    );

    return rows.map(SurveyResponseMapper.toDomain);
  }

  // For legacy compatibility - this method exists in the current provider
  async findFromCollection(instanceId: string): Promise<SurveyResponse[]> {
    return this.findByInstanceId(instanceId);
  }
}