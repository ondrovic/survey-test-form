import { SurveyInstance } from '../types/framework.types';
import { SurveyInstanceRow } from '../types/database-rows.types';

export class SurveyInstanceMapper {
  static toDomain(row: SurveyInstanceRow): SurveyInstance {
    return {
      id: row.id,
      configId: row.config_id,
      title: row.title,
      description: row.description,
      slug: row.slug,
      paginatorConfig: row.paginator_config || {},
      isActive: row.is_active,
      activeDateRange: row.active_date_range,
      metadata: row.metadata || {
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        createdBy: 'system'
      }
    };
  }

  static toDatabase(domain: SurveyInstance): Omit<SurveyInstanceRow, 'created_at' | 'updated_at'> {
    return {
      id: domain.id,
      config_id: domain.configId,
      title: domain.title,
      description: domain.description,
      slug: domain.slug,
      paginator_config: domain.paginatorConfig,
      is_active: domain.isActive,
      active_date_range: domain.activeDateRange,
      metadata: domain.metadata
    };
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
    if (domain.activeDateRange !== undefined) result.active_date_range = domain.activeDateRange;
    if (domain.metadata !== undefined) result.metadata = domain.metadata;
    
    return result;
  }
}