-- Add validation_in_progress field to prevent date automation during validation
-- This prevents race conditions between validation and the GitHub Action

-- Step 1: Add the validation_in_progress column
ALTER TABLE survey_instances 
ADD COLUMN IF NOT EXISTS validation_in_progress BOOLEAN DEFAULT false;

-- Step 2: Create index for performance
CREATE INDEX IF NOT EXISTS idx_survey_instances_validation_in_progress 
ON survey_instances(validation_in_progress);

-- Step 3: Update existing records to have validation_in_progress = false
UPDATE survey_instances 
SET validation_in_progress = false 
WHERE validation_in_progress IS NULL;

-- Step 4: Make column NOT NULL
ALTER TABLE survey_instances 
ALTER COLUMN validation_in_progress SET NOT NULL;

-- Step 5: Add comment for documentation
COMMENT ON COLUMN survey_instances.validation_in_progress IS 
'Prevents date automation from running while validation is in progress. Set to true during validation, false when complete.';

-- Step 6: Update the update_survey_instance_statuses function to respect this field
CREATE OR REPLACE FUNCTION update_survey_instance_statuses()
RETURNS json AS $$
DECLARE
    activated_count INTEGER := 0;
    deactivated_count INTEGER := 0;
    activation_record RECORD;
    deactivation_record RECORD;
BEGIN
    -- Update instances that should be activated 
    -- (currently inactive, within date range, config is valid, AND validation is not in progress)
    FOR activation_record IN
        SELECT id, title, active_date_range
        FROM survey_instances 
        WHERE 
            is_active = false 
            AND config_valid = true  -- Only activate if config is valid
            AND validation_in_progress = false  -- NEW: Don't activate if validation is in progress
            AND active_date_range IS NOT NULL
            AND NOW() >= (active_date_range->>'startDate')::timestamp
            AND NOW() <= (active_date_range->>'endDate')::timestamp
    LOOP
        UPDATE survey_instances 
        SET is_active = true
        WHERE id = activation_record.id;
        
        activated_count := activated_count + 1;
    END LOOP;
    
    -- Update instances that should be deactivated (currently active but outside date range)
    -- Note: We still deactivate based on date ranges even if validation is in progress
    FOR deactivation_record IN
        SELECT id, title, active_date_range
        FROM survey_instances 
        WHERE 
            is_active = true 
            AND active_date_range IS NOT NULL
            AND (NOW() < (active_date_range->>'startDate')::timestamp
                 OR NOW() > (active_date_range->>'endDate')::timestamp)
    LOOP
        UPDATE survey_instances 
        SET is_active = false
        WHERE id = deactivation_record.id;
        
        deactivated_count := deactivated_count + 1;
    END LOOP;
    
    -- Return summary of changes
    RETURN json_build_object(
        'success', true,
        'activated', activated_count,
        'deactivated', deactivated_count,
        'timestamp', NOW(),
        'message', format('Processed %s activations and %s deactivations', activated_count, deactivated_count)
    );
END;
$$ LANGUAGE plpgsql;

-- Step 7: Add a function to clear validation locks (call this after validation completes)
CREATE OR REPLACE FUNCTION clear_validation_locks()
RETURNS json AS $$
DECLARE
    cleared_count INTEGER := 0;
BEGIN
    UPDATE survey_instances 
    SET validation_in_progress = false
    WHERE validation_in_progress = true;
    
    GET DIAGNOSTICS cleared_count = ROW_COUNT;
    
    RETURN json_build_object(
        'success', true,
        'cleared_locks', cleared_count,
        'timestamp', NOW(),
        'message', format('Cleared %s validation locks', cleared_count)
    );
END;
$$ LANGUAGE plpgsql;

-- Step 8: Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'survey_instances' 
AND column_name IN ('config_valid', 'validation_in_progress')
ORDER BY column_name;

-- Step 9: Test the function
SELECT update_survey_instance_statuses();
