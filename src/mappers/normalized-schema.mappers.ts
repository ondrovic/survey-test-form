// Mappers for the normalized database schema

import {
  SurveySection,
  SurveyField,
  SurveyFieldResponse,
  SurveyTemplate,
  SurveyResponseSummary,
  EntityAuditLog,
  SurveySectionRow,
  SurveyFieldRow,
  SurveyFieldResponseRow,
  SurveyTemplateRow,
  SurveyResponseSummaryRow,
  EntityAuditLogRow
} from '../types/normalized-schema.types';

export class SurveySectionMapper {
  static toDomain(row: SurveySectionRow): SurveySection {
    return {
      id: row.id,
      surveyConfigId: row.survey_config_id,
      title: row.title,
      description: row.description,
      sectionType: row.section_type,
      orderIndex: row.order_index,
      isRequired: row.is_required,
      displayLogic: row.display_logic,
      metadata: row.metadata || {
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        createdBy: 'system'
      }
    };
  }

  static toDatabase(domain: SurveySection): Omit<SurveySectionRow, 'created_at' | 'updated_at'> {
    return {
      id: domain.id,
      survey_config_id: domain.surveyConfigId,
      title: domain.title,
      description: domain.description,
      section_type: domain.sectionType,
      order_index: domain.orderIndex,
      is_required: domain.isRequired,
      display_logic: domain.displayLogic,
      metadata: domain.metadata
    };
  }

  static toPartialDatabase(domain: Partial<SurveySection>): Partial<Omit<SurveySectionRow, 'created_at' | 'updated_at'>> {
    const result: Partial<Omit<SurveySectionRow, 'created_at' | 'updated_at'>> = {};
    
    if (domain.id !== undefined) result.id = domain.id;
    if (domain.surveyConfigId !== undefined) result.survey_config_id = domain.surveyConfigId;
    if (domain.title !== undefined) result.title = domain.title;
    if (domain.description !== undefined) result.description = domain.description;
    if (domain.sectionType !== undefined) result.section_type = domain.sectionType;
    if (domain.orderIndex !== undefined) result.order_index = domain.orderIndex;
    if (domain.isRequired !== undefined) result.is_required = domain.isRequired;
    if (domain.displayLogic !== undefined) result.display_logic = domain.displayLogic;
    if (domain.metadata !== undefined) result.metadata = domain.metadata;
    
    return result;
  }
}

export class SurveyFieldMapper {
  static toDomain(row: SurveyFieldRow): SurveyField {
    return {
      id: row.id,
      sectionId: row.section_id,
      fieldKey: row.field_key,
      label: row.label,
      fieldType: row.field_type,
      description: row.description,
      placeholder: row.placeholder,
      orderIndex: row.order_index,
      isRequired: row.is_required,
      minLength: row.min_length,
      maxLength: row.max_length,
      minValue: row.min_value,
      maxValue: row.max_value,
      pattern: row.pattern,
      customValidation: row.custom_validation,
      defaultValue: row.default_value,
      fieldConfig: row.field_config,
      displayLogic: row.display_logic,
      ratingScaleId: row.rating_scale_id,
      radioOptionSetId: row.radio_option_set_id,
      multiSelectOptionSetId: row.multi_select_option_set_id,
      selectOptionSetId: row.select_option_set_id,
      metadata: row.metadata || {
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        createdBy: 'system'
      }
    };
  }

  static toDatabase(domain: SurveyField): Omit<SurveyFieldRow, 'created_at' | 'updated_at'> {
    return {
      id: domain.id,
      section_id: domain.sectionId,
      field_key: domain.fieldKey,
      label: domain.label,
      field_type: domain.fieldType,
      description: domain.description,
      placeholder: domain.placeholder,
      order_index: domain.orderIndex,
      is_required: domain.isRequired,
      min_length: domain.minLength,
      max_length: domain.maxLength,
      min_value: domain.minValue,
      max_value: domain.maxValue,
      pattern: domain.pattern,
      custom_validation: domain.customValidation,
      default_value: domain.defaultValue,
      field_config: domain.fieldConfig,
      display_logic: domain.displayLogic,
      rating_scale_id: domain.ratingScaleId,
      radio_option_set_id: domain.radioOptionSetId,
      multi_select_option_set_id: domain.multiSelectOptionSetId,
      select_option_set_id: domain.selectOptionSetId,
      metadata: domain.metadata
    };
  }

