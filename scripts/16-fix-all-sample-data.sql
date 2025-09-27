-- Fix all sample data for dropdowns and forms
-- This script ensures all tables have proper sample data

-- Insert sample workers if they don't exist
INSERT INTO workers (name, phone, email, is_sample, created_by_id, created_by)
SELECT 'עובד דוגמה 1', '050-1234567', 'worker1@example.com', true, 'sample-user', 'demo@example.com'
WHERE NOT EXISTS (SELECT 1 FROM workers WHERE is_sample = true AND name = 'עובד דוגמה 1');

INSERT INTO workers (name, phone, email, is_sample, created_by_id, created_by)
SELECT 'עובד דוגמה 2', '050-7654321', 'worker2@example.com', true, 'sample-user', 'demo@example.com'
WHERE NOT EXISTS (SELECT 1 FROM workers WHERE is_sample = true AND name = 'עובד דוגמה 2');

-- Insert sample vehicles if they don't exist
INSERT INTO vehicles (name, license_plate, vehicle_type, is_sample, created_by_id, created_by)
SELECT 'רכב דוגמה 1', '123-45-678', 'משאית', true, 'sample-user', 'demo@example.com'
WHERE NOT EXISTS (SELECT 1 FROM vehicles WHERE is_sample = true AND name = 'רכב דוגמה 1');

INSERT INTO vehicles (name, license_plate, vehicle_type, is_sample, created_by_id, created_by)
SELECT 'רכב דוגמה 2', '987-65-432', 'ואן', true, 'sample-user', 'demo@example.com'
WHERE NOT EXISTS (SELECT 1 FROM vehicles WHERE is_sample = true AND name = 'רכב דוגמה 2');

-- Insert sample carts if they don't exist
INSERT INTO carts (name, capacity, cart_type, is_sample, created_by_id, created_by)
SELECT 'עגלה דוגמה 1', '500kg', 'עגלת יד', true, 'sample-user', 'demo@example.com'
WHERE NOT EXISTS (SELECT 1 FROM carts WHERE is_sample = true AND name = 'עגלה דוגמה 1');

INSERT INTO carts (name, capacity, cart_type, is_sample, created_by_id, created_by)
SELECT 'עגלה דוגמה 2', '1000kg', 'עגלת משא', true, 'sample-user', 'demo@example.com'
WHERE NOT EXISTS (SELECT 1 FROM carts WHERE is_sample = true AND name = 'עגלה דוגמה 2');

-- Insert sample clients if they don't exist
INSERT INTO clients (company_name, contact_name, phone, email, address, city, is_sample, created_by_id, created_by)
SELECT 'חברת דוגמה בע"מ', 'איש קשר דוגמה', '03-1234567', 'contact@example.com', 'רחוב דוגמה 123', 'תל אביב', true, 'sample-user', 'demo@example.com'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE is_sample = true AND company_name = 'חברת דוגמה בע"מ');

INSERT INTO clients (company_name, contact_name, phone, email, address, city, is_sample, created_by_id, created_by)
SELECT 'לקוח פרטי דוגמה', 'לקוח דוגמה', '052-9876543', 'private@example.com', 'רחוב הדוגמה 456', 'ירושלים', true, 'sample-user', 'demo@example.com'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE is_sample = true AND company_name = 'לקוח פרטי דוגמה');

-- Ensure work types exist
INSERT INTO work_types (name_he, name_en, is_sample, created_by_id, created_by)
SELECT 'פינוי פסולת', 'Waste Removal', true, 'sample-user', 'demo@example.com'
WHERE NOT EXISTS (SELECT 1 FROM work_types WHERE name_he = 'פינוי פסולת');

INSERT INTO work_types (name_he, name_en, is_sample, created_by_id, created_by)
SELECT 'הובלה', 'Transportation', true, 'sample-user', 'demo@example.com'
WHERE NOT EXISTS (SELECT 1 FROM work_types WHERE name_he = 'הובלה');
