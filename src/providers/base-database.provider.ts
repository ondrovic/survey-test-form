import {
  AuthHelpers,
  DatabaseConfig,
  DatabaseProvider_Interface,
} from "../types/database.types";
import { SupabaseClientService } from "../services/supabase-client.service";
import { initializeRepositoryService } from "../services/repository.service";

/**
 * Abstract base class for database providers
 * Implements common functionality and initialization patterns
 */
export abstract class BaseDatabaseProvider implements DatabaseProvider_Interface {
  protected clientService: SupabaseClientService;
  protected initialized = false;

  constructor() {
    this.clientService = SupabaseClientService.getInstance();
  }

  abstract get authHelpers(): AuthHelpers;
  abstract get databaseHelpers(): any;

  async initialize(config: DatabaseConfig): Promise<void> {
    if (this.initialized) {
      console.log("Database provider already initialized");
      return;
    }

    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Database provider initialization attempt ${attempt}/${maxRetries}`);

        // Get single client through the client service
        const client = await this.clientService.getClient(config);

        // Test connection
        await this.clientService.testConnection(client);

        // Initialize repository service with elevated privileges for admin operations
        await this.clientService.withClient(async (elevatedClient) => {
          initializeRepositoryService(elevatedClient);
        });


        this.initialized = true;
        console.log("Database provider initialized successfully");
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(
          `Database provider initialization attempt ${attempt} failed:`,
          lastError.message
        );

        // Don't retry on schema errors
        if (
          lastError.message.includes("Database tables not found") ||
          lastError.message.includes('relation "survey_configs" does not exist')
        ) {
          break;
        }

        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          console.log(`Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    console.error("Failed to initialize database provider after all attempts:", lastError);
    this.initialized = false;
    throw lastError || new Error("Unknown initialization error");
  }

  isInitialized(): boolean {
    return this.initialized;
  }

}