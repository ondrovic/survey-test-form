import { RadioOptionSet, MultiSelectOptionSet, SelectOptionSet } from '../types/framework.types';
import { RadioOptionSetRow, MultiSelectOptionSetRow, SelectOptionSetRow } from '../types/database-rows.types';

export class RadioOptionSetMapper {
  static toDomain(row: RadioOptionSetRow): RadioOptionSet {
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

  static toDatabase(domain: RadioOptionSet): Omit<RadioOptionSetRow, 'created_at' | 'updated_at'> {
    return {
      id: domain.id,
      name: domain.name,
      description: domain.description,
      options: domain.options,
      is_active: domain.isActive,
      metadata: domain.metadata
    };
  }

  static toPartialDatabase(domain: Partial<RadioOptionSet>): Partial<Omit<RadioOptionSetRow, 'created_at' | 'updated_at'>> {
    const result: Partial<Omit<RadioOptionSetRow, 'created_at' | 'updated_at'>> = {};
    
    if (domain.id !== undefined) result.id = domain.id;
    if (domain.name !== undefined) result.name = domain.name;
    if (domain.description !== undefined) result.description = domain.description;
    if (domain.options !== undefined) result.options = domain.options;
    if (domain.isActive !== undefined) result.is_active = domain.isActive;
    if (domain.metadata !== undefined) result.metadata = domain.metadata;
    
    return result;
  }
}

export class MultiSelectOptionSetMapper {
  static toDomain(row: MultiSelectOptionSetRow): MultiSelectOptionSet {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      options: row.options || [],
      minSelections: row.min_selections,
      maxSelections: row.max_selections,
      isActive: row.is_active,
      metadata: row.metadata || {
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        createdBy: 'system'
      }
    };
  }

  static toDatabase(domain: MultiSelectOptionSet): Omit<MultiSelectOptionSetRow, 'created_at' | 'updated_at'> {
    return {
      id: domain.id,
      name: domain.name,
      description: domain.description,
      options: domain.options,
      min_selections: domain.minSelections,
      max_selections: domain.maxSelections,
      is_active: domain.isActive,
      metadata: domain.metadata
    };
  }

  static toPartialDatabase(domain: Partial<MultiSelectOptionSet>): Partial<Omit<MultiSelectOptionSetRow, 'created_at' | 'updated_at'>> {
    const result: Partial<Omit<MultiSelectOptionSetRow, 'created_at' | 'updated_at'>> = {};
    
    if (domain.id !== undefined) result.id = domain.id;
    if (domain.name !== undefined) result.name = domain.name;
    if (domain.description !== undefined) result.description = domain.description;
    if (domain.options !== undefined) result.options = domain.options;
    if (domain.minSelections !== undefined) result.min_selections = domain.minSelections;
    if (domain.maxSelections !== undefined) result.max_selections = domain.maxSelections;
    if (domain.isActive !== undefined) result.is_active = domain.isActive;
    if (domain.metadata !== undefined) result.metadata = domain.metadata;
    
    return result;
  }
}

export class SelectOptionSetMapper {
  static toDomain(row: SelectOptionSetRow): SelectOptionSet {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      options: row.options || [],
      allowMultiple: row.allow_multiple,
      isActive: row.is_active,
      metadata: row.metadata || {
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        createdBy: 'system'
      }
    };
  }

  static toDatabase(domain: SelectOptionSet): Omit<SelectOptionSetRow, 'created_at' | 'updated_at'> {
    return {
      id: domain.id,
      name: domain.name,
      description: domain.description,
      options: domain.options,
      allow_multiple: domain.allowMultiple ?? false,
      is_active: domain.isActive,
      metadata: domain.metadata
    };
  }

  static toPartialDatabase(domain: Partial<SelectOptionSet>): Partial<Omit<SelectOptionSetRow, 'created_at' | 'updated_at'>> {
    const result: Partial<Omit<SelectOptionSetRow, 'created_at' | 'updated_at'>> = {};
    
    if (domain.id !== undefined) result.id = domain.id;
    if (domain.name !== undefined) result.name = domain.name;
    if (domain.description !== undefined) result.description = domain.description;
    if (domain.options !== undefined) result.options = domain.options;
    if (domain.allowMultiple !== undefined) result.allow_multiple = domain.allowMultiple;
    if (domain.isActive !== undefined) result.is_active = domain.isActive;
    if (domain.metadata !== undefined) result.metadata = domain.metadata;
    
    return result;
  }
}