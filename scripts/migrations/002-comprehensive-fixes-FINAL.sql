-- COMPREHENSIVE MIGRATION: Fix RLS, Add Job Status, Custom Rates, and Invoices Table
-- All authenticated users should see all data - RLS only for authentication security

-- Set search path to ensure we're working in the correct schema
SET search_path = public, pg_catalog;

-- 1. ADD JOB_STATUS COLUMN TO JOBS TABLE
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS job_status TEXT DEFAULT 'ממתין';

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_jobs_job_status ON jobs(job_status);

-- 2. ADD 5 CUSTOM RATE COLUMNS TO CLIENTS TABLE
ALTER TABLE clients ADD COLUMN IF NOT EXISTS custom_rate_1 DECIMAL(10,2) DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS custom_rate_2 DECIMAL(10,2) DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS custom_rate_3 DECIMAL(10,2) DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS custom_rate_4 DECIMAL(10,2) DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS custom_rate_5 DECIMAL(10,2) DEFAULT 0;

-- Add labels for custom rates (so we can track what each represents)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS custom_rate_1_label TEXT DEFAULT '';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS custom_rate_2_label TEXT DEFAULT '';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS custom_rate_3_label TEXT DEFAULT '';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS custom_rate_4_label TEXT DEFAULT '';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS custom_rate_5_label TEXT DEFAULT '';

-- 3. CREATE INVOICES TABLE (replacing client_payment_logs)
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL UNIQUE,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  subtotal DECIMAL(12,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) DEFAULT 0,
  currency TEXT DEFAULT 'ILS',
  notes TEXT,
  payment_terms TEXT,
  
  -- Payment tracking
  payment_date DATE,
  payment_method TEXT,
  payment_reference TEXT,
  
  -- PDF and document management
  pdf_path TEXT,
  pdf_generated_at TIMESTAMPTZ,
  
  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by_id UUID REFERENCES auth.users(id),
  created_by TEXT
);

-- Invoice line items table
CREATE TABLE IF NOT EXISTS invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  
  -- Line item details
  description TEXT NOT NULL,
  quantity DECIMAL(10,3) DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  line_total DECIMAL(12,2) NOT NULL,
  
  -- Additional details
  work_type TEXT,
  job_date DATE,
  site_location TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for invoices
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoice_line_items_invoice_id ON invoice_line_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_line_items_job_id ON invoice_line_items(job_id);

-- 4. SAFELY DROP OLD TABLES AND POLICIES
-- Function to safely drop policies and tables
DO $$
DECLARE
    rec RECORD;
BEGIN
    -- Drop policies only if tables exist
    FOR rec IN 
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('client_work_type_rates', 'client_payment_logs')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "%s" ON public.%I', 
                      'Users can manage rates for their clients', rec.tablename);
        EXECUTE format('DROP POLICY IF EXISTS "%s" ON public.%I', 
                      'Users can manage payment logs for their clients', rec.tablename);
    END LOOP;
    
    -- Drop tables if they exist
    DROP TABLE IF EXISTS public.client_payment_logs CASCADE;
    DROP TABLE IF EXISTS public.client_work_type_rates CASCADE;
END $$;

-- 5. FIX RLS POLICIES - Remove data hiding between users
-- Function to safely drop existing restrictive policies
DO $$
DECLARE
    policy_names TEXT[] := ARRAY[
        'Users can view own clients', 'Users can insert own clients', 
        'Users can update own clients', 'Users can delete own clients',
        'Users can view own workers', 'Users can insert own workers',
        'Users can update own workers', 'Users can delete own workers',
        'Users can view own vehicles', 'Users can insert own vehicles',
        'Users can update own vehicles', 'Users can delete own vehicles',
        'Users can view own carts', 'Users can insert own carts',
        'Users can update own carts', 'Users can delete own carts',
        'Users can view own jobs', 'Users can insert own jobs',
        'Users can update own jobs', 'Users can delete own jobs',
        'Users can view own receipts', 'Users can insert own receipts',
        'Users can update own receipts', 'Users can delete own receipts',
        'Users can modify their own clients', 'Users can modify their own workers',
        'Users can modify their own vehicles', 'Users can modify their own carts',
        'Users can modify their own work types'
    ];
    table_names TEXT[] := ARRAY['clients', 'workers', 'vehicles', 'carts', 'jobs', 'receipts', 'work_types'];
    policy_name TEXT;
    table_name TEXT;
