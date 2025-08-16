import { Pool, PoolClient } from 'pg';
import {
  DatabaseConfig,
  DatabaseProvider_Interface,
  AuthHelpers,
  DatabaseHelpers,
} from '../types/database.types';
import {
  MultiSelectOptionSet,
  RadioOptionSet,
  RatingScale,
  SelectOptionSet,
  SurveyConfig,
  SurveyInstance,
  SurveyResponse,
} from '../types/framework.types';
import {
  createMetadata,
  mergeMetadata,
  updateMetadata,
} from '../utils/metadata.utils';

export class PostgresProvider implements DatabaseProvider_Interface {
  private pool: Pool | null = null;
  private initialized = false;
  private currentUser: any = null;

  async initialize(config: DatabaseConfig): Promise<void> {
    if (!config.postgres) {
      throw new Error('PostgreSQL configuration is required');
    }

    this.pool = new Pool({
      host: config.postgres.host,
      port: config.postgres.port,
      database: config.postgres.database,
      user: config.postgres.username,
      password: config.postgres.password,
      ssl: config.postgres.ssl ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Test connection
    try {
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      this.initialized = true;
      console.log('PostgreSQL provider initialized');
    } catch (error) {
      console.error('Failed to initialize PostgreSQL connection:', error);
      throw error;
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  get authHelpers(): AuthHelpers {
    return {
      async signInAnonymously() {
        try {
          // PostgreSQL doesn't have auth built-in like Firebase
          // Create a simple anonymous user session
          this.currentUser = { id: 'anonymous', isAnonymous: true };
          return this.currentUser;
        } catch (error) {
          console.error('Error signing in anonymously:', error);
          throw error;
        }
      },

      getCurrentUser: () => {
        return this.currentUser;
      },

      onAuthStateChanged: (callback: (user: any) => void) => {
        // Simple implementation - just call with current user
        callback(this.currentUser);
        return () => {}; // Return unsubscribe function
      },
    };
  }

  get databaseHelpers(): DatabaseHelpers {
    return {
      // Legacy survey functions
      async getSurveys() {
        try {
          const query = 'SELECT * FROM surveys ORDER BY submitted_at DESC';
          const result = await this.pool!.query(query);
          return result.rows;
        } catch (error) {
          console.error('Error getting surveys:', error);
          throw error;
        }
      },

      async addSurvey(surveyData: any) {
        try {
          const now = new Date().toISOString();
          const query = `
            INSERT INTO surveys (data, submitted_at, created_at)
            VALUES ($1, $2, $3)
            RETURNING *
          `;
          const values = [
            JSON.stringify(surveyData),
            now,
            now,
          ];
          const result = await this.pool!.query(query, values);
          return result.rows[0];
        } catch (error) {
          console.error('Error adding survey:', error);
          throw error;
        }
      },

      async updateSurvey(id: string, data: any) {
        try {
          const updateData = { ...data };
          if (data.metadata) {
            updateData.metadata = updateMetadata(data.metadata);
          } else {
            updateData.metadata = updateMetadata(await createMetadata());
          }

          const query = `
            UPDATE surveys 
            SET data = $1, updated_at = $2
            WHERE id = $3
          `;
          const values = [
            JSON.stringify(updateData),
            new Date().toISOString(),
            id,
          ];
          await this.pool!.query(query, values);
        } catch (error) {
          console.error('Error updating survey:', error);
          throw error;
        }
      },

      async deleteSurvey(id: string) {
        try {
          const query = 'DELETE FROM surveys WHERE id = $1';
          await this.pool!.query(query, [id]);
        } catch (error) {
          console.error('Error deleting survey:', error);
          throw error;
        }
      },

      // Survey Configs
      async getSurveyConfigs() {
        try {
          const query = `
            SELECT * FROM survey_configs 
            ORDER BY (metadata->>'createdAt')::timestamp DESC
          `;
          const result = await this.pool!.query(query);
          return result.rows.map(this.transformConfigFromDb);
        } catch (error) {
          console.error('Error getting survey configs:', error);
          throw error;
        }
      },

      async getSurveyConfig(id: string) {
        try {
          const query = 'SELECT * FROM survey_configs WHERE id = $1';
          const result = await this.pool!.query(query, [id]);
          if (result.rows.length === 0) return null;
          return this.transformConfigFromDb(result.rows[0]);
        } catch (error) {
          console.error('Error getting survey config:', error);
          throw error;
        }
      },

      async addSurveyConfig(config: Omit<SurveyConfig, 'id'>) {
        try {
          const configId = this.createKebabCaseId(config.title);
          const configData = {
            ...config,
            id: configId,
            isActive: config.isActive ?? true,
            version: config.version || '1.0.0',
            metadata: await mergeMetadata(config.metadata),
          };

          const query = `
            INSERT INTO survey_configs (id, title, description, sections, paginator_config, footer_config, is_active, version, metadata)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
          `;
          const values = [
            configData.id,
            configData.title,
            configData.description,
            JSON.stringify(configData.sections),
            JSON.stringify(configData.paginatorConfig),
            JSON.stringify(configData.footerConfig),
            configData.isActive,
            configData.version,
            JSON.stringify(configData.metadata),
          ];
          const result = await this.pool!.query(query, values);
          return this.transformConfigFromDb(result.rows[0]);
        } catch (error) {
          console.error('Error adding survey config:', error);
          throw error;
        }
      },

      async updateSurveyConfig(id: string, data: Partial<SurveyConfig>) {
        try {
          const updateData = { ...data };
          if (data.metadata) {
            updateData.metadata = updateMetadata(data.metadata as any);
          } else {
            updateData.metadata = updateMetadata(await createMetadata());
          }

          const setParts = [];
          const values = [];
          let paramIndex = 1;

          if (data.title) {
            setParts.push(`title = $${paramIndex++}`);
            values.push(data.title);
          }
          if (data.description !== undefined) {
            setParts.push(`description = $${paramIndex++}`);
            values.push(data.description);
          }
          if (data.sections) {
            setParts.push(`sections = $${paramIndex++}`);
            values.push(JSON.stringify(data.sections));
          }
          if (data.paginatorConfig) {
            setParts.push(`paginator_config = $${paramIndex++}`);
            values.push(JSON.stringify(data.paginatorConfig));
          }
          if (data.footerConfig) {
            setParts.push(`footer_config = $${paramIndex++}`);
            values.push(JSON.stringify(data.footerConfig));
          }
          if (data.isActive !== undefined) {
            setParts.push(`is_active = $${paramIndex++}`);
            values.push(data.isActive);
          }
          if (data.version) {
            setParts.push(`version = $${paramIndex++}`);
            values.push(data.version);
          }
          if (updateData.metadata) {
            setParts.push(`metadata = $${paramIndex++}`);
            values.push(JSON.stringify(updateData.metadata));
          }

          if (setParts.length === 0) return;

          values.push(id);
          const query = `UPDATE survey_configs SET ${setParts.join(', ')} WHERE id = $${paramIndex}`;
          await this.pool!.query(query, values);
        } catch (error) {
          console.error('Error updating survey config:', error);
          throw error;
        }
      },

      async deleteSurveyConfig(id: string) {
        try {
          const query = 'DELETE FROM survey_configs WHERE id = $1';
          await this.pool!.query(query, [id]);
        } catch (error) {
          console.error('Error deleting survey config:', error);
          throw error;
        }
      },

      // Survey Instances
      async getSurveyInstances() {
        try {
          const query = 'SELECT * FROM survey_instances';
          const result = await this.pool!.query(query);
          return result.rows.map(this.transformInstanceFromDb);
        } catch (error) {
          console.error('Error getting survey instances:', error);
          throw error;
        }
      },

      async getSurveyInstancesByConfig(configId: string) {
        try {
          const query = 'SELECT * FROM survey_instances WHERE config_id = $1';
          const result = await this.pool!.query(query, [configId]);
          return result.rows.map(this.transformInstanceFromDb);
        } catch (error) {
          console.error('Error getting survey instances by config:', error);
          throw error;
        }
      },

      async addSurveyInstance(instance: Omit<SurveyInstance, 'id'>) {
        try {
          const instanceId = await this.createUniqueInstanceId(instance.title);
          const instanceData = {
            ...instance,
            id: instanceId,
            metadata: await mergeMetadata(instance.metadata),
          };

          const query = `
            INSERT INTO survey_instances (id, config_id, title, description, is_active, active_date_range, metadata)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
          `;
          const values = [
            instanceData.id,
            instanceData.configId,
            instanceData.title,
            instanceData.description,
            instanceData.isActive,
            JSON.stringify(instanceData.activeDateRange),
            JSON.stringify(instanceData.metadata),
          ];
          const result = await this.pool!.query(query, values);
          return this.transformInstanceFromDb(result.rows[0]);
        } catch (error) {
          console.error('Error adding survey instance:', error);
          throw error;
        }
      },

      async updateSurveyInstance(id: string, data: Partial<SurveyInstance>) {
        try {
          const updateData: any = { ...data };
          if (data.metadata) {
            updateData.metadata = updateMetadata(data.metadata as any);
          } else {
            updateData.metadata = updateMetadata(await createMetadata());
          }

          const setParts = [];
          const values = [];
          let paramIndex = 1;

          if (data.configId) {
            setParts.push(`config_id = $${paramIndex++}`);
            values.push(data.configId);
          }
          if (data.title) {
            setParts.push(`title = $${paramIndex++}`);
            values.push(data.title);
          }
          if (data.description !== undefined) {
            setParts.push(`description = $${paramIndex++}`);
            values.push(data.description);
          }
          if (data.isActive !== undefined) {
            setParts.push(`is_active = $${paramIndex++}`);
            values.push(data.isActive);
          }
          if (data.activeDateRange !== undefined) {
            setParts.push(`active_date_range = $${paramIndex++}`);
            values.push(JSON.stringify(data.activeDateRange));
          }
          if (updateData.metadata) {
            setParts.push(`metadata = $${paramIndex++}`);
            values.push(JSON.stringify(updateData.metadata));
          }

          if (setParts.length === 0) return;

          values.push(id);
          const query = `UPDATE survey_instances SET ${setParts.join(', ')} WHERE id = $${paramIndex}`;
          await this.pool!.query(query, values);
        } catch (error) {
          console.error('Error updating survey instance:', error);
          throw error;
        }
      },

      async deleteSurveyInstance(id: string) {
        try {
          const query = 'DELETE FROM survey_instances WHERE id = $1';
          await this.pool!.query(query, [id]);
        } catch (error) {
          console.error('Error deleting survey instance:', error);
          throw error;
        }
      },

      // Survey Responses
      async addSurveyResponse(response: Omit<SurveyResponse, 'id'>) {
        try {
          // Check if survey instance exists
          const instanceQuery = 'SELECT id FROM survey_instances WHERE id = $1';
          const instanceResult = await this.pool!.query(instanceQuery, [response.surveyInstanceId]);

          if (instanceResult.rows.length === 0) {
            throw new Error(`Survey instance ${response.surveyInstanceId} not found`);
          }

          // Create instance-specific table if it doesn't exist
          const tableName = `survey_responses_${response.surveyInstanceId.replace(/-/g, '_')}`;
          await this.createResponseTableIfNotExists(tableName);

          const query = `
            INSERT INTO ${tableName} (survey_instance_id, config_version, responses, submitted_at, metadata)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
          `;
          const values = [
            response.surveyInstanceId,
            response.configVersion,
            JSON.stringify(response.responses),
            response.submittedAt || new Date().toISOString(),
            JSON.stringify(response.metadata),
          ];
          const result = await this.pool!.query(query, values);
          return this.transformResponseFromDb(result.rows[0]);
        } catch (error) {
          console.error('Error adding survey response:', error);
          throw error;
        }
      },

      async getSurveyResponses(instanceId?: string) {
        try {
          let query = 'SELECT * FROM survey_responses ORDER BY submitted_at DESC';
          let values: any[] = [];

          if (instanceId) {
            query = 'SELECT * FROM survey_responses WHERE survey_instance_id = $1 ORDER BY submitted_at DESC';
            values = [instanceId];
          }

          const result = await this.pool!.query(query, values);
          return result.rows.map(this.transformResponseFromDb);
        } catch (error) {
          console.error('Error getting survey responses:', error);
          throw error;
        }
      },

      async getSurveyResponsesFromCollection(instanceId: string) {
        try {
          // Check if survey instance exists
          const instanceQuery = 'SELECT id FROM survey_instances WHERE id = $1';
          const instanceResult = await this.pool!.query(instanceQuery, [instanceId]);

          if (instanceResult.rows.length === 0) {
            throw new Error(`Survey instance ${instanceId} not found`);
          }

          const tableName = `survey_responses_${instanceId.replace(/-/g, '_')}`;
          
          // Check if table exists
          const tableExistsQuery = `
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_name = $1
            )
          `;
          const tableResult = await this.pool!.query(tableExistsQuery, [tableName]);
          
          if (!tableResult.rows[0].exists) {
            return []; // Table doesn't exist, no responses
          }

          const query = `SELECT * FROM ${tableName} ORDER BY submitted_at DESC`;
          const result = await this.pool!.query(query);
          return result.rows.map(this.transformResponseFromDb);
        } catch (error) {
          console.error('Error getting survey responses from collection:', error);
          throw error;
        }
      },

      // Rating Scales
      async getRatingScales() {
        try {
          const query = `
            SELECT * FROM rating_scales 
            ORDER BY (metadata->>'createdAt')::timestamp DESC
          `;
          const result = await this.pool!.query(query);
          return result.rows.map(this.transformRatingScaleFromDb);
        } catch (error) {
          console.error('Error getting rating scales:', error);
          throw error;
        }
      },

      async getRatingScale(id: string) {
        try {
          const query = 'SELECT * FROM rating_scales WHERE id = $1';
          const result = await this.pool!.query(query, [id]);
          if (result.rows.length === 0) return null;
          return this.transformRatingScaleFromDb(result.rows[0]);
        } catch (error) {
          console.error('Error getting rating scale:', error);
          throw error;
        }
      },

      async addRatingScale(scale: Omit<RatingScale, 'id'>) {
        try {
          const scaleId = this.createKebabCaseId(scale.name);
          const scaleData = {
            ...scale,
            id: scaleId,
            isActive: scale.isActive ?? true,
            metadata: await mergeMetadata(scale.metadata),
          };

          const query = `
            INSERT INTO rating_scales (id, name, description, options, is_active, metadata)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
          `;
          const values = [
            scaleData.id,
            scaleData.name,
            scaleData.description,
            JSON.stringify(scaleData.options),
            scaleData.isActive,
            JSON.stringify(scaleData.metadata),
          ];
          const result = await this.pool!.query(query, values);
          return this.transformRatingScaleFromDb(result.rows[0]);
        } catch (error) {
          console.error('Error adding rating scale:', error);
          throw error;
        }
      },

      async updateRatingScale(id: string, data: Partial<RatingScale>) {
        try {
          const updateData = { ...data };
          if (data.metadata) {
            updateData.metadata = updateMetadata(data.metadata as any);
          } else {
            updateData.metadata = updateMetadata(await createMetadata());
          }

          const setParts = [];
          const values = [];
          let paramIndex = 1;

          if (data.name) {
            setParts.push(`name = $${paramIndex++}`);
            values.push(data.name);
          }
          if (data.description !== undefined) {
            setParts.push(`description = $${paramIndex++}`);
            values.push(data.description);
          }
          if (data.options) {
            setParts.push(`options = $${paramIndex++}`);
            values.push(JSON.stringify(data.options));
          }
          if (data.isActive !== undefined) {
            setParts.push(`is_active = $${paramIndex++}`);
            values.push(data.isActive);
          }
          if (updateData.metadata) {
            setParts.push(`metadata = $${paramIndex++}`);
            values.push(JSON.stringify(updateData.metadata));
          }

          if (setParts.length === 0) return;

          values.push(id);
          const query = `UPDATE rating_scales SET ${setParts.join(', ')} WHERE id = $${paramIndex}`;
          await this.pool!.query(query, values);
        } catch (error) {
          console.error('Error updating rating scale:', error);
          throw error;
        }
      },

      async deleteRatingScale(id: string) {
        try {
          const query = 'DELETE FROM rating_scales WHERE id = $1';
          await this.pool!.query(query, [id]);
        } catch (error) {
          console.error('Error deleting rating scale:', error);
          throw error;
        }
      },

      // Radio Option Sets - Similar implementations
      async getRadioOptionSets() {
        try {
          const query = `
            SELECT * FROM radio_option_sets 
            ORDER BY (metadata->>'createdAt')::timestamp DESC
          `;
          const result = await this.pool!.query(query);
          return result.rows.map(this.transformOptionSetFromDb);
        } catch (error) {
          console.error('Error getting radio option sets:', error);
          throw error;
        }
      },

      async getRadioOptionSet(id: string) {
        try {
          const query = 'SELECT * FROM radio_option_sets WHERE id = $1';
          const result = await this.pool!.query(query, [id]);
          if (result.rows.length === 0) return null;
          return this.transformOptionSetFromDb(result.rows[0]);
        } catch (error) {
          console.error('Error getting radio option set:', error);
          throw error;
        }
      },

      async addRadioOptionSet(optionSet: Omit<RadioOptionSet, 'id'>) {
        try {
          const setId = this.createKebabCaseId(optionSet.name);
          const setData = {
            ...optionSet,
            id: setId,
            isActive: optionSet.isActive ?? true,
            metadata: await mergeMetadata(optionSet.metadata),
          };

          const query = `
            INSERT INTO radio_option_sets (id, name, description, options, is_active, metadata)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
          `;
          const values = [
            setData.id,
            setData.name,
            setData.description,
            JSON.stringify(setData.options),
            setData.isActive,
            JSON.stringify(setData.metadata),
          ];
          const result = await this.pool!.query(query, values);
          return this.transformOptionSetFromDb(result.rows[0]);
        } catch (error) {
          console.error('Error adding radio option set:', error);
          throw error;
        }
      },

      async updateRadioOptionSet(id: string, data: Partial<RadioOptionSet>) {
        try {
          const updateData = { ...data };
          if (data.metadata) {
            updateData.metadata = updateMetadata(data.metadata as any);
          } else {
            updateData.metadata = updateMetadata(await createMetadata());
          }

          const setParts = [];
          const values = [];
          let paramIndex = 1;

          if (data.name) {
            setParts.push(`name = $${paramIndex++}`);
            values.push(data.name);
          }
          if (data.description !== undefined) {
            setParts.push(`description = $${paramIndex++}`);
            values.push(data.description);
          }
          if (data.options) {
            setParts.push(`options = $${paramIndex++}`);
            values.push(JSON.stringify(data.options));
          }
          if (data.isActive !== undefined) {
            setParts.push(`is_active = $${paramIndex++}`);
            values.push(data.isActive);
          }
          if (updateData.metadata) {
            setParts.push(`metadata = $${paramIndex++}`);
            values.push(JSON.stringify(updateData.metadata));
          }

          if (setParts.length === 0) return;

          values.push(id);
          const query = `UPDATE radio_option_sets SET ${setParts.join(', ')} WHERE id = $${paramIndex}`;
          await this.pool!.query(query, values);
        } catch (error) {
          console.error('Error updating radio option set:', error);
          throw error;
        }
      },

      async deleteRadioOptionSet(id: string) {
        try {
          const query = 'DELETE FROM radio_option_sets WHERE id = $1';
          await this.pool!.query(query, [id]);
        } catch (error) {
          console.error('Error deleting radio option set:', error);
          throw error;
        }
      },

      // Multi-Select Option Sets (abbreviated - similar pattern)
      async getMultiSelectOptionSets() {
        try {
          const query = `SELECT * FROM multi_select_option_sets ORDER BY (metadata->>'createdAt')::timestamp DESC`;
          const result = await this.pool!.query(query);
          return result.rows.map(this.transformMultiSelectOptionSetFromDb);
        } catch (error) {
          console.error('Error getting multi-select option sets:', error);
          throw error;
        }
      },

      async getMultiSelectOptionSet(id: string) {
        try {
          const query = 'SELECT * FROM multi_select_option_sets WHERE id = $1';
          const result = await this.pool!.query(query, [id]);
          if (result.rows.length === 0) return null;
          return this.transformMultiSelectOptionSetFromDb(result.rows[0]);
        } catch (error) {
          console.error('Error getting multi-select option set:', error);
          throw error;
        }
      },

      async addMultiSelectOptionSet(optionSet: Omit<MultiSelectOptionSet, 'id'>) {
        try {
          const setId = this.createKebabCaseId(optionSet.name);
          const setData = {
            ...optionSet,
            id: setId,
            isActive: optionSet.isActive ?? true,
            metadata: await mergeMetadata(optionSet.metadata),
          };

          const query = `
            INSERT INTO multi_select_option_sets (id, name, description, options, max_selections, min_selections, is_active, metadata)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
          `;
          const values = [
            setData.id,
            setData.name,
            setData.description,
            JSON.stringify(setData.options),
            setData.maxSelections,
            setData.minSelections,
            setData.isActive,
            JSON.stringify(setData.metadata),
          ];
          const result = await this.pool!.query(query, values);
          return this.transformMultiSelectOptionSetFromDb(result.rows[0]);
        } catch (error) {
          console.error('Error adding multi-select option set:', error);
          throw error;
        }
      },

      async updateMultiSelectOptionSet(id: string, data: Partial<MultiSelectOptionSet>) {
        try {
          const updateData = { ...data };
          if (data.metadata) {
            updateData.metadata = updateMetadata(data.metadata as any);
          } else {
            updateData.metadata = updateMetadata(await createMetadata());
          }

          const setParts = [];
          const values = [];
          let paramIndex = 1;

          if (data.name) {
            setParts.push(`name = $${paramIndex++}`);
            values.push(data.name);
          }
          if (data.description !== undefined) {
            setParts.push(`description = $${paramIndex++}`);
            values.push(data.description);
          }
          if (data.options) {
            setParts.push(`options = $${paramIndex++}`);
            values.push(JSON.stringify(data.options));
          }
          if (data.maxSelections !== undefined) {
            setParts.push(`max_selections = $${paramIndex++}`);
            values.push(data.maxSelections);
          }
          if (data.minSelections !== undefined) {
            setParts.push(`min_selections = $${paramIndex++}`);
            values.push(data.minSelections);
          }
          if (data.isActive !== undefined) {
            setParts.push(`is_active = $${paramIndex++}`);
            values.push(data.isActive);
          }
          if (updateData.metadata) {
            setParts.push(`metadata = $${paramIndex++}`);
            values.push(JSON.stringify(updateData.metadata));
          }

          if (setParts.length === 0) return;

          values.push(id);
          const query = `UPDATE multi_select_option_sets SET ${setParts.join(', ')} WHERE id = $${paramIndex}`;
          await this.pool!.query(query, values);
        } catch (error) {
          console.error('Error updating multi-select option set:', error);
          throw error;
        }
      },

      async deleteMultiSelectOptionSet(id: string) {
        try {
          const query = 'DELETE FROM multi_select_option_sets WHERE id = $1';
          await this.pool!.query(query, [id]);
        } catch (error) {
          console.error('Error deleting multi-select option set:', error);
          throw error;
        }
      },

      // Select Option Sets (abbreviated - similar pattern)
      async getSelectOptionSets() {
        try {
          const query = `SELECT * FROM select_option_sets ORDER BY (metadata->>'createdAt')::timestamp DESC`;
          const result = await this.pool!.query(query);
          return result.rows.map(this.transformSelectOptionSetFromDb);
        } catch (error) {
          console.error('Error getting select option sets:', error);
          throw error;
        }
      },

      async getSelectOptionSet(id: string) {
        try {
          const query = 'SELECT * FROM select_option_sets WHERE id = $1';
          const result = await this.pool!.query(query, [id]);
          if (result.rows.length === 0) return null;
          return this.transformSelectOptionSetFromDb(result.rows[0]);
        } catch (error) {
          console.error('Error getting select option set:', error);
          throw error;
        }
      },

      async addSelectOptionSet(optionSet: Omit<SelectOptionSet, 'id'>) {
        try {
          const setId = this.createKebabCaseId(optionSet.name);
          const setData = {
            ...optionSet,
            id: setId,
            isActive: optionSet.isActive ?? true,
            metadata: await mergeMetadata(optionSet.metadata),
          };

          const query = `
            INSERT INTO select_option_sets (id, name, description, options, allow_multiple, is_active, metadata)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
          `;
          const values = [
            setData.id,
            setData.name,
            setData.description,
            JSON.stringify(setData.options),
            setData.allowMultiple,
            setData.isActive,
            JSON.stringify(setData.metadata),
          ];
          const result = await this.pool!.query(query, values);
          return this.transformSelectOptionSetFromDb(result.rows[0]);
        } catch (error) {
          console.error('Error adding select option set:', error);
          throw error;
        }
      },

      async updateSelectOptionSet(id: string, data: Partial<SelectOptionSet>) {
        try {
          const updateData = { ...data };
          if (data.metadata) {
            updateData.metadata = updateMetadata(data.metadata as any);
          } else {
            updateData.metadata = updateMetadata(await createMetadata());
          }

          const setParts = [];
          const values = [];
          let paramIndex = 1;

          if (data.name) {
            setParts.push(`name = $${paramIndex++}`);
            values.push(data.name);
          }
          if (data.description !== undefined) {
            setParts.push(`description = $${paramIndex++}`);
            values.push(data.description);
          }
          if (data.options) {
            setParts.push(`options = $${paramIndex++}`);
            values.push(JSON.stringify(data.options));
          }
          if (data.allowMultiple !== undefined) {
            setParts.push(`allow_multiple = $${paramIndex++}`);
            values.push(data.allowMultiple);
          }
          if (data.isActive !== undefined) {
            setParts.push(`is_active = $${paramIndex++}`);
            values.push(data.isActive);
          }
          if (updateData.metadata) {
            setParts.push(`metadata = $${paramIndex++}`);
            values.push(JSON.stringify(updateData.metadata));
          }

          if (setParts.length === 0) return;

          values.push(id);
          const query = `UPDATE select_option_sets SET ${setParts.join(', ')} WHERE id = $${paramIndex}`;
          await this.pool!.query(query, values);
        } catch (error) {
          console.error('Error updating select option set:', error);
          throw error;
        }
      },

      async deleteSelectOptionSet(id: string) {
        try {
          const query = 'DELETE FROM select_option_sets WHERE id = $1';
          await this.pool!.query(query, [id]);
        } catch (error) {
          console.error('Error deleting select option set:', error);
          throw error;
        }
      },
    };
  }

  // Helper methods
  private createKebabCaseId(name: string): string {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private async createUniqueInstanceId(baseTitle: string): Promise<string> {
    const baseId = this.createKebabCaseId(baseTitle);

    const query = 'SELECT id FROM survey_instances WHERE id LIKE $1';
    const result = await this.pool!.query(query, [`${baseId}%`]);
    const existingIds = result.rows.map((row: any) => row.id);
    const matchingIds = existingIds.filter((id: string) => id.startsWith(baseId));

    if (matchingIds.length === 0) {
      return `${baseId}-001`;
    }

    const counters = matchingIds
      .map((id: string) => {
        const match = id.match(new RegExp(`^${baseId}-(\\d{3})$`));
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((counter: number) => counter > 0);

    const nextCounter = counters.length > 0 ? Math.max(...counters) + 1 : 1;
    return `${baseId}-${nextCounter.toString().padStart(3, '0')}`;
  }

  private async createResponseTableIfNotExists(tableName: string): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS ${tableName} (
        id SERIAL PRIMARY KEY,
        survey_instance_id VARCHAR(255) NOT NULL,
        config_version VARCHAR(255) NOT NULL,
        responses JSONB NOT NULL,
        submitted_at TIMESTAMP WITH TIME ZONE NOT NULL,
        metadata JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    await this.pool!.query(query);
  }

  // Transform database rows to application types
  private transformConfigFromDb(dbRow: any): SurveyConfig {
    return {
      id: dbRow.id,
      title: dbRow.title,
      description: dbRow.description,
      sections: dbRow.sections,
      paginatorConfig: dbRow.paginator_config,
      footerConfig: dbRow.footer_config,
      isActive: dbRow.is_active,
      version: dbRow.version,
      metadata: dbRow.metadata,
    };
  }

  private transformInstanceFromDb(dbRow: any): SurveyInstance {
    return {
      id: dbRow.id,
      configId: dbRow.config_id,
      title: dbRow.title,
      description: dbRow.description,
      isActive: dbRow.is_active,
      activeDateRange: dbRow.active_date_range,
      metadata: dbRow.metadata,
    };
  }

  private transformResponseFromDb(dbRow: any): SurveyResponse {
    return {
      id: dbRow.id.toString(),
      surveyInstanceId: dbRow.survey_instance_id,
      configVersion: dbRow.config_version,
      responses: dbRow.responses,
      submittedAt: dbRow.submitted_at,
      metadata: dbRow.metadata,
    };
  }

  private transformRatingScaleFromDb(dbRow: any): RatingScale {
    return {
      id: dbRow.id,
      name: dbRow.name,
      description: dbRow.description,
      options: dbRow.options,
      isActive: dbRow.is_active,
      metadata: dbRow.metadata,
    };
  }

  private transformOptionSetFromDb(dbRow: any): RadioOptionSet {
    return {
      id: dbRow.id,
      name: dbRow.name,
      description: dbRow.description,
      options: dbRow.options,
      isActive: dbRow.is_active,
      metadata: dbRow.metadata,
    };
  }

  private transformMultiSelectOptionSetFromDb(dbRow: any): MultiSelectOptionSet {
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
  }

  private transformSelectOptionSetFromDb(dbRow: any): SelectOptionSet {
    return {
      id: dbRow.id,
      name: dbRow.name,
      description: dbRow.description,
      options: dbRow.options,
      allowMultiple: dbRow.allow_multiple,
      isActive: dbRow.is_active,
      metadata: dbRow.metadata,
    };
  }
}