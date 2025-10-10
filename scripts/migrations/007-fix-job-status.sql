-- JOB STATUS CONSOLIDATION AND AUTOMATION MIGRATION
-- This migration will:
-- 1. Remove duplicate 'status' column if exists
-- 2. Keep only 'job_status' column 
-- 3. Create function to calculate status based on date/time
-- 4. Add trigger to auto-update job status

-- Set search path
SET search_path = public, pg_catalog;

-- 1. REMOVE DUPLICATE STATUS COLUMN
-- Check if 'status' column exists and remove it (keep job_status only)
DO $$
BEGIN
    -- Check if the column exists before trying to drop it
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'jobs' AND column_name = 'status' AND table_schema = 'public') THEN
        
        -- Copy data from 'status' to 'job_status' if job_status is null
        UPDATE jobs 
        SET job_status = status 
        WHERE job_status IS NULL AND status IS NOT NULL;
        
        -- Drop the duplicate column
        ALTER TABLE jobs DROP COLUMN status;
        
        RAISE NOTICE 'Removed duplicate status column from jobs table';
    END IF;
END $$;

-- 2. ENSURE job_status COLUMN EXISTS WITH PROPER CONSTRAINTS
-- Make sure job_status column exists and has proper default
ALTER TABLE jobs ALTER COLUMN job_status SET DEFAULT 'ממתין';
ALTER TABLE jobs ALTER COLUMN job_status SET NOT NULL;

-- Add check constraint for valid status values
DO $$
BEGIN
    -- Drop existing constraint if it exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'jobs_job_status_check' AND table_name = 'jobs') THEN
        ALTER TABLE jobs DROP CONSTRAINT jobs_job_status_check;
    END IF;
    
    -- Add new constraint
    ALTER TABLE jobs ADD CONSTRAINT jobs_job_status_check 
    CHECK (job_status IN ('ממתין', 'בתהליך', 'הושלם'));
    
    RAISE NOTICE 'Added job status constraint';
END $$;

-- 3. CREATE FUNCTION TO CALCULATE JOB STATUS BASED ON DATE AND TIME
CREATE OR REPLACE FUNCTION calculate_job_status(
    job_date DATE,
    shift_type TEXT,
    current_timestamp TIMESTAMPTZ DEFAULT NOW()
) RETURNS TEXT AS $$
DECLARE
    job_start_time TIMESTAMPTZ;
    job_end_time TIMESTAMPTZ;
    shift_duration INTERVAL;
BEGIN
    -- Handle null inputs
    IF job_date IS NULL THEN
        RETURN 'ממתין';
    END IF;
    
    -- Default shift type if null
    IF shift_type IS NULL THEN
        shift_type := 'day';
    END IF;
    
    -- Determine shift start time and duration
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
            -- Default to day shift
            job_start_time := job_date::TIMESTAMPTZ + INTERVAL '6 hours';
            shift_duration := INTERVAL '11 hours';
    END CASE;
    
    job_end_time := job_start_time + shift_duration;
    
    -- Calculate status based on timing
    IF current_timestamp < job_start_time - INTERVAL '24 hours' THEN
        -- More than 24 hours before job starts
        RETURN 'ממתין';
    ELSIF current_timestamp >= job_start_time - INTERVAL '24 hours' AND current_timestamp < job_end_time THEN
        -- Within 24 hours of start time or during the job
        RETURN 'בתהליך';
    ELSE
        -- After job end time
        RETURN 'הושלם';
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 4. CREATE TRIGGER FUNCTION TO AUTO-UPDATE JOB STATUS
CREATE OR REPLACE FUNCTION update_job_status_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate and set the job status
    NEW.job_status := calculate_job_status(NEW.job_date, NEW.shift_type);
    
    -- Update the updated_date
    NEW.updated_date := NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. CREATE TRIGGERS FOR AUTO-UPDATE
-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_job_status ON jobs;

-- Create trigger for INSERT and UPDATE
CREATE TRIGGER trigger_update_job_status
    BEFORE INSERT OR UPDATE OF job_date, shift_type
    ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_job_status_trigger();

-- 6. UPDATE ALL EXISTING JOBS WITH CALCULATED STATUS
UPDATE jobs 
SET job_status = calculate_job_status(job_date, shift_type)
WHERE job_date IS NOT NULL;

-- 7. CREATE INDEX FOR BETTER PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_jobs_status_date ON jobs(job_status, job_date);

-- 8. CREATE VIEW FOR JOB STATUS SUMMARY
CREATE OR REPLACE VIEW job_status_summary AS
SELECT 
    job_status,
    COUNT(*) as count,
    COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage
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

-- 9. CREATE FUNCTION TO MANUALLY REFRESH ALL JOB STATUSES
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

-- Run initial status update
SELECT refresh_all_job_statuses() as jobs_updated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Job status consolidation completed successfully!';
    RAISE NOTICE 'All jobs now use job_status column with automatic calculation';
    RAISE NOTICE 'Status values: ממתין (waiting), בתהליך (in progress), הושלם (finished)';
    RAISE NOTICE 'Use refresh_all_job_statuses() function to manually recalculate all statuses';
END $$;