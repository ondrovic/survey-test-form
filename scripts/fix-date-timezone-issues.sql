-- Fix for date timezone issues in survey instances
-- This script corrects existing dates that may have been affected by timezone conversion bugs

-- Function to fix date timezone issues
CREATE OR REPLACE FUNCTION fix_date_timezone_issues()
RETURNS json AS $$
DECLARE
    instance_record RECORD;
    fixed_count INTEGER := 0;
    start_date_fixed BOOLEAN;
    end_date_fixed BOOLEAN;
    original_start_date TEXT;
    original_end_date TEXT;
    new_start_date TEXT;
    new_end_date TEXT;
BEGIN
    -- Loop through all survey instances with active date ranges
    FOR instance_record IN
        SELECT 
            id, 
            title, 
            active_date_range
        FROM survey_instances 
        WHERE active_date_range IS NOT NULL
    LOOP
        start_date_fixed := false;
        end_date_fixed := false;
        
        -- Check if start date needs fixing
        IF instance_record.active_date_range->>'startDate' IS NOT NULL THEN
            original_start_date := instance_record.active_date_range->>'startDate';
            
            -- Parse the date and check if it's off by one day due to timezone
            -- If the time is not exactly 00:00:00.000Z, it might have timezone issues
            IF original_start_date NOT LIKE '%T00:00:00.000Z' THEN
                -- Extract the date part and create a proper UTC date
                new_start_date := (instance_record.active_date_range->>'startDate')::timestamp::date || 'T00:00:00.000Z';
                
                -- Update the start date
                UPDATE survey_instances 
                SET active_date_range = jsonb_set(
                    active_date_range, 
                    '{startDate}', 
                    to_jsonb(new_start_date)
                )
                WHERE id = instance_record.id;
                
                start_date_fixed := true;
                RAISE NOTICE 'Fixed start date for instance %: % -> %', 
                    instance_record.title, original_start_date, new_start_date;
            END IF;
        END IF;
        
        -- Check if end date needs fixing
        IF instance_record.active_date_range->>'endDate' IS NOT NULL THEN
            original_end_date := instance_record.active_date_range->>'endDate';
            
            -- Parse the date and check if it's off by one day due to timezone
            -- If the time is not exactly 23:59:59.999Z, it might have timezone issues
            IF original_end_date NOT LIKE '%T23:59:59.999Z' THEN
                -- Extract the date part and create a proper UTC date
                new_end_date := (instance_record.active_date_range->>'endDate')::timestamp::date || 'T23:59:59.999Z';
                
                -- Update the end date
                UPDATE survey_instances 
                SET active_date_range = jsonb_set(
                    active_date_range, 
                    '{endDate}', 
                    to_jsonb(new_end_date)
                )
                WHERE id = instance_record.id;
                
                end_date_fixed := true;
                RAISE NOTICE 'Fixed end date for instance %: % -> %', 
                    instance_record.title, original_end_date, new_end_date;
            END IF;
        END IF;
        
        -- Count fixed instances
        IF start_date_fixed OR end_date_fixed THEN
            fixed_count := fixed_count + 1;
        END IF;
    END LOOP;
    
    -- Return summary
    RETURN json_build_object(
        'success', true,
        'fixed_instances', fixed_count,
        'message', format('Fixed date timezone issues for %s survey instances', fixed_count),
        'timestamp', NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Execute the fix
SELECT fix_date_timezone_issues();

-- Clean up the function
DROP FUNCTION IF EXISTS fix_date_timezone_issues();

-- Show the results
SELECT 
    id,
    title,
    active_date_range->>'startDate' as start_date,
    active_date_range->>'endDate' as end_date
FROM survey_instances 
WHERE active_date_range IS NOT NULL
ORDER BY title;
