-- Migration 010: Add schema_migrations tracking table
-- This table tracks which migration scripts have been applied to the database.
-- Going forward, every new migration script should INSERT a row into this table.

CREATE TABLE IF NOT EXISTS public.schema_migrations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  version text NOT NULL UNIQUE,
  name text NOT NULL,
  applied_at timestamptz DEFAULT now() NOT NULL,
  applied_by text DEFAULT 'manual',
  checksum text, -- optional: SHA256 of the script for integrity verification
  notes text
);

-- Enable RLS (admin-only access)
ALTER TABLE public.schema_migrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view migrations" ON public.schema_migrations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'root')
    )
  );

-- Backfill: Record all historical scripts as "applied" in logical order.
-- This documents the history even though they were run manually.

INSERT INTO public.schema_migrations (version, name, applied_by, notes) VALUES
  -- Phase 1: Foundation
  ('001', '01-create-tables', 'manual-backfill', 'Core tables: users, clients, workers, vehicles, carts, work_types, jobs, receipts'),
  ('002', '02-add-documents-table', 'manual-backfill', 'Documents table'),
  ('003', '03-add-user-management', 'manual-backfill', 'user_roles, user_preferences tables'),
  ('004', '04-create-root-user', 'manual-backfill', 'Root user profile creation'),
  ('005', '05-update-schema-to-match-base44', 'manual-backfill', 'Schema alignment with Base44 design'),
  -- Phase 2: Business logic + Auth
  ('006', '06-create-business-settings', 'manual-backfill', 'business_settings table'),
  ('007', '07-username-auth-system', 'manual-backfill', 'user_profiles with password_hash, session management'),
  ('008', '08-fix-user-auth-table', 'manual-backfill', 'Fixes to user_profiles schema'),
  -- Phase 3: RLS + Policies
  ('009', '09-fix-rls-policies', 'manual-backfill', 'Initial RLS policy fixes'),
  ('010', '10-fix-work-types-rls + sample data', 'manual-backfill', 'work_types RLS + sample data'),
  ('011', '11-enable-rls-all-tables', 'manual-backfill', 'Enable RLS on all tables'),
  -- Phase 4: Schema refinements
  ('012', '12-add-required-columns', 'manual-backfill', 'Missing columns'),
  ('013', '13-reset-and-create-rls-policies', 'manual-backfill', 'RLS policy reset'),
  ('014', '14-fix-dropdown-sample-data', 'manual-backfill', 'Dropdown sample data fixes'),
  ('015', '15-add-sample-clients', 'manual-backfill', 'Sample clients'),
  ('016', '16-populate-all-tables', 'manual-backfill', 'Populate tables'),
  ('017', '17-fix-rls-and-created-by-defaults', 'manual-backfill', 'RLS + created_by defaults'),
  ('018', '18-fix-anonymous-user-constraints', 'manual-backfill', 'Anonymous user constraint fixes'),
  -- Phase 5: Formal migrations
  ('M001', 'migrations/001-multi-user-support', 'manual-backfill', 'Multi-user support'),
  ('M002', 'migrations/002-comprehensive-fixes-FINAL', 'manual-backfill', 'Comprehensive fixes'),
  ('M003', 'migrations/003-add-phone-column-fix', 'manual-backfill', 'Phone column on user_profiles'),
  ('M004', 'migrations/004-fix-job-timestamps', 'manual-backfill', 'Job timestamp columns'),
  ('M005', 'migrations/005-fix-payment-status-constraint', 'manual-backfill', 'Payment status CHECK fix'),
  ('M006', 'migrations/006-add-missing-pieces-only', 'manual-backfill', 'Missing pieces'),
  ('M007', 'migrations/007-add-bank-account-fields', 'manual-backfill', 'Bank account fields on business_settings'),
  ('M007-status', 'migrations/007-fix-job-status-CORRECTED-FINAL', 'manual-backfill', 'Job status final fix'),
  ('M008-rls', 'migrations/008-fix-business-settings-rls', 'manual-backfill', 'Business settings RLS'),
  ('M008-shifts', 'migrations/008-fix-shift-types-and-payment-status-ULTRA-SAFE', 'manual-backfill', 'Shift types + payment status (final version)'),
  ('M009-tables', 'migrations/009-phase8-missing-tables', 'manual-backfill', 'Missing tables'),
  ('M009-settings', 'migrations/009-settings-enhancement-database-integration', 'manual-backfill', 'Settings enhancement'),
  -- Hotfixes (unnumbered, applied at various points)
  ('HF-is-deleted', 'add-is-deleted-column', 'manual-backfill', 'Soft delete column on jobs'),
  ('HF-default-user', 'create-default-user', 'manual-backfill', 'Default user profile'),
  ('HF-user-prefs', 'create-user-preferences', 'manual-backfill', 'user_preferences table creation'),
  ('HF-profiles-rls', 'final-user-profiles-rls-fix', 'manual-backfill', 'Final user_profiles RLS fix'),
  ('HF-clients-rls', 'fix-clients-rls', 'manual-backfill', 'Clients RLS fix'),
  ('HF-jobs-rls', 'fix-jobs-rls', 'manual-backfill', 'Jobs RLS fix'),
  ('HF-missing-cols', 'fix-missing-columns', 'manual-backfill', 'Missing columns'),
  ('HF-shift-constraint', 'fix-shift-type-constraint', 'manual-backfill', 'Shift type CHECK constraint'),
  ('HF-profiles-rls-simple', 'simple-user-profiles-fix', 'manual-backfill', 'Simple user_profiles fix'),
  -- This migration
  ('M010', 'migrations/010-add-schema-migrations-tracker', 'migration-script', 'Schema migrations tracking table + backfill')
ON CONFLICT (version) DO NOTHING;
