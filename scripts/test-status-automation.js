#!/usr/bin/env node

/**
 * Test script for survey instance status automation
 * Run this to test the automated status update system
 * 
 * Usage:
 * node scripts/test-status-automation.js
 * 
 * Requirements:
 * - VITE_SUPABASE_URL environment variable
 * - VITE_SUPABASE_ANON_KEY environment variable
 * - Supabase database with the new functions installed
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testStatusAutomation() {
  console.log('🧪 Testing Survey Instance Status Automation');
  console.log('='.repeat(50));

  try {
    // Test 1: Check if the functions exist
    console.log('📋 Test 1: Checking database functions...');
    
    const { data: functions, error: funcError } = await supabase
      .rpc('update_survey_instance_statuses');
    
    if (funcError) {
      console.error('❌ update_survey_instance_statuses function not found:', funcError.message);
      return;
    }
    
    console.log('✅ update_survey_instance_statuses function exists');
    console.log('📊 Function result:', functions);

    // Test 2: Check upcoming status changes
    console.log('\n📋 Test 2: Checking upcoming status changes...');
    
    const { data: upcoming, error: upcomingError } = await supabase
      .rpc('get_upcoming_status_changes', { hours_ahead: 24 });
    
    if (upcomingError) {
      console.error('❌ get_upcoming_status_changes function error:', upcomingError.message);
      return;
    }
    
    console.log('✅ get_upcoming_status_changes function exists');
    console.log('📊 Upcoming changes:', upcoming);

    // Test 3: Check status change audit trail
    console.log('\n📋 Test 3: Checking audit trail...');
    
    const { data: auditLog, error: auditError } = await supabase
      .from('survey_instance_status_changes')
      .select('*')
      .order('changed_at', { ascending: false })
      .limit(5);
    
    if (auditError) {
      console.error('❌ Audit trail table error:', auditError.message);
      return;
    }
    
    console.log('✅ Audit trail table accessible');
    console.log('📊 Recent status changes:', auditLog?.length || 0, 'records');
    
    if (auditLog && auditLog.length > 0) {
      console.log('📝 Latest change:', {
        instance_id: auditLog[0].instance_id,
        reason: auditLog[0].reason,
        changed_at: auditLog[0].changed_at,
        changed_by: auditLog[0].changed_by
      });
    }

    // Test 4: Check survey instances with date ranges
    console.log('\n📋 Test 4: Checking survey instances with date ranges...');
    
    const { data: instances, error: instancesError } = await supabase
      .from('survey_instances')
      .select('id, title, is_active, active_date_range')
      .not('active_date_range', 'is', null);
    
    if (instancesError) {
      console.error('❌ Survey instances query error:', instancesError.message);
      return;
    }
    
    console.log('✅ Survey instances accessible');
    console.log('📊 Instances with date ranges:', instances?.length || 0);
    
    if (instances && instances.length > 0) {
      instances.forEach((instance, index) => {
        console.log(`   ${index + 1}. ${instance.title}`);
        console.log(`      Active: ${instance.is_active}`);
        console.log(`      Date Range: ${JSON.stringify(instance.active_date_range)}`);
      });
    } else {
      console.log('ℹ️  No survey instances with date ranges found');
      console.log('💡 Create a survey instance with a date range to test automation');
    }

    console.log('\n🎉 All tests passed! Status automation system is ready.');
    console.log('\n📋 Next Steps:');
    console.log('1. Create survey instances with active date ranges');
    console.log('2. GitHub Actions will run every 6 hours to update statuses');
    console.log('3. Manual trigger: GitHub → Actions → "Update Survey Instance Status"');
    console.log('4. Monitor audit trail in survey_instance_status_changes table');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('🔍 Full error:', error);
  }
}

// Run the test
testStatusAutomation().then(() => {
  console.log('\n✅ Test completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Test script failed:', error);
  process.exit(1);
});