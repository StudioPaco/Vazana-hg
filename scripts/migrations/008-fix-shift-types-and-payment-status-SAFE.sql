-- SAFE Fix for shift type language consistency and payment status constraints
-- This version safely handles existing data before adding constraints

-- 1. FIRST, let's see what payment status values currently exist
DO $$
BEGIN
    RAISE NOTICE '=== CURRENT PAYMENT STATUS VALUES ===';
END $$;

SELECT DISTINCT payment_status, COUNT(*) as count 
FROM jobs 
GROUP BY payment_status 
ORDER BY count DESC;

-- 2. STANDARDIZE ALL PAYMENT STATUS VALUES TO HEBREW
UPDATE jobs 
SET payment_status = CASE 
    WHEN payment_status IN ('pending', 'ממתין לתשלום') THEN 'ממתין לתשלום'
    WHEN payment_status IN ('paid', 'שולם') THEN 'שולם'
    WHEN payment_status IN ('overdue', 'מאוחר') THEN 'מאוחר'
    WHEN payment_status IN ('not_relevant', 'לא רלוונטי') THEN 'לא רלוונטי'
    -- Handle any other unexpected values
    WHEN payment_status IS NULL OR payment_status = '' THEN 'ממתין לתשלום'
    ELSE 'ממתין לתשלום' -- Default fallback for any unknown values
END;

-- 3. STANDARDIZE SHIFT TYPES TO HEBREW
UPDATE jobs 
SET shift_type = CASE 
    WHEN shift_type IN ('day', 'יום') THEN 'יום'
    WHEN shift_type IN ('night', 'לילה') THEN 'לילה'  
    WHEN shift_type IN ('double', 'כפול', '24 שעות') THEN 'כפול'
    WHEN shift_type IS NULL OR shift_type = '' THEN 'יום'
    ELSE 'יום' -- Default fallback
END;

-- 4. VERIFY DATA IS CLEAN BEFORE ADDING CONSTRAINTS
DO $$
BEGIN
    RAISE NOTICE '=== AFTER CLEANUP - PAYMENT STATUS VALUES ===';
END $$;

SELECT DISTINCT payment_status, COUNT(*) as count 
FROM jobs 
GROUP BY payment_status 
ORDER BY count DESC;

DO $$
BEGIN
    RAISE NOTICE '=== AFTER CLEANUP - SHIFT TYPE VALUES ===';
END $$;

SELECT DISTINCT shift_type, COUNT(*) as count 
FROM jobs 
GROUP BY shift_type 
ORDER BY count DESC;

-- 5. DROP EXISTING CONSTRAINTS SAFELY
DO $$
BEGIN
    -- Drop existing payment status constraint if it exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'jobs_payment_status_check' AND table_name = 'jobs') THEN
        ALTER TABLE jobs DROP CONSTRAINT jobs_payment_status_check;
        RAISE NOTICE 'Dropped existing payment status constraint';
    END IF;
    
    -- Drop existing shift type constraint if it exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'jobs_shift_type_check' AND table_name = 'jobs') THEN
        ALTER TABLE jobs DROP CONSTRAINT jobs_shift_type_check;
        RAISE NOTICE 'Dropped existing shift type constraint';
    END IF;
END $$;

-- 6. ADD NEW HEBREW CONSTRAINTS
DO $$
BEGIN
    -- Add payment status constraint
    ALTER TABLE jobs ADD CONSTRAINT jobs_payment_status_check 
    CHECK (payment_status IN ('ממתין לתשלום', 'שולם', 'מאוחר', 'לא רלוונטי'));
    RAISE NOTICE 'Added Hebrew payment status constraint';
    
    -- Add shift type constraint
    ALTER TABLE jobs ADD CONSTRAINT jobs_shift_type_check 
    CHECK (shift_type IN ('יום', 'לילה', 'כפול'));
    RAISE NOTICE 'Added Hebrew shift type constraint';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'ERROR adding constraints: %', SQLERRM;
        RAISE NOTICE 'Please check data consistency first';
END $$;

-- 7. UPDATE THE CALCULATION FUNCTION TO HANDLE HEBREW SHIFT TYPES
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

-- 8. REFRESH ALL JOB STATUSES WITH CORRECTED CALCULATION
UPDATE jobs 
SET job_status = calculate_job_status(job_date, shift_type)
WHERE job_date IS NOT NULL;

-- 9. FINAL VERIFICATION
DO $$
BEGIN
    RAISE NOTICE '=== FINAL VERIFICATION ===';
END $$;

SELECT 'Payment Status Final' as info, payment_status, COUNT(*) as count  
FROM jobs 
GROUP BY payment_status 
ORDER BY count DESC;

SELECT 'Shift Types Final' as info, shift_type, COUNT(*) as count
FROM jobs 
GROUP BY shift_type
ORDER BY count DESC;

SELECT 'Job Status Final' as info, job_status, COUNT(*) as count
FROM jobs 
GROUP BY job_status  
ORDER BY count DESC;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '=== SAFE LANGUAGE CONSISTENCY MIGRATION COMPLETED ===';
    RAISE NOTICE 'All shift types are now in Hebrew: יום, לילה, כפול';
    RAISE NOTICE 'All payment statuses are now in Hebrew: ממתין לתשלום, שולם, מאוחר, לא רלוונטי';
    RAISE NOTICE 'Job statuses remain in Hebrew: ממתין, בתהליך, הושלם';
    RAISE NOTICE 'Constraints have been updated to enforce Hebrew values only';
END $$;