  static toPartialDatabase(domain: Partial<SurveyField>): Partial<Omit<SurveyFieldRow, 'created_at' | 'updated_at'>> {
    const result: Partial<Omit<SurveyFieldRow, 'created_at' | 'updated_at'>> = {};
    
    if (domain.id !== undefined) result.id = domain.id;
    if (domain.sectionId !== undefined) result.section_id = domain.sectionId;
    if (domain.fieldKey !== undefined) result.field_key = domain.fieldKey;
    if (domain.label !== undefined) result.label = domain.label;
    if (domain.fieldType !== undefined) result.field_type = domain.fieldType;
    if (domain.description !== undefined) result.description = domain.description;
    if (domain.placeholder !== undefined) result.placeholder = domain.placeholder;
    if (domain.orderIndex !== undefined) result.order_index = domain.orderIndex;
    if (domain.isRequired !== undefined) result.is_required = domain.isRequired;
    if (domain.minLength !== undefined) result.min_length = domain.minLength;
    if (domain.maxLength !== undefined) result.max_length = domain.maxLength;
    if (domain.minValue !== undefined) result.min_value = domain.minValue;
    if (domain.maxValue !== undefined) result.max_value = domain.maxValue;
    if (domain.pattern !== undefined) result.pattern = domain.pattern;
    if (domain.customValidation !== undefined) result.custom_validation = domain.customValidation;
    if (domain.defaultValue !== undefined) result.default_value = domain.defaultValue;
    if (domain.fieldConfig !== undefined) result.field_config = domain.fieldConfig;
    if (domain.displayLogic !== undefined) result.display_logic = domain.displayLogic;
    if (domain.ratingScaleId !== undefined) result.rating_scale_id = domain.ratingScaleId;
    if (domain.radioOptionSetId !== undefined) result.radio_option_set_id = domain.radioOptionSetId;
    if (domain.multiSelectOptionSetId !== undefined) result.multi_select_option_set_id = domain.multiSelectOptionSetId;
    if (domain.selectOptionSetId !== undefined) result.select_option_set_id = domain.selectOptionSetId;
    if (domain.metadata !== undefined) result.metadata = domain.metadata;
    
    return result;
  }
}

export class SurveyFieldResponseMapper {
  static toDomain(row: SurveyFieldResponseRow): SurveyFieldResponse {
    return {
      id: row.id,
      surveyResponseId: row.survey_response_id,
      fieldId: row.field_id,
      fieldKey: row.field_key,
      fieldType: row.field_type,
      textValue: row.text_value,
      numericValue: row.numeric_value,
      booleanValue: row.boolean_value,
      dateValue: row.date_value,
      arrayValue: row.array_value,
      responseMetadata: row.response_metadata,
      createdAt: row.created_at
    };
  }

  static toDatabase(domain: SurveyFieldResponse): Omit<SurveyFieldResponseRow, 'created_at'> {
    return {
      id: domain.id,
      survey_response_id: domain.surveyResponseId,
      field_id: domain.fieldId,
      field_key: domain.fieldKey,
      field_type: domain.fieldType,
      text_value: domain.textValue,
      numeric_value: domain.numericValue,
      boolean_value: domain.booleanValue,
      date_value: domain.dateValue,
      array_value: domain.arrayValue,
      response_metadata: domain.responseMetadata
    };
  }

  // Helper method to create a field response with the appropriate value type
  static createTypedResponse(
    surveyResponseId: string,
    fieldId: string,
    fieldKey: string,
    fieldType: string,
    value: any,
    responseMetadata?: Record<string, any>
  ): Omit<SurveyFieldResponse, 'id' | 'createdAt'> {
    const base = {
      surveyResponseId,
      fieldId,
      fieldKey,
      fieldType,
      responseMetadata,
      textValue: undefined,
      numericValue: undefined,
      booleanValue: undefined,
      dateValue: undefined,
      arrayValue: undefined
    };

    // Set the appropriate value based on type
    switch (fieldType) {
      case 'text':
      case 'email':
      case 'textarea':
      case 'select':
      case 'radio':
        base.textValue = String(value);
        break;
      case 'number':
      case 'rating':
        base.numericValue = Number(value);
        break;
      case 'checkbox':
        base.booleanValue = Boolean(value);
        break;
      case 'multiselect':
      case 'multiselectdropdown':
        base.arrayValue = Array.isArray(value) ? value : [value];
        break;
      default:
        // Default to text value
        base.textValue = String(value);
    }

    return base;
  }
}

