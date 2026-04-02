-- Add sent_date and paid_date to invoices for status tracking
-- Applied to production DB on 2026-04-02.
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS sent_date DATE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid_date DATE;
