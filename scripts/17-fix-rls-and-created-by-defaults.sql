-- Fix RLS issues by adding DEFAULT auth.uid() to created_by_id columns
-- This ensures all new records automatically get the current user's ID

-- Add DEFAULT auth.uid() to all created_by_id columns
ALTER TABLE clients ALTER COLUMN created_by_id SET DEFAULT auth.uid();
ALTER TABLE workers ALTER COLUMN created_by_id SET DEFAULT auth.uid();
ALTER TABLE vehicles ALTER COLUMN created_by_id SET DEFAULT auth.uid();
ALTER TABLE carts ALTER COLUMN created_by_id SET DEFAULT auth.uid();
ALTER TABLE work_types ALTER COLUMN created_by_id SET DEFAULT auth.uid();
ALTER TABLE jobs ALTER COLUMN created_by_id SET DEFAULT auth.uid();
ALTER TABLE receipts ALTER COLUMN created_by_id SET DEFAULT auth.uid();

-- Also set created_by to the user's email for better tracking
-- Create a function to get current user email
CREATE OR REPLACE FUNCTION get_current_user_email()
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT email FROM auth.users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add DEFAULT for created_by columns
ALTER TABLE clients ALTER COLUMN created_by SET DEFAULT get_current_user_email();
ALTER TABLE workers ALTER COLUMN created_by SET DEFAULT get_current_user_email();
ALTER TABLE vehicles ALTER COLUMN created_by SET DEFAULT get_current_user_email();
ALTER TABLE carts ALTER COLUMN created_by SET DEFAULT get_current_user_email();
ALTER TABLE work_types ALTER COLUMN created_by SET DEFAULT get_current_user_email();
ALTER TABLE jobs ALTER COLUMN created_by SET DEFAULT get_current_user_email();
ALTER TABLE receipts ALTER COLUMN created_by SET DEFAULT get_current_user_email();

-- Insert comprehensive sample data for all tables
-- This ensures dropdowns work properly

-- Sample clients
INSERT INTO clients (company_name, contact_person, phone, email, address, city, po_box, payment_method, security_rate, installation_rate, notes, is_sample) VALUES
('חברת אבטחה מקצועית', 'יוסי כהן', '050-1234567', 'yossi@security.co.il', 'רחוב הרצל 15', 'תל אביב', '12345', 1, 120.00, 150.00, 'לקוח VIP - תשלום מיידי', true),
('מפעל תעשיות', 'רחל לוי', '052-9876543', 'rachel@factory.co.il', 'אזור תעשייה', 'חיפה', '67890', 2, 100.00, 130.00, 'מפעל גדול - צריך אבטחה 24/7', true),
('חברת הייטק', 'דוד שמואל', '054-5555555', 'david@hitech.com', 'פארק הייטק', 'הרצליה', '11111', 1, 140.00, 170.00, 'חברת הייטק מובילה', true)
ON CONFLICT DO NOTHING;

-- Sample workers
INSERT INTO workers (name, phone_number, address, shift_rate, payment_terms_days, notes, is_sample) VALUES
('אבי מזרחי', '050-1111111', 'רחוב הדקל 5, תל אביב', 120.00, 30, 'עובד ותיק ואמין', true),
('משה כהן', '052-2222222', 'שדרות רוטשילד 10, חיפה', 110.00, 30, 'מתמחה באבטחת לילה', true),
('יוסי לוי', '054-3333333', 'רחוב הרצל 20, ירושלים', 130.00, 15, 'עובד מעולה עם ניסיון רב', true),
('רונן דוד', '050-4444444', 'רחוב בן גוריון 8, באר שבע', 115.00, 30, 'זמין לעבודות דחופות', true),
('עמית שמואל', '052-5555555', 'שדרות ירושלים 15, נתניה', 125.00, 30, 'מתמחה בהתקנות', true)
ON CONFLICT DO NOTHING;

-- Sample vehicles
INSERT INTO vehicles (name, license_plate, details, is_sample) VALUES
('טנדר לבן - טויוטה', '123-45-678', 'רכב עבודה ראשי, מתאים להובלת ציוד כבד', true),
('רכב פרטי - הונדה', '987-65-432', 'רכב קטן לעבודות קלות ונסיעות מהירות', true),
('משאית קטנה', '555-44-333', 'משאית להובלת ציוד גדול ומתקנים', true),
('רכב חירום', '111-22-333', 'רכב מיוחד לקריאות דחופות', true)
ON CONFLICT DO NOTHING;

-- Sample carts
INSERT INTO carts (name, details, is_sample) VALUES
('עגלת ציוד בסיסית', 'עגלה עם כלי עבודה בסיסיים לעבודות אבטחה', true),
('עגלת התקנות', 'עגלה מיוחדת עם כלים להתקנת מערכות אבטחה', true),
('עגלת חירום', 'עגלה עם ציוד חירום ועזרה ראשונה', true)
ON CONFLICT DO NOTHING;

-- Ensure work types exist
INSERT INTO work_types (name_en, name_he, is_sample) VALUES
('Security', 'אבטחה', true),
('Installation', 'התקנות', true)
ON CONFLICT DO NOTHING;
