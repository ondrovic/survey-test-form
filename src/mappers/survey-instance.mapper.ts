import { SurveyInstance } from '../types/framework.types';
import { SurveyInstanceRow } from '../types/database-rows.types';

export class SurveyInstanceMapper {
  static toDomain(row: SurveyInstanceRow): SurveyInstance {
    return {
      id: row.id,
      configId: row.config_id,
      title: row.title,
      slug: row.slug,
      description: row.description,
      isActive: row.is_active,
      activeDateRange: row.active_date_range,
      config_valid: row.config_valid ?? true, // Default to true for backwards compatibility
      validation_in_progress: row.validation_in_progress ?? false, // Default to false for backwards compatibility
      metadata: row.metadata,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  static toDatabase(domain: SurveyInstance): SurveyInstanceRow {
    const result: SurveyInstanceRow = {
      id: domain.id,
      config_id: domain.configId,
      title: domain.title,
      slug: domain.slug,
      description: domain.description,
      is_active: domain.isActive,
      active_date_range: domain.activeDateRange,
      metadata: domain.metadata,
      created_at: domain.createdAt,
      updated_at: domain.updatedAt,
    };

    if (domain.config_valid !== undefined) result.config_valid = domain.config_valid;
    if (domain.validation_in_progress !== undefined) result.validation_in_progress = domain.validation_in_progress;

    return result;
  }

  static toPartialDatabase(domain: Partial<SurveyInstance>): Partial<Omit<SurveyInstanceRow, 'created_at' | 'updated_at'>> {
    const result: Partial<Omit<SurveyInstanceRow, 'created_at' | 'updated_at'>> = {};
    
    if (domain.id !== undefined) result.id = domain.id;
    if (domain.configId !== undefined) result.config_id = domain.configId;
    if (domain.title !== undefined) result.title = domain.title;
    if (domain.description !== undefined) result.description = domain.description;
    if (domain.slug !== undefined) result.slug = domain.slug;
    if (domain.paginatorConfig !== undefined) result.paginator_config = domain.paginatorConfig;
    if (domain.isActive !== undefined) result.is_active = domain.isActive;
    if (domain.config_valid !== undefined) result.config_valid = domain.config_valid;
    if (domain.activeDateRange !== undefined) result.active_date_range = domain.activeDateRange;
    if (domain.metadata !== undefined) result.metadata = domain.metadata;
    
    return result;
  }
}