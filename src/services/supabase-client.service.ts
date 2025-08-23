import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { DatabaseConfig } from "../types/database.types";

interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}

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
      console.log("Reusing existing Supabase client");
      return this.globalClient!;
    }

    // Create new single client
    this.initializationInProgress = true;
    try {
      console.log("Creating new Supabase client");
      
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

      if (!this.serviceRoleKey || this.serviceRoleKey === "your_service_role_key_here") {
        console.warn(
          "Service role key not configured. Admin operations may fail due to RLS policies."
        );
      } else {
        console.log("Service role key available for privilege elevation");
      }

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

    // Check if normalized schema exists
    const { error: normalizedError } = await client
      .from("survey_sections")
      .select("id")
      .limit(1);

    if (normalizedError && normalizedError.message.includes("does not exist")) {
      console.warn("Normalized schema not found. Running in legacy mode.");
      console.warn(
        "To enable optimized features, run migration-v2-normalized-schema.sql"
      );
    } else {
      console.log("Normalized schema detected. Optimized features available.");
    }

    console.log("Supabase connection test successful");
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
   * Create a temporary admin client for privileged operations
   * This client is created on-demand and not cached to avoid multiple client issues
   */
  async withElevatedPrivileges<T>(
    operation: (client: SupabaseClient) => Promise<T>
  ): Promise<T> {
    if (!this.serviceRoleKey || this.serviceRoleKey === "your_service_role_key_here") {
      console.warn("Service role key not available, using regular client");
      return operation(this.getCurrentClient());
    }

    if (!this.globalConfig) {
      throw new Error("Client not properly initialized");
    }

    // Create temporary admin client for this operation only
    const adminClient = createClient(
      this.globalConfig.url,
      this.serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          storage: undefined,
        },
      }
    );

    try {
      return await operation(adminClient);
    } finally {
      // Admin client will be garbage collected after this scope
      // No explicit cleanup needed
    }
  }

  /**
   * Create a temporary anonymous client for public survey operations
   * This bypasses authentication but respects RLS policies for anonymous users
   */
  async withAnonymousAccess<T>(
    operation: (client: SupabaseClient) => Promise<T>
  ): Promise<T> {
    if (!this.globalConfig) {
      throw new Error("Client not properly initialized");
    }

    // Create temporary anonymous client for this operation only
    const anonClient = createClient(
      this.globalConfig.url,
      this.globalConfig.anonKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          storage: undefined,
        },
      }
    );

    try {
      return await operation(anonClient);
    } finally {
      // Anonymous client will be garbage collected after this scope
      // No explicit cleanup needed
    }
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