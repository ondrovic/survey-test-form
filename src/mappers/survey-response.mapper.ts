import { SurveyResponse } from '../types/framework.types';
import { SurveyResponseRow } from '../types/database-rows.types';

export class SurveyResponseMapper {
  static toDomain(row: SurveyResponseRow): SurveyResponse {
    return {
      id: row.id,
      surveyInstanceId: row.survey_instance_id,
      configVersion: row.config_version,
      responses: row.responses || {},
      submittedAt: row.submitted_at,
      metadata: row.metadata || {
        createdAt: row.created_at,
        updatedAt: row.created_at, // responses don't get updated
        createdBy: 'anonymous'
      }
    };
  }

  static toDatabase(domain: SurveyResponse): Omit<SurveyResponseRow, 'created_at'> {
    return {
      id: domain.id,
      survey_instance_id: domain.surveyInstanceId,
      config_version: domain.configVersion,
      responses: domain.responses,
      submitted_at: domain.submittedAt,
      metadata: domain.metadata
    };
  }

  static toPartialDatabase(domain: Partial<SurveyResponse>): Partial<Omit<SurveyResponseRow, 'created_at'>> {
    const result: Partial<Omit<SurveyResponseRow, 'created_at'>> = {};
    
    if (domain.id !== undefined) result.id = domain.id;
    if (domain.surveyInstanceId !== undefined) result.survey_instance_id = domain.surveyInstanceId;
    if (domain.configVersion !== undefined) result.config_version = domain.configVersion;
    if (domain.responses !== undefined) result.responses = domain.responses;
    if (domain.submittedAt !== undefined) result.submitted_at = domain.submittedAt;
    if (domain.metadata !== undefined) result.metadata = domain.metadata;
    
    return result;
  }
}