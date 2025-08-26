import { databaseService } from "../services/database.service";
import {
  createDatabaseConfig,
  validateDatabaseConfig,
} from "./database.config";
import type { AuthHelpers, DatabaseHelpers } from "../types/database.types";

/**
 * Database initialization state management
 */
class DatabaseInitializationManager {
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;
  private initializationError: Error | null = null;

  async initialize(retryOnFailure = true): Promise<void> {
    // If already initialized, return immediately
    if (this.isInitialized) {
      console.log("Database already initialized, skipping");
      return;
    }

    // If initialization failed before, throw the cached error
    if (this.initializationError && !retryOnFailure) {
      throw this.initializationError;
    }

    // If initialization is in progress, wait for it
    if (this.initializationPromise) {
      console.log("Database initialization already in progress, waiting...");
      try {
        await this.initializationPromise;
        return;
      } catch (error) {
        // If the shared promise failed, we can retry if allowed
        if (!retryOnFailure) {
          throw error;
        }
        // Clear the failed promise so we can retry
        this.initializationPromise = null;
        this.initializationError =
          error instanceof Error ? error : new Error(String(error));
      }
    }

    // Start new initialization
    this.initializationPromise = this.performInitialization();

    try {
      await this.initializationPromise;
      this.isInitialized = true;
      this.initializationError = null;
      console.log("Database service initialized successfully");
    } catch (error) {
      this.initializationPromise = null;
      this.initializationError =
        error instanceof Error ? error : new Error(String(error));

      this.handleInitializationError(error);
      throw error;
    }
  }

  private async performInitialization(): Promise<void> {
    const config = createDatabaseConfig();
    validateDatabaseConfig(config);

    console.log(`Initializing database with provider: ${config.provider}`);
    await databaseService.initialize(config);
  }

  private handleInitializationError(error: unknown): void {
    if (error instanceof Error) {
      const errorHandlers = {
        "process is not defined": () => console.error(
          "💡 This error usually means you're trying to use a Node.js library in the browser. Please check your database provider configuration."
        ),
        "Unknown database provider": () => console.error(
          "💡 Suggestion: Set your Supabase configuration in your .env file."
        ),
        "Database tables not found": () => console.error(
          "💡 Database schema not set up. Please run the setup script for your database provider."
        )
      };

      Object.entries(errorHandlers).forEach(([errorText, handler]) => {
        if (error.message.includes(errorText)) {
          handler();
        }
      });
    }
  }

  async retryInitialization(
    maxAttempts = parseInt(import.meta.env.VITE_DATABASE_MAX_RETRIES) || 3,
    delay = parseInt(import.meta.env.VITE_DATABASE_RETRY_DELAY) || 60000
  ): Promise<void> {
    let lastError: Error | null = null;
    const nonRetryableErrors = [
      "Database tables not found",
      "Unknown database provider",
      "configuration is required"
    ];

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(
          `Database initialization retry attempt ${attempt}/${maxAttempts}`
        );
        await this.initialize(false); // Don't auto-retry within initialize
        return; // Success
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(
          `Database initialization attempt ${attempt} failed:`,
          lastError.message
        );

        // Don't retry on configuration or schema errors
        const isNonRetryable = nonRetryableErrors.some(errorText => 
          lastError!.message.includes(errorText)
        );
        
        if (isNonRetryable) {
          throw lastError;
        }

        if (attempt < maxAttempts) {
          const waitTime = delay * attempt; // Linear backoff
          console.log(`Waiting ${waitTime}ms before retry...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      }
    }

    throw (
      lastError ||
      new Error("Database initialization failed after all retry attempts")
    );
  }
}

// Create singleton instance
const initializationManager = new DatabaseInitializationManager();

// Export public API
export const initializeDatabase = (retryOnFailure?: boolean) => 
  initializationManager.initialize(retryOnFailure);

export const retryDatabaseInitialization = (
  maxAttempts?: number,
  delay?: number
) => initializationManager.retryInitialization(maxAttempts, delay);

/**
 * Dynamic proxy factory for creating helper objects with initialization validation
 * This eliminates code repetition and makes adding new methods easier
 */
class DatabaseHelperProxy {
  private static readonly INITIALIZATION_ERROR_MESSAGE = 
    "Database service not initialized. Call initializeDatabase() first.";

  /**
   * Creates a proxy for a helper object that validates initialization before method calls
   * @param getHelperObject Function that returns the actual helper object from database service
   * @param customMethods Optional custom methods to add to the proxy
   */
  static createProxy<T extends object>(
    getHelperObject: () => T,
    customMethods?: Partial<T>
  ): T {
    const cache = new Map<string | symbol, any>();

    return new Proxy({} as T, {
      get(_target, prop: string | symbol) {
        // Return custom methods if they exist
        if (customMethods && prop in customMethods) {
          return customMethods[prop as keyof T];
        }

        // Check if method is cached
        if (cache.has(prop)) {
          return cache.get(prop);
        }

        // Return a function that checks initialization when called
        // This prevents errors during object destructuring or property access
        const proxyMethod = function(this: any, ...args: any[]) {
          // Validate initialization when the method is actually called
          if (!databaseService.isInitialized()) {
            throw new Error(DatabaseHelperProxy.INITIALIZATION_ERROR_MESSAGE);
          }

          let helperObject: T;
          try {
            helperObject = getHelperObject();
          } catch (error) {
            console.error("Error getting helper object:", error);
            throw new Error("Database service helpers are not available");
          }

          if (!helperObject) {
            throw new Error("Database helpers are not available");
          }

          const value = helperObject[prop as keyof T];

          if (typeof value === 'function') {
            return (value as (...args: any[]) => any).apply(helperObject, args);
          } else if (value !== undefined) {
            return value;
          } else {
            throw new Error(`Method ${String(prop)} is not available in database helpers`);
          }
        };

        cache.set(prop, proxyMethod);
        return proxyMethod;
      },

      has(_target, prop) {
        if (customMethods && prop in customMethods) {
          return true;
        }

        // Always return true for methods that could exist
        // The actual validation happens when the method is called
        if (typeof prop === 'string' || typeof prop === 'symbol') {
          return true;
        }

        return false;
      },

      ownKeys(_target) {
        const customKeys = customMethods ? Object.keys(customMethods) : [];
        
        // Return a basic set of expected keys for enumeration
        // The proxy will handle actual method resolution dynamically
        const basicKeys = [
          'getSurveys', 'addSurvey', 'updateSurvey', 'deleteSurvey',
          'getSurveyConfigs', 'getSurveyConfig', 'addSurveyConfig', 'updateSurveyConfig', 'deleteSurveyConfig',
          'getSurveyInstances', 'getSurveyInstancesByConfig', 'addSurveyInstance', 'updateSurveyInstance', 'deleteSurveyInstance',
          'addSurveyResponse', 'getSurveyResponses', 'getSurveyResponsesFromCollection',
          'getRatingScales', 'getRatingScale', 'addRatingScale', 'updateRatingScale', 'deleteRatingScale',
          'getRadioOptionSets', 'getRadioOptionSet', 'addRadioOptionSet', 'updateRadioOptionSet', 'deleteRadioOptionSet',
          'getMultiSelectOptionSets', 'getMultiSelectOptionSet', 'addMultiSelectOptionSet', 'updateMultiSelectOptionSet', 'deleteMultiSelectOptionSet',
          'getSelectOptionSets', 'getSelectOptionSet', 'addSelectOptionSet', 'updateSelectOptionSet', 'deleteSelectOptionSet',
          'updateSurveyInstanceStatuses', 'clearValidationLocks', 'getUpcomingStatusChanges', 'getSurveyInstanceStatusChanges',
          'addSurveySession', 'updateSurveySession', 'getSurveySessionByToken', 'getSurveySession', 'getSurveySessions'
        ];
        
        return Array.from(new Set([...basicKeys, ...customKeys]));
      },

      getOwnPropertyDescriptor(_target, prop) {
        // Make all properties enumerable for proper object iteration
        if (typeof prop === 'string' || typeof prop === 'symbol') {
          return {
            enumerable: true,
            configurable: true,
            writable: true,
          };
        }

        return undefined;
      }
    });
  }
}

/**
 * Authentication helpers with automatic initialization validation
 */
export const authHelpers: AuthHelpers = DatabaseHelperProxy.createProxy<AuthHelpers>(
  () => databaseService.authHelpers
);

/**
 * Database helpers with automatic initialization validation and custom methods
 */
export const databaseHelpers = DatabaseHelperProxy.createProxy<DatabaseHelpers>(
  () => databaseService.databaseHelpers,
  {
    // Custom method that doesn't require database initialization
    async verifyInstanceCollectionSeparation() {
      console.log(
        "🔍 Collection separation verification not implemented for this provider"
      );
      return {
        totalInstances: 0,
        properlyIsolated: 0,
        hasErrors: 0,
        results: [],
      };
    },
  } as any
) as DatabaseHelpers & {
  verifyInstanceCollectionSeparation(): Promise<{
    totalInstances: number;
    properlyIsolated: number;
    hasErrors: number;
    results: any[];
  }>;
};

/**
 * Utility function to get current provider info
 * This function provides safe access to provider information without requiring initialization
 */
export const getDatabaseProviderInfo = (): {
  provider: string;
  isInitialized: boolean;
} => {
  return {
    provider: databaseService.getCurrentProvider(),
    isInitialized: databaseService.isInitialized(),
  };
}

/**
 * Type-safe helper to check if database is initialized before performing operations
 * @param operation Function to execute if database is initialized
 * @param fallback Optional fallback value if database is not initialized
 */
export const withDatabaseInitialized = <T>(
  operation: () => T,
  fallback?: T
): T | undefined => {
  if (!databaseService.isInitialized()) {
    if (fallback !== undefined) {
      return fallback;
    }
    console.warn("Database service not initialized. Operation skipped.");
    return undefined;
  }
  return operation();
}
