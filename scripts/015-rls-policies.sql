-- 015: Replace all RLS policies with proper role-based access control
-- Run this in Supabase SQL Editor AFTER running 014 and setup-owner.
--
-- Strategy (shared business app):
--   SELECT  → all authenticated users see all data
--   INSERT  → owner/admin: all tables; staff: jobs only
--   UPDATE  → owner/admin: all tables; staff: jobs only
--   DELETE  → owner/admin only
--   user_profiles → owner/admin manage; users see own profile
--   user_preferences → each user manages their own

-- ============================================================
-- 0. Helper: get_user_role(uid)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_user_role(uid UUID)
RETURNS TEXT AS $$
  SELECT role FROM public.user_profiles
  WHERE id = uid AND is_active = true
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- 1. Drop ALL existing policies on public tables
-- ============================================================
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I;',
      pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

-- ============================================================
-- 2. Ensure RLS is enabled on every table
-- ============================================================
ALTER TABLE public.clients               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workers               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_types            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_settings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles         ENABLE ROW LEVEL SECURITY;

-- These may or may not exist yet — use DO block to avoid errors
DO $$ BEGIN
  ALTER TABLE public.invoices              ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.invoice_line_items    ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.client_work_type_rates ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.client_payment_logs   ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.documents             ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.user_preferences      ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.notifications         ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.receipts              ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- ============================================================
-- 3. Business data tables: shared read, role-based write
--    (clients, workers, vehicles, carts, work_types,
--     business_settings, invoices, invoice_line_items,
--     client_work_type_rates, client_payment_logs, receipts)
-- ============================================================

-- --- clients ---
CREATE POLICY "select_clients" ON public.clients
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_clients" ON public.clients
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role(auth.uid()) IN ('owner','admin'));
CREATE POLICY "update_clients" ON public.clients
  FOR UPDATE TO authenticated
  USING (get_user_role(auth.uid()) IN ('owner','admin'));
CREATE POLICY "delete_clients" ON public.clients
  FOR DELETE TO authenticated
  USING (get_user_role(auth.uid()) IN ('owner','admin'));

-- --- workers ---
CREATE POLICY "select_workers" ON public.workers
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_workers" ON public.workers
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role(auth.uid()) IN ('owner','admin'));
CREATE POLICY "update_workers" ON public.workers
  FOR UPDATE TO authenticated
  USING (get_user_role(auth.uid()) IN ('owner','admin'));
CREATE POLICY "delete_workers" ON public.workers
  FOR DELETE TO authenticated
  USING (get_user_role(auth.uid()) IN ('owner','admin'));

-- --- vehicles ---
CREATE POLICY "select_vehicles" ON public.vehicles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_vehicles" ON public.vehicles
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role(auth.uid()) IN ('owner','admin'));
CREATE POLICY "update_vehicles" ON public.vehicles
  FOR UPDATE TO authenticated
  USING (get_user_role(auth.uid()) IN ('owner','admin'));
CREATE POLICY "delete_vehicles" ON public.vehicles
  FOR DELETE TO authenticated
  USING (get_user_role(auth.uid()) IN ('owner','admin'));

-- --- carts ---
CREATE POLICY "select_carts" ON public.carts
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_carts" ON public.carts
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role(auth.uid()) IN ('owner','admin'));
CREATE POLICY "update_carts" ON public.carts
  FOR UPDATE TO authenticated
  USING (get_user_role(auth.uid()) IN ('owner','admin'));
CREATE POLICY "delete_carts" ON public.carts
  FOR DELETE TO authenticated
  USING (get_user_role(auth.uid()) IN ('owner','admin'));

-- --- work_types ---
CREATE POLICY "select_work_types" ON public.work_types
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_work_types" ON public.work_types
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role(auth.uid()) IN ('owner','admin'));
CREATE POLICY "update_work_types" ON public.work_types
  FOR UPDATE TO authenticated
  USING (get_user_role(auth.uid()) IN ('owner','admin'));
CREATE POLICY "delete_work_types" ON public.work_types
  FOR DELETE TO authenticated
  USING (get_user_role(auth.uid()) IN ('owner','admin'));

-- --- jobs (staff can also insert/update) ---
CREATE POLICY "select_jobs" ON public.jobs
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_jobs" ON public.jobs
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role(auth.uid()) IN ('owner','admin','staff'));
CREATE POLICY "update_jobs" ON public.jobs
  FOR UPDATE TO authenticated
  USING (get_user_role(auth.uid()) IN ('owner','admin','staff'));
CREATE POLICY "delete_jobs" ON public.jobs
  FOR DELETE TO authenticated
  USING (get_user_role(auth.uid()) IN ('owner','admin'));

-- --- business_settings ---
CREATE POLICY "select_business_settings" ON public.business_settings
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_business_settings" ON public.business_settings
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role(auth.uid()) IN ('owner','admin'));
CREATE POLICY "update_business_settings" ON public.business_settings
  FOR UPDATE TO authenticated
  USING (get_user_role(auth.uid()) IN ('owner','admin'));
CREATE POLICY "delete_business_settings" ON public.business_settings
  FOR DELETE TO authenticated
  USING (get_user_role(auth.uid()) = 'owner');

