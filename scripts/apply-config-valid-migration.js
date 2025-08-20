// Script to apply the config_valid column migration via Supabase client
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://gmzoqgdzdpuwsoqluoen.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function applyMigration() {
  try {
    console.log('🔄 Applying config_valid column migration...');

    // Step 1: Add the config_valid column
    console.log('📝 Adding config_valid column...');
    const { error: addColumnError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE survey_instances ADD COLUMN IF NOT EXISTS config_valid BOOLEAN DEFAULT true;'
    });

    if (addColumnError && !addColumnError.message.includes('column "config_valid" of relation "survey_instances" already exists')) {
      console.error('❌ Error adding column:', addColumnError);
      throw addColumnError;
    }

    // Step 2: Create index
    console.log('🔍 Creating index...');
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: 'CREATE INDEX IF NOT EXISTS idx_survey_instances_config_valid ON survey_instances(config_valid);'
    });

    if (indexError) {
      console.warn('⚠️  Index creation warning (may already exist):', indexError.message);
    }

    // Step 3: Update existing records
    console.log('🔄 Updating existing records...');
    const { error: updateError } = await supabase.rpc('exec_sql', {
      sql: 'UPDATE survey_instances SET config_valid = true WHERE config_valid IS NULL;'
    });

    if (updateError) {
      console.error('❌ Error updating records:', updateError);
      throw updateError;
    }

    // Step 4: Make column NOT NULL
    console.log('🔒 Setting NOT NULL constraint...');
    const { error: constraintError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE survey_instances ALTER COLUMN config_valid SET NOT NULL;'
    });

    if (constraintError) {
      console.error('❌ Error setting NOT NULL:', constraintError);
      throw constraintError;
    }

    console.log('✅ Migration completed successfully!');

    // Verify the column exists
    const { data: columns, error: verifyError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'survey_instances')
      .eq('column_name', 'config_valid');

    if (verifyError) {
      console.error('❌ Error verifying column:', verifyError);
    } else if (columns && columns.length > 0) {
      console.log('✅ Column verification:', columns[0]);
    } else {
      console.error('❌ Column not found in verification');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Alternative approach if exec_sql RPC doesn't exist
async function applyMigrationAlternative() {
  try {
    console.log('🔄 Applying migration using direct SQL execution...');

    // Check if column already exists
    const { data: existingColumns } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'survey_instances')
      .eq('column_name', 'config_valid');

    if (existingColumns && existingColumns.length > 0) {
      console.log('✅ config_valid column already exists');
      return;
    }

    console.log('❌ Column does not exist. Please run the SQL migration manually.');
    console.log('\nSQL to execute:');
    console.log(`
-- Add config_valid column
ALTER TABLE survey_instances ADD COLUMN IF NOT EXISTS config_valid BOOLEAN DEFAULT true;

-- Create index  
CREATE INDEX IF NOT EXISTS idx_survey_instances_config_valid ON survey_instances(config_valid);

-- Update existing records
UPDATE survey_instances SET config_valid = true WHERE config_valid IS NULL;

-- Set NOT NULL constraint
ALTER TABLE survey_instances ALTER COLUMN config_valid SET NOT NULL;
    `);
    
  } catch (error) {
    console.error('❌ Alternative migration check failed:', error);
  }
}

// Try main migration first, fallback to alternative
applyMigration().catch(() => {
  console.log('🔄 Falling back to alternative approach...');
  applyMigrationAlternative();
});