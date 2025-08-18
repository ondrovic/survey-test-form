// Performance tests for repository operations
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { SurveyConfigRepository } from '../../repositories/survey-config.repository';
import { SurveyInstanceRepository } from '../../repositories/survey-instance.repository';
import { SurveyResponseRepository } from '../../repositories/survey-response.repository';

// Test configuration
const TEST_CONFIG = {
  SUPABASE_URL: process.env.VITE_SUPABASE_URL || 'http://localhost:54321',
  SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || 'test-key',
  PERFORMANCE_THRESHOLD_MS: 1000, // 1 second threshold
  BATCH_SIZE: 100,
  CONCURRENT_OPERATIONS: 10
};

describe('Repository Performance Tests', () => {
  let supabase: any;
  let configRepo: SurveyConfigRepository;
  let instanceRepo: SurveyInstanceRepository;
  let responseRepo: SurveyResponseRepository;

  beforeAll(async () => {
    // Only run performance tests if we have a real Supabase connection
    if (TEST_CONFIG.SUPABASE_URL.includes('localhost') || TEST_CONFIG.SUPABASE_ANON_KEY === 'test-key') {
      console.log('Skipping performance tests - no real Supabase connection');
      return;
    }

    supabase = createClient(TEST_CONFIG.SUPABASE_URL, TEST_CONFIG.SUPABASE_ANON_KEY);
    configRepo = new SurveyConfigRepository(supabase);
    instanceRepo = new SurveyInstanceRepository(supabase);
    responseRepo = new SurveyResponseRepository(supabase);
  });

  afterAll(async () => {
    // Cleanup test data if needed
  });

  describe('SurveyConfigRepository Performance', () => {
    it('should fetch all configs within performance threshold', async () => {
      if (!supabase) return; // Skip if no connection

      const startTime = Date.now();
      const configs = await configRepo.findAll();
      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`findAll() took ${duration}ms for ${configs.length} configs`);
      expect(duration).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLD_MS);
    });

    it('should handle concurrent read operations efficiently', async () => {
      if (!supabase) return;

      const operations = Array(TEST_CONFIG.CONCURRENT_OPERATIONS).fill(null).map(() => 
        configRepo.findAll()
      );

      const startTime = Date.now();
      const results = await Promise.all(operations);
      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`${TEST_CONFIG.CONCURRENT_OPERATIONS} concurrent reads took ${duration}ms`);
      expect(duration).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLD_MS * 2);
      expect(results.every(result => Array.isArray(result))).toBe(true);
    });

    it('should find active configs efficiently', async () => {
      if (!supabase) return;

      const startTime = Date.now();
      const activeConfigs = await configRepo.findActive();
      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`findActive() took ${duration}ms for ${activeConfigs.length} active configs`);
      expect(duration).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLD_MS);
    });
  });

  describe('SurveyInstanceRepository Performance', () => {
    it('should fetch all instances within performance threshold', async () => {
      if (!supabase) return;

      const startTime = Date.now();
      const instances = await instanceRepo.findAll();
      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`findAll() took ${duration}ms for ${instances.length} instances`);
      expect(duration).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLD_MS);
    });

    it('should efficiently find instances by config ID', async () => {
      if (!supabase) return;

      // First get a config ID
      const configs = await configRepo.findAll();
      if (configs.length === 0) return;

      const configId = configs[0].id;

      const startTime = Date.now();
      const instances = await instanceRepo.findByConfigId(configId);
      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`findByConfigId() took ${duration}ms for ${instances.length} instances`);
      expect(duration).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLD_MS);
    });

    it('should handle status updates efficiently', async () => {
      if (!supabase) return;

      const startTime = Date.now();
      const result = await instanceRepo.updateStatuses();
      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`updateStatuses() took ${duration}ms (${result.activated} activated, ${result.deactivated} deactivated)`);
      expect(duration).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLD_MS * 3); // Allow more time for bulk updates
    });
  });

  describe('SurveyResponseRepository Performance', () => {
    it('should fetch all responses within performance threshold', async () => {
      if (!supabase) return;

      const startTime = Date.now();
      const responses = await responseRepo.findAll();
      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`findAll() took ${duration}ms for ${responses.length} responses`);
      expect(duration).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLD_MS * 2); // Responses can be large
    });

    it('should efficiently find responses by instance ID', async () => {
      if (!supabase) return;

      // First get an instance ID
      const instances = await instanceRepo.findAll();
      if (instances.length === 0) return;

      const instanceId = instances[0].id;

      const startTime = Date.now();
      const responses = await responseRepo.findByInstanceId(instanceId);
      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`findByInstanceId() took ${duration}ms for ${responses.length} responses`);
      expect(duration).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLD_MS);
    });

    it('should efficiently count responses by instance', async () => {
      if (!supabase) return;

      // First get an instance ID
      const instances = await instanceRepo.findAll();
      if (instances.length === 0) return;

      const instanceId = instances[0].id;

      const startTime = Date.now();
      const count = await responseRepo.countByInstanceId(instanceId);
      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`countByInstanceId() took ${duration}ms (count: ${count})`);
      expect(duration).toBeLessThan(500); // Count operations should be very fast
    });

    it('should handle date range queries efficiently', async () => {
      if (!supabase) return;

      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days ago

      const startTime = Date.now();
      const responses = await responseRepo.findByDateRange(startDate, endDate);
      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`findByDateRange() took ${duration}ms for ${responses.length} responses`);
      expect(duration).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLD_MS * 2);
    });
  });

  describe('Cross-Repository Performance', () => {
    it('should handle complex queries across multiple repositories', async () => {
      if (!supabase) return;

      const startTime = Date.now();

      // Simulate a complex dashboard query
      const [configs, instances, recentResponses] = await Promise.all([
        configRepo.findActive(),
        instanceRepo.findActive(),
        responseRepo.findByDateRange(
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
          new Date().toISOString()
        )
      ]);

      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`Complex dashboard query took ${duration}ms`);
      console.log(`Results: ${configs.length} configs, ${instances.length} instances, ${recentResponses.length} responses`);
      
      expect(duration).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLD_MS * 2);
    });

    it('should handle bulk operations efficiently', async () => {
      if (!supabase) return;

      // Get some test data
      const instances = await instanceRepo.findAll();
      if (instances.length === 0) return;

      const instanceIds = instances.slice(0, Math.min(10, instances.length));

      const startTime = Date.now();

      // Simulate bulk response counting
      const countPromises = instanceIds.map(instance => 
        responseRepo.countByInstanceId(instance.id)
      );
      const counts = await Promise.all(countPromises);

      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`Bulk count operations (${instanceIds.length} instances) took ${duration}ms`);
      expect(duration).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLD_MS);
      expect(counts.every(count => typeof count === 'number')).toBe(true);
    });
  });

  describe('Memory Usage and Resource Management', () => {
    it('should not leak memory during repeated operations', async () => {
      if (!supabase) return;

      const initialMemory = process.memoryUsage().heapUsed;
      
      // Perform many repeated operations
      for (let i = 0; i < 50; i++) {
        await configRepo.findAll();
        await instanceRepo.findAll();
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      const memoryIncreaseMB = memoryIncrease / 1024 / 1024;

      console.log(`Memory increase after 50 operations: ${memoryIncreaseMB.toFixed(2)}MB`);
      
      // Allow for some memory increase but not excessive
      expect(memoryIncreaseMB).toBeLessThan(50); // Less than 50MB increase
    });

    it('should handle large result sets without performance degradation', async () => {
      if (!supabase) return;

      // This test assumes there's a reasonable amount of data
      const startTime = Date.now();
      const allResponses = await responseRepo.findAll();
      const endTime = Date.now();
      const duration = endTime - startTime;

      if (allResponses.length > 1000) {
        console.log(`Large dataset test: ${allResponses.length} responses in ${duration}ms`);
        
        // Performance should still be reasonable even for large datasets
        const performanceRatio = duration / allResponses.length; // ms per record
        expect(performanceRatio).toBeLessThan(10); // Less than 10ms per record
      } else {
        console.log(`Skipping large dataset test - only ${allResponses.length} responses available`);
      }
    });
  });
});