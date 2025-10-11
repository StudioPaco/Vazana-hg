-- JOB STATUS CONSOLIDATION - FINAL CORRECTED VERSION
-- This migration will:
-- 1. Clean any bad data first
-- 2. Remove duplicate 'status' column if exists  
-- 3. Keep only 'job_status' column with smart calculation
-- 4. Add triggers for automatic status updates

-- Set search path
SET search_path = public, pg_catalog;

-- 1. CLEAN BAD DATA FIRST - Update any invalid status values
UPDATE jobs 
SET job_status = CASE 
    WHEN job_status IN ('ממתין', 'בתהליך', 'הושלם') THEN job_status
    WHEN job_status = 'pending' THEN 'ממתין'
    WHEN job_status = 'in_progress' THEN 'בתהליך'
    WHEN job_status = 'completed' THEN 'הושלם'
    WHEN job_status = 'finished' THEN 'הושלם'
    WHEN job_status = 'active' THEN 'בתהליך'
    WHEN job_status = 'לא צוין' THEN 'ממתין'
    ELSE 'ממתין'
END
WHERE job_status IS NOT NULL;

-- Set NULL values to default
UPDATE jobs SET job_status = 'ממתין' WHERE job_status IS NULL;

-- 2. REMOVE DUPLICATE STATUS COLUMN IF EXISTS
DO $$
BEGIN
    -- Check if the column exists before trying to drop it
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'jobs' AND column_name = 'status' AND table_schema = 'public') THEN
        
        -- Copy data from 'status' to 'job_status' if job_status is null
        UPDATE jobs 
        SET job_status = CASE 
            WHEN status IN ('ממתין', 'בתהליך', 'הושלם') THEN status
            WHEN status = 'pending' THEN 'ממתין'
            WHEN status = 'in_progress' THEN 'בתהליך' 
            WHEN status = 'completed' THEN 'הושלם'
            WHEN status = 'finished' THEN 'הושלם'
            WHEN status = 'active' THEN 'בתהליך'
            WHEN status = 'לא צוין' THEN 'ממתין'
            ELSE 'ממתין'
        END
        WHERE job_status IS NULL AND status IS NOT NULL;
        
        -- Drop the duplicate column
        ALTER TABLE jobs DROP COLUMN status;
        
        RAISE NOTICE 'Removed duplicate status column from jobs table';
    END IF;
END $$;

-- 3. ENSURE job_status COLUMN HAS PROPER CONSTRAINTS
ALTER TABLE jobs ALTER COLUMN job_status SET DEFAULT 'ממתין';
ALTER TABLE jobs ALTER COLUMN job_status SET NOT NULL;

-- 4. ADD CHECK CONSTRAINT FOR VALID STATUS VALUES  
DO $$
BEGIN
    -- Drop existing constraint if it exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'jobs_job_status_check' AND table_name = 'jobs') THEN
        ALTER TABLE jobs DROP CONSTRAINT jobs_job_status_check;
    END IF;
    
    -- Add new constraint - this should work now since we cleaned the data
    ALTER TABLE jobs ADD CONSTRAINT jobs_job_status_check 
    CHECK (job_status IN ('ממתין', 'בתהליך', 'הושלם'));
    
    RAISE NOTICE 'Added job status constraint successfully';
END $$;

-- 5. CREATE SMART CALCULATION FUNCTION
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
        shift_type := 'day';
    END IF;
    
    -- Determine shift start time and duration based on shift type
    CASE 
        WHEN shift_type = 'day' THEN
            job_start_time := job_date::TIMESTAMPTZ + INTERVAL '6 hours'; -- 6:00 AM
            shift_duration := INTERVAL '11 hours'; -- Until 17:00 (5:00 PM)
        WHEN shift_type = 'night' THEN  
            job_start_time := job_date::TIMESTAMPTZ + INTERVAL '18 hours'; -- 6:00 PM
            shift_duration := INTERVAL '12 hours'; -- Until 6:00 AM next day
        WHEN shift_type = 'double' THEN
            job_start_time := job_date::TIMESTAMPTZ + INTERVAL '6 hours'; -- 6:00 AM  
            shift_duration := INTERVAL '24 hours'; -- 24 hour shift
        ELSE
            -- Default to day shift for any other values
            job_start_time := job_date::TIMESTAMPTZ + INTERVAL '6 hours';
            shift_duration := INTERVAL '11 hours';
    END CASE;
    
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

-- 6. CREATE TRIGGER FUNCTION FOR AUTO-UPDATE
CREATE OR REPLACE FUNCTION update_job_status_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-calculate and set the job status based on date/time
    NEW.job_status := calculate_job_status(NEW.job_date, NEW.shift_type);
    
    -- Update the timestamp
    NEW.updated_date := NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. CREATE TRIGGERS FOR AUTOMATIC UPDATES
-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_job_status ON jobs;

-- Create trigger that fires on INSERT and UPDATE of relevant columns
CREATE TRIGGER trigger_update_job_status
    BEFORE INSERT OR UPDATE OF job_date, shift_type
    ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_job_status_trigger();

-- 8. UPDATE ALL EXISTING JOBS WITH SMART CALCULATED STATUS
UPDATE jobs 
SET job_status = calculate_job_status(job_date, shift_type)
WHERE job_date IS NOT NULL;

-- 9. CREATE INDEX FOR BETTER QUERY PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_jobs_status_date ON jobs(job_status, job_date);
CREATE INDEX IF NOT EXISTS idx_jobs_date_shift ON jobs(job_date, shift_type);

-- 10. CREATE VIEW FOR STATUS SUMMARY STATISTICS
CREATE OR REPLACE VIEW job_status_summary AS
SELECT 
    job_status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM jobs 
WHERE job_date IS NOT NULL 
GROUP BY job_status
ORDER BY 
    CASE job_status 
        WHEN 'ממתין' THEN 1 
        WHEN 'בתהליך' THEN 2 
        WHEN 'הושלם' THEN 3 
        ELSE 4 
    END;

-- 11. CREATE FUNCTION TO MANUALLY REFRESH ALL STATUSES
CREATE OR REPLACE FUNCTION refresh_all_job_statuses()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE jobs 
    SET job_status = calculate_job_status(job_date, shift_type)
    WHERE job_date IS NOT NULL;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- 12. TEST THE CALCULATION WITH SOME EXAMPLES
DO $$
BEGIN
    RAISE NOTICE 'Testing job status calculation:';
    RAISE NOTICE 'Past job (should be הושלם): %', calculate_job_status('2025-01-01'::DATE, 'day');
    RAISE NOTICE 'Future job (should be ממתין): %', calculate_job_status('2025-12-01'::DATE, 'day'); 
    RAISE NOTICE 'Today job (depends on time): %', calculate_job_status(CURRENT_DATE, 'day');
END $$;

-- 13. FINAL STATUS UPDATE AND VERIFICATION
SELECT refresh_all_job_statuses() as total_jobs_updated;

-- Show the status distribution
SELECT * FROM job_status_summary;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '=== JOB STATUS MIGRATION COMPLETED SUCCESSFULLY! ===';
    RAISE NOTICE 'Smart status calculation is now active:';
    RAISE NOTICE '• ממתין = More than 24h before job starts';
    RAISE NOTICE '• בתהליך = Within 24h of start OR during job execution';  
    RAISE NOTICE '• הושלם = After job completion';
    RAISE NOTICE 'Status will auto-update when jobs are modified';
    RAISE NOTICE 'Use refresh_all_job_statuses() to manually recalculate all';
END $$;