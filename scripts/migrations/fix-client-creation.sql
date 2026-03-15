-- COMPREHENSIVE FIX: Client creation and all entity INSERT issues
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- 
-- ROOT CAUSE: Migration created column "created_by" but triggers/policies reference "created_by_id"
-- Also: RLS FOR ALL policy blocks INSERT when created_by_id is not yet set
-- This script fixes BOTH issues.

-- ============================================================
-- STEP 1: Ensure created_by_id column exists on all tables
-- (If only "created_by" exists, add "created_by_id" and copy data)
-- ============================================================

ALTER TABLE clients ADD COLUMN IF NOT EXISTS created_by_id UUID REFERENCES auth.users(id);
ALTER TABLE workers ADD COLUMN IF NOT EXISTS created_by_id UUID REFERENCES auth.users(id);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS created_by_id UUID REFERENCES auth.users(id);
ALTER TABLE carts ADD COLUMN IF NOT EXISTS created_by_id UUID REFERENCES auth.users(id);
ALTER TABLE work_types ADD COLUMN IF NOT EXISTS created_by_id UUID REFERENCES auth.users(id);

-- Copy data from old "created_by" column to "created_by_id" if it exists
DO $$
BEGIN
  -- clients
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='created_by') THEN
    UPDATE clients SET created_by_id = created_by::uuid WHERE created_by_id IS NULL AND created_by IS NOT NULL;
  END IF;
  -- workers
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workers' AND column_name='created_by') THEN
    UPDATE workers SET created_by_id = created_by::uuid WHERE created_by_id IS NULL AND created_by IS NOT NULL;
  END IF;
  -- vehicles
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehicles' AND column_name='created_by') THEN
    UPDATE vehicles SET created_by_id = created_by::uuid WHERE created_by_id IS NULL AND created_by IS NOT NULL;
  END IF;
  -- carts
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='carts' AND column_name='created_by') THEN
    UPDATE carts SET created_by_id = created_by::uuid WHERE created_by_id IS NULL AND created_by IS NOT NULL;
  END IF;
  -- work_types
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='work_types' AND column_name='created_by') THEN
    UPDATE work_types SET created_by_id = created_by::uuid WHERE created_by_id IS NULL AND created_by IS NOT NULL;
  END IF;
END $$;

-- ============================================================
-- STEP 2: Fix trigger functions (correct column names)
-- ============================================================

CREATE OR REPLACE FUNCTION set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id = auth.uid();
  END IF;
  NEW.updated_date = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION set_created_by()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_by_id IS NULL THEN
    NEW.created_by_id = auth.uid();
  END IF;
  NEW.updated_date = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- STEP 3: Fix RLS policies for INSERT
-- The FOR ALL policy blocks INSERT because it checks created_by_id
-- BEFORE the trigger sets it. We need explicit INSERT policies.
-- ============================================================

-- Drop existing problematic FOR ALL policies and replace with specific ones

-- CLIENTS
DROP POLICY IF EXISTS "Users can modify their own clients" ON clients;
CREATE POLICY "Users can insert clients"
  ON clients FOR INSERT
  WITH CHECK (true);
CREATE POLICY "Users can update their own clients"
  ON clients FOR UPDATE
  USING ((SELECT auth.uid())::uuid = created_by_id);
CREATE POLICY "Users can delete their own clients"
  ON clients FOR DELETE
  USING ((SELECT auth.uid())::uuid = created_by_id);

-- WORKERS
DROP POLICY IF EXISTS "Users can modify their own workers" ON workers;
CREATE POLICY "Users can insert workers"
  ON workers FOR INSERT
  WITH CHECK (true);
CREATE POLICY "Users can update their own workers"
  ON workers FOR UPDATE
  USING ((SELECT auth.uid())::uuid = created_by_id);
CREATE POLICY "Users can delete their own workers"
  ON workers FOR DELETE
  USING ((SELECT auth.uid())::uuid = created_by_id);

-- VEHICLES
DROP POLICY IF EXISTS "Users can modify their own vehicles" ON vehicles;
CREATE POLICY "Users can insert vehicles"
  ON vehicles FOR INSERT
  WITH CHECK (true);
CREATE POLICY "Users can update their own vehicles"
  ON vehicles FOR UPDATE
  USING ((SELECT auth.uid())::uuid = created_by_id);
CREATE POLICY "Users can delete their own vehicles"
  ON vehicles FOR DELETE
  USING ((SELECT auth.uid())::uuid = created_by_id);

