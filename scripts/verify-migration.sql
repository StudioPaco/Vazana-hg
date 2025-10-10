-- Verification script for 001-multi-user-support.sql migration
-- Run these queries in your Supabase SQL editor to verify the migration worked

-- 1. Check if new tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_preferences', 'user_roles', 'client_work_type_rates', 'client_payment_logs');

-- 2. Check if new columns were added to existing tables
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND ((table_name = 'jobs' AND column_name = 'user_id')
  OR (table_name = 'clients' AND column_name = 'created_by')
  OR (table_name = 'receipts' AND column_name = 'user_id')
  OR (table_name = 'workers' AND column_name = 'created_by')
  OR (table_name = 'vehicles' AND column_name = 'created_by')
  OR (table_name = 'carts' AND column_name = 'created_by')
  OR (table_name = 'work_types' AND column_name = 'created_by'));

-- 3. Check if RLS is enabled on tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('jobs', 'clients', 'receipts', 'workers', 'vehicles', 'carts', 'work_types', 'user_preferences', 'user_roles', 'client_work_type_rates', 'client_payment_logs');

-- 4. Check if RLS policies were created
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';

-- 5. Check if triggers were created
SELECT trigger_name, event_object_table, action_statement 
FROM information_schema.triggers 
WHERE event_object_schema = 'public';