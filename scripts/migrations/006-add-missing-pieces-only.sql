-- Add only missing pieces from comprehensive migration
-- Skip policies that already exist

-- 1. ADD JOB_STATUS COLUMN TO JOBS TABLE (if not exists)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS job_status TEXT DEFAULT 'ממתין';

-- Add index for performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_jobs_job_status ON jobs(job_status);

-- 2. ADD 5 CUSTOM RATE COLUMNS TO CLIENTS TABLE (if not exists)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS custom_rate_1 DECIMAL(10,2) DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS custom_rate_2 DECIMAL(10,2) DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS custom_rate_3 DECIMAL(10,2) DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS custom_rate_4 DECIMAL(10,2) DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS custom_rate_5 DECIMAL(10,2) DEFAULT 0;

-- Add labels for custom rates (if not exists)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS custom_rate_1_label TEXT DEFAULT '';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS custom_rate_2_label TEXT DEFAULT '';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS custom_rate_3_label TEXT DEFAULT '';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS custom_rate_4_label TEXT DEFAULT '';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS custom_rate_5_label TEXT DEFAULT '';

-- 3. CREATE INVOICES TABLE (if not exists)
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

-- Invoice line items table (if not exists)
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

-- Add indexes for invoices (if not exists)
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoice_line_items_invoice_id ON invoice_line_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_line_items_job_id ON invoice_line_items(job_id);

-- 4. Enable RLS and create policies for new tables only
-- Invoices
DO $$
BEGIN
    -- Enable RLS if not already enabled
    ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
    
    -- Only create policies if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'invoices' AND policyname = 'All users can view all invoices'
    ) THEN
        CREATE POLICY "All users can view all invoices" ON invoices FOR SELECT TO authenticated USING (true);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'invoices' AND policyname = 'All users can insert invoices'
    ) THEN
        CREATE POLICY "All users can insert invoices" ON invoices FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'invoices' AND policyname = 'All users can update invoices'
    ) THEN
        CREATE POLICY "All users can update invoices" ON invoices FOR UPDATE TO authenticated USING (true);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'invoices' AND policyname = 'All users can delete invoices'
    ) THEN
        CREATE POLICY "All users can delete invoices" ON invoices FOR DELETE TO authenticated USING (true);
    END IF;
END $$;

-- Invoice Line Items
DO $$
BEGIN
    -- Enable RLS if not already enabled
    ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
    
    -- Only create policies if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'invoice_line_items' AND policyname = 'All users can view all invoice line items'
    ) THEN
        CREATE POLICY "All users can view all invoice line items" ON invoice_line_items FOR SELECT TO authenticated USING (true);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'invoice_line_items' AND policyname = 'All users can insert invoice line items'
    ) THEN
        CREATE POLICY "All users can insert invoice line items" ON invoice_line_items FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'invoice_line_items' AND policyname = 'All users can update invoice line items'
    ) THEN
        CREATE POLICY "All users can update invoice line items" ON invoice_line_items FOR UPDATE TO authenticated USING (true);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'invoice_line_items' AND policyname = 'All users can delete invoice line items'
    ) THEN
        CREATE POLICY "All users can delete invoice line items" ON invoice_line_items FOR DELETE TO authenticated USING (true);
    END IF;
END $$;

-- 5. CREATE TRIGGERS FOR INVOICE NUMBERING (if not exists)
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

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_generate_invoice_number ON invoices;
CREATE TRIGGER trigger_generate_invoice_number
  BEFORE INSERT ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION generate_invoice_number();