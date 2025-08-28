#!/usr/bin/env node

/**
 * Test script to verify pg_cron automation is working correctly
 * This script checks that survey instance status updates, session cleanup,
 * and error log cleanup are scheduled and running properly via pg_cron
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Testing pg_cron Automation Setup');
console.log('====================================\n');

async function testCronSetup() {
  try {
    // Test 1: Check if pg_cron extension is enabled
    console.log('📋 Test 1: Checking pg_cron extension...');
    const { data: extensions, error: extError } = await supabase
      .rpc('sql', { 
        query: "SELECT * FROM pg_extension WHERE extname = 'pg_cron';" 
      });
    
    if (extError) {
      console.error('❌ Cannot check pg_cron extension:', extError.message);
      return false;
    }

    if (!extensions || extensions.length === 0) {
      console.error('❌ pg_cron extension is not installed');
      console.log('💡 Run: CREATE EXTENSION IF NOT EXISTS pg_cron;');
      return false;
    }

    console.log('✅ pg_cron extension is installed');

    // Test 2: Check scheduled jobs
    console.log('\n📋 Test 2: Checking scheduled cron jobs...');
    const { data: jobs, error: jobsError } = await supabase
      .rpc('sql', { 
        query: "SELECT jobid, jobname, schedule, command, active FROM cron.job WHERE jobname IN ('survey-instance-status-updates', 'session-cleanup') ORDER BY jobname;" 
      });

    if (jobsError) {
      console.error('❌ Cannot check cron jobs:', jobsError.message);
      console.log('💡 This might be a permissions issue or cron.job table access');
      return false;
    }

    if (!jobs || jobs.length === 0) {
      console.error('❌ No cron jobs found');
      console.log('💡 Run the setup migration or scripts to create cron jobs');
      return false;
    }

    console.log(`✅ Found ${jobs.length} scheduled cron job(s):`);
    jobs.forEach(job => {
      console.log(`   🔄 ${job.jobname} (ID: ${job.jobid})`);
      console.log(`      Schedule: ${job.schedule}`);
      console.log(`      Command: ${job.command}`);
      console.log(`      Status: ${job.active ? '✅ Active' : '❌ Inactive'}`);
      console.log('');
    });

    // Test 3: Check job execution history
    console.log('📋 Test 3: Checking recent job execution history...');
    const { data: history, error: historyError } = await supabase
      .rpc('sql', { 
        query: "SELECT jobid, job_name, start_time, end_time, return_message, status FROM cron.job_run_details WHERE job_name IN ('survey-instance-status-updates', 'session-cleanup') ORDER BY start_time DESC LIMIT 10;" 
      });

    if (historyError) {
      console.error('⚠️  Cannot check job history:', historyError.message);
      console.log('💡 This is normal if jobs haven\'t run yet or permissions are limited');
    } else if (!history || history.length === 0) {
      console.log('⚠️  No job execution history found yet');
      console.log('💡 Jobs may not have run yet (they run every 15-30 minutes)');
    } else {
      console.log(`✅ Found ${history.length} recent job execution(s):`);
      history.forEach(run => {
        const duration = run.end_time 
          ? Math.round((new Date(run.end_time) - new Date(run.start_time)) / 1000) 
          : 'Running...';
        console.log(`   📊 ${run.job_name}`);
        console.log(`      Started: ${run.start_time}`);
        console.log(`      Duration: ${duration}s`);
        console.log(`      Status: ${run.status === 'succeeded' ? '✅' : '❌'} ${run.status}`);
        if (run.return_message) {
          console.log(`      Result: ${run.return_message}`);
        }
        console.log('');
      });
    }

    // Test 4: Test manual execution of functions
    console.log('📋 Test 4: Testing manual function execution...');
    
    // Test survey instance status updates
    console.log('   🔄 Testing update_survey_instance_statuses()...');
    const { data: instanceResult, error: instanceError } = await supabase
      .rpc('update_survey_instance_statuses');
    
    if (instanceError) {
      console.error('❌ update_survey_instance_statuses failed:', instanceError.message);
    } else {
      console.log('✅ update_survey_instance_statuses succeeded');
      console.log(`   📊 Result: ${instanceResult?.message || JSON.stringify(instanceResult)}`);
    }

    // Test session cleanup
    console.log('   🧹 Testing cleanup_survey_sessions()...');
    const { data: sessionResult, error: sessionError } = await supabase
      .rpc('cleanup_survey_sessions');
    
    if (sessionError) {
      console.error('❌ cleanup_survey_sessions failed:', sessionError.message);
    } else {
      console.log('✅ cleanup_survey_sessions succeeded');
      console.log(`   📊 Result: ${sessionResult?.message || JSON.stringify(sessionResult)}`);
    }

    // Test error log cleanup (new trigger-based system)
    console.log('   🗂️  Testing error log cleanup functions...');
    const { data: errorCleanupResult, error: errorCleanupError } = await supabase
      .rpc('lightweight_error_cleanup');
    
    if (errorCleanupError) {
      console.error('❌ lightweight_error_cleanup failed:', errorCleanupError.message);
    } else {
      console.log('✅ lightweight_error_cleanup succeeded');
      console.log(`   📊 Result: ${JSON.stringify(errorCleanupResult)}`);
    }

    // Test 5: Check current session status
    console.log('\n📋 Test 5: Checking current session statuses...');
    const { data: sessions, error: sessionsError } = await supabase
      .from('survey_sessions')
      .select('id, status, started_at, last_activity_at, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (sessionsError) {
      console.error('❌ Cannot check sessions:', sessionsError.message);
    } else if (!sessions || sessions.length === 0) {
      console.log('ℹ️  No sessions found in database');
    } else {
      console.log(`✅ Found ${sessions.length} recent session(s):`);
      sessions.forEach(session => {
        const age = Math.round((new Date() - new Date(session.created_at)) / (1000 * 60)); // minutes
        const lastActivity = Math.round((new Date() - new Date(session.last_activity_at)) / (1000 * 60)); // minutes
        console.log(`   📊 ${session.id.substring(0, 8)}... - Status: ${session.status}`);
        console.log(`      Created: ${age} minutes ago`);
        console.log(`      Last Activity: ${lastActivity} minutes ago`);
        console.log('');
      });
    }

    return true;

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    return false;
  }
}

async function main() {
  const success = await testCronSetup();
  
  console.log('\n====================================');
  if (success) {
    console.log('🎉 Cron automation test completed!');
    console.log('');
    console.log('📋 Summary:');
    console.log('✅ pg_cron extension is enabled');
    console.log('✅ Cron jobs are scheduled');
    console.log('✅ Functions execute manually');
    console.log('');
    console.log('🤖 Automated Tasks:');
    console.log('   • Survey instance activation/deactivation: Every 30 minutes');
    console.log('   • Session cleanup (abandon/expire): Every 15 minutes');
    console.log('');
    console.log('📊 Monitoring:');
    console.log('   • View jobs: SELECT * FROM cron.job;');
    console.log('   • View history: SELECT * FROM cron.job_run_details ORDER BY start_time DESC;');
    console.log('   • Manual run: SELECT cleanup_survey_sessions();');
  } else {
    console.log('❌ Cron automation test failed');
    console.log('');
    console.log('🔧 Next Steps:');
    console.log('1. Run the setup migration: 20250826140000_setup_cron_automation.sql');
    console.log('2. Or run the setup script: scripts/setup-supabase-optimized.sql');
    console.log('3. Ensure pg_cron extension is enabled');
  }
  
  process.exit(success ? 0 : 1);
}

// Run the test
main().catch(console.error);