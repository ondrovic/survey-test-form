import { SurveyResponse } from '../types/framework.types';
import { SurveyResponseRow } from '../types/database-rows.types';

export class SurveyResponseMapper {
  static toDomain(row: SurveyResponseRow): SurveyResponse {
    return {
      id: row.id,
      surveyInstanceId: row.survey_instance_id,
      sessionId: row.session_id,
      configVersion: row.config_version,
      responses: row.responses || {},
      
      // Timing tracking
      startedAt: row.started_at,
      completedAt: row.completed_at,
      submittedAt: row.submitted_at,
      completion_time_seconds: row.completion_time_seconds,
      
      // Status tracking
      completion_status: row.completion_status,
      completion_percentage: row.completion_percentage,
      
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
      session_id: domain.sessionId,
      config_version: domain.configVersion,
      responses: domain.responses,
      
      // Timing tracking
      started_at: domain.startedAt,
      completed_at: domain.completedAt,
      submitted_at: domain.submittedAt,
      completion_time_seconds: domain.completion_time_seconds,
      
      // Status tracking
      completion_status: domain.completion_status,
      completion_percentage: domain.completion_percentage,
      
      metadata: domain.metadata
    };
  }

  static toPartialDatabase(domain: Partial<SurveyResponse>): Partial<Omit<SurveyResponseRow, 'created_at'>> {
    const result: Partial<Omit<SurveyResponseRow, 'created_at'>> = {};
    
    if (domain.id !== undefined) result.id = domain.id;
    if (domain.surveyInstanceId !== undefined) result.survey_instance_id = domain.surveyInstanceId;
    if (domain.sessionId !== undefined) result.session_id = domain.sessionId;
    if (domain.configVersion !== undefined) result.config_version = domain.configVersion;
    if (domain.responses !== undefined) result.responses = domain.responses;
    
    // Timing tracking
    if (domain.startedAt !== undefined) result.started_at = domain.startedAt;
    if (domain.completedAt !== undefined) result.completed_at = domain.completedAt;
    if (domain.submittedAt !== undefined) result.submitted_at = domain.submittedAt;
    if (domain.completion_time_seconds !== undefined) result.completion_time_seconds = domain.completion_time_seconds;
    
    // Status tracking
    if (domain.completion_status !== undefined) result.completion_status = domain.completion_status;
    if (domain.completion_percentage !== undefined) result.completion_percentage = domain.completion_percentage;
    
    if (domain.metadata !== undefined) result.metadata = domain.metadata;
    
    return result;
  }
}