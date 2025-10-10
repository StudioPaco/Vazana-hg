-- Fix missing columns in user_profiles and jobs tables
-- Run this in Supabase SQL Editor

-- Add phone column to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add missing essential columns to jobs table
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS job_time TIME,
ADD COLUMN IF NOT EXISTS job_location TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'active', 'completed', 'cancelled'));

-- Create index for job status
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);

-- Update existing jobs to have a default status if needed
UPDATE public.jobs 
SET status = 'scheduled' 
WHERE status IS NULL OR status = '';

-- Add comments for clarity
COMMENT ON COLUMN public.user_profiles.phone IS 'User phone number - Israeli format (10 digits 05x/07x or 9 digits 0x)';
COMMENT ON COLUMN public.jobs.job_time IS 'Time of job execution';
COMMENT ON COLUMN public.jobs.job_location IS 'Specific job location address';
COMMENT ON COLUMN public.jobs.status IS 'Job execution status (scheduled, confirmed, active, completed, cancelled)';

SELECT 'Missing columns added successfully!' as result;