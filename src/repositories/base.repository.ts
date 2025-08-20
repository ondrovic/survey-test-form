import { SupabaseClient } from '@supabase/supabase-js';

export abstract class BaseRepository {
  protected supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  protected validateId(id: string, operation: string): void {
    if (!id || id.trim() === '') {
      throw new Error(`Invalid ID for ${operation}: ID cannot be empty`);
    }
  }

  protected handleError(error: any, operation: string): never {
    console.error(`Error in ${operation}:`, error);
    throw error;
  }

  protected async handleQuery<T>(
    queryPromise: any,
    operation: string
  ): Promise<T> {
    try {
      const { data, error } = await queryPromise;
      if (error) throw error;
      return data as T;
    } catch (error) {
      this.handleError(error, operation);
    }
  }

  protected async handleQueryArray<T>(
    queryPromise: any,
    operation: string
  ): Promise<T[]> {
    try {
      const { data, error } = await queryPromise;
      if (error) throw error;
      return data || [];
    } catch (error) {
      this.handleError(error, operation);
    }
  }

  protected async handleMutation(
    mutationPromise: any,
    operation: string
  ): Promise<void> {
    try {
      const { error } = await mutationPromise;
      if (error) throw error;
    } catch (error) {
      this.handleError(error, operation);
    }
  }
}