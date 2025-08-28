#!/usr/bin/env node

/**
 * Database Reset Script
 * Executes the reset-supabase-optimized.sql script to completely wipe the database
 * Includes cleanup of error logging system and real-time subscriptions
 * 
 * Usage: node scripts/db-reset.js
 * Or: yarn db:reset
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RESET_SQL_PATH = path.join(__dirname, 'reset-supabase-optimized.sql');

function showManualMethod() {
  console.log('');
  console.log('📖 Manual Execution (Required for complete reset)');
  console.log('');
  console.log('🔗 Open your Supabase Dashboard:');
  console.log('   https://supabase.com/dashboard/project/gmzoqgdzdpuwsoqluoen');
  console.log('');
  console.log('📝 Steps:');
  console.log('   1. Go to SQL Editor in your Supabase dashboard');
  console.log('   2. Create a new query');
  console.log('   3. Copy the entire contents of: scripts/reset-supabase-optimized.sql');
  console.log('   4. Paste the contents and click "Run"');
  console.log('');
  console.log('⚠️  WARNING: This will completely wipe ALL data in your database!');
  console.log('✨ After reset, you can run: yarn db:setup');
}

async function resetDatabase() {
  console.log('🔄 Starting database reset...');
  console.log('⚠️  WARNING: This will DELETE ALL DATA in your database!');
  
  // Check if SQL file exists
  if (!fs.existsSync(RESET_SQL_PATH)) {
    console.error(`❌ Reset SQL file not found: ${RESET_SQL_PATH}`);
    process.exit(1);
  }

  try {
    // Read the SQL file
    const sqlContent = fs.readFileSync(RESET_SQL_PATH, 'utf8');
    
    console.log('💡 Choose your execution method:');
    console.log('');
    console.log('🔄 Method 1: Supabase CLI (if available)');
    
    try {
      // Check if supabase is linked
      execSync('npx supabase projects list', { stdio: 'pipe' });
      console.log('✅ Supabase CLI is available');
      
      try {
        // Try CLI reset first
        console.log('🚀 Attempting CLI reset...');
        execSync(`npx supabase db reset --linked`, { 
          stdio: 'inherit'
        });
        
        console.log('✅ Database reset completed via CLI');
        console.log('💡 Run: yarn db:setup to recreate the schema');
        
      } catch (cliError) {
        console.log('⚠️  CLI reset failed, using manual method...');
        console.log('Error:', cliError.message.split('\\n')[0]);
        
        // Fall back to manual method
        showManualMethod();
      }
      
    } catch (cliError) {
      console.log('ℹ️  Supabase CLI not configured - using manual method');
      showManualMethod();
    }

  } catch (error) {
    console.error('❌ Database reset failed:', error.message);
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log('Database Reset Script');
  console.log('');
  console.log('Usage: node scripts/db-reset.js');
  console.log('   or: yarn db:reset');
  console.log('');
  console.log('⚠️  WARNING: This completely wipes your database!');
  console.log('');
  console.log('This script resets your Supabase database by:');
  console.log('• Dropping all tables (CASCADE)');
  console.log('• Removing all functions');
  console.log('• Clearing all data');
  console.log('• Resetting to clean state');
  console.log('');
  console.log('After reset, run: yarn db:setup');
  process.exit(0);
}

if (args.includes('--force') || args.includes('-f')) {
  console.log('🚀 Force flag detected, proceeding with reset...');
} else {
  console.log('');
  console.log('⚠️  This will permanently delete ALL data in your database!');
  console.log('🛡️  Add --force flag if you\'re sure: yarn db:reset --force');
  console.log('');
  process.exit(0);
}

// Run the reset
resetDatabase().catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});