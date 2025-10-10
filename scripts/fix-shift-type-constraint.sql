-- Fix shift type constraint to allow Hebrew values
-- Drop existing constraint if it exists
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_shift_type_check;

-- Add new constraint with Hebrew values
ALTER TABLE jobs 
ADD CONSTRAINT jobs_shift_type_check 
CHECK (shift_type IN ('יום', 'לילה', 'כפול', 'day', 'night', 'double'));

-- Add comment for clarity
COMMENT ON CONSTRAINT jobs_shift_type_check ON jobs IS 'Allows Hebrew and English shift type values';