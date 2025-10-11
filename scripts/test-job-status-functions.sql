-- Test the job status calculation function with proper type casting
-- TEST 2: Test Smart Status Calculation

SELECT 
    'Past job (yesterday)' as test_case,
    calculate_job_status((CURRENT_DATE - INTERVAL '1 day')::DATE, 'day'::TEXT) as calculated_status;
    
SELECT 
    'Future job (tomorrow)' as test_case,
    calculate_job_status((CURRENT_DATE + INTERVAL '1 day')::DATE, 'day'::TEXT) as calculated_status;
    
SELECT 
    'Today job' as test_case,
    calculate_job_status(CURRENT_DATE::DATE, 'day'::TEXT) as calculated_status;

SELECT 
    'Night shift tomorrow' as test_case,
    calculate_job_status((CURRENT_DATE + INTERVAL '1 day')::DATE, 'night'::TEXT) as calculated_status;
    
SELECT 
    'Double shift today' as test_case,
    calculate_job_status(CURRENT_DATE::DATE, 'double'::TEXT) as calculated_status;

-- Test with some actual data from your jobs table
SELECT 
    job_number,
    job_date,
    shift_type,
    job_status as current_status,
    calculate_job_status(job_date, shift_type) as calculated_status,
    CASE 
        WHEN job_status = calculate_job_status(job_date, shift_type) THEN 'MATCH' 
        ELSE 'DIFFERENT' 
    END as status_comparison
FROM jobs 
WHERE job_date IS NOT NULL 
LIMIT 10;