export class SurveyTemplateMapper {
  static toDomain(row: SurveyTemplateRow): SurveyTemplate {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      category: row.category,
      isPublic: row.is_public,
      templateConfig: row.template_config,
      tags: row.tags || [],
      usageCount: row.usage_count,
      createdBy: row.created_by,
      metadata: row.metadata || {
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        createdBy: row.created_by
      }
    };
  }

  static toDatabase(domain: SurveyTemplate): Omit<SurveyTemplateRow, 'created_at' | 'updated_at'> {
    return {
      id: domain.id,
      name: domain.name,
      description: domain.description,
      category: domain.category,
      is_public: domain.isPublic,
      template_config: domain.templateConfig,
      tags: domain.tags,
      usage_count: domain.usageCount,
      created_by: domain.createdBy,
      metadata: domain.metadata
    };
  }

  static toPartialDatabase(domain: Partial<SurveyTemplate>): Partial<Omit<SurveyTemplateRow, 'created_at' | 'updated_at'>> {
    const result: Partial<Omit<SurveyTemplateRow, 'created_at' | 'updated_at'>> = {};
    
    if (domain.id !== undefined) result.id = domain.id;
    if (domain.name !== undefined) result.name = domain.name;
    if (domain.description !== undefined) result.description = domain.description;
    if (domain.category !== undefined) result.category = domain.category;
    if (domain.isPublic !== undefined) result.is_public = domain.isPublic;
    if (domain.templateConfig !== undefined) result.template_config = domain.templateConfig;
    if (domain.tags !== undefined) result.tags = domain.tags;
    if (domain.usageCount !== undefined) result.usage_count = domain.usageCount;
    if (domain.createdBy !== undefined) result.created_by = domain.createdBy;
    if (domain.metadata !== undefined) result.metadata = domain.metadata;
    
    return result;
  }
}

export class SurveyResponseSummaryMapper {
  static toDomain(row: SurveyResponseSummaryRow): SurveyResponseSummary {
    return {
      id: row.id,
      surveyInstanceId: row.survey_instance_id,
      dateBucket: row.date_bucket,
      responseCount: row.response_count,
      completionRate: row.completion_rate,
      averageCompletionTime: row.average_completion_time,
      fieldStatistics: row.field_statistics,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  static toDatabase(domain: SurveyResponseSummary): Omit<SurveyResponseSummaryRow, 'created_at' | 'updated_at'> {
    return {
      id: domain.id,
      survey_instance_id: domain.surveyInstanceId,
      date_bucket: domain.dateBucket,
      response_count: domain.responseCount,
      completion_rate: domain.completionRate,
      average_completion_time: domain.averageCompletionTime,
      field_statistics: domain.fieldStatistics
    };
  }
}

export class EntityAuditLogMapper {
  static toDomain(row: EntityAuditLogRow): EntityAuditLog {
    return {
      id: row.id,
      entityType: row.entity_type,
      entityId: row.entity_id,
      action: row.action,
      oldValues: row.old_values,
      newValues: row.new_values,
      changedFields: row.changed_fields,
      userId: row.user_id,
      userContext: row.user_context,
      timestamp: row.timestamp
    };
  }

  static toDatabase(domain: EntityAuditLog): Omit<EntityAuditLogRow, 'timestamp'> {
    return {
      id: domain.id,
      entity_type: domain.entityType,
      entity_id: domain.entityId,
      action: domain.action,
      old_values: domain.oldValues,
      new_values: domain.newValues,
      changed_fields: domain.changedFields,
      user_id: domain.userId,
      user_context: domain.userContext
    };
  }
}