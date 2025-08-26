import { DatabaseConfig, DatabaseProvider } from '../types/database.types';

export const createDatabaseConfig = (): DatabaseConfig => {
  const provider = (import.meta.env.VITE_DATABASE_PROVIDER || 'supabase') as DatabaseProvider;

  const config: DatabaseConfig = {
    provider,
    supabase: {
      url: import.meta.env.VITE_SUPABASE_URL || '',
      anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    },
  };

  switch (provider) {
    case 'supabase':
      // Configuration already set above
      break;

    default:
      throw new Error(`Unknown database provider: ${provider}. Currently supported: supabase`);
  }

  return config;
}

export const validateDatabaseConfig = (config: DatabaseConfig): void => {
  switch (config.provider) {
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

    default:
      throw new Error(`Unknown database provider: ${config.provider}. Currently supported: supabase`);
  }
}