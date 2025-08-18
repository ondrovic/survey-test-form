import { RatingScale } from '../types/framework.types';
import { RatingScaleRow } from '../types/database-rows.types';

export class RatingScaleMapper {
  static toDomain(row: RatingScaleRow): RatingScale {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      options: row.options || [],
      isActive: row.is_active,
      metadata: row.metadata || {
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        createdBy: 'system'
      }
    };
  }

  static toDatabase(domain: RatingScale): Omit<RatingScaleRow, 'created_at' | 'updated_at'> {
    return {
      id: domain.id,
      name: domain.name,
      description: domain.description,
      options: domain.options,
      is_active: domain.isActive,
      metadata: domain.metadata
    };
  }

  static toPartialDatabase(domain: Partial<RatingScale>): Partial<Omit<RatingScaleRow, 'created_at' | 'updated_at'>> {
    const result: Partial<Omit<RatingScaleRow, 'created_at' | 'updated_at'>> = {};
    
    if (domain.id !== undefined) result.id = domain.id;
    if (domain.name !== undefined) result.name = domain.name;
    if (domain.description !== undefined) result.description = domain.description;
    if (domain.options !== undefined) result.options = domain.options;
    if (domain.isActive !== undefined) result.is_active = domain.isActive;
    if (domain.metadata !== undefined) result.metadata = domain.metadata;
    
    return result;
  }
}