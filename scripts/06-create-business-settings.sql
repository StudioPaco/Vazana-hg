-- Creating business_settings table for company information
CREATE TABLE IF NOT EXISTS business_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT,
  company_email TEXT,
  registration_number TEXT,
  address TEXT,
  phone TEXT,
  vat_percentage NUMERIC DEFAULT 18,
  day_shift_end_time TIME DEFAULT '17:00',
  night_shift_end_time TIME DEFAULT '06:00',
  auto_invoice_sync BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by_id UUID
);

-- Insert default business settings
INSERT INTO business_settings (company_name, company_email, vat_percentage) 
VALUES ('וזאנה אבטחת כבישים', '', 18)
ON CONFLICT DO NOTHING;
