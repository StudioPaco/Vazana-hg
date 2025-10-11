-- Fix shift type language consistency and payment status constraints
-- This will standardize all shift types to Hebrew and fix payment status issues

-- 1. STANDARDIZE SHIFT TYPES TO HEBREW
UPDATE jobs 
SET shift_type = CASE 
    WHEN shift_type IN ('day', 'יום') THEN 'יום'
    WHEN shift_type IN ('night', 'לילה') THEN 'לילה'  
    WHEN shift_type IN ('double', 'כפול', '24 שעות') THEN 'כפול'
    ELSE 'יום' -- Default fallback
END
WHERE shift_type IS NOT NULL;

-- 2. ADD/UPDATE CHECK CONSTRAINT FOR SHIFT TYPES
DO $$
BEGIN
    -- Drop existing constraint if it exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'jobs_shift_type_check' AND table_name = 'jobs') THEN
        ALTER TABLE jobs DROP CONSTRAINT jobs_shift_type_check;
    END IF;
    
    -- Add new Hebrew constraint
    ALTER TABLE jobs ADD CONSTRAINT jobs_shift_type_check 
    CHECK (shift_type IN ('יום', 'לילה', 'כפול'));
    
    RAISE NOTICE 'Updated shift type constraint to Hebrew values only';
END $$;

-- 3. STANDARDIZE PAYMENT STATUS TO HEBREW
UPDATE jobs 
SET payment_status = CASE 
    WHEN payment_status IN ('pending', 'ממתין לתשלום') THEN 'ממתין לתשלום'
    WHEN payment_status IN ('paid', 'שולם') THEN 'שולם'
    WHEN payment_status IN ('overdue', 'מאוחר') THEN 'מאוחר'
    WHEN payment_status IN ('not_relevant', 'לא רלוונטי') THEN 'לא רלוונטי'
    ELSE 'ממתין לתשלום' -- Default fallback
END
WHERE payment_status IS NOT NULL;

-- 4. ADD/UPDATE CHECK CONSTRAINT FOR PAYMENT STATUS
DO $$
BEGIN
    -- Drop existing constraint if it exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'jobs_payment_status_check' AND table_name = 'jobs') THEN
        ALTER TABLE jobs DROP CONSTRAINT jobs_payment_status_check;
    END IF;
    
    -- Add new Hebrew constraint
    ALTER TABLE jobs ADD CONSTRAINT jobs_payment_status_check 
    CHECK (payment_status IN ('ממתין לתשלום', 'שולם', 'מאוחר', 'לא רלוונטי'));
    
    RAISE NOTICE 'Updated payment status constraint to Hebrew values only';
END $$;

-- 5. UPDATE THE CALCULATION FUNCTION TO HANDLE HEBREW SHIFT TYPES
CREATE OR REPLACE FUNCTION calculate_job_status(
    job_date DATE,
    shift_type TEXT,
    current_ts TIMESTAMPTZ DEFAULT NOW()
) RETURNS TEXT AS $$
DECLARE
    job_start_time TIMESTAMPTZ;
    job_end_time TIMESTAMPTZ;
    shift_duration INTERVAL;
BEGIN
    -- Handle null inputs - return default status
    IF job_date IS NULL THEN
        RETURN 'ממתין';
    END IF;
    
    -- Default shift type if null
    IF shift_type IS NULL THEN
        shift_type := 'יום';
    END IF;
    
    -- Determine shift start time and duration based on Hebrew shift type
    IF shift_type IN ('יום', 'day') THEN
        job_start_time := job_date::TIMESTAMPTZ + INTERVAL '6 hours'; -- 6:00 AM
        shift_duration := INTERVAL '11 hours'; -- Until 17:00 (5:00 PM)
    ELSIF shift_type IN ('לילה', 'night') THEN  
        job_start_time := job_date::TIMESTAMPTZ + INTERVAL '18 hours'; -- 6:00 PM
        shift_duration := INTERVAL '12 hours'; -- Until 6:00 AM next day
    ELSIF shift_type IN ('כפול', 'double', '24 שעות') THEN
        job_start_time := job_date::TIMESTAMPTZ + INTERVAL '6 hours'; -- 6:00 AM  
        shift_duration := INTERVAL '24 hours'; -- 24 hour shift
    ELSE
        -- Default to day shift for any other values
        job_start_time := job_date::TIMESTAMPTZ + INTERVAL '6 hours';
        shift_duration := INTERVAL '11 hours';
    END IF;
    
    job_end_time := job_start_time + shift_duration;
    
    -- Calculate status based on current time vs job timing
    IF current_ts < job_start_time - INTERVAL '24 hours' THEN
        -- More than 24 hours before job starts
        RETURN 'ממתין';
    ELSIF current_ts >= job_start_time - INTERVAL '24 hours' AND current_ts < job_end_time THEN
        -- Within 24 hours of start time OR currently during the job
        RETURN 'בתהליך'; 
    ELSE
        -- After job end time  
        RETURN 'הושלם';
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 6. REFRESH ALL JOB STATUSES WITH CORRECTED CALCULATION
UPDATE jobs 
SET job_status = calculate_job_status(job_date, shift_type)
WHERE job_date IS NOT NULL;

-- 7. VERIFICATION QUERIES
SELECT 'Shift Types Distribution' as info, shift_type, COUNT(*) as count
FROM jobs 
GROUP BY shift_type
ORDER BY count DESC;

SELECT 'Payment Status Distribution' as info, payment_status, COUNT(*) as count  
FROM jobs 
GROUP BY payment_status
ORDER BY count DESC;

SELECT 'Job Status Distribution' as info, job_status, COUNT(*) as count
FROM jobs 
GROUP BY job_status  
ORDER BY count DESC;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '=== LANGUAGE CONSISTENCY MIGRATION COMPLETED ===';
    RAISE NOTICE 'All shift types are now in Hebrew: יום, לילה, כפול';
    RAISE NOTICE 'All payment statuses are now in Hebrew: ממתין לתשלום, שולם, מאוחר, לא רלוונטי';
    RAISE NOTICE 'Job statuses remain in Hebrew: ממתין, בתהליך, הושלם';
END $$;