-- Complete fix for clients RLS policies
-- Run this in Supabase SQL Editor

-- First, drop all existing RLS policies for clients table
DROP POLICY IF EXISTS "Users can view own clients" ON clients;
DROP POLICY IF EXISTS "Users can insert own clients" ON clients;
DROP POLICY IF EXISTS "Users can update own clients" ON clients;
DROP POLICY IF EXISTS "Users can delete own clients" ON clients;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON clients;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON clients;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON clients;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON clients;

-- Create permissive policies that allow all operations
CREATE POLICY "Allow all operations on clients" ON clients
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Ensure RLS is enabled but with permissive policy
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Verify the policy was created
SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'clients';