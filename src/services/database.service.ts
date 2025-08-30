import { logError } from '@/utils/error-logging.utils';
import {
  AuthHelpers,
  DatabaseConfig,
  DatabaseHelpers,
  DatabaseProvider_Interface,
} from "../types/database.types";

class DatabaseService {
  private provider: DatabaseProvider_Interface | null = null;
  private config: DatabaseConfig | null = null;

  async initialize(config: DatabaseConfig): Promise<void> {
    // Prevent re-initialization if already initialized with the same provider
    if (
      this.provider &&
      this.config?.provider === config.provider &&
      this.provider.isInitialized()
    ) {
      return;
    }

    // If we have a different provider, clean up first
    if (this.provider && this.config?.provider !== config.provider) {
      this.provider = null;
    }

    this.config = config;

    // Only create new provider if we don't have one
    if (!this.provider) {
      switch (config.provider) {
        case "supabase": {
          const { SupabaseProvider } = await import(
            "../providers/supabase.provider"
          );
          this.provider = SupabaseProvider;
          break;
        }
        default: {
          const error = new Error(`Unknown database provider: ${config.provider}`);
          await logError('Database initialization failed', error, {
            severity: 'critical',
            componentName: 'DatabaseService',
            userAction: 'Database initialization',
            additionalContext: { provider: config.provider }
          });
          throw error;
        }
      }
    }

    await this.provider.initialize(config);
  }

  get authHelpers(): AuthHelpers {
    if (!this.provider) {
      throw new Error("Database service not initialized");
    }
    return this.provider.authHelpers;
  }

  get databaseHelpers(): DatabaseHelpers {
    if (!this.provider) {
      throw new Error("Database service not initialized");
    }
    return this.provider.databaseHelpers;
  }

  isInitialized(): boolean {
    return this.provider?.isInitialized() ?? false;
  }

  getCurrentProvider(): string {
    return this.config?.provider ?? "none";
  }
}

export const databaseService = new DatabaseService();
export { DatabaseService };
