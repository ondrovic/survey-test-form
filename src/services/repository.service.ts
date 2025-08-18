import { SupabaseClient } from '@supabase/supabase-js';
import {
  SurveyConfigRepository,
  SurveyInstanceRepository,
  SurveyResponseRepository,
  RatingScaleRepository,
  RadioOptionSetRepository,
  MultiSelectOptionSetRepository,
  SelectOptionSetRepository
} from '../repositories';

// Repository service that provides access to all repositories
export class RepositoryService {
  public readonly surveyConfigs: SurveyConfigRepository;
  public readonly surveyInstances: SurveyInstanceRepository;
  public readonly surveyResponses: SurveyResponseRepository;
  public readonly ratingScales: RatingScaleRepository;
  public readonly radioOptionSets: RadioOptionSetRepository;
  public readonly multiSelectOptionSets: MultiSelectOptionSetRepository;
  public readonly selectOptionSets: SelectOptionSetRepository;

  constructor(supabase: SupabaseClient) {
    this.surveyConfigs = new SurveyConfigRepository(supabase);
    this.surveyInstances = new SurveyInstanceRepository(supabase);
    this.surveyResponses = new SurveyResponseRepository(supabase);
    this.ratingScales = new RatingScaleRepository(supabase);
    this.radioOptionSets = new RadioOptionSetRepository(supabase);
    this.multiSelectOptionSets = new MultiSelectOptionSetRepository(supabase);
    this.selectOptionSets = new SelectOptionSetRepository(supabase);
  }
}

// Global repository service instance
let repositoryService: RepositoryService | null = null;

// Initialize repository service
export function initializeRepositoryService(supabase: SupabaseClient): RepositoryService {
  repositoryService = new RepositoryService(supabase);
  return repositoryService;
}

// Get repository service instance
export function getRepositoryService(): RepositoryService {
  if (!repositoryService) {
    throw new Error('Repository service not initialized. Call initializeRepositoryService() first.');
  }
  return repositoryService;
}

// Check if repository service is initialized
export function isRepositoryServiceInitialized(): boolean {
  return repositoryService !== null;
}