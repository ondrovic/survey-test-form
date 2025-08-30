import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { DatabaseConfig, SupabaseConfig } from "@/types";

/**
 * Singleton service for managing a single Supabase client instance
 * Uses privilege elevation pattern instead of multiple clients
 */
export class SupabaseClientService {
  private static instance: SupabaseClientService;
  private globalClient: SupabaseClient | null = null;
  private globalConfig: SupabaseConfig | null = null;
  private serviceRoleKey: string | null = null;
  private initializationInProgress = false;

  private constructor() {}

  static getInstance(): SupabaseClientService {
    if (!SupabaseClientService.instance) {
      SupabaseClientService.instance = new SupabaseClientService();
    }
    return SupabaseClientService.instance;
  }

  /**
   * Get or create single Supabase client with proper singleton protection
   */
  async getClient(config: DatabaseConfig): Promise<SupabaseClient> {
    if (!config.supabase) {
      throw new Error("Supabase configuration is required");
    }

    // Prevent concurrent initialization
    if (this.initializationInProgress) {
      await this.waitForInitialization();
    }

    this.serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || null;
    const currentConfig: SupabaseConfig = {
      url: config.supabase.url,
      anonKey: config.supabase.anonKey,
      serviceRoleKey: this.serviceRoleKey || undefined,
    };

    // Reuse existing client if configuration matches
    if (this.canReuseClient(currentConfig)) {
      return this.globalClient!;
    }

    // Create new single client
    this.initializationInProgress = true;
    try {
      // Create single client with stable auth configuration
      this.globalClient = createClient(
        config.supabase.url,
        config.supabase.anonKey,
        {
          auth: {
            storageKey: "sb-auth-token",
            persistSession: true,
            autoRefreshToken: true,
          },
        }
      );

      this.globalConfig = currentConfig;
      
      return this.globalClient;
    } finally {
      this.initializationInProgress = false;
    }
  }

  /**
   * Test connection to Supabase with schema validation
   */
  async testConnection(client: SupabaseClient): Promise<void> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Connection test timeout")), 10000);
    });

    // Test basic connection
    const testPromise = client.from("survey_configs").select("id").limit(1);
    const { error } = await Promise.race([testPromise, timeoutPromise]) as any;

    if (error) {
      if (error.message.includes('relation "survey_configs" does not exist')) {
        throw new Error(
          "Database tables not found. Please run the setup script from scripts/setup-supabase.sql"
        );
      }
      throw error;
    }
  }

  /**
   * Get the current client (throws if not initialized)
   */
  getCurrentClient(): SupabaseClient {
    if (!this.globalClient) {
      throw new Error(
        "Supabase client not initialized. Please call getClient() first."
      );
    }
    return this.globalClient;
  }

  /**
   * Get the current client without throwing (returns null if not initialized)
   * Used for error logging to prevent recursive errors
   */
  getClientSafe(): SupabaseClient | null {
    return this.globalClient;
  }


  /**
   * Execute operation with the single global client
   * Since RLS is disabled, all operations use the same client
   */
  async withClient<T>(
    operation: (client: SupabaseClient) => Promise<T>
  ): Promise<T> {
    const client = this.getCurrentClient();
    return await operation(client);
  }

  private canReuseClient(config: SupabaseConfig): boolean {
    return !!(
      this.globalClient &&
      this.globalConfig &&
      this.globalConfig.url === config.url &&
      this.globalConfig.anonKey === config.anonKey &&
      this.globalConfig.serviceRoleKey === config.serviceRoleKey
    );
  }

  private async waitForInitialization(): Promise<void> {
    while (this.initializationInProgress) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
}