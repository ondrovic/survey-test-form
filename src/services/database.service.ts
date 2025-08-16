import { DatabaseConfig, DatabaseProvider_Interface, AuthHelpers, DatabaseHelpers } from '../types/database.types';

class DatabaseService {
  private provider: DatabaseProvider_Interface | null = null;
  private config: DatabaseConfig | null = null;

  async initialize(config: DatabaseConfig): Promise<void> {
    this.config = config;
    
    switch (config.provider) {
      case 'firebase':
        const { FirebaseProvider } = await import('../providers/firebase.provider');
        this.provider = new FirebaseProvider();
        break;
      case 'supabase':
        const { SupabaseProvider } = await import('../providers/supabase.provider');
        this.provider = new SupabaseProvider();
        break;
      case 'postgres':
        const { PostgresProvider } = await import('../providers/postgres.provider');
        this.provider = new PostgresProvider();
        break;
      default:
        throw new Error(`Unknown database provider: ${config.provider}`);
    }

    await this.provider.initialize(config);
  }

  get authHelpers(): AuthHelpers {
    if (!this.provider) {
      throw new Error('Database service not initialized');
    }
    return this.provider.authHelpers;
  }

  get databaseHelpers(): DatabaseHelpers {
    if (!this.provider) {
      throw new Error('Database service not initialized');
    }
    return this.provider.databaseHelpers;
  }

  isInitialized(): boolean {
    return this.provider?.isInitialized() ?? false;
  }

  getCurrentProvider(): string {
    return this.config?.provider ?? 'none';
  }
}

export const databaseService = new DatabaseService();
export { DatabaseService };