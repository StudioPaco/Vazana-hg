-- Execute the sample data population
-- This script runs the sample data insertion with proper error handling

-- Add sample bilingual work types
INSERT INTO work_types (name_he, name_en) VALUES
('אבטחה', 'Security'),
('התקנות', 'Installation'),
('תחזוקה', 'Maintenance')
ON CONFLICT DO NOTHING;

-- Add sample workers (only if table is empty)
INSERT INTO workers (name, phone_number, email, details)
SELECT 'דוד כהן', '050-1234567', 'david@example.com', 'מאבטח מנוסה'
WHERE NOT EXISTS (SELECT 1 FROM workers);

INSERT INTO workers (name, phone_number, email, details)
SELECT 'שרה לוי', '052-9876543', 'sarah@example.com', 'טכנאית התקנות'
WHERE NOT EXISTS (SELECT 1 FROM workers LIMIT 1 OFFSET 1);

-- Add sample vehicles (only if table is empty)
INSERT INTO vehicles (name, license_plate, details)
SELECT 'רכב שירות 1', '123-45-678', 'רכב שירות עם ציוד מלא'
WHERE NOT EXISTS (SELECT 1 FROM vehicles);

INSERT INTO vehicles (name, license_plate, details)
SELECT 'רכב שירות 2', '987-65-432', 'רכב קטן לעבודות מהירות'
WHERE NOT EXISTS (SELECT 1 FROM vehicles LIMIT 1 OFFSET 1);

-- Add sample carts (only if table is empty)
INSERT INTO carts (name, details)
SELECT 'עגלת ציוד A', 'עגלה עם ציוד אבטחה בסיסי'
WHERE NOT EXISTS (SELECT 1 FROM carts);

INSERT INTO carts (name, details)
SELECT 'נגרר כלים', 'נגרר עם כלי עבודה מתקדמים'
WHERE NOT EXISTS (SELECT 1 FROM carts LIMIT 1 OFFSET 1);

-- Add sample client (only if table is empty)
INSERT INTO clients (company_name, contact_person, phone_number, email, address)
SELECT 'חברת דוגמה בע"מ', 'יוסי מנהל', '03-1234567', 'yossi@example.com', 'רחוב הדוגמה 123, תל אביב'
WHERE NOT EXISTS (SELECT 1 FROM clients);
