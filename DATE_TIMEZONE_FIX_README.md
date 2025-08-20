# Date Timezone Fix for Survey Instances

## Problem Description

The survey instance date range functionality was experiencing timezone conversion issues where:

- Dates entered as "08/20/2025" were being stored as "8/19/2025" in the database
- This caused a one-day shift due to JavaScript's timezone handling when converting dates to ISO strings
- The issue affected both the display of dates and the actual stored values

## Root Cause

The problem occurred in several places:

1. **Date Input Parsing**: When parsing existing dates from the database, timezone conversions were causing date shifts
2. **Date Saving**: When saving new dates, the conversion to ISO strings was introducing timezone offsets
3. **Date Display**: The display logic was not properly handling timezone-affected dates

## Solution Implemented

### 1. Fixed Date Utility Functions

Updated `src/utils/date.utils.ts` with new functions:

- `createDateRangeISOStrings()`: Creates consistent UTC date strings
- `parseDateFromISOString()`: Safely parses dates with timezone handling
- `normalizeExistingDate()`: Fixes existing dates with timezone issues
- `getDisplayDate()`: Gets display-ready dates from potentially problematic strings

### 2. Updated Components

- **InstanceSettingsModal**: Fixed date input handling and saving
- **useSurveyInstanceSettings hook**: Updated date processing logic
- **SurveyInstanceCard**: Fixed date display to handle existing problematic data

### 3. Database Migration

Created migration scripts to fix existing data:

- `scripts/fix-date-timezone-issues.sql`: SQL script to fix existing dates
- `scripts/fix-date-timezone-issues.js`: Node.js script to run the migration

## How to Apply the Fix

### Option 1: Run the Migration Script (Recommended)

1. Ensure you have the required environment variables:

   ```bash
   VITE_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. Run the migration script:
   ```bash
   node scripts/fix-date-timezone-issues.js
   ```

### Option 2: Manual Database Update

If you prefer to run the SQL manually:

1. Connect to your Supabase database
2. Run the contents of `scripts/fix-date-timezone-issues.sql`

### Option 3: Fix Individual Instances

If you only want to fix specific instances, you can run this SQL:

```sql
-- Fix a specific instance (replace with actual ID)
UPDATE survey_instances
SET active_date_range = jsonb_set(
    active_date_range,
    '{startDate}',
    to_jsonb((active_date_range->>'startDate')::timestamp::date || 'T00:00:00.000Z')
)
WHERE id = 'your-instance-id';

UPDATE survey_instances
SET active_date_range = jsonb_set(
    active_date_range,
    '{endDate}',
    to_jsonb((active_date_range->>'endDate')::timestamp::date || 'T23:59:59.999Z')
)
WHERE id = 'your-instance-id';
```

## What the Fix Does

1. **Normalizes Existing Dates**: Converts dates like "2025-08-19T00:00:00.000Z" to "2025-08-20T00:00:00.000Z"
2. **Ensures Consistent Format**: All dates are stored in UTC with proper time components
3. **Prevents Future Issues**: New date inputs are handled consistently without timezone shifts

## Verification

After running the fix, verify that:

1. Date inputs in the modal show the correct dates
2. Survey instance cards display the correct active date ranges
3. New date ranges are saved correctly
4. Existing date ranges are displayed correctly

## Prevention

The fix also prevents future issues by:

- Using consistent UTC date strings
- Proper timezone handling in date parsing
- Robust error handling for malformed dates

## Files Modified

- `src/utils/date.utils.ts` - Added new utility functions
- `src/components/common/business/framework/modal/instance-settings-modal.tsx` - Fixed date handling
- `src/hooks/use-survey-instance-settings.ts` - Updated date logic
- `src/components/common/business/framework/card/survey-instance-card.tsx` - Fixed date display
- `scripts/fix-date-timezone-issues.sql` - Database migration script
- `scripts/fix-date-timezone-issues.js` - Migration runner script

## Testing

After applying the fix:

1. Open the survey instance settings modal
2. Verify that existing dates are displayed correctly
3. Try setting new date ranges
4. Check that the survey instance card shows the correct dates
5. Verify that the dates are saved correctly in the database
