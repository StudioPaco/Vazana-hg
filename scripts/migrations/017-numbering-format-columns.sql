-- Add numbering format columns to business_settings
-- These columns control how job numbers, invoice numbers, and form numbers are generated.
-- Already applied to production DB on 2026-04-02.

ALTER TABLE business_settings
  ADD COLUMN IF NOT EXISTS job_number_prefix TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS job_number_digits INTEGER DEFAULT 4,
  ADD COLUMN IF NOT EXISTS invoice_number_prefix TEXT DEFAULT 'INV',
  ADD COLUMN IF NOT EXISTS invoice_number_digits INTEGER DEFAULT 4,
  ADD COLUMN IF NOT EXISTS invoice_number_include_year BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS form_number_prefix TEXT DEFAULT 'FRM',
  ADD COLUMN IF NOT EXISTS form_number_digits INTEGER DEFAULT 4;