-- --- invoices ---
DO $$ BEGIN
CREATE POLICY "select_invoices" ON public.invoices
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_invoices" ON public.invoices
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role(auth.uid()) IN ('owner','admin'));
CREATE POLICY "update_invoices" ON public.invoices
  FOR UPDATE TO authenticated
  USING (get_user_role(auth.uid()) IN ('owner','admin'));
CREATE POLICY "delete_invoices" ON public.invoices
  FOR DELETE TO authenticated
  USING (get_user_role(auth.uid()) IN ('owner','admin'));
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- --- invoice_line_items ---
DO $$ BEGIN
CREATE POLICY "select_invoice_line_items" ON public.invoice_line_items
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_invoice_line_items" ON public.invoice_line_items
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role(auth.uid()) IN ('owner','admin'));
CREATE POLICY "update_invoice_line_items" ON public.invoice_line_items
  FOR UPDATE TO authenticated
  USING (get_user_role(auth.uid()) IN ('owner','admin'));
CREATE POLICY "delete_invoice_line_items" ON public.invoice_line_items
  FOR DELETE TO authenticated
  USING (get_user_role(auth.uid()) IN ('owner','admin'));
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- --- client_work_type_rates ---
DO $$ BEGIN
CREATE POLICY "select_client_work_type_rates" ON public.client_work_type_rates
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_client_work_type_rates" ON public.client_work_type_rates
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role(auth.uid()) IN ('owner','admin'));
CREATE POLICY "update_client_work_type_rates" ON public.client_work_type_rates
  FOR UPDATE TO authenticated
  USING (get_user_role(auth.uid()) IN ('owner','admin'));
CREATE POLICY "delete_client_work_type_rates" ON public.client_work_type_rates
  FOR DELETE TO authenticated
  USING (get_user_role(auth.uid()) IN ('owner','admin'));
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- --- client_payment_logs ---
DO $$ BEGIN
CREATE POLICY "select_client_payment_logs" ON public.client_payment_logs
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_client_payment_logs" ON public.client_payment_logs
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role(auth.uid()) IN ('owner','admin'));
CREATE POLICY "update_client_payment_logs" ON public.client_payment_logs
  FOR UPDATE TO authenticated
  USING (get_user_role(auth.uid()) IN ('owner','admin'));
CREATE POLICY "delete_client_payment_logs" ON public.client_payment_logs
  FOR DELETE TO authenticated
  USING (get_user_role(auth.uid()) IN ('owner','admin'));
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- --- receipts ---
DO $$ BEGIN
CREATE POLICY "select_receipts" ON public.receipts
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_receipts" ON public.receipts
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role(auth.uid()) IN ('owner','admin'));
CREATE POLICY "update_receipts" ON public.receipts
  FOR UPDATE TO authenticated
  USING (get_user_role(auth.uid()) IN ('owner','admin'));
CREATE POLICY "delete_receipts" ON public.receipts
  FOR DELETE TO authenticated
  USING (get_user_role(auth.uid()) IN ('owner','admin'));
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- ============================================================
-- 4. user_profiles: owner/admin manage, all see own profile
-- ============================================================
CREATE POLICY "select_own_profile" ON public.user_profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "select_all_profiles_admin" ON public.user_profiles
  FOR SELECT TO authenticated
  USING (get_user_role(auth.uid()) IN ('owner','admin'));

CREATE POLICY "manage_profiles_owner" ON public.user_profiles
  FOR ALL TO authenticated
  USING (get_user_role(auth.uid()) = 'owner');

CREATE POLICY "manage_non_owner_profiles_admin" ON public.user_profiles
  FOR ALL TO authenticated
  USING (
    get_user_role(auth.uid()) = 'admin'
    AND role != 'owner'
  );

-- ============================================================
-- 5. user_preferences: per-user
-- ============================================================
DO $$ BEGIN
CREATE POLICY "select_own_preferences" ON public.user_preferences
  FOR SELECT TO authenticated
  USING (user_id::text = auth.uid()::text);
CREATE POLICY "insert_own_preferences" ON public.user_preferences
  FOR INSERT TO authenticated
  WITH CHECK (user_id::text = auth.uid()::text);
CREATE POLICY "update_own_preferences" ON public.user_preferences
  FOR UPDATE TO authenticated
  USING (user_id::text = auth.uid()::text);
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- ============================================================
-- 6. documents: all can view, each manages own uploads
-- ============================================================
DO $$ BEGIN
CREATE POLICY "select_documents" ON public.documents
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_documents" ON public.documents
  FOR INSERT TO authenticated
  WITH CHECK (uploaded_by = auth.uid());
CREATE POLICY "delete_own_documents" ON public.documents
  FOR DELETE TO authenticated
  USING (uploaded_by = auth.uid() OR get_user_role(auth.uid()) IN ('owner','admin'));
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- ============================================================
-- 7. notifications: all can view, per-user management
-- ============================================================
DO $$ BEGIN
CREATE POLICY "select_notifications" ON public.notifications
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "manage_notifications" ON public.notifications
  FOR ALL TO authenticated
  USING (get_user_role(auth.uid()) IN ('owner','admin'));
EXCEPTION WHEN undefined_table THEN NULL; END $$;
