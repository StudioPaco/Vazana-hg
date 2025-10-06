-- Complete fix for jobs RLS policies
-- Run this in Supabase SQL Editor

-- First, drop all existing RLS policies for jobs table
DROP POLICY IF EXISTS "Users can view own jobs" ON jobs;
DROP POLICY IF EXISTS "Users can insert own jobs" ON jobs;
DROP POLICY IF EXISTS "Users can update own jobs" ON jobs;
DROP POLICY IF EXISTS "Users can delete own jobs" ON jobs;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON jobs;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON jobs;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON jobs;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON jobs;

-- Create permissive policies that allow all operations
CREATE POLICY "Allow all operations on jobs" ON jobs
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Ensure RLS is enabled but with permissive policy
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Verify the policy was created
SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'jobs';