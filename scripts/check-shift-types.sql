-- Check current shift_type values
SELECT 'Current Shift Types' as check_type, shift_type, COUNT(*) as count
FROM jobs 
WHERE shift_type IS NOT NULL
GROUP BY shift_type
ORDER BY count DESC;

-- Check if we have any jobs at all
SELECT 'Total Jobs' as info, COUNT(*) as count FROM jobs;

-- If no data exists, let's create a sample job with Hebrew shift type
INSERT INTO jobs (
  job_number,
  client_name, 
  work_type,
  job_date,
  shift_type,
  site,
  city,
  payment_status,
  job_status,
  created_by,
  created_date,
  updated_date
) VALUES (
  '9999',
  'לקוח דוגמה',
  'אבטחה',
  CURRENT_DATE + INTERVAL '1 day',
  'יום',
  'אתר דוגמה', 
  'תל אביב',
  'ממתין לתשלום',
  'ממתין',
  'root',
  NOW(),
  NOW()
) 
ON CONFLICT (job_number) DO NOTHING;

-- Check again after insert
SELECT 'After Sample Insert' as check_type, shift_type, COUNT(*) as count
FROM jobs 
WHERE shift_type IS NOT NULL
GROUP BY shift_type
ORDER BY count DESC;