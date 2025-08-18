#!/usr/bin/env node

// Migration runner script
// Usage: npx ts-node src/scripts/run-migrations.ts [options]

import { createClient } from '@supabase/supabase-js';
import { MigrationService } from '../services/migration.service';

interface CliOptions {
  command: 'status' | 'run' | 'cleanup' | 'all';
  verbose?: boolean;
  force?: boolean;
  startDate?: string;
  endDate?: string;
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const options: CliOptions = {
    command: 'status'
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case 'status':
      case 'run':
      case 'cleanup':
      case 'all':
        options.command = arg;
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--force':
      case '-f':
        options.force = true;
        break;
      case '--start-date':
        options.startDate = args[++i];
        break;
      case '--end-date':
        options.endDate = args[++i];
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;
      default:
        console.error(`Unknown option: ${arg}`);
        printHelp();
        process.exit(1);
    }
  }

  return options;
}

function printHelp() {
  console.log(`
Supabase Migration Runner

Usage: npx ts-node src/scripts/run-migrations.ts <command> [options]

Commands:
  status    Show migration status
  run       Run pending migrations
  cleanup   Clean up old JSONB data (after migrations complete)
  all       Run all migrations and cleanup

Options:
  --verbose, -v         Verbose output
  --force, -f          Force run migrations (skip confirmations)
  --start-date DATE    Start date for summary generation (YYYY-MM-DD)
  --end-date DATE      End date for summary generation (YYYY-MM-DD)
  --help, -h           Show this help message

Environment Variables:
  VITE_SUPABASE_URL     Supabase project URL
  VITE_SUPABASE_ANON_KEY   Supabase anon key

Examples:
  npx ts-node src/scripts/run-migrations.ts status
  npx ts-node src/scripts/run-migrations.ts run --verbose
  npx ts-node src/scripts/run-migrations.ts all --force
  npx ts-node src/scripts/run-migrations.ts cleanup
`);
}

async function initializeSupabase(): Promise<MigrationService> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Missing Supabase configuration. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.'
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  return new MigrationService(supabase);
}

async function showMigrationStatus(migration: MigrationService, verbose: boolean) {
  console.log('📊 Migration Status Report\n');

  const migrations = [
    'sections_to_normalized',
    'responses_to_normalized', 
    'generate_summaries'
  ];

  for (const migrationName of migrations) {
    const status = await migration.getMigrationStatus(migrationName);
    
    if (!status) {
      console.log(`❓ ${migrationName}: Unknown (not started)`);
      continue;
    }

    const statusIcon = {
      pending: '⏳',
      running: '🔄',
      completed: '✅',
      failed: '❌'
    }[status.status] || '❓';

    console.log(`${statusIcon} ${migrationName}: ${status.status.toUpperCase()}`);
    
    if (verbose && status.status !== 'pending') {
      if (status.startedAt) {
        console.log(`   Started: ${new Date(status.startedAt).toLocaleString()}`);
      }
      if (status.completedAt) {
        console.log(`   Completed: ${new Date(status.completedAt).toLocaleString()}`);
      }
      if (status.errorMessage) {
        console.log(`   Error: ${status.errorMessage}`);
      }
      if (status.migrationData) {
        console.log(`   Details: ${JSON.stringify(status.migrationData, null, 2)}`);
      }
    }
    console.log();
  }

  // Check overall status
  const allComplete = await migration.areAllMigrationsComplete();
  console.log(`🎯 Overall Status: ${allComplete ? 'All migrations complete' : 'Migrations pending'}\n`);
}

async function runMigrations(migration: MigrationService, options: CliOptions) {
  console.log('🚀 Running database migrations...\n');

  if (!options.force) {
    console.log('⚠️  This will modify your database structure and data.');
    console.log('   Make sure you have a backup before proceeding.\n');
    
    // In a real CLI, you'd use readline to get user confirmation
    // For now, we'll assume --force is required for automated runs
    console.log('Use --force flag to proceed with migrations.');
    return;
  }

  try {
    const results = await migration.runAllMigrations();
    
    console.log('✅ All migrations completed successfully!\n');
    
    for (const result of results) {
      console.log(`📝 ${result.message}`);
      if (options.verbose && result.details) {
        console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

async function cleanupOldData(migration: MigrationService, options: CliOptions) {
  console.log('🧹 Cleaning up old JSONB data...\n');

  if (!options.force) {
    console.log('⚠️  This will permanently remove old JSONB data from your database.');
    console.log('   This action cannot be undone. Make sure migrations are complete.\n');
    console.log('Use --force flag to proceed with cleanup.');
    return;
  }

  try {
    const result = await migration.cleanupOldData();
    console.log('✅ Cleanup completed successfully!');
    console.log(`📝 ${result.message}`);
    
    if (options.verbose && result.details) {
      console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
    }
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

async function main() {
  try {
    const options = parseArgs();
    const migration = await initializeSupabase();

    console.log('🔗 Connected to Supabase\n');

    switch (options.command) {
      case 'status':
        await showMigrationStatus(migration, options.verbose || false);
        break;
        
      case 'run':
        await runMigrations(migration, options);
        break;
        
      case 'cleanup':
        await cleanupOldData(migration, options);
        break;
        
      case 'all':
        await runMigrations(migration, options);
        console.log('\n' + '='.repeat(50) + '\n');
        await cleanupOldData(migration, options);
        break;
        
      default:
        console.error(`Unknown command: ${options.command}`);
        printHelp();
        process.exit(1);
    }

    console.log('\n🎉 Operation completed successfully!');
    
  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { main as runMigrations };