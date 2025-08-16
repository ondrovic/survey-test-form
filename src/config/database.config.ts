import { DatabaseConfig, DatabaseProvider } from '../types/database.types';

export function createDatabaseConfig(): DatabaseConfig {
  const provider = (import.meta.env.VITE_DATABASE_PROVIDER || 'firebase') as DatabaseProvider;

  const config: DatabaseConfig = {
    provider,
  };

  switch (provider) {
    case 'firebase':
      config.firebase = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
        appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
        measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
      };
      break;

    case 'supabase':
      config.supabase = {
        url: import.meta.env.VITE_SUPABASE_URL || '',
        anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
      };
      break;

    case 'postgres':
      config.postgres = {
        host: import.meta.env.VITE_POSTGRES_HOST || 'localhost',
        port: parseInt(import.meta.env.VITE_POSTGRES_PORT || '5432', 10),
        database: import.meta.env.VITE_POSTGRES_DATABASE || 'survey_db',
        username: import.meta.env.VITE_POSTGRES_USERNAME || 'survey_user',
        password: import.meta.env.VITE_POSTGRES_PASSWORD || '',
        ssl: import.meta.env.VITE_POSTGRES_SSL === 'true',
      };
      break;

    default:
      throw new Error(`Unknown database provider: ${provider}`);
  }

  return config;
}

export function validateDatabaseConfig(config: DatabaseConfig): void {
  switch (config.provider) {
    case 'firebase':
      if (!config.firebase) {
        throw new Error('Firebase configuration is required when using Firebase provider');
      }
      const requiredFirebaseKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
      for (const key of requiredFirebaseKeys) {
        if (!config.firebase[key as keyof typeof config.firebase]) {
          throw new Error(`Firebase ${key} is required`);
        }
      }
      break;

    case 'supabase':
      if (!config.supabase) {
        throw new Error('Supabase configuration is required when using Supabase provider');
      }
      if (!config.supabase.url) {
        throw new Error('Supabase URL is required');
      }
      if (!config.supabase.anonKey) {
        throw new Error('Supabase anonymous key is required');
      }
      break;

    case 'postgres':
      if (!config.postgres) {
        throw new Error('PostgreSQL configuration is required when using PostgreSQL provider');
      }
      const requiredPgKeys = ['host', 'port', 'database', 'username', 'password'];
      for (const key of requiredPgKeys) {
        if (!config.postgres[key as keyof typeof config.postgres]) {
          throw new Error(`PostgreSQL ${key} is required`);
        }
      }
      break;

    default:
      throw new Error(`Unknown database provider: ${config.provider}`);
  }
}