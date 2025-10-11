-- ULTRA SAFE Fix for shift type language consistency and payment status constraints
-- This version ensures ALL data is cleaned BEFORE any constraints are added

BEGIN;

-- 1. FIRST, let's see what values currently exist
DO $$
BEGIN
    RAISE NOTICE '=== CURRENT DATA STATE ===';
END $$;

SELECT 'Current Payment Status' as info, payment_status, COUNT(*) as count 
FROM jobs 
WHERE payment_status IS NOT NULL
GROUP BY payment_status 
ORDER BY count DESC;

SELECT 'Current Shift Types' as info, shift_type, COUNT(*) as count 
FROM jobs 
WHERE shift_type IS NOT NULL
GROUP BY shift_type 
ORDER BY count DESC;

-- 2. DROP ALL EXISTING CONSTRAINTS FIRST (before any updates)
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

-- 3. CLEAN ALL PAYMENT STATUS VALUES TO HEBREW
UPDATE jobs 
SET payment_status = CASE 
    WHEN payment_status IN ('pending', 'ממתין לתשלום') THEN 'ממתין לתשלום'
    WHEN payment_status IN ('paid', 'שולם') THEN 'שולם'
    WHEN payment_status IN ('overdue', 'מאוחר') THEN 'מאוחר'
    WHEN payment_status IN ('not_relevant', 'לא רלוונטי') THEN 'לא רלוונטי'
    WHEN payment_status IS NULL OR payment_status = '' THEN 'ממתין לתשלום'
    ELSE 'ממתין לתשלום' -- Default fallback for any unknown values
END;

-- 4. CLEAN ALL SHIFT TYPES TO HEBREW  
UPDATE jobs 
SET shift_type = CASE 
    WHEN shift_type IN ('day', 'יום') THEN 'יום'
    WHEN shift_type IN ('night', 'לילה') THEN 'לילה'  
    WHEN shift_type IN ('double', 'כפול', '24 שעות') THEN 'כפול'
    WHEN shift_type IS NULL OR shift_type = '' THEN 'יום'
    ELSE 'יום' -- Default fallback
END;

-- 5. VERIFY ALL DATA IS NOW CLEAN
DO $$
BEGIN
    RAISE NOTICE '=== AFTER CLEANUP - VERIFICATION ===';
END $$;

-- Check for any remaining non-Hebrew payment status values
SELECT 'Cleaned Payment Status' as info, payment_status, COUNT(*) as count 
FROM jobs 
GROUP BY payment_status 
ORDER BY count DESC;

-- Check for any remaining non-Hebrew shift type values
SELECT 'Cleaned Shift Types' as info, shift_type, COUNT(*) as count 
FROM jobs 
GROUP BY shift_type 
ORDER BY count DESC;

-- Alert if any data doesn't match expected Hebrew values
DO $$
DECLARE
    bad_payment_count INTEGER;
    bad_shift_count INTEGER;
BEGIN
    -- Check payment status compliance
    SELECT COUNT(*) INTO bad_payment_count 
    FROM jobs 
    WHERE payment_status NOT IN ('ממתין לתשלום', 'שולם', 'מאוחר', 'לא רלוונטי');
    
    -- Check shift type compliance  
    SELECT COUNT(*) INTO bad_shift_count
    FROM jobs 
    WHERE shift_type NOT IN ('יום', 'לילה', 'כפול');
    
    IF bad_payment_count > 0 THEN
        RAISE EXCEPTION 'ERROR: % rows still have invalid payment_status values!', bad_payment_count;
    END IF;
    
    IF bad_shift_count > 0 THEN
        RAISE EXCEPTION 'ERROR: % rows still have invalid shift_type values!', bad_shift_count;
    END IF;
    
    RAISE NOTICE 'SUCCESS: All data is now compliant with Hebrew constraints';
END $$;

-- 6. NOW SAFE TO ADD HEBREW CONSTRAINTS
ALTER TABLE jobs ADD CONSTRAINT jobs_payment_status_check 
CHECK (payment_status IN ('ממתין לתשלום', 'שולם', 'מאוחר', 'לא רלוונטי'));

ALTER TABLE jobs ADD CONSTRAINT jobs_shift_type_check 
CHECK (shift_type IN ('יום', 'לילה', 'כפול'));

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

-- 9. FINAL VERIFICATION AND SUCCESS MESSAGE
DO $$
BEGIN
    RAISE NOTICE '=== FINAL STATE ===';
END $$;

SELECT 'Final Payment Status' as info, payment_status, COUNT(*) as count  
FROM jobs 
GROUP BY payment_status 
ORDER BY count DESC;

SELECT 'Final Shift Types' as info, shift_type, COUNT(*) as count
FROM jobs 
GROUP BY shift_type
ORDER BY count DESC;

SELECT 'Final Job Status' as info, job_status, COUNT(*) as count
FROM jobs 
GROUP BY job_status  
ORDER BY count DESC;

-- Final success message
DO $$
BEGIN
    RAISE NOTICE '=== ULTRA-SAFE LANGUAGE CONSISTENCY MIGRATION COMPLETED SUCCESSFULLY ===';
    RAISE NOTICE 'All shift types standardized to Hebrew: יום, לילה, כפול';
    RAISE NOTICE 'All payment statuses standardized to Hebrew: ממתין לתשלום, שולם, מאוחר, לא רלוונטי';
    RAISE NOTICE 'Job statuses remain in Hebrew: ממתין, בתהליך, הושלם';
    RAISE NOTICE 'Hebrew-only constraints are now active and enforced';
END $$;

COMMIT;