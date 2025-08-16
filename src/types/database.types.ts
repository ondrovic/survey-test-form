import {
  SurveyConfig,
  SurveyInstance,
  SurveyResponse,
  RatingScale,
  RadioOptionSet,
  MultiSelectOptionSet,
  SelectOptionSet
} from './framework.types';

export type DatabaseProvider = 'firebase' | 'supabase' | 'postgres';

export interface DatabaseConfig {
  provider: DatabaseProvider;
  firebase?: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId?: string;
  };
  supabase?: {
    url: string;
    anonKey: string;
  };
  postgres?: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl?: boolean;
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
  addRatingScale(scale: Omit<RatingScale, 'id'>): Promise<RatingScale>;
  updateRatingScale(id: string, data: Partial<RatingScale>): Promise<void>;
  deleteRatingScale(id: string): Promise<void>;

  // Radio Option Sets
  getRadioOptionSets(): Promise<RadioOptionSet[]>;
  getRadioOptionSet(id: string): Promise<RadioOptionSet | null>;
  addRadioOptionSet(optionSet: Omit<RadioOptionSet, 'id'>): Promise<RadioOptionSet>;
  updateRadioOptionSet(id: string, data: Partial<RadioOptionSet>): Promise<void>;
  deleteRadioOptionSet(id: string): Promise<void>;

  // Multi-Select Option Sets
  getMultiSelectOptionSets(): Promise<MultiSelectOptionSet[]>;
  getMultiSelectOptionSet(id: string): Promise<MultiSelectOptionSet | null>;
  addMultiSelectOptionSet(optionSet: Omit<MultiSelectOptionSet, 'id'>): Promise<MultiSelectOptionSet>;
  updateMultiSelectOptionSet(id: string, data: Partial<MultiSelectOptionSet>): Promise<void>;
  deleteMultiSelectOptionSet(id: string): Promise<void>;

  // Select Option Sets
  getSelectOptionSets(): Promise<SelectOptionSet[]>;
  getSelectOptionSet(id: string): Promise<SelectOptionSet | null>;
  addSelectOptionSet(optionSet: Omit<SelectOptionSet, 'id'>): Promise<SelectOptionSet>;
  updateSelectOptionSet(id: string, data: Partial<SelectOptionSet>): Promise<void>;
  deleteSelectOptionSet(id: string): Promise<void>;
}

export interface DatabaseProvider_Interface {
  authHelpers: AuthHelpers;
  databaseHelpers: DatabaseHelpers;
  initialize(config: DatabaseConfig): Promise<void>;
  isInitialized(): boolean;
}