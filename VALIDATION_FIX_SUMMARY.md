# Configuration Validation Deactivation Fix

## Problem
Survey instances with configuration validation errors (like missing radio option sets) were showing as deactivated in the validation modal but remaining active in the database. This was caused by database triggers and automated date range processing that would override application-level deactivation.

## Root Cause Analysis
1. **GitHub Action**: Runs every 6 hours (`update-survey-status.yml`) calling `update_survey_instance_statuses()` 
2. **Database Function**: Only considers `active_date_range` when activating/deactivating instances
3. **No Validation Check**: Automated system ignored configuration validation status

## Solution Implementation

### 1. Database Changes (`scripts/fix-validation-deactivation.sql`)
- Added `config_valid BOOLEAN` field to `survey_instances` table
- Updated `update_survey_instance_statuses()` function to respect `config_valid` status
- Modified status change logging to track validation-based deactivation
- Instances with `config_valid=false` will not be automatically activated by date range

### 2. TypeScript Changes
- Updated `SurveyInstance` interface to include `config_valid?: boolean`
- Updated `SurveyInstanceRow` database type
- Enhanced mapper to handle the new field with backward compatibility

### 3. Validation Logic Updates (`src/hooks/use-survey-operations.ts`)
- **Invalid Configurations**: Set both `isActive=false` and `config_valid=false`
- **Valid Configurations**: Set `config_valid=true` to allow date range activation
- **Inactive Instances**: Also marked as `config_valid=false` if configuration invalid

## How It Works

### Before Fix:
1. Validation finds missing radio option set
2. Application sets `isActive=false`  
3. GitHub Action runs automated status update
4. Function reactivates instance based on date range only
5. Instance appears deactivated in UI but is active in database

### After Fix:
1. Validation finds missing radio option set
2. Application sets `isActive=false` AND `config_valid=false`
3. GitHub Action runs automated status update  
4. Function checks `config_valid=false` and skips activation
5. Instance remains deactivated until configuration is fixed

## Testing Steps

1. **Apply Database Migration**:
   ```sql
   -- Run scripts/fix-validation-deactivation.sql
   ```

2. **Verify Field Added**:
   ```sql
   SELECT column_name, data_type, is_nullable 
   FROM information_schema.columns 
   WHERE table_name = 'survey_instances' AND column_name = 'config_valid';
   ```

3. **Test Validation**:
   - Create survey instance with missing radio option set
   - Run configuration validation
   - Verify `config_valid=false` in database
   - Wait for automated status update (or trigger manually)
   - Confirm instance remains deactivated

4. **Test Recovery**:
   - Create missing radio option set
   - Run configuration validation again
   - Verify `config_valid=true` in database
   - Instance should be eligible for date range activation

## Benefits

- **Prevents Reactivation**: Invalid configurations cannot be accidentally reactivated
- **Maintains Automation**: Date range functionality still works for valid configurations  
- **Clear Status Tracking**: `survey_instance_status_changes` logs validation deactivation
- **Backward Compatible**: Existing instances default to `config_valid=true`

## Files Modified

- `scripts/fix-validation-deactivation.sql` - Database migration
- `src/hooks/use-survey-operations.ts` - Validation logic
- `src/types/framework.types.ts` - SurveyInstance interface
- `src/types/database-rows.types.ts` - SurveyInstanceRow interface  
- `src/mappers/survey-instance.mapper.ts` - Domain/database mapping
- `src/services/database-operations/option-sets-operations.service.ts` - Minor fixes
- `src/services/supabase-client.service.ts` - Minor fixes

## Next Steps

1. Apply database migration in all environments
2. Test validation workflow end-to-end
3. Monitor status change logs for validation-based deactivation
4. Consider UI improvements to show `config_valid` status to users