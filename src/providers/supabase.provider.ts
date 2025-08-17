import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  AuthHelpers,
  DatabaseConfig,
  DatabaseHelpers,
  DatabaseProvider_Interface,
} from "../types/database.types";
import {
  MultiSelectOptionSet,
  RadioOptionSet,
  RatingScale,
  SelectOptionSet,
  SurveyConfig,
  SurveyInstance,
  SurveyResponse,
} from "../types/framework.types";
import {
  createMetadata,
  mergeMetadata,
  updateMetadata,
} from "../utils/metadata.utils";

// Global flag to prevent multiple Supabase client instances
let globalSupabaseClient: SupabaseClient | null = null;
let globalSupabaseConfig: { url: string; anonKey: string } | null = null;

// State variables
let supabase: SupabaseClient | null = null;
let initialized = false;

// Helper method to ensure client is initialized
const ensureClient = (): SupabaseClient => {
  if (!supabase) {
    throw new Error(
      "Supabase client not initialized. Please call initialize() first."
    );
  }
  return supabase;
};

// Helper method to validate ID
const validateId = (id: string, operation: string): void => {
  if (!id || id.trim() === "") {
    throw new Error(`Invalid ID for ${operation}: ID cannot be empty`);
  }
};

// Transform database rows to application types
const transformRatingScaleFromDb = (dbRow: any): RatingScale => {
  return {
    id: dbRow.id,
    name: dbRow.name,
    description: dbRow.description,
    options: dbRow.options,
    isActive: dbRow.is_active,
    metadata: dbRow.metadata,
  };
};

const transformOptionSetFromDb = (dbRow: any): RadioOptionSet => {
  return {
    id: dbRow.id,
    name: dbRow.name,
    description: dbRow.description,
    options: dbRow.options,
    isActive: dbRow.is_active,
    metadata: dbRow.metadata,
  };
};

const transformMultiSelectOptionSetFromDb = (
  dbRow: any
): MultiSelectOptionSet => {
  return {
    id: dbRow.id,
    name: dbRow.name,
    description: dbRow.description,
    options: dbRow.options,
    maxSelections: dbRow.max_selections,
    minSelections: dbRow.min_selections,
    isActive: dbRow.is_active,
    metadata: dbRow.metadata,
  };
};

const transformSelectOptionSetFromDb = (dbRow: any): SelectOptionSet => {
  return {
    id: dbRow.id,
    name: dbRow.name,
    description: dbRow.description,
    options: dbRow.options,
    allowMultiple: dbRow.allow_multiple,
    isActive: dbRow.is_active,
    metadata: dbRow.metadata,
  };
};

// Test connection method
const testConnection = async (): Promise<void> => {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  try {
    // Test connection with a timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Connection test timeout")), 10000); // 10 second timeout
    });

    const testPromise = supabase.from("survey_configs").select("id").limit(1);

    const { error } = (await Promise.race([
      testPromise,
      timeoutPromise,
    ])) as any;

    if (error) {
      if (error.message.includes('relation "survey_configs" does not exist')) {
        throw new Error(
          "Database tables not found. Please run the setup script from scripts/setup-supabase.sql in your Supabase SQL Editor. See SUPABASE_SETUP.md for instructions."
        );
      }
      throw error;
    }

    console.log("Supabase connection test successful");
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Database tables not found")
    ) {
      throw error;
    }
    throw new Error(
      `Connection test failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};

export const SupabaseProvider: DatabaseProvider_Interface = {
  async initialize(config: DatabaseConfig): Promise<void> {
    if (initialized && supabase) {
      console.log("Supabase provider already initialized");
      return;
    }

    if (!config.supabase) {
      throw new Error("Supabase configuration is required");
    }

    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Supabase initialization attempt ${attempt}/${maxRetries}`);

        // Reuse existing client if configuration matches
        if (
          globalSupabaseClient &&
          globalSupabaseConfig &&
          globalSupabaseConfig.url === config.supabase.url &&
          globalSupabaseConfig.anonKey === config.supabase.anonKey
        ) {
          console.log("Reusing existing Supabase client");
          supabase = globalSupabaseClient;
        } else {
          console.log("Creating new Supabase client");
          supabase = createClient(config.supabase.url, config.supabase.anonKey);
          globalSupabaseClient = supabase;
          globalSupabaseConfig = {
            url: config.supabase.url,
            anonKey: config.supabase.anonKey,
          };
        }

        if (!supabase) {
          throw new Error("Failed to create Supabase client");
        }

        // Test the connection and check if tables exist with timeout
        await testConnection();

        initialized = true;
        console.log("Supabase provider initialized successfully");
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(
          `Supabase initialization attempt ${attempt} failed:`,
          lastError.message
        );

        // Don't retry on schema errors
        if (
          lastError.message.includes("Database tables not found") ||
          lastError.message.includes('relation "survey_configs" does not exist')
        ) {
          break;
        }

        supabase = null;
        initialized = false;

        // Wait before retrying (exponential backoff)
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Cap at 5 seconds
          console.log(`Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    // If we get here, all attempts failed
    console.error(
      "Failed to initialize Supabase provider after all attempts:",
      lastError
    );
    supabase = null;
    initialized = false;
    throw lastError || new Error("Unknown initialization error");
  },

  isInitialized(): boolean {
    return initialized;
  },

  get authHelpers(): AuthHelpers {
    return {
      async signInAnonymously() {
        try {
          // Supabase doesn't have anonymous auth like Firebase,
          // so we'll create a simple guest user session
          const user = { id: "anonymous", isAnonymous: true };
          return user;
        } catch (error) {
          console.error("Error signing in anonymously:", error);
          throw error;
        }
      },

      getCurrentUser: () => {
        // For now, return a default anonymous user
        // In a real implementation, this would check Supabase auth state
        return { id: "anonymous", isAnonymous: true };
      },

      onAuthStateChanged: (callback: (user: any) => void) => {
        // Simple implementation - just call with current user
        const user = { id: "anonymous", isAnonymous: true };
        callback(user);
        return () => {}; // Return unsubscribe function
      },
    };
  },

  get databaseHelpers(): DatabaseHelpers {
    return {
      // Legacy survey functions
      getSurveys: async () => {
        try {
          const client = ensureClient();
          const { data, error } = await client
            .from("surveys")
            .select("*")
            .order("created_at", { ascending: false });

          if (error) throw error;
          return data || [];
        } catch (error) {
          console.error("Error getting surveys:", error);
          throw error;
        }
      },

      addSurvey: async (surveyData: any) => {
        try {
          const { data, error } = await ensureClient()
            .from("surveys")
            .insert({
              ...surveyData,
              submitted_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (error) throw error;
          return data;
        } catch (error) {
          console.error("Error adding survey:", error);
          throw error;
        }
      },

      updateSurvey: async (id: string, data: any) => {
        try {
          validateId(id, "updateSurvey");
          const updateData = { ...data };
          if (data.metadata) {
            updateData.metadata = updateMetadata(data.metadata);
          } else {
            updateData.metadata = updateMetadata(await createMetadata());
          }

          const { error } = await ensureClient()
            .from("surveys")
            .update(updateData)
            .eq("id", id);

          if (error) throw error;
        } catch (error) {
          console.error("Error updating survey:", error);
          throw error;
        }
      },

      deleteSurvey: async (id: string) => {
        try {
          validateId(id, "deleteSurvey");
          const { error } = await ensureClient()
            .from("surveys")
            .delete()
            .eq("id", id);

          if (error) throw error;
        } catch (error) {
          console.error("Error deleting survey:", error);
          throw error;
        }
      },

      // Survey Configs
      getSurveyConfigs: async () => {
        try {
          const { data, error } = await ensureClient()
            .from("survey_configs")
            .select("*")
            .order("metadata->createdAt", { ascending: false });

          if (error) throw error;

          // Map Supabase field names back to application format
          return (data || []).map((config: any) => {
            const { is_active, paginator_config, footer_config, ...rest } =
              config;
            return {
              ...rest,
              isActive: is_active,
              paginatorConfig: paginator_config,
              footerConfig: footer_config,
            };
          });
        } catch (error) {
          console.error("Error getting survey configs:", error);
          throw error;
        }
      },

      getSurveyConfig: async (id: string) => {
        try {
          validateId(id, "getSurveyConfig");
          const { data, error } = await ensureClient()
            .from("survey_configs")
            .select("*")
            .eq("id", id)
            .single();

          if (error) {
            if (error.code === "PGRST116") return null; // Not found
            throw error;
          }

          if (data) {
            // Map Supabase field names back to application format
            const { is_active, paginator_config, footer_config, ...rest } =
              data;
            return {
              ...rest,
              isActive: is_active,
              paginatorConfig: paginator_config,
              footerConfig: footer_config,
            };
          }

          return data;
        } catch (error) {
          console.error("Error getting survey config:", error);
          throw error;
        }
      },

      addSurveyConfig: async (config: Omit<SurveyConfig, "id">) => {
        try {
          const {
            isActive,
            paginatorConfig,
            footerConfig,
            ...configWithoutMappedFields
          } = config;
          const configData = {
            ...configWithoutMappedFields,
            is_active: isActive ?? true,
            paginator_config: paginatorConfig || {},
            footer_config: footerConfig || {},
            version: config.version || "1.0.0",
            metadata: await mergeMetadata(config.metadata),
          };

          const { data, error } = await ensureClient()
            .from("survey_configs")
            .insert(configData)
            .select()
            .single();

          if (error) throw error;
          return data;
        } catch (error) {
          console.error("Error adding survey config:", error);
          throw error;
        }
      },

      updateSurveyConfig: async (id: string, data: Partial<SurveyConfig>) => {
        try {
          validateId(id, "updateSurveyConfig");
          const {
            isActive,
            paginatorConfig,
            footerConfig,
            ...updateDataWithoutMappedFields
          } = data;
          const updateData: any = { ...updateDataWithoutMappedFields };

          // Map field names for Supabase
          if (isActive !== undefined) {
            updateData.is_active = isActive;
          }
          if (paginatorConfig !== undefined) {
            updateData.paginator_config = paginatorConfig;
          }
          if (footerConfig !== undefined) {
            updateData.footer_config = footerConfig;
          }

          if (data.metadata) {
            updateData.metadata = updateMetadata(data.metadata as any);
          } else {
            updateData.metadata = updateMetadata(await createMetadata());
          }

          const { error } = await ensureClient()
            .from("survey_configs")
            .update(updateData)
            .eq("id", id);

          if (error) throw error;
        } catch (error) {
          console.error("Error updating survey config:", error);
          throw error;
        }
      },

      deleteSurveyConfig: async (id: string) => {
        try {
          validateId(id, "deleteSurveyConfig");
          const { error } = await ensureClient()
            .from("survey_configs")
            .delete()
            .eq("id", id);

          if (error) throw error;
        } catch (error) {
          console.error("Error deleting survey config:", error);
          throw error;
        }
      },

      // Survey Instances
      getSurveyInstances: async () => {
        try {
          const { data, error } = await ensureClient()
            .from("survey_instances")
            .select("*");

          if (error) throw error;

          // Map Supabase field names back to application format
          return (data || []).map((instance: any) => {
            const {
              config_id,
              is_active,
              active_date_range,
              paginator_config,
              ...rest
            } = instance;
            return {
              ...rest,
              configId: config_id,
              isActive: is_active,
              activeDateRange: active_date_range,
              paginatorConfig: paginator_config,
            };
          });
        } catch (error) {
          console.error("Error getting survey instances:", error);
          throw error;
        }
      },

      getSurveyInstancesByConfig: async (configId: string) => {
        try {
          const { data, error } = await ensureClient()
            .from("survey_instances")
            .select("*")
            .eq("config_id", configId);

          if (error) throw error;

          // Map Supabase field names back to application format
          return (data || []).map((instance: any) => {
            const {
              config_id,
              is_active,
              active_date_range,
              paginator_config,
              ...rest
            } = instance;
            return {
              ...rest,
              configId: config_id,
              isActive: is_active,
              activeDateRange: active_date_range,
              paginatorConfig: paginator_config,
            };
          });
        } catch (error) {
          console.error("Error getting survey instances by config:", error);
          throw error;
        }
      },

      addSurveyInstance: async (instance: Omit<SurveyInstance, "id">) => {
        try {
          const {
            configId,
            isActive,
            activeDateRange,
            paginatorConfig,
            ...instanceWithoutMappedFields
          } = instance;
          const instanceData = {
            ...instanceWithoutMappedFields,
            config_id: configId,
            is_active: isActive,
            active_date_range: activeDateRange,
            paginator_config: paginatorConfig || {},
            metadata: await mergeMetadata(instance.metadata),
          };

          const { data, error } = await ensureClient()
            .from("survey_instances")
            .insert(instanceData)
            .select()
            .single();

          if (error) throw error;

          // Map back to application format
          const {
            config_id,
            is_active,
            active_date_range,
            paginator_config,
            ...rest
          } = data;
          return {
            ...rest,
            configId: config_id,
            isActive: is_active,
            activeDateRange: active_date_range,
            paginatorConfig: paginator_config,
          };
        } catch (error) {
          console.error("Error adding survey instance:", error);
          throw error;
        }
      },

      updateSurveyInstance: async (
        id: string,
        data: Partial<SurveyInstance>
      ) => {
        try {
          validateId(id, "updateSurveyInstance");
          const {
            configId,
            isActive,
            activeDateRange,
            paginatorConfig,
            ...updateDataWithoutMappedFields
          } = data;
          const updateData: any = { ...updateDataWithoutMappedFields };

          // Map field names for Supabase
          if (configId !== undefined) updateData.config_id = configId;
          if (isActive !== undefined) updateData.is_active = isActive;
          if (activeDateRange !== undefined)
            updateData.active_date_range = activeDateRange;
          if (paginatorConfig !== undefined)
            updateData.paginator_config = paginatorConfig;

          if (data.metadata) {
            updateData.metadata = updateMetadata(data.metadata as any);
          } else {
            updateData.metadata = updateMetadata(await createMetadata());
          }

          const { error } = await ensureClient()
            .from("survey_instances")
            .update(updateData)
            .eq("id", id);

          if (error) throw error;
        } catch (error) {
          console.error("Error updating survey instance:", error);
          throw error;
        }
      },

      deleteSurveyInstance: async (id: string) => {
        try {
          validateId(id, "deleteSurveyInstance");
          const { error } = await ensureClient()
            .from("survey_instances")
            .delete()
            .eq("id", id);

          if (error) throw error;
        } catch (error) {
          console.error("Error deleting survey instance:", error);
          throw error;
        }
      },

      // Survey Responses
      addSurveyResponse: async (response: Omit<SurveyResponse, "id">) => {
        try {
          // Check if survey instance exists
          const { data: instance, error: instanceError } = await ensureClient()
            .from("survey_instances")
            .select("id")
            .eq("id", response.surveyInstanceId)
            .single();

          if (instanceError || !instance) {
            throw new Error(
              `Survey instance ${response.surveyInstanceId} not found`
            );
          }

          // Use the main survey_responses table instead of instance-specific tables
          const {
            surveyInstanceId,
            configVersion,
            submittedAt,
            ...responseWithoutMappedFields
          } = response;
          const { data, error } = await ensureClient()
            .from("survey_responses")
            .insert({
              ...responseWithoutMappedFields,
              survey_instance_id: surveyInstanceId,
              config_version: configVersion,
              submitted_at: submittedAt || new Date().toISOString(),
              metadata: response.metadata,
            })
            .select()
            .single();

          if (error) throw error;

          // Map back to application format
          const { survey_instance_id, config_version, submitted_at, ...rest } =
            data;
          return {
            ...rest,
            surveyInstanceId: survey_instance_id,
            configVersion: config_version,
            submittedAt: submitted_at,
          };
        } catch (error) {
          console.error("Error adding survey response:", error);
          throw error;
        }
      },

      getSurveyResponses: async (instanceId?: string) => {
        try {
          let query = ensureClient()
            .from("survey_responses")
            .select("*")
            .order("submitted_at", { ascending: false });

          if (instanceId) {
            query = query.eq("survey_instance_id", instanceId);
          }

          const { data, error } = await query;
          if (error) throw error;

          // Map Supabase field names back to application format
          return (data || []).map((response: any) => {
            const {
              survey_instance_id,
              config_version,
              submitted_at,
              ...rest
            } = response;
            return {
              ...rest,
              surveyInstanceId: survey_instance_id,
              configVersion: config_version,
              submittedAt: submitted_at,
            };
          });
        } catch (error) {
          console.error("Error getting survey responses:", error);
          throw error;
        }
      },

      getSurveyResponsesFromCollection: async (instanceId: string) => {
        try {
          // For Supabase, we use the main survey_responses table instead of instance-specific tables
          // This is more efficient and simpler to manage
          const { data, error } = await ensureClient()
            .from("survey_responses")
            .select("*")
            .eq("survey_instance_id", instanceId)
            .order("submitted_at", { ascending: false });

          if (error) throw error;

          // Map Supabase field names back to application format
          return (data || []).map((response: any) => {
            const {
              survey_instance_id,
              config_version,
              submitted_at,
              ...rest
            } = response;
            return {
              ...rest,
              surveyInstanceId: survey_instance_id,
              configVersion: config_version,
              submittedAt: submitted_at,
            };
          });
        } catch (error) {
          console.error(
            "Error getting survey responses from collection:",
            error
          );
          throw error;
        }
      },

      // Rating Scales
      getRatingScales: async () => {
        try {
          const { data, error } = await ensureClient()
            .from("rating_scales")
            .select("*")
            .order("metadata->createdAt", { ascending: false });

          if (error) throw error;
          return (data || []).map(transformRatingScaleFromDb);
        } catch (error) {
          console.error("Error getting rating scales:", error);
          throw error;
        }
      },

      getRatingScale: async (id: string) => {
        try {
          validateId(id, "getRatingScale");
          const { data, error } = await ensureClient()
            .from("rating_scales")
            .select("*")
            .eq("id", id)
            .single();

          if (error) {
            if (error.code === "PGRST116") return null;
            throw error;
          }
          return transformRatingScaleFromDb(data);
        } catch (error) {
          console.error("Error getting rating scale:", error);
          throw error;
        }
      },

      addRatingScale: async (scale: RatingScale | Omit<RatingScale, "id">) => {
        try {
          const scaleData = {
            ...(('id' in scale && scale.id) ? { id: scale.id } : {}),
            name: scale.name,
            description: scale.description,
            options: scale.options,
            is_active: scale.isActive ?? true,
            metadata: await mergeMetadata(scale.metadata),
          };

          const { data, error } = await ensureClient()
            .from("rating_scales")
            .insert(scaleData)
            .select()
            .single();

          if (error) throw error;
          return transformRatingScaleFromDb(data);
        } catch (error) {
          console.error("Error adding rating scale:", error);
          throw error;
        }
      },

      updateRatingScale: async (id: string, data: Partial<RatingScale>) => {
        try {
          validateId(id, "updateRatingScale");
          const updateData: any = {};

          // Map only the fields we want to update
          if (data.name !== undefined) updateData.name = data.name;
          if (data.description !== undefined)
            updateData.description = data.description;
          if (data.options !== undefined) updateData.options = data.options;
          if (data.isActive !== undefined) updateData.is_active = data.isActive;

          if (data.metadata) {
            updateData.metadata = updateMetadata(data.metadata as any);
          } else {
            updateData.metadata = updateMetadata(await createMetadata());
          }

          const { error } = await ensureClient()
            .from("rating_scales")
            .update(updateData)
            .eq("id", id);

          if (error) throw error;
        } catch (error) {
          console.error("Error updating rating scale:", error);
          throw error;
        }
      },

      deleteRatingScale: async (id: string) => {
        try {
          validateId(id, "deleteRatingScale");
          const { error } = await ensureClient()
            .from("rating_scales")
            .delete()
            .eq("id", id);

          if (error) throw error;
        } catch (error) {
          console.error("Error deleting rating scale:", error);
          throw error;
        }
      },

      // Radio Option Sets - Similar pattern
      getRadioOptionSets: async () => {
        try {
          const { data, error } = await ensureClient()
            .from("radio_option_sets")
            .select("*")
            .order("metadata->createdAt", { ascending: false });

          if (error) throw error;
          return (data || []).map(transformOptionSetFromDb);
        } catch (error) {
          console.error("Error getting radio option sets:", error);
          throw error;
        }
      },

      getRadioOptionSet: async (id: string) => {
        try {
          validateId(id, "getRadioOptionSet");
          const { data, error } = await ensureClient()
            .from("radio_option_sets")
            .select("*")
            .eq("id", id)
            .single();

          if (error) {
            if (error.code === "PGRST116") return null;
            throw error;
          }
          return transformOptionSetFromDb(data);
        } catch (error) {
          console.error("Error getting radio option set:", error);
          throw error;
        }
      },

      addRadioOptionSet: async (optionSet: RadioOptionSet | Omit<RadioOptionSet, "id">) => {
        try {
          const setData = {
            ...(('id' in optionSet && optionSet.id) ? { id: optionSet.id } : {}),
            name: optionSet.name,
            description: optionSet.description,
            options: optionSet.options,
            is_active: optionSet.isActive ?? true,
            metadata: await mergeMetadata(optionSet.metadata),
          };

          const { data, error } = await ensureClient()
            .from("radio_option_sets")
            .insert(setData)
            .select()
            .single();

          if (error) throw error;
          return transformOptionSetFromDb(data);
        } catch (error) {
          console.error("Error adding radio option set:", error);
          throw error;
        }
      },

      updateRadioOptionSet: async (
        id: string,
        data: Partial<RadioOptionSet>
      ) => {
        try {
          validateId(id, "updateRadioOptionSet");
          const updateData: any = {};

          // Map only the fields we want to update
          if (data.name !== undefined) updateData.name = data.name;
          if (data.description !== undefined)
            updateData.description = data.description;
          if (data.options !== undefined) updateData.options = data.options;
          if (data.isActive !== undefined) updateData.is_active = data.isActive;

          if (data.metadata) {
            updateData.metadata = updateMetadata(data.metadata as any);
          } else {
            updateData.metadata = updateMetadata(await createMetadata());
          }

          const { error } = await ensureClient()
            .from("radio_option_sets")
            .update(updateData)
            .eq("id", id);

          if (error) throw error;
        } catch (error) {
          console.error("Error updating radio option set:", error);
          throw error;
        }
      },

      deleteRadioOptionSet: async (id: string) => {
        try {
          validateId(id, "deleteRadioOptionSet");
          const { error } = await ensureClient()
            .from("radio_option_sets")
            .delete()
            .eq("id", id);

          if (error) throw error;
        } catch (error) {
          console.error("Error deleting radio option set:", error);
          throw error;
        }
      },

      // Multi-Select Option Sets
      getMultiSelectOptionSets: async () => {
        try {
          const { data, error } = await ensureClient()
            .from("multi_select_option_sets")
            .select("*")
            .order("metadata->createdAt", { ascending: false });

          if (error) throw error;
          return (data || []).map(transformMultiSelectOptionSetFromDb);
        } catch (error) {
          console.error("Error getting multi-select option sets:", error);
          throw error;
        }
      },

      getMultiSelectOptionSet: async (id: string) => {
        try {
          validateId(id, "getMultiSelectOptionSet");
          const { data, error } = await ensureClient()
            .from("multi_select_option_sets")
            .select("*")
            .eq("id", id)
            .single();

          if (error) {
            if (error.code === "PGRST116") return null;
            throw error;
          }
          return transformMultiSelectOptionSetFromDb(data);
        } catch (error) {
          console.error("Error getting multi-select option set:", error);
          throw error;
        }
      },

      addMultiSelectOptionSet: async (
        optionSet: MultiSelectOptionSet | Omit<MultiSelectOptionSet, "id">
      ) => {
        try {
          const setData = {
            ...(('id' in optionSet && optionSet.id) ? { id: optionSet.id } : {}),
            name: optionSet.name,
            description: optionSet.description,
            options: optionSet.options,
            max_selections: optionSet.maxSelections,
            min_selections: optionSet.minSelections,
            is_active: optionSet.isActive ?? true,
            metadata: await mergeMetadata(optionSet.metadata),
          };

          const { data, error } = await ensureClient()
            .from("multi_select_option_sets")
            .insert(setData)
            .select()
            .single();

          if (error) throw error;
          return transformMultiSelectOptionSetFromDb(data);
        } catch (error) {
          console.error("Error adding multi-select option set:", error);
          throw error;
        }
      },

      updateMultiSelectOptionSet: async (
        id: string,
        data: Partial<MultiSelectOptionSet>
      ) => {
        try {
          validateId(id, "updateMultiSelectOptionSet");
          const updateData: any = {};

          // Map only the fields we want to update
          if (data.name !== undefined) updateData.name = data.name;
          if (data.description !== undefined)
            updateData.description = data.description;
          if (data.options !== undefined) updateData.options = data.options;
          if (data.isActive !== undefined) updateData.is_active = data.isActive;
          if (data.maxSelections !== undefined)
            updateData.max_selections = data.maxSelections;
          if (data.minSelections !== undefined)
            updateData.min_selections = data.minSelections;

          if (data.metadata) {
            updateData.metadata = updateMetadata(data.metadata as any);
          } else {
            updateData.metadata = updateMetadata(await createMetadata());
          }

          const { error } = await ensureClient()
            .from("multi_select_option_sets")
            .update(updateData)
            .eq("id", id);

          if (error) throw error;
        } catch (error) {
          console.error("Error updating multi-select option set:", error);
          throw error;
        }
      },

      deleteMultiSelectOptionSet: async (id: string) => {
        try {
          validateId(id, "deleteMultiSelectOptionSet");
          const { error } = await ensureClient()
            .from("multi_select_option_sets")
            .delete()
            .eq("id", id);

          if (error) throw error;
        } catch (error) {
          console.error("Error deleting multi-select option set:", error);
          throw error;
        }
      },

      // Select Option Sets
      getSelectOptionSets: async () => {
        try {
          const { data, error } = await ensureClient()
            .from("select_option_sets")
            .select("*")
            .order("metadata->createdAt", { ascending: false });

          if (error) throw error;
          return (data || []).map(transformSelectOptionSetFromDb);
        } catch (error) {
          console.error("Error getting select option sets:", error);
          throw error;
        }
      },

      getSelectOptionSet: async (id: string) => {
        try {
          validateId(id, "getSelectOptionSet");
          const { data, error } = await ensureClient()
            .from("select_option_sets")
            .select("*")
            .eq("id", id)
            .single();

          if (error) {
            if (error.code === "PGRST116") return null;
            throw error;
          }
          return transformSelectOptionSetFromDb(data);
        } catch (error) {
          console.error("Error getting select option set:", error);
          throw error;
        }
      },

      addSelectOptionSet: async (optionSet: SelectOptionSet | Omit<SelectOptionSet, "id">) => {
        try {
          const setData = {
            ...(('id' in optionSet && optionSet.id) ? { id: optionSet.id } : {}),
            name: optionSet.name,
            description: optionSet.description,
            options: optionSet.options,
            allow_multiple: optionSet.allowMultiple,
            is_active: optionSet.isActive ?? true,
            metadata: await mergeMetadata(optionSet.metadata),
          };

          const { data, error } = await ensureClient()
            .from("select_option_sets")
            .insert(setData)
            .select()
            .single();

          if (error) throw error;
          return transformSelectOptionSetFromDb(data);
        } catch (error) {
          console.error("Error adding select option set:", error);
          throw error;
        }
      },

      updateSelectOptionSet: async (
        id: string,
        data: Partial<SelectOptionSet>
      ) => {
        try {
          validateId(id, "updateSelectOptionSet");
          const updateData: any = {};

          // Map only the fields we want to update
          if (data.name !== undefined) updateData.name = data.name;
          if (data.description !== undefined)
            updateData.description = data.description;
          if (data.options !== undefined) updateData.options = data.options;
          if (data.isActive !== undefined) updateData.is_active = data.isActive;
          if (data.allowMultiple !== undefined)
            updateData.allow_multiple = data.allowMultiple;

          if (data.metadata) {
            updateData.metadata = updateMetadata(data.metadata as any);
          } else {
            updateData.metadata = updateMetadata(await createMetadata());
          }

          const { error } = await ensureClient()
            .from("select_option_sets")
            .update(updateData)
            .eq("id", id);

          if (error) throw error;
        } catch (error) {
          console.error("Error updating select option set:", error);
          throw error;
        }
      },

      deleteSelectOptionSet: async (id: string) => {
        try {
          validateId(id, "deleteSelectOptionSet");
          const { error } = await ensureClient()
            .from("select_option_sets")
            .delete()
            .eq("id", id);

          if (error) throw error;
        } catch (error) {
          console.error("Error deleting select option set:", error);
          throw error;
        }
      },

      // Survey Instance Status Management
      updateSurveyInstanceStatuses: async () => {
        try {
          const { data, error } = await ensureClient().rpc(
            "update_survey_instance_statuses"
          );

          if (error) throw error;

          return {
            success: data?.success || false,
            activated: data?.activated || 0,
            deactivated: data?.deactivated || 0,
            message: data?.message || "Status update completed",
          };
        } catch (error) {
          console.error("Error updating survey instance statuses:", error);
          throw error;
        }
      },

      getUpcomingStatusChanges: async (hoursAhead = 24) => {
        try {
          const { data, error } = await ensureClient().rpc(
            "get_upcoming_status_changes",
            { hours_ahead: hoursAhead }
          );

          if (error) throw error;

          return {
            upcoming_activations: data?.upcoming_activations || [],
            upcoming_deactivations: data?.upcoming_deactivations || [],
            check_time: data?.check_time || new Date().toISOString(),
            hours_ahead: data?.hours_ahead || hoursAhead,
          };
        } catch (error) {
          console.error("Error getting upcoming status changes:", error);
          throw error;
        }
      },

      getSurveyInstanceStatusChanges: async (instanceId?: string) => {
        try {
          let query = ensureClient()
            .from("survey_instance_status_changes")
            .select("*")
            .order("changed_at", { ascending: false });

          if (instanceId) {
            query = query.eq("instance_id", instanceId);
          }

          const { data, error } = await query;

          if (error) throw error;

          return (
            data?.map((row: any) => ({
              id: row.id,
              instance_id: row.instance_id,
              old_status: row.old_status,
              new_status: row.new_status,
              reason: row.reason,
              changed_at: row.changed_at,
              changed_by: row.changed_by,
              details: row.details,
            })) || []
          );
        } catch (error) {
          console.error("Error getting survey instance status changes:", error);
          throw error;
        }
      },
    };
  },
};