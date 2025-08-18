import { SupabaseClient } from '@supabase/supabase-js';
import { SurveyConfig } from '../types/framework.types';
import { SurveyConfigRow } from '../types/database-rows.types';
import { SurveyConfigMapper } from '../mappers/survey-config.mapper';
import { BaseRepository } from './base.repository';
import { updateMetadata, createMetadata, mergeMetadata } from '../utils/metadata.utils';

export class SurveyConfigRepository extends BaseRepository {
  constructor(supabase: SupabaseClient) {
    super(supabase);
  }

  async findAll(): Promise<SurveyConfig[]> {
    const rows = await this.handleQueryArray<SurveyConfigRow>(
      this.supabase
        .from('survey_configs')
        .select('*')
        .order('metadata->createdAt', { ascending: false }),
      'findAll survey configs'
    );

    return rows.map(SurveyConfigMapper.toDomain);
  }

  async findById(id: string): Promise<SurveyConfig | null> {
    this.validateId(id, 'findById survey config');

    try {
      const { data, error } = await this.supabase
        .from('survey_configs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return data ? SurveyConfigMapper.toDomain(data) : null;
    } catch (error) {
      this.handleError(error, 'findById survey config');
    }
  }

  async create(config: Omit<SurveyConfig, 'id'>): Promise<SurveyConfig> {
    const configWithMetadata = {
      ...config,
      metadata: await mergeMetadata(config.metadata)
    };

    const dbData = SurveyConfigMapper.toDatabase(configWithMetadata as SurveyConfig);
    
    const row = await this.handleQuery<SurveyConfigRow>(
      this.supabase
        .from('survey_configs')
        .insert(dbData)
        .select()
        .single(),
      'create survey config'
    );

    return SurveyConfigMapper.toDomain(row);
  }

  async update(id: string, data: Partial<SurveyConfig>): Promise<void> {
    this.validateId(id, 'update survey config');

    const updateData = SurveyConfigMapper.toPartialDatabase(data);
    
    // Update metadata timestamp
    if (data.metadata) {
      updateData.metadata = updateMetadata(data.metadata as any);
    } else {
      updateData.metadata = updateMetadata(await createMetadata());
    }

    await this.handleMutation(
      this.supabase
        .from('survey_configs')
        .update(updateData)
        .eq('id', id),
      'update survey config'
    );
  }

  async delete(id: string): Promise<void> {
    this.validateId(id, 'delete survey config');

    await this.handleMutation(
      this.supabase
        .from('survey_configs')
        .delete()
        .eq('id', id),
      'delete survey config'
    );
  }

  async findActive(): Promise<SurveyConfig[]> {
    const rows = await this.handleQueryArray<SurveyConfigRow>(
      this.supabase
        .from('survey_configs')
        .select('*')
        .eq('is_active', true)
        .order('metadata->createdAt', { ascending: false }),
      'findActive survey configs'
    );

    return rows.map(SurveyConfigMapper.toDomain);
  }
}