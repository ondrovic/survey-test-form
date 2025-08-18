// Test suite for MigrationService
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MigrationService } from '../../services/migration.service';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(),
  rpc: vi.fn()
};

describe('MigrationService', () => {
  let migrationService: MigrationService;

  beforeEach(() => {
    migrationService = new MigrationService(mockSupabase as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getMigrationStatus', () => {
    it('should return migration status when found', async () => {
      const mockStatus = {
        migration_name: 'test_migration',
        status: 'completed',
        started_at: '2023-01-01T00:00:00Z',
        completed_at: '2023-01-01T00:01:00Z',
        error_message: null,
        migration_data: { result: 'success' }
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: mockStatus,
              error: null
            }))
          }))
        }))
      });

      const result = await migrationService.getMigrationStatus('test_migration');

      expect(result).toEqual({
        migrationName: 'test_migration',
        status: 'completed',
        startedAt: '2023-01-01T00:00:00Z',
        completedAt: '2023-01-01T00:01:00Z',
        errorMessage: null,
        migrationData: { result: 'success' }
      });
    });

    it('should return null when migration not found', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: null,
              error: { code: 'PGRST116' }
            }))
          }))
        }))
      });

      const result = await migrationService.getMigrationStatus('non_existent');

      expect(result).toBeNull();
    });
  });

  describe('updateMigrationStatus', () => {
    it('should update migration status successfully', async () => {
      mockSupabase.from.mockReturnValue({
        upsert: vi.fn(() => Promise.resolve({
          data: null,
          error: null
        }))
      });

      await expect(
        migrationService.updateMigrationStatus('test_migration', 'running')
      ).resolves.toBeUndefined();
    });

    it('should handle update errors', async () => {
      mockSupabase.from.mockReturnValue({
        upsert: vi.fn(() => Promise.resolve({
          data: null,
          error: new Error('Update failed')
        }))
      });

      await expect(
        migrationService.updateMigrationStatus('test_migration', 'running')
      ).rejects.toThrow('Update failed');
    });
  });

  describe('runSchemaMigration', () => {
    it('should verify schema migration successfully', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({
            data: [{ id: 'test' }],
            error: null
          }))
        }))
      });

      // Mock the status update calls
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'migration_status') {
          return {
            upsert: vi.fn(() => Promise.resolve({ data: null, error: null }))
          };
        }
        return {
          select: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({
              data: [{ id: 'test' }],
              error: null
            }))
          }))
        };
      });

      const result = await migrationService.runSchemaMigration();

      expect(result.success).toBe(true);
      expect(result.message).toContain('normalized tables exist');
    });

    it('should throw error when tables do not exist', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({
            data: null,
            error: { message: 'relation "survey_sections" does not exist' }
          }))
        }))
      });

      // Mock the status update calls for the error case
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'migration_status') {
          return {
            upsert: vi.fn(() => Promise.resolve({ data: null, error: null }))
          };
        }
        return {
          select: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({
              data: null,
              error: { message: 'relation "survey_sections" does not exist' }
            }))
          }))
        };
      });

      await expect(migrationService.runSchemaMigration()).rejects.toThrow(
        'Schema migration not yet applied'
      );
    });
  });

  describe('migrateSurveySections', () => {
    it('should migrate survey sections successfully', async () => {
      const mockResult = {
        success: true,
        migrated_configs: 5,
        migrated_sections: 15,
        migrated_fields: 50
      };

      mockSupabase.rpc.mockResolvedValue({
        data: mockResult,
        error: null
      });

      // Mock the status update calls
      mockSupabase.from.mockReturnValue({
        upsert: vi.fn(() => Promise.resolve({ data: null, error: null }))
      });

      const result = await migrationService.migrateSurveySections();

      expect(result.success).toBe(true);
      expect(result.message).toContain('5 configs');
      expect(result.details).toEqual(mockResult);
    });

    it('should handle migration errors', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: new Error('Migration failed')
      });

      // Mock the status update calls
      mockSupabase.from.mockReturnValue({
        upsert: vi.fn(() => Promise.resolve({ data: null, error: null }))
      });

      await expect(migrationService.migrateSurveySections()).rejects.toThrow(
        'Migration failed'
      );
    });
  });

  describe('areAllMigrationsComplete', () => {
    it('should return true when all migrations are complete', async () => {
      const mockStatuses = [
        { migration_name: 'sections_to_normalized', status: 'completed' },
        { migration_name: 'responses_to_normalized', status: 'completed' },
        { migration_name: 'generate_summaries', status: 'completed' }
      ];

      let callCount = 0;
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => {
              const response = {
                data: mockStatuses[callCount],
                error: null
              };
              callCount++;
              return Promise.resolve(response);
            })
          }))
        }))
      });

      const result = await migrationService.areAllMigrationsComplete();

      expect(result).toBe(true);
    });

    it('should return false when any migration is incomplete', async () => {
      const mockStatuses = [
        { migration_name: 'sections_to_normalized', status: 'completed' },
        { migration_name: 'responses_to_normalized', status: 'pending' },
        { migration_name: 'generate_summaries', status: 'completed' }
      ];

      let callCount = 0;
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => {
              const response = {
                data: callCount < mockStatuses.length ? mockStatuses[callCount] : null,
                error: callCount < mockStatuses.length ? null : { code: 'PGRST116' }
              };
              callCount++;
              return Promise.resolve(response);
            })
          }))
        }))
      });

      const result = await migrationService.areAllMigrationsComplete();

      expect(result).toBe(false);
    });
  });

  describe('cleanupOldData', () => {
    it('should cleanup old data when migrations are complete', async () => {
      // Mock areAllMigrationsComplete to return true
      vi.spyOn(migrationService, 'areAllMigrationsComplete').mockResolvedValue(true);

      const mockCleanupResult = {
        success: true,
        cleaned_configs: 10,
        cleaned_responses: 100
      };

      mockSupabase.rpc.mockResolvedValue({
        data: mockCleanupResult,
        error: null
      });

      const result = await migrationService.cleanupOldData();

      expect(result.success).toBe(true);
      expect(result.message).toContain('10 configs');
      expect(result.message).toContain('100 responses');
    });

    it('should throw error when migrations are not complete', async () => {
      // Mock areAllMigrationsComplete to return false
      vi.spyOn(migrationService, 'areAllMigrationsComplete').mockResolvedValue(false);

      await expect(migrationService.cleanupOldData()).rejects.toThrow(
        'Cannot cleanup data - not all migrations are complete'
      );
    });
  });

  describe('runAllMigrations', () => {
    it('should run all migrations in sequence', async () => {
      // Mock all individual migration methods
      vi.spyOn(migrationService, 'runSchemaMigration').mockResolvedValue({
        success: true,
        message: 'Schema verified',
        timestamp: new Date().toISOString()
      });

      vi.spyOn(migrationService, 'migrateSurveySections').mockResolvedValue({
        success: true,
        message: 'Sections migrated',
        timestamp: new Date().toISOString()
      });

      vi.spyOn(migrationService, 'migrateSurveyResponses').mockResolvedValue({
        success: true,
        message: 'Responses migrated',
        timestamp: new Date().toISOString()
      });

      vi.spyOn(migrationService, 'generateResponseSummaries').mockResolvedValue({
        success: true,
        message: 'Summaries generated',
        timestamp: new Date().toISOString()
      });

      const results = await migrationService.runAllMigrations();

      expect(results).toHaveLength(4);
      expect(results.every(r => r.success)).toBe(true);
    });

    it('should stop on first migration failure', async () => {
      // Mock first migration to fail
      vi.spyOn(migrationService, 'runSchemaMigration').mockRejectedValue(
        new Error('Schema migration failed')
      );

      await expect(migrationService.runAllMigrations()).rejects.toThrow(
        'Schema migration failed'
      );
    });
  });
});