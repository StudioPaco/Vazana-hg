-- Fix payment status constraint issue
-- Drop and recreate constraint with correct values

-- Drop the existing constraint
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_payment_status_check;

-- Add the correct constraint
ALTER TABLE jobs ADD CONSTRAINT jobs_payment_status_check 
    CHECK (payment_status IN ('pending', 'paid', 'overdue', 'ממתין', 'שולם', 'מאחר'));

-- Also check if shift_type constraint needs fixing for Hebrew values
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_shift_type_check;

-- Add constraint that accepts both English and Hebrew shift types
ALTER TABLE jobs ADD CONSTRAINT jobs_shift_type_check 
    CHECK (shift_type IN ('day', 'night', 'double', 'יום', 'לילה', 'כפול'));

-- Verify constraints
SELECT 
    constraint_name, 
    check_clause
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%jobs%' 
AND constraint_schema = 'public';