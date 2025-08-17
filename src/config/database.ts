import { databaseService } from '../services/database.service';
import { createDatabaseConfig, validateDatabaseConfig } from './database.config';

// Database initialization state management
let isInitialized = false;
let initializationPromise: Promise<void> | null = null;
let initializationError: Error | null = null;

export async function initializeDatabase(retryOnFailure = true): Promise<void> {
  // If already initialized, return immediately
  if (isInitialized) {
    console.log('Database already initialized, skipping');
    return;
  }

  // If initialization failed before, throw the cached error
  if (initializationError && !retryOnFailure) {
    throw initializationError;
  }

  // If initialization is in progress, wait for it
  if (initializationPromise) {
    console.log('Database initialization already in progress, waiting...');
    try {
      await initializationPromise;
      return;
    } catch (error) {
      // If the shared promise failed, we can retry if allowed
      if (!retryOnFailure) {
        throw error;
      }
      // Clear the failed promise so we can retry
      initializationPromise = null;
      initializationError = error instanceof Error ? error : new Error(String(error));
    }
  }

  // Start new initialization
  initializationPromise = performInitialization();
  
  try {
    await initializationPromise;
    isInitialized = true;
    initializationError = null;
    console.log('Database service initialized successfully');
  } catch (error) {
    initializationPromise = null;
    initializationError = error instanceof Error ? error : new Error(String(error));
    
    // Provide helpful error messages for common issues
    if (error instanceof Error) {
      if (error.message.includes('process is not defined')) {
        console.error('💡 This error usually means you\'re trying to use a Node.js library in the browser. Please check your database provider configuration.');
      } else if (error.message.includes('Unknown database provider')) {
        console.error('💡 Suggestion: Set your Supabase configuration in your .env file.');
      } else if (error.message.includes('Database tables not found')) {
        console.error('💡 Database schema not set up. Please run the setup script for your database provider.');
      }
    }
    
    throw error;
  }
}

async function performInitialization(): Promise<void> {
  const config = createDatabaseConfig();
  validateDatabaseConfig(config);
  
  console.log(`Initializing database with provider: ${config.provider}`);
  await databaseService.initialize(config);
}

