-- Fix job creation timestamp issues
-- Add updated_at trigger for jobs table

-- First ensure the jobs table has the updated_at column
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create or replace function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for jobs table
DROP TRIGGER IF EXISTS update_jobs_updated_at ON jobs;
CREATE TRIGGER update_jobs_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Also ensure trigger exists for INSERT to set updated_at = created_date on creation
CREATE OR REPLACE FUNCTION set_initial_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    -- Set created_date if not provided
    IF NEW.created_date IS NULL THEN
        NEW.created_date = NOW();
    END IF;
    
    -- Set updated_at to match created_date on insert
    IF NEW.updated_at IS NULL THEN
        NEW.updated_at = NEW.created_date;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for initial timestamps
DROP TRIGGER IF EXISTS set_jobs_initial_timestamps ON jobs;
CREATE TRIGGER set_jobs_initial_timestamps
    BEFORE INSERT ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION set_initial_timestamps();

-- Verify the columns exist
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'jobs' 
AND column_name IN ('created_date', 'updated_date', 'created_at', 'updated_at')
ORDER BY column_name;