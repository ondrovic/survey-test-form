#!/usr/bin/env node

/**
 * Script to apply the session status automation migration manually
 * This script applies the database migration that adds triggers and functions
 * for reliable session status management.
 * 
 * Usage: node scripts/apply-session-automation-migration.js
 */

const fs = require('fs');
const path = require('path');

// Read environment variables
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

async function applyMigration() {
  console.log('🔧 Applying session automation migration...');
  
  // Check for required environment variables
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('❌ Missing required environment variables:');
    console.error('   - VITE_SUPABASE_URL');
    console.error('   - SUPABASE_SERVICE_ROLE_KEY');
    console.error('');
    console.error('Please set these in your .env file or environment.');
    process.exit(1);
  }
  
  // Create Supabase client with service role key
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  
  // Read the migration file
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250826020000_session_status_automation.sql');
  
  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Migration file not found: ${migrationPath}`);
    process.exit(1);
  }
  
  const migrationSql = fs.readFileSync(migrationPath, 'utf8');
  
  console.log('📝 Executing migration SQL...');
  
  try {
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSql });
    
    if (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
    
    console.log('✅ Migration applied successfully!');
    console.log('');
    console.log('🎯 New features available:');
    console.log('   - Database triggers automatically update session status');
    console.log('   - Sessions become "abandoned" after 2 hours of inactivity');
    console.log('   - Sessions become "expired" after 24 hours total');
    console.log('   - cleanup_survey_sessions() function can be called for manual cleanup');
    console.log('   - get_session_analytics() function provides session statistics');
    console.log('');
    console.log('🔧 To test the cleanup function:');
    console.log('   SELECT cleanup_survey_sessions();');
    console.log('');
    console.log('📊 To view session analytics:');
    console.log('   SELECT get_session_analytics();');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Alternative method if rpc doesn't work - split and execute individual statements
async function applyMigrationManual() {
  console.log('🔧 Applying migration with manual statement execution...');
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250826020000_session_status_automation.sql');
  const migrationSql = fs.readFileSync(migrationPath, 'utf8');
  
  // Split SQL into individual statements (basic approach)
  const statements = migrationSql
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt && !stmt.startsWith('--') && !stmt.match(/^\s*$/));
  
  console.log(`📝 Executing ${statements.length} SQL statements...`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    if (!statement) continue;
    
    console.log(`   [${i + 1}/${statements.length}] Executing statement...`);
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      if (error) {
        console.warn(`   ⚠️  Statement ${i + 1} failed:`, error.message);
        errorCount++;
      } else {
        successCount++;
      }
    } catch (error) {
      console.warn(`   ⚠️  Statement ${i + 1} error:`, error.message);
      errorCount++;
    }
  }
  
  console.log('');
  console.log(`📊 Migration completed: ${successCount} successful, ${errorCount} errors`);
  
  if (errorCount === 0) {
    console.log('✅ All statements executed successfully!');
  } else {
    console.log(`⚠️  ${errorCount} statements had issues - this may be normal for already-existing functions/triggers`);
  }
}

// Run the migration
if (require.main === module) {
  applyMigration().catch(error => {
    console.error('❌ Migration process failed:', error);
    console.log('');
    console.log('🔄 Trying alternative approach...');
    applyMigrationManual().catch(altError => {
      console.error('❌ Alternative migration also failed:', altError);
      process.exit(1);
    });
  });
}

module.exports = { applyMigration, applyMigrationManual };