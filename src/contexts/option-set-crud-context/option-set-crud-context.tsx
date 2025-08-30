import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { useToast } from '../toast-context';
import { ErrorLoggingService } from '@/services/error-logging.service';

// Generic base interface for all option sets
export interface BaseOptionSet {
  id: string;
  name: string;
  description?: string;
  options: any[];
  // Business logic field (moved from metadata)
  isActive: boolean;
  // Audit trail only
  metadata?: {
    createdAt: string;
    updatedAt: string;
    createdBy?: string;  // Optional, no longer hardcoded
  };
}

// CRUD operation types
export type CrudOperation = 'create' | 'update' | 'delete';

// Configuration for different option set types
export interface OptionSetConfig<T extends BaseOptionSet> {
  type: 'rating-scale' | 'radio' | 'multi-select' | 'select';
  displayName: string;
  databaseHelpers: {
    get: () => Promise<T[]>;
    create: (data: Omit<T, 'id'>) => Promise<T>;
    update: (id: string, data: Partial<T>) => Promise<void>;
    delete: (id: string) => Promise<void>;
  };
  validation: {
    validateName: (name: string) => string | null;
    validateOptions: (options: any[]) => string | null;
    validateCustomFields?: (data: any) => string | null;
  };
  defaultItem: () => Omit<T, 'id'>;
}

// Context interface
interface OptionSetCrudContextType {
  // Generic CRUD operations
  loadItems: <T extends BaseOptionSet>(config: OptionSetConfig<T>) => Promise<T[]>;
  createItem: <T extends BaseOptionSet>(config: OptionSetConfig<T>, data: Omit<T, 'id'>) => Promise<T | null>;
  updateItem: <T extends BaseOptionSet>(config: OptionSetConfig<T>, id: string, data: Partial<T>) => Promise<boolean>;
  deleteItem: <T extends BaseOptionSet>(config: OptionSetConfig<T>, id: string, name: string) => Promise<boolean>;
  
  // State management
  isLoading: boolean;
  error: string | null;
}

const OptionSetCrudContext = createContext<OptionSetCrudContextType | undefined>(undefined);

interface OptionSetCrudProviderProps {
  children: ReactNode;
}

export const OptionSetCrudProvider: React.FC<OptionSetCrudProviderProps> = ({ children }) => {
  const { showSuccess, showError } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadItems = useCallback(async <T extends BaseOptionSet>(config: OptionSetConfig<T>): Promise<T[]> => {
    setIsLoading(true);
    setError(null);
    try {
      return await config.databaseHelpers.get();
    } catch (err) {
      const errorMsg = `Failed to load ${config.displayName.toLowerCase()}s`;
      ErrorLoggingService.logError({
        severity: 'medium',
        errorMessage: errorMsg,
        stackTrace: err instanceof Error ? err.stack : String(err),
        componentName: 'OptionSetCrudProvider',
        functionName: 'loadItems',
        userAction: `load_${config.type}_items`,
        additionalContext: {
          optionSetType: config.type,
          displayName: config.displayName,
          error: err instanceof Error ? err.message : String(err)
        },
        tags: ['option-sets', 'crud', config.type]
      });
      setError(errorMsg);
      showError(errorMsg);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  const createItem = useCallback(async <T extends BaseOptionSet>(
    config: OptionSetConfig<T>, 
    data: Omit<T, 'id'>
  ): Promise<T | null> => {
    setError(null);
    
    // Validate name
    const nameError = config.validation.validateName(data.name);
    if (nameError) {
      showError(nameError);
      return null;
    }

    // Validate options
    const optionsError = config.validation.validateOptions(data.options);
    if (optionsError) {
      showError(optionsError);
      return null;
    }

    // Validate custom fields if validator exists
    if (config.validation.validateCustomFields) {
      const customError = config.validation.validateCustomFields(data);
      if (customError) {
        showError(customError);
        return null;
      }
    }

    // Only set loading to true when we're actually making the API call
    setIsLoading(true);
    try {
      const newItem = await config.databaseHelpers.create(data);
      showSuccess(`${config.displayName} "${data.name}" created!`);
      return newItem;
    } catch (err) {
      const errorMsg = `Failed to create ${config.displayName.toLowerCase()} "${data.name}"`;
      ErrorLoggingService.logError({
        severity: 'medium',
        errorMessage: errorMsg,
        stackTrace: err instanceof Error ? err.stack : String(err),
        componentName: 'OptionSetCrudProvider',
        functionName: 'createItem',
        userAction: `create_${config.type}_item`,
        additionalContext: {
          optionSetType: config.type,
          displayName: config.displayName,
          itemName: data.name,
          optionsCount: data.options?.length || 0,
          error: err instanceof Error ? err.message : String(err)
        },
        tags: ['option-sets', 'crud', 'create', config.type]
      });
      setError(errorMsg);
      showError(errorMsg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [showError, showSuccess]);

  const updateItem = useCallback(async <T extends BaseOptionSet>(
    config: OptionSetConfig<T>, 
    id: string, 
    data: Partial<T>
  ): Promise<boolean> => {
    setError(null);
    
    // Validate name if provided
    if (data.name !== undefined) {
      const nameError = config.validation.validateName(data.name);
      if (nameError) {
        showError(nameError);
        return false;
      }
    }

    // Validate options if provided
    if (data.options !== undefined) {
      const optionsError = config.validation.validateOptions(data.options);
      if (optionsError) {
        showError(optionsError);
        return false;
      }
    }

    // Validate custom fields if validator exists and data is provided
    if (config.validation.validateCustomFields && Object.keys(data).length > 0) {
      const customError = config.validation.validateCustomFields(data);
      if (customError) {
        showError(customError);
        return false;
      }
    }

    // Only set loading to true when we're actually making the API call
    setIsLoading(true);
    try {
      await config.databaseHelpers.update(id, data);
      showSuccess(`${config.displayName} "${data.name || 'item'}" updated!`);
      return true;
    } catch (err) {
      const errorMsg = `Failed to update ${config.displayName.toLowerCase()} "${data.name || 'item'}"`;
      ErrorLoggingService.logError({
        severity: 'medium',
        errorMessage: errorMsg,
        stackTrace: err instanceof Error ? err.stack : String(err),
        componentName: 'OptionSetCrudProvider',
        functionName: 'updateItem',
        userAction: `update_${config.type}_item`,
        additionalContext: {
          optionSetType: config.type,
          displayName: config.displayName,
          itemName: data.name || 'item',
          itemId: id,
          updateKeysCount: Object.keys(data).length,
          error: err instanceof Error ? err.message : String(err)
        },
        tags: ['option-sets', 'crud', 'update', config.type]
      });
      setError(errorMsg);
      showError(errorMsg);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [showError, showSuccess]);

  const deleteItem = useCallback(async <T extends BaseOptionSet>(
    config: OptionSetConfig<T>, 
    id: string, 
    name: string
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      await config.databaseHelpers.delete(id);
      showSuccess(`${config.displayName} "${name}" deleted!`);
      return true;
    } catch (err) {
      const errorMsg = `Failed to delete ${config.displayName.toLowerCase()} "${name}"`;
      ErrorLoggingService.logError({
        severity: 'medium',
        errorMessage: errorMsg,
        stackTrace: err instanceof Error ? err.stack : String(err),
        componentName: 'OptionSetCrudProvider',
        functionName: 'deleteItem',
        userAction: `delete_${config.type}_item`,
        additionalContext: {
          optionSetType: config.type,
          displayName: config.displayName,
          itemName: name,
          itemId: id,
          error: err instanceof Error ? err.message : String(err)
        },
        tags: ['option-sets', 'crud', 'delete', config.type]
      });
      setError(errorMsg);
      showError(errorMsg);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [showError, showSuccess]);

  const value: OptionSetCrudContextType = {
    loadItems,
    createItem,
    updateItem,
    deleteItem,
    isLoading,
    error,
  };

  return (
    <OptionSetCrudContext.Provider value={value}>
      {children}
    </OptionSetCrudContext.Provider>
  );
};

export const useOptionSetCrud = () => {
  const context = useContext(OptionSetCrudContext);
  if (context === undefined) {
    throw new Error('useOptionSetCrud must be used within an OptionSetCrudProvider');
  }
  return context;
};