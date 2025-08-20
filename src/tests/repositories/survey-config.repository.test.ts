// Test suite for SurveyConfigRepository
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SurveyConfigRepository } from '../../repositories/survey-config.repository';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      order: vi.fn(() => ({
        data: [],
        error: null
      }))
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => ({
          data: null,
          error: null
        }))
      }))
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        data: null,
        error: null
      }))
    })),
    delete: vi.fn(() => ({
      eq: vi.fn(() => ({
        data: null,
        error: null
      }))
    })),
    eq: vi.fn(() => ({
      single: vi.fn(() => ({
        data: null,
        error: null
      }))
    }))
  }))
};

describe('SurveyConfigRepository', () => {
  let repository: SurveyConfigRepository;
  let mockConfig: any;

  beforeEach(() => {
    repository = new SurveyConfigRepository(mockSupabase as any);
    
    mockConfig = {
      id: 'test-id',
      title: 'Test Survey',
      description: 'Test Description',
      sections: [],
      version: '1.0.0',
      paginatorConfig: {},
      footerConfig: {},
      isActive: true,
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'test-user'
      }
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all survey configs', async () => {
      const mockData = [
        {
          id: 'test-id',
          title: 'Test Survey',
          description: 'Test Description',
          sections: [],
          version: '1.0.0',
          paginator_config: {},
          footer_config: {},
          is_active: true,
          metadata: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({
            data: mockData,
            error: null
          }))
        }))
      });

      const result = await repository.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Test Survey');
      expect(result[0].isActive).toBe(true);
    });

    it('should handle database errors', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({
            data: null,
            error: new Error('Database error')
          }))
        }))
      });

      await expect(repository.findAll()).rejects.toThrow('Database error');
    });
  });

  describe('findById', () => {
    it('should return a survey config by id', async () => {
      const mockData = {
        id: 'test-id',
        title: 'Test Survey',
        description: 'Test Description',
        sections: [],
        version: '1.0.0',
        paginator_config: {},
        footer_config: {},
        is_active: true,
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: mockData,
              error: null
            }))
          }))
        }))
      });

      const result = await repository.findById('test-id');

      expect(result).toBeTruthy();
      expect(result?.title).toBe('Test Survey');
    });

    it('should return null when config not found', async () => {
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

      const result = await repository.findById('non-existent-id');

      expect(result).toBeNull();
    });

    it('should validate id parameter', async () => {
      await expect(repository.findById('')).rejects.toThrow('Invalid ID');
    });
  });

  describe('create', () => {
    it('should create a new survey config', async () => {
      const createData = {
        title: 'New Survey',
        description: 'New Description',
        sections: [],
        version: '1.0.0',
        paginatorConfig: {},
        footerConfig: {},
        isActive: true,
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'test-user'
        }
      };

      const mockReturnData = {
        id: 'new-id',
        title: 'New Survey',
        description: 'New Description',
        sections: [],
        version: '1.0.0',
        paginator_config: {},
        footer_config: {},
        is_active: true,
        metadata: createData.metadata,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      mockSupabase.from.mockReturnValue({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: mockReturnData,
              error: null
            }))
          }))
        }))
      });

      const result = await repository.create(createData);

      expect(result.title).toBe('New Survey');
      expect(result.id).toBe('new-id');
    });

    it('should handle creation errors', async () => {
      const createData = {
        title: 'New Survey',
        sections: [],
        version: '1.0.0',
        paginatorConfig: {},
        footerConfig: {},
        isActive: true,
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'test-user'
        }
      };

      mockSupabase.from.mockReturnValue({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: null,
              error: new Error('Creation failed')
            }))
          }))
        }))
      });

      await expect(repository.create(createData)).rejects.toThrow('Creation failed');
    });
  });

  describe('update', () => {
    it('should update a survey config', async () => {
      const updateData = {
        title: 'Updated Survey'
      };

      mockSupabase.from.mockReturnValue({
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({
            data: null,
            error: null
          }))
        }))
      });

      await expect(repository.update('test-id', updateData)).resolves.toBeUndefined();
    });

    it('should validate id parameter for update', async () => {
      await expect(repository.update('', { title: 'Test' })).rejects.toThrow('Invalid ID');
    });
  });

  describe('delete', () => {
    it('should delete a survey config', async () => {
      mockSupabase.from.mockReturnValue({
        delete: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({
            data: null,
            error: null
          }))
        }))
      });

      await expect(repository.delete('test-id')).resolves.toBeUndefined();
    });

    it('should validate id parameter for delete', async () => {
      await expect(repository.delete('')).rejects.toThrow('Invalid ID');
    });
  });

  describe('findActive', () => {
    it('should return only active survey configs', async () => {
      const mockData = [
        {
          id: 'active-id',
          title: 'Active Survey',
          description: 'Active Description',
          sections: [],
          version: '1.0.0',
          paginator_config: {},
          footer_config: {},
          is_active: true,
          metadata: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({
              data: mockData,
              error: null
            }))
          }))
        }))
      });

      const result = await repository.findActive();

      expect(result).toHaveLength(1);
      expect(result[0].isActive).toBe(true);
    });
  });
});