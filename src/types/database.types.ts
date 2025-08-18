import {
  SurveyConfig,
  SurveyInstance,
  SurveyResponse,
  RatingScale,
  RadioOptionSet,
  MultiSelectOptionSet,
  SelectOptionSet
} from './framework.types';

export type DatabaseProvider = 'supabase';

export interface DatabaseConfig {
  provider: DatabaseProvider;
  supabase: {
    url: string;
    anonKey: string;
  };
}

export interface AuthHelpers {
  signInAnonymously(): Promise<any>;
  getCurrentUser(): any;
  onAuthStateChanged(callback: (user: any) => void): () => void;
}

export interface DatabaseHelpers {
  // Legacy survey functions
  getSurveys(): Promise<any[]>;
  addSurvey(surveyData: any): Promise<any>;
  updateSurvey(id: string, data: any): Promise<void>;
  deleteSurvey(id: string): Promise<void>;

  // Survey Configs
  getSurveyConfigs(): Promise<SurveyConfig[]>;
  getSurveyConfig(id: string): Promise<SurveyConfig | null>;
  addSurveyConfig(config: Omit<SurveyConfig, 'id'>): Promise<SurveyConfig>;
  updateSurveyConfig(id: string, data: Partial<SurveyConfig>): Promise<void>;
  deleteSurveyConfig(id: string): Promise<void>;

  // Survey Instances
  getSurveyInstances(): Promise<SurveyInstance[]>;
  getSurveyInstancesByConfig(configId: string): Promise<SurveyInstance[]>;
  addSurveyInstance(instance: Omit<SurveyInstance, 'id'>): Promise<SurveyInstance>;
  updateSurveyInstance(id: string, data: Partial<SurveyInstance>): Promise<void>;
  deleteSurveyInstance(id: string): Promise<void>;

  // Survey Responses
  addSurveyResponse(response: Omit<SurveyResponse, 'id'>): Promise<SurveyResponse>;
  getSurveyResponses(instanceId?: string): Promise<SurveyResponse[]>;
  getSurveyResponsesFromCollection(instanceId: string): Promise<SurveyResponse[]>;

  // Rating Scales
  getRatingScales(): Promise<RatingScale[]>;
  getRatingScale(id: string): Promise<RatingScale | null>;
  addRatingScale(scale: RatingScale | Omit<RatingScale, 'id'>): Promise<RatingScale>;
  updateRatingScale(id: string, data: Partial<RatingScale>): Promise<void>;
  deleteRatingScale(id: string): Promise<void>;

  // Radio Option Sets
  getRadioOptionSets(): Promise<RadioOptionSet[]>;
  getRadioOptionSet(id: string): Promise<RadioOptionSet | null>;
  addRadioOptionSet(optionSet: RadioOptionSet | Omit<RadioOptionSet, 'id'>): Promise<RadioOptionSet>;
  updateRadioOptionSet(id: string, data: Partial<RadioOptionSet>): Promise<void>;
  deleteRadioOptionSet(id: string): Promise<void>;

  // Multi-Select Option Sets
  getMultiSelectOptionSets(): Promise<MultiSelectOptionSet[]>;
  getMultiSelectOptionSet(id: string): Promise<MultiSelectOptionSet | null>;
  addMultiSelectOptionSet(optionSet: MultiSelectOptionSet | Omit<MultiSelectOptionSet, 'id'>): Promise<MultiSelectOptionSet>;
  updateMultiSelectOptionSet(id: string, data: Partial<MultiSelectOptionSet>): Promise<void>;
  deleteMultiSelectOptionSet(id: string): Promise<void>;

  // Select Option Sets
  getSelectOptionSets(): Promise<SelectOptionSet[]>;
  getSelectOptionSet(id: string): Promise<SelectOptionSet | null>;
  addSelectOptionSet(optionSet: SelectOptionSet | Omit<SelectOptionSet, 'id'>): Promise<SelectOptionSet>;
  updateSelectOptionSet(id: string, data: Partial<SelectOptionSet>): Promise<void>;
  deleteSelectOptionSet(id: string): Promise<void>;

  // Survey Instance Status Management
  updateSurveyInstanceStatuses(): Promise<{ success: boolean; activated: number; deactivated: number; message: string }>;
  getUpcomingStatusChanges(hoursAhead?: number): Promise<{
    upcoming_activations: Array<{ id: string; title: string; slug?: string; active_date_range: any }>;
    upcoming_deactivations: Array<{ id: string; title: string; slug?: string; active_date_range: any }>;
    check_time: string;
    hours_ahead: number;
  }>;
  getSurveyInstanceStatusChanges(instanceId?: string): Promise<Array<{
    id: string;
    instance_id: string;
    old_status: boolean | null;
    new_status: boolean;
    reason: string;
    changed_at: string;
    changed_by: string;
    details: any;
  }>>;
}

export interface DatabaseProvider_Interface {
  authHelpers: AuthHelpers;
  databaseHelpers: DatabaseHelpers;
  initialize(config: DatabaseConfig): Promise<void>;
  isInitialized(): boolean;
  getMigrationService(): any;
  runMigrations(): Promise<void>;
  isMigrationComplete(): Promise<boolean>;
}