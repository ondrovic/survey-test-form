import { SupabaseClient } from '@supabase/supabase-js';
import { RatingScale } from '../types/framework.types';
import { RatingScaleRow } from '../types/database-rows.types';
import { RatingScaleMapper } from '../mappers/rating-scale.mapper';
import { BaseRepository } from './base.repository';
import { updateMetadata, createMetadata, mergeMetadata } from '../utils/metadata.utils';

export class RatingScaleRepository extends BaseRepository {
  constructor(supabase: SupabaseClient) {
    super(supabase);
  }

  async findAll(): Promise<RatingScale[]> {
    const rows = await this.handleQueryArray<RatingScaleRow>(
      this.supabase
        .from('rating_scales')
        .select('*')
        .order('metadata->createdAt', { ascending: false }),
      'findAll rating scales'
    );

    return rows.map(RatingScaleMapper.toDomain);
  }

  async findById(id: string): Promise<RatingScale | null> {
    this.validateId(id, 'findById rating scale');

    try {
      const { data, error } = await this.supabase
        .from('rating_scales')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return data ? RatingScaleMapper.toDomain(data) : null;
    } catch (error) {
      this.handleError(error, 'findById rating scale');
    }
  }

  async create(scale: RatingScale | Omit<RatingScale, 'id'>): Promise<RatingScale> {
    const scaleWithMetadata = {
      ...scale,
      metadata: await mergeMetadata(scale.metadata)
    };

    const dbData = RatingScaleMapper.toDatabase(scaleWithMetadata as RatingScale);
    
    const row = await this.handleQuery<RatingScaleRow>(
      this.supabase
        .from('rating_scales')
        .insert(dbData)
        .select()
        .single(),
      'create rating scale'
    );

    return RatingScaleMapper.toDomain(row);
  }

  async update(id: string, data: Partial<RatingScale>): Promise<void> {
    this.validateId(id, 'update rating scale');

    const updateData = RatingScaleMapper.toPartialDatabase(data);
    
    // Update metadata timestamp
    if (data.metadata) {
      updateData.metadata = updateMetadata(data.metadata as any);
    } else {
      updateData.metadata = updateMetadata(await createMetadata());
    }

    await this.handleMutation(
      this.supabase
        .from('rating_scales')
        .update(updateData)
        .eq('id', id),
      'update rating scale'
    );
  }

  async delete(id: string): Promise<void> {
    this.validateId(id, 'delete rating scale');

    await this.handleMutation(
      this.supabase
        .from('rating_scales')
        .delete()
        .eq('id', id),
      'delete rating scale'
    );
  }

  async findActive(): Promise<RatingScale[]> {
    const rows = await this.handleQueryArray<RatingScaleRow>(
      this.supabase
        .from('rating_scales')
        .select('*')
        .eq('is_active', true)
        .order('metadata->createdAt', { ascending: false }),
      'findActive rating scales'
    );

    return rows.map(RatingScaleMapper.toDomain);
  }
}