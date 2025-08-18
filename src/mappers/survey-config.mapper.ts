import { SurveyConfig } from '../types/framework.types';
import { SurveyConfigRow } from '../types/database-rows.types';

export class SurveyConfigMapper {
  static toDomain(row: SurveyConfigRow): SurveyConfig {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      sections: row.sections || [],
      version: row.version,
      paginatorConfig: row.paginator_config || {},
      footerConfig: row.footer_config || {},
      isActive: row.is_active,
      metadata: row.metadata || {
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        createdBy: 'system'
      }
    };
  }

  static toDatabase(domain: SurveyConfig): Omit<SurveyConfigRow, 'created_at' | 'updated_at'> {
    return {
      id: domain.id,
      title: domain.title,
      description: domain.description,
      sections: domain.sections,
      version: domain.version,
      paginator_config: domain.paginatorConfig,
      footer_config: domain.footerConfig,
      is_active: domain.isActive,
      metadata: domain.metadata
    };
  }

  static toPartialDatabase(domain: Partial<SurveyConfig>): Partial<Omit<SurveyConfigRow, 'created_at' | 'updated_at'>> {
    const result: Partial<Omit<SurveyConfigRow, 'created_at' | 'updated_at'>> = {};
    
    if (domain.id !== undefined) result.id = domain.id;
    if (domain.title !== undefined) result.title = domain.title;
    if (domain.description !== undefined) result.description = domain.description;
    if (domain.sections !== undefined) result.sections = domain.sections;
    if (domain.version !== undefined) result.version = domain.version;
    if (domain.paginatorConfig !== undefined) result.paginator_config = domain.paginatorConfig;
    if (domain.footerConfig !== undefined) result.footer_config = domain.footerConfig;
    if (domain.isActive !== undefined) result.is_active = domain.isActive;
    if (domain.metadata !== undefined) result.metadata = domain.metadata;
    
    return result;
  }
}