-- CARTS
DROP POLICY IF EXISTS "Users can modify their own carts" ON carts;
CREATE POLICY "Users can insert carts"
  ON carts FOR INSERT
  WITH CHECK (true);
CREATE POLICY "Users can update their own carts"
  ON carts FOR UPDATE
  USING ((SELECT auth.uid())::uuid = created_by_id);
CREATE POLICY "Users can delete their own carts"
  ON carts FOR DELETE
  USING ((SELECT auth.uid())::uuid = created_by_id);

-- WORK TYPES
DROP POLICY IF EXISTS "Users can modify their own work types" ON work_types;
CREATE POLICY "Users can insert work types"
  ON work_types FOR INSERT
  WITH CHECK (true);
CREATE POLICY "Users can update their own work types"
  ON work_types FOR UPDATE
  USING ((SELECT auth.uid())::uuid = created_by_id);
CREATE POLICY "Users can delete their own work types"
  ON work_types FOR DELETE
  USING ((SELECT auth.uid())::uuid = created_by_id);

-- JOBS (same pattern)
DROP POLICY IF EXISTS "Users can modify their own jobs" ON jobs;
CREATE POLICY "Users can insert jobs"
  ON jobs FOR INSERT
  WITH CHECK (true);
CREATE POLICY "Users can update their own jobs"
  ON jobs FOR UPDATE
  USING ((SELECT auth.uid())::uuid = user_id);
CREATE POLICY "Users can delete their own jobs"
  ON jobs FOR DELETE
  USING ((SELECT auth.uid())::uuid = user_id);

-- CLIENT WORK TYPE RATES
DROP POLICY IF EXISTS "Users can manage rates for their clients" ON client_work_type_rates;
CREATE POLICY "Users can view rates"
  ON client_work_type_rates FOR SELECT
  USING (true);
CREATE POLICY "Users can insert rates"
  ON client_work_type_rates FOR INSERT
  WITH CHECK (true);
CREATE POLICY "Users can update rates"
  ON client_work_type_rates FOR UPDATE
  USING (true);
CREATE POLICY "Users can delete rates"
  ON client_work_type_rates FOR DELETE
  USING (true);

-- CLIENT PAYMENT LOGS
DROP POLICY IF EXISTS "Users can manage payment logs for their clients" ON client_payment_logs;
CREATE POLICY "Users can view payment logs"
  ON client_payment_logs FOR SELECT
  USING (true);
CREATE POLICY "Users can insert payment logs"
  ON client_payment_logs FOR INSERT
  WITH CHECK (true);
CREATE POLICY "Users can update payment logs"
  ON client_payment_logs FOR UPDATE
  USING (true);
CREATE POLICY "Users can delete payment logs"
  ON client_payment_logs FOR DELETE
  USING (true);

-- ============================================================
-- STEP 4: Ensure triggers exist (idempotent)
-- ============================================================

DROP TRIGGER IF EXISTS set_clients_created_by ON clients;
CREATE TRIGGER set_clients_created_by
  BEFORE INSERT ON clients
  FOR EACH ROW
  EXECUTE FUNCTION set_created_by();

DROP TRIGGER IF EXISTS set_workers_created_by ON workers;
CREATE TRIGGER set_workers_created_by
  BEFORE INSERT ON workers
  FOR EACH ROW
  EXECUTE FUNCTION set_created_by();

DROP TRIGGER IF EXISTS set_vehicles_created_by ON vehicles;
CREATE TRIGGER set_vehicles_created_by
  BEFORE INSERT ON vehicles
  FOR EACH ROW
  EXECUTE FUNCTION set_created_by();

DROP TRIGGER IF EXISTS set_carts_created_by ON carts;
CREATE TRIGGER set_carts_created_by
  BEFORE INSERT ON carts
  FOR EACH ROW
  EXECUTE FUNCTION set_created_by();

DROP TRIGGER IF EXISTS set_jobs_user_id ON jobs;
CREATE TRIGGER set_jobs_user_id
  BEFORE INSERT ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();

-- ============================================================
-- STEP 5: Add index on created_by_id for performance
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_clients_created_by_id ON clients(created_by_id);
CREATE INDEX IF NOT EXISTS idx_workers_created_by_id ON workers(created_by_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_created_by_id ON vehicles(created_by_id);
CREATE INDEX IF NOT EXISTS idx_carts_created_by_id ON carts(created_by_id);
CREATE INDEX IF NOT EXISTS idx_work_types_created_by_id ON work_types(created_by_id);
