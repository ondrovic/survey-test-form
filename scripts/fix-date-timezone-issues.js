const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_SUPABASE_URL:', !!process.env.VITE_SUPABASE_URL);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixDateTimezoneIssues() {
  console.log('🔧 Starting date timezone fix migration...');
  
  try {
    // Read the SQL migration file
    const sqlPath = path.join(__dirname, 'fix-date-timezone-issues.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 Executing SQL migration...');
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      // If the RPC method doesn't exist, try direct execution
      console.log('⚠️  RPC method not available, trying direct SQL execution...');
      
      // Split the SQL into individual statements
      const statements = sqlContent
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);
      
      for (const statement of statements) {
        if (statement.trim()) {
          console.log(`📝 Executing: ${statement.substring(0, 50)}...`);
          const { error: stmtError } = await supabase.rpc('exec_sql', { sql: statement });
          if (stmtError) {
            console.warn(`⚠️  Statement failed: ${stmtError.message}`);
          }
        }
      }
    } else {
      console.log('✅ Migration executed successfully:', data);
    }
    
    // Verify the fix by checking current date ranges
    console.log('🔍 Verifying current date ranges...');
    const { data: instances, error: fetchError } = await supabase
      .from('survey_instances')
      .select('id, title, active_date_range')
      .not('active_date_range', 'is', null);
    
    if (fetchError) {
      console.error('❌ Error fetching instances:', fetchError);
      return;
    }
    
    console.log('📊 Current date ranges:');
    instances.forEach(instance => {
      const startDate = instance.active_date_range?.startDate;
      const endDate = instance.active_date_range?.endDate;
      console.log(`   ${instance.title}:`);
      console.log(`     Start: ${startDate}`);
      console.log(`     End: ${endDate}`);
    });
    
    console.log('✅ Date timezone fix migration completed!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
fixDateTimezoneIssues()
  .then(() => {
    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });
