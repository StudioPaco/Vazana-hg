-- Fix business_settings RLS policies and clean duplicate rows
-- Migration: 008-fix-business-settings-rls.sql

-- First, disable RLS temporarily to clean up data
ALTER TABLE business_settings DISABLE ROW LEVEL SECURITY;

-- Delete duplicate rows, keeping only the oldest one
WITH ranked_business_settings AS (
  SELECT id, created_at,
         ROW_NUMBER() OVER (ORDER BY created_at ASC) as rn
  FROM business_settings
)
DELETE FROM business_settings 
WHERE id IN (
  SELECT id 
  FROM ranked_business_settings 
  WHERE rn > 1
);

-- Drop existing RLS policies if they exist
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON business_settings;
DROP POLICY IF EXISTS "Enable read access for all users" ON business_settings;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON business_settings;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON business_settings;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON business_settings;

-- Create permissive RLS policies for business_settings
-- Since this is a single-business app, allow all authenticated users to read/write
CREATE POLICY "Allow all operations on business_settings" ON business_settings
FOR ALL USING (true) WITH CHECK (true);

-- Re-enable RLS
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to public/anon users for business settings
GRANT SELECT, INSERT, UPDATE, DELETE ON business_settings TO public;
GRANT SELECT, INSERT, UPDATE, DELETE ON business_settings TO anon;

-- Ensure there's at least one business_settings record
INSERT INTO business_settings (company_name, vat_percentage, created_at, updated_at) 
VALUES ('וזאנה אבטחת כבישים', 18, NOW(), NOW())
ON CONFLICT DO NOTHING;