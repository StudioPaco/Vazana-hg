-- Add is_deleted column to jobs table for soft delete functionality
-- Run this in Supabase SQL Editor

-- Add is_deleted column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'jobs' 
        AND column_name = 'is_deleted'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.jobs 
        ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;
        
        -- Add a comment to document the column
        COMMENT ON COLUMN public.jobs.is_deleted IS 'Soft delete flag - true if job is deleted, false if active';
        
        -- Create an index for better query performance
        CREATE INDEX idx_jobs_is_deleted ON public.jobs(is_deleted);
        
        -- Update RLS policies to handle is_deleted column if needed
        -- This ensures deleted jobs are still accessible for restore functionality
        
    END IF;
END $$;

-- Optional: Update any existing jobs to have is_deleted = false by default
UPDATE public.jobs SET is_deleted = FALSE WHERE is_deleted IS NULL;