BEGIN
    -- Drop all restrictive policies
    FOREACH policy_name IN ARRAY policy_names
    LOOP
        FOREACH table_name IN ARRAY table_names
        LOOP
            BEGIN
                EXECUTE format('DROP POLICY IF EXISTS "%s" ON %s', policy_name, table_name);
            EXCEPTION
                WHEN OTHERS THEN
                    -- Continue if policy doesn't exist
                    NULL;
            END;
        END LOOP;
    END LOOP;
END $$;

-- Create new policies that allow ALL authenticated users to access ALL data
-- Clients
CREATE POLICY "All users can view all clients" ON clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "All users can insert clients" ON clients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "All users can update clients" ON clients FOR UPDATE TO authenticated USING (true);
CREATE POLICY "All users can delete clients" ON clients FOR DELETE TO authenticated USING (true);

-- Workers
CREATE POLICY "All users can view all workers" ON workers FOR SELECT TO authenticated USING (true);
CREATE POLICY "All users can insert workers" ON workers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "All users can update workers" ON workers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "All users can delete workers" ON workers FOR DELETE TO authenticated USING (true);

-- Vehicles
CREATE POLICY "All users can view all vehicles" ON vehicles FOR SELECT TO authenticated USING (true);
CREATE POLICY "All users can insert vehicles" ON vehicles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "All users can update vehicles" ON vehicles FOR UPDATE TO authenticated USING (true);
CREATE POLICY "All users can delete vehicles" ON vehicles FOR DELETE TO authenticated USING (true);

-- Carts
CREATE POLICY "All users can view all carts" ON carts FOR SELECT TO authenticated USING (true);
CREATE POLICY "All users can insert carts" ON carts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "All users can update carts" ON carts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "All users can delete carts" ON carts FOR DELETE TO authenticated USING (true);

-- Jobs
CREATE POLICY "All users can view all jobs" ON jobs FOR SELECT TO authenticated USING (true);
CREATE POLICY "All users can insert jobs" ON jobs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "All users can update jobs" ON jobs FOR UPDATE TO authenticated USING (true);
CREATE POLICY "All users can delete jobs" ON jobs FOR DELETE TO authenticated USING (true);

-- Work Types
CREATE POLICY "All users can view all work types" ON work_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "All users can insert work types" ON work_types FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "All users can update work types" ON work_types FOR UPDATE TO authenticated USING (true);
CREATE POLICY "All users can delete work types" ON work_types FOR DELETE TO authenticated USING (true);

-- Receipts (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'receipts' AND schemaname = 'public') THEN
        CREATE POLICY "All users can view all receipts" ON receipts FOR SELECT TO authenticated USING (true);
        CREATE POLICY "All users can insert receipts" ON receipts FOR INSERT TO authenticated WITH CHECK (true);
        CREATE POLICY "All users can update receipts" ON receipts FOR UPDATE TO authenticated USING (true);
        CREATE POLICY "All users can delete receipts" ON receipts FOR DELETE TO authenticated USING (true);
    END IF;
END $$;

-- Invoices
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All users can view all invoices" ON invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "All users can insert invoices" ON invoices FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "All users can update invoices" ON invoices FOR UPDATE TO authenticated USING (true);
CREATE POLICY "All users can delete invoices" ON invoices FOR DELETE TO authenticated USING (true);

-- Invoice Line Items
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All users can view all invoice line items" ON invoice_line_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "All users can insert invoice line items" ON invoice_line_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "All users can update invoice line items" ON invoice_line_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "All users can delete invoice line items" ON invoice_line_items FOR DELETE TO authenticated USING (true);

-- 6. CREATE TRIGGERS FOR INVOICE NUMBERING
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    -- Generate invoice number like INV-2025-0001
    SELECT INTO NEW.invoice_number 
      'INV-' || EXTRACT(YEAR FROM CURRENT_DATE) || '-' || 
      LPAD((
        SELECT COUNT(*) + 1 
        FROM invoices 
        WHERE EXTRACT(YEAR FROM invoice_date) = EXTRACT(YEAR FROM CURRENT_DATE)
      )::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_invoice_number
  BEFORE INSERT ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION generate_invoice_number();