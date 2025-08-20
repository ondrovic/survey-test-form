import { SupabaseClient } from '@supabase/supabase-js';

export interface MigrationResult {
  success: boolean;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

export interface MigrationStatus {
  migrationName: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
  migrationData?: Record<string, any>;
}

export class MigrationService {
  private migrationsEnabled: boolean;

  constructor(private supabase: SupabaseClient) {
    // Check if migrations are explicitly enabled
    const enabledFlag = import.meta.env.VITE_ENABLE_MIGRATIONS;
    this.migrationsEnabled = enabledFlag === 'true';
    
    if (!this.migrationsEnabled) {
      console.log('🚫 Migration service: Advanced migrations disabled via VITE_ENABLE_MIGRATIONS');
    } else {
      console.log('✅ Migration service: Advanced migrations enabled');
    }
  }

  // Check migration status
  async getMigrationStatus(migrationName: string): Promise<MigrationStatus | null> {
    // Double-check the environment flag to ensure it's properly disabled
    const enabledFlag = import.meta.env.VITE_ENABLE_MIGRATIONS;
    if (!this.migrationsEnabled || enabledFlag !== 'true') {
      console.log(`🚫 Migration check skipped for ${migrationName} (migrations disabled)`);
      return null; // Skip migration checks when disabled
    }
    
    try {
      const { data, error } = await this.supabase
        .from('migration_status')
        .select('*')
        .eq('migration_name', migrationName)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        if (error.code === 'PGRST301' || error.message?.includes('relation "migration_status" does not exist')) {
          console.warn('Migration status table does not exist, assuming migrations not started');
          return null;
        }
        if (error.code === '406' || error.message?.includes('Not Acceptable')) {
          console.warn('Migration status table not accessible, assuming migrations not required');
          return null;
        }
        throw error;
      }

      return {
        migrationName: data.migration_name,
        status: data.status,
        startedAt: data.started_at,
        completedAt: data.completed_at,
        errorMessage: data.error_message,
        migrationData: data.migration_data
      };
    } catch (error) {
      console.warn('Unable to check migration status, assuming migrations not required:', error);
      return null;
    }
  }

