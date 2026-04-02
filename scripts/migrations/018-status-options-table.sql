-- Configurable status options table
-- Stores payment statuses, invoice statuses, and other enum-like values
-- that the business owner may want to customize.
-- Applied to production DB on 2026-04-02.

CREATE TABLE IF NOT EXISTS status_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  value TEXT NOT NULL,
  label_he TEXT NOT NULL,
  label_en TEXT,
  color TEXT,
  sort_order INTEGER DEFAULT 0,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(category, value)
);

ALTER TABLE status_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read status_options"
  ON status_options FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage status_options"
  ON status_options FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed payment statuses
INSERT INTO status_options (category, value, label_he, label_en, color, sort_order, is_default) VALUES
  ('payment_status', 'ממתין לתשלום', 'ממתין לתשלום', 'Pending', 'yellow', 1, true),
  ('payment_status', 'שולם', 'שולם', 'Paid', 'green', 2, false),
  ('payment_status', 'מאוחר', 'מאוחר', 'Overdue', 'red', 3, false),
  ('payment_status', 'לא רלוונטי', 'לא רלוונטי', 'N/A', 'gray', 4, false)
ON CONFLICT (category, value) DO NOTHING;

-- Seed invoice statuses
INSERT INTO status_options (category, value, label_he, label_en, color, sort_order, is_default) VALUES
  ('invoice_status', 'טיוטה', 'טיוטה', 'Draft', 'gray', 1, true),
  ('invoice_status', 'נשלח', 'נשלח', 'Sent', 'blue', 2, false),
  ('invoice_status', 'שולם', 'שולם', 'Paid', 'green', 3, false),
  ('invoice_status', 'בוטל', 'בוטל', 'Cancelled', 'red', 4, false)
ON CONFLICT (category, value) DO NOTHING;

-- Seed client statuses
INSERT INTO status_options (category, value, label_he, label_en, color, sort_order, is_default) VALUES
  ('client_status', 'active', 'פעיל', 'Active', 'green', 1, true),
  ('client_status', 'inactive', 'לא פעיל', 'Inactive', 'gray', 2, false)
ON CONFLICT (category, value) DO NOTHING;
