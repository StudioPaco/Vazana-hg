-- Phase 8 Migration: Add missing tables and columns
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- ============================================================
-- 1. Client Work Type Rates table
--    Stores per-client, per-work-type rate overrides
--    Used by: client-edit-modal.tsx "rates" tab
-- ============================================================
CREATE TABLE IF NOT EXISTS client_work_type_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  work_type_id UUID NOT NULL REFERENCES work_types(id) ON DELETE CASCADE,
  rate DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, work_type_id)
);

CREATE INDEX IF NOT EXISTS idx_client_work_type_rates_client 
  ON client_work_type_rates(client_id);

-- ============================================================
-- 2. Client Payment Logs table
--    Tracks monthly invoice/payment status per client
--    Used by: client-edit-modal.tsx "payments" tab
-- ============================================================
CREATE TABLE IF NOT EXISTS client_payment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  month TEXT NOT NULL,  -- YYYY-MM format
  invoice_sent BOOLEAN DEFAULT FALSE,
  invoice_sent_date DATE,
  payment_received BOOLEAN DEFAULT FALSE,
  payment_received_date DATE,
  amount DECIMAL(12,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, month)
);

CREATE INDEX IF NOT EXISTS idx_client_payment_logs_client 
  ON client_payment_logs(client_id);

-- ============================================================
-- 3. Bank columns on business_settings
--    Component already saves these fields — ensure columns exist
-- ============================================================
ALTER TABLE business_settings 
  ADD COLUMN IF NOT EXISTS bank_account_name TEXT DEFAULT '';
ALTER TABLE business_settings 
  ADD COLUMN IF NOT EXISTS bank_name TEXT DEFAULT '';
ALTER TABLE business_settings 
  ADD COLUMN IF NOT EXISTS bank_branch TEXT DEFAULT '';
ALTER TABLE business_settings 
  ADD COLUMN IF NOT EXISTS bank_account_number TEXT DEFAULT '';

-- ============================================================
-- 4. User preferences table (if not already created)
--    Used by: jobs-page.tsx for view mode, filters, etc.
-- ============================================================
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,  -- 'root' or user profile ID
  show_deleted_jobs BOOLEAN DEFAULT FALSE,
  show_finished_jobs BOOLEAN DEFAULT TRUE,
  add_to_calendar_default BOOLEAN DEFAULT FALSE,
  jobs_view_mode TEXT DEFAULT 'list',
  default_status_filter TEXT DEFAULT 'all',
  default_client_filter TEXT DEFAULT 'all',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default preferences for root user
INSERT INTO user_preferences (user_id) VALUES ('root')
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================
-- 5. RLS policies for new tables
--    Using permissive anon-compatible policies (matches current auth model)
--    These will be tightened when Supabase Auth + RBAC is implemented
-- ============================================================
ALTER TABLE client_work_type_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_payment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Permissive policies (allow all operations via anon key)
-- These MUST be replaced with proper RLS when auth is implemented
CREATE POLICY "Allow all access to client_work_type_rates" 
  ON client_work_type_rates FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to client_payment_logs" 
  ON client_payment_logs FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to user_preferences" 
  ON user_preferences FOR ALL USING (true) WITH CHECK (true);

-- Also ensure existing tables have anon-compatible policies
-- (needed because current RLS policies require auth.uid() which is null with anon key)
DO $$
BEGIN
  -- business_settings
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'business_settings' AND policyname = 'Allow all access to business_settings') THEN
    CREATE POLICY "Allow all access to business_settings" ON business_settings FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