  // Update migration status
  async updateMigrationStatus(
    migrationName: string, 
    status: MigrationStatus['status'],
    errorMessage?: string,
    migrationData?: Record<string, any>
  ): Promise<void> {
    try {
      const updateData: any = {
        status,
        error_message: errorMessage,
        migration_data: migrationData
      };

      if (status === 'running') {
        updateData.started_at = new Date().toISOString();
      } else if (status === 'completed' || status === 'failed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await this.supabase
        .from('migration_status')
        .upsert({
          migration_name: migrationName,
          ...updateData
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating migration status:', error);
      throw error;
    }
  }

  // Execute migration with status tracking
  private async executeMigrationWithTracking<T>(
    migrationName: string,
    migrationFunction: () => Promise<T>
  ): Promise<T> {
    try {
      await this.updateMigrationStatus(migrationName, 'running');
      const result = await migrationFunction();
      await this.updateMigrationStatus(migrationName, 'completed', undefined, { result });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await this.updateMigrationStatus(migrationName, 'failed', errorMessage);
      throw error;
    }
  }

  // Run schema migration
  async runSchemaMigration(): Promise<MigrationResult> {
    return this.executeMigrationWithTracking('schema_migration', async () => {
      // The schema migration should be run manually via SQL scripts
      // This function just checks if the new tables exist
      const { error } = await this.supabase
        .from('survey_sections')
        .select('id')
        .limit(1);

      if (error && error.message.includes('does not exist')) {
        throw new Error('Schema migration not yet applied. Please run migration-v2-normalized-schema.sql first.');
      }

      return {
        success: true,
        message: 'Schema migration verified - normalized tables exist',
        timestamp: new Date().toISOString()
      };
    });
  }

  // Migrate survey sections from JSONB to normalized tables
  async migrateSurveySections(): Promise<MigrationResult> {
    return this.executeMigrationWithTracking('sections_to_normalized', async () => {
      const { data, error } = await this.supabase.rpc('migrate_survey_sections_to_normalized');

      if (error) throw error;

      return {
        success: data.success,
        message: `Migrated ${data.migrated_configs} configs, ${data.migrated_sections} sections, ${data.migrated_fields} fields`,
        details: data,
        timestamp: new Date().toISOString()
      };
    });
  }

  // Migrate survey responses from JSONB to normalized field responses
  async migrateSurveyResponses(): Promise<MigrationResult> {
    return this.executeMigrationWithTracking('responses_to_normalized', async () => {
      const { data, error } = await this.supabase.rpc('migrate_survey_responses_to_normalized');

      if (error) throw error;

      return {
        success: data.success,
        message: `Migrated ${data.migrated_responses} responses, ${data.migrated_field_responses} field responses`,
        details: data,
        timestamp: new Date().toISOString()
      };
    });
  }

  // Generate response summaries for analytics
  async generateResponseSummaries(startDate?: string, endDate?: string): Promise<MigrationResult> {
    return this.executeMigrationWithTracking('generate_summaries', async () => {
      const params: any = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const { data, error } = await this.supabase.rpc('generate_response_summaries', params);

      if (error) throw error;

      return {
        success: data.success,
        message: `Generated ${data.generated_summaries} response summaries`,
        details: data,
        timestamp: new Date().toISOString()
      };
    });
  }

  // Run all migrations in sequence
  async runAllMigrations(): Promise<MigrationResult[]> {
    const results: MigrationResult[] = [];

    try {
      console.log('Starting complete migration process...');

      // 1. Verify schema migration
      console.log('Step 1: Verifying schema migration...');
      const schemaResult = await this.runSchemaMigration();
      results.push(schemaResult);

      // 2. Migrate survey sections
      console.log('Step 2: Migrating survey sections...');
      const sectionsResult = await this.migrateSurveySections();
      results.push(sectionsResult);

      // 3. Migrate survey responses
      console.log('Step 3: Migrating survey responses...');
      const responsesResult = await this.migrateSurveyResponses();
      results.push(responsesResult);

      // 4. Generate response summaries
      console.log('Step 4: Generating response summaries...');
      const summariesResult = await this.generateResponseSummaries();
      results.push(summariesResult);

      console.log('All migrations completed successfully!');
      return results;

    } catch (error) {
      console.error('Migration process failed:', error);
      throw error;
    }
  }

  // Check if all migrations are complete
  async areAllMigrationsComplete(): Promise<boolean> {
    if (!this.migrationsEnabled) {
      console.log('Migrations disabled, skipping migration checks');
      return false; // Assume migrations not needed when disabled
    }

    try {
      const migrations = ['sections_to_normalized', 'responses_to_normalized', 'generate_summaries'];
      
      for (const migrationName of migrations) {
        const status = await this.getMigrationStatus(migrationName);
        if (!status || status.status !== 'completed') {
          return false;
        }
      }

      return true;
    } catch (error) {
      // If we can't check migration status (due to RLS or missing tables), assume no migrations needed
      console.warn('Unable to check migration status, assuming migrations not required:', error);
      return false;
    }
  }

  // Clean up old JSONB data after successful migration
  async cleanupOldData(): Promise<MigrationResult> {
    const allComplete = await this.areAllMigrationsComplete();
    
    if (!allComplete) {
      throw new Error('Cannot cleanup data - not all migrations are complete');
    }

    try {
      const { data, error } = await this.supabase.rpc('cleanup_migrated_jsonb_data');

      if (error) throw error;

      return {
        success: data.success,
        message: `Cleaned up ${data.cleaned_configs} configs and ${data.cleaned_responses} responses`,
        details: data,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error cleaning up old data:', error);
      throw error;
    }
  }

  // Check if a specific survey config has been migrated
  async isSurveyConfigMigrated(configId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.rpc('is_survey_config_migrated', { config_id: configId });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error checking config migration status:', error);
      return false;
    }
  }

  // Check if responses for a survey instance have been migrated
  async areResponsesMigrated(instanceId: string): Promise<boolean> {
    if (!this.migrationsEnabled) {
      console.log('Migrations disabled, skipping response migration check');
      return false;
    }

    try {
      const { data, error } = await this.supabase.rpc('are_responses_migrated', { instance_id: instanceId });

      if (error) {
        // Handle RLS or function not exists errors gracefully
        if (error.code === '406' || error.message?.includes('Not Acceptable') || error.message?.includes('does not exist')) {
          console.warn('Migration check function not available, assuming responses not migrated');
          return false;
        }
        throw error;
      }
      return data;
    } catch (error) {
      console.warn('Unable to check responses migration status, assuming not migrated:', error);
      return false;
    }
  }
}