// Helper function to retry database initialization
export async function retryDatabaseInitialization(
  maxAttempts = parseInt(import.meta.env.VITE_DATABASE_MAX_RETRIES) || 3, 
  delay = parseInt(import.meta.env.VITE_DATABASE_RETRY_DELAY) || 60000
): Promise<void> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`Database initialization retry attempt ${attempt}/${maxAttempts}`);
      await initializeDatabase(false); // Don't auto-retry within initializeDatabase
      return; // Success
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`Database initialization attempt ${attempt} failed:`, lastError.message);
      
      // Don't retry on configuration or schema errors
      if (lastError.message.includes('Database tables not found') ||
          lastError.message.includes('Unknown database provider') ||
          lastError.message.includes('configuration is required')) {
        throw lastError;
      }
      
      if (attempt < maxAttempts) {
        const waitTime = delay * attempt; // Linear backoff
        console.log(`Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  throw lastError || new Error('Database initialization failed after all retry attempts');
}

// Export the database helpers for use throughout the app
export const authHelpers = {
  get signInAnonymously() {
    if (!databaseService.isInitialized()) {
      throw new Error('Database service not initialized. Call initializeDatabase() first.');
    }
    return databaseService.authHelpers.signInAnonymously.bind(databaseService.authHelpers);
  },
  
  get getCurrentUser() {
    if (!databaseService.isInitialized()) {
      throw new Error('Database service not initialized. Call initializeDatabase() first.');
    }
    return databaseService.authHelpers.getCurrentUser.bind(databaseService.authHelpers);
  },
  
  get onAuthStateChanged() {
    if (!databaseService.isInitialized()) {
      throw new Error('Database service not initialized. Call initializeDatabase() first.');
    }
    return databaseService.authHelpers.onAuthStateChanged.bind(databaseService.authHelpers);
  },
};

export const firestoreHelpers = {
  // Legacy survey functions
  get getSurveys() {
    if (!databaseService.isInitialized()) {
      throw new Error('Database service not initialized. Call initializeDatabase() first.');
    }
    return databaseService.databaseHelpers.getSurveys.bind(databaseService.databaseHelpers);
  },
  
  get addSurvey() {
    if (!databaseService.isInitialized()) {
      throw new Error('Database service not initialized. Call initializeDatabase() first.');
    }
    return databaseService.databaseHelpers.addSurvey.bind(databaseService.databaseHelpers);
  },
  
  get updateSurvey() {
    if (!databaseService.isInitialized()) {
      throw new Error('Database service not initialized. Call initializeDatabase() first.');
    }
    return databaseService.databaseHelpers.updateSurvey.bind(databaseService.databaseHelpers);
  },
  
  get deleteSurvey() {
    if (!databaseService.isInitialized()) {
      throw new Error('Database service not initialized. Call initializeDatabase() first.');
    }
    return databaseService.databaseHelpers.deleteSurvey.bind(databaseService.databaseHelpers);
  },

  // Survey Configs
  get getSurveyConfigs() {
    if (!databaseService.isInitialized()) {
      throw new Error('Database service not initialized. Call initializeDatabase() first.');
    }
    return databaseService.databaseHelpers.getSurveyConfigs.bind(databaseService.databaseHelpers);
  },
  
  get getSurveyConfig() {
    if (!databaseService.isInitialized()) {
      throw new Error('Database service not initialized. Call initializeDatabase() first.');
    }
    return databaseService.databaseHelpers.getSurveyConfig.bind(databaseService.databaseHelpers);
  },
  
  get addSurveyConfig() {
    if (!databaseService.isInitialized()) {
      throw new Error('Database service not initialized. Call initializeDatabase() first.');
    }
    return databaseService.databaseHelpers.addSurveyConfig.bind(databaseService.databaseHelpers);
  },
  
  get updateSurveyConfig() {
    if (!databaseService.isInitialized()) {
      throw new Error('Database service not initialized. Call initializeDatabase() first.');
    }
    return databaseService.databaseHelpers.updateSurveyConfig.bind(databaseService.databaseHelpers);
  },
  
  get deleteSurveyConfig() {
    if (!databaseService.isInitialized()) {
      throw new Error('Database service not initialized. Call initializeDatabase() first.');
    }
    return databaseService.databaseHelpers.deleteSurveyConfig.bind(databaseService.databaseHelpers);
  },

  // Survey Instances
  get getSurveyInstances() {
    if (!databaseService.isInitialized()) {
      throw new Error('Database service not initialized. Call initializeDatabase() first.');
    }
    return databaseService.databaseHelpers.getSurveyInstances.bind(databaseService.databaseHelpers);
  },
  
  get getSurveyInstancesByConfig() {
    if (!databaseService.isInitialized()) {
      throw new Error('Database service not initialized. Call initializeDatabase() first.');
    }
    return databaseService.databaseHelpers.getSurveyInstancesByConfig.bind(databaseService.databaseHelpers);
  },
  
  get addSurveyInstance() {
    if (!databaseService.isInitialized()) {
      throw new Error('Database service not initialized. Call initializeDatabase() first.');
    }
    return databaseService.databaseHelpers.addSurveyInstance.bind(databaseService.databaseHelpers);
  },
  
  get updateSurveyInstance() {
    if (!databaseService.isInitialized()) {
      throw new Error('Database service not initialized. Call initializeDatabase() first.');
    }
    return databaseService.databaseHelpers.updateSurveyInstance.bind(databaseService.databaseHelpers);
  },
  
  get deleteSurveyInstance() {
    if (!databaseService.isInitialized()) {
      throw new Error('Database service not initialized. Call initializeDatabase() first.');
    }
    return databaseService.databaseHelpers.deleteSurveyInstance.bind(databaseService.databaseHelpers);
  },

  // Survey Responses
  get addSurveyResponse() {
    if (!databaseService.isInitialized()) {
      throw new Error('Database service not initialized. Call initializeDatabase() first.');
    }
    return databaseService.databaseHelpers.addSurveyResponse.bind(databaseService.databaseHelpers);
  },
  
  get getSurveyResponses() {
    if (!databaseService.isInitialized()) {
      throw new Error('Database service not initialized. Call initializeDatabase() first.');
    }
    return databaseService.databaseHelpers.getSurveyResponses.bind(databaseService.databaseHelpers);
  },
  
  get getSurveyResponsesFromCollection() {
    if (!databaseService.isInitialized()) {
      throw new Error('Database service not initialized. Call initializeDatabase() first.');
    }
    return databaseService.databaseHelpers.getSurveyResponsesFromCollection.bind(databaseService.databaseHelpers);
  },

  // Rating Scales
  get getRatingScales() {
    if (!databaseService.isInitialized()) {
      throw new Error('Database service not initialized. Call initializeDatabase() first.');
    }
    return databaseService.databaseHelpers.getRatingScales.bind(databaseService.databaseHelpers);
  },
  
  get getRatingScale() {
    if (!databaseService.isInitialized()) {
      throw new Error('Database service not initialized. Call initializeDatabase() first.');
    }
    return databaseService.databaseHelpers.getRatingScale.bind(databaseService.databaseHelpers);
  },
  
  get addRatingScale() {
    if (!databaseService.isInitialized()) {
      throw new Error('Database service not initialized. Call initializeDatabase() first.');
    }
    return databaseService.databaseHelpers.addRatingScale.bind(databaseService.databaseHelpers);
  },
  
  get updateRatingScale() {
    if (!databaseService.isInitialized()) {
      throw new Error('Database service not initialized. Call initializeDatabase() first.');
    }
    return databaseService.databaseHelpers.updateRatingScale.bind(databaseService.databaseHelpers);
  },
  
  get deleteRatingScale() {
    if (!databaseService.isInitialized()) {
      throw new Error('Database service not initialized. Call initializeDatabase() first.');
    }
    return databaseService.databaseHelpers.deleteRatingScale.bind(databaseService.databaseHelpers);
  },

  // Radio Option Sets
  get getRadioOptionSets() {
    if (!databaseService.isInitialized()) {
      throw new Error('Database service not initialized. Call initializeDatabase() first.');
    }
    return databaseService.databaseHelpers.getRadioOptionSets.bind(databaseService.databaseHelpers);
  },
  
  get getRadioOptionSet() {
    if (!databaseService.isInitialized()) {
      throw new Error('Database service not initialized. Call initializeDatabase() first.');
    }
    return databaseService.databaseHelpers.getRadioOptionSet.bind(databaseService.databaseHelpers);
  },
  
  get addRadioOptionSet() {
    if (!databaseService.isInitialized()) {
      throw new Error('Database service not initialized. Call initializeDatabase() first.');
    }
    return databaseService.databaseHelpers.addRadioOptionSet.bind(databaseService.databaseHelpers);
  },
  
  get updateRadioOptionSet() {
    if (!databaseService.isInitialized()) {
      throw new Error('Database service not initialized. Call initializeDatabase() first.');
    }
    return databaseService.databaseHelpers.updateRadioOptionSet.bind(databaseService.databaseHelpers);
  },
  
  get deleteRadioOptionSet() {
    if (!databaseService.isInitialized()) {
      throw new Error('Database service not initialized. Call initializeDatabase() first.');
    }
    return databaseService.databaseHelpers.deleteRadioOptionSet.bind(databaseService.databaseHelpers);
  },

  // Multi-Select Option Sets
  get getMultiSelectOptionSets() {
    if (!databaseService.isInitialized()) {
      throw new Error('Database service not initialized. Call initializeDatabase() first.');
    }
    return databaseService.databaseHelpers.getMultiSelectOptionSets.bind(databaseService.databaseHelpers);
  },
  
  get getMultiSelectOptionSet() {
    if (!databaseService.isInitialized()) {
      throw new Error('Database service not initialized. Call initializeDatabase() first.');
    }
    return databaseService.databaseHelpers.getMultiSelectOptionSet.bind(databaseService.databaseHelpers);
  },
  
  get addMultiSelectOptionSet() {
    if (!databaseService.isInitialized()) {
      throw new Error('Database service not initialized. Call initializeDatabase() first.');
    }
    return databaseService.databaseHelpers.addMultiSelectOptionSet.bind(databaseService.databaseHelpers);
  },
  
  get updateMultiSelectOptionSet() {
    if (!databaseService.isInitialized()) {
      throw new Error('Database service not initialized. Call initializeDatabase() first.');
    }
    return databaseService.databaseHelpers.updateMultiSelectOptionSet.bind(databaseService.databaseHelpers);
  },
  
  get deleteMultiSelectOptionSet() {
    if (!databaseService.isInitialized()) {
      throw new Error('Database service not initialized. Call initializeDatabase() first.');
    }
    return databaseService.databaseHelpers.deleteMultiSelectOptionSet.bind(databaseService.databaseHelpers);
  },

  // Select Option Sets
  get getSelectOptionSets() {
    if (!databaseService.isInitialized()) {
      throw new Error('Database service not initialized. Call initializeDatabase() first.');
    }
    return databaseService.databaseHelpers.getSelectOptionSets.bind(databaseService.databaseHelpers);
  },
  
  get getSelectOptionSet() {
    if (!databaseService.isInitialized()) {
      throw new Error('Database service not initialized. Call initializeDatabase() first.');
    }
    return databaseService.databaseHelpers.getSelectOptionSet.bind(databaseService.databaseHelpers);
  },
  
  get addSelectOptionSet() {
    if (!databaseService.isInitialized()) {
      throw new Error('Database service not initialized. Call initializeDatabase() first.');
    }
    return databaseService.databaseHelpers.addSelectOptionSet.bind(databaseService.databaseHelpers);
  },
  
  get updateSelectOptionSet() {
    if (!databaseService.isInitialized()) {
      throw new Error('Database service not initialized. Call initializeDatabase() first.');
    }
    return databaseService.databaseHelpers.updateSelectOptionSet.bind(databaseService.databaseHelpers);
  },
  
  get deleteSelectOptionSet() {
    if (!databaseService.isInitialized()) {
      throw new Error('Database service not initialized. Call initializeDatabase() first.');
    }
    return databaseService.databaseHelpers.deleteSelectOptionSet.bind(databaseService.databaseHelpers);
  },

  // Verification helper
  async verifyInstanceCollectionSeparation() {
    console.log('🔍 Collection separation verification not implemented for this provider');
    return {
      totalInstances: 0,
      properlyIsolated: 0,
      hasErrors: 0,
      results: [],
    };
  },
};

// Utility function to get current provider info
export function getDatabaseProviderInfo() {
  return {
    provider: databaseService.getCurrentProvider(),
    isInitialized: databaseService.isInitialized(),
  };
}