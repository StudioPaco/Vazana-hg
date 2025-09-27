-- First, let's check if we have any existing data and clean up if needed
DELETE FROM workers WHERE is_sample = true;
DELETE FROM vehicles WHERE is_sample = true;
DELETE FROM carts WHERE is_sample = true;
DELETE FROM clients WHERE is_sample = true;
DELETE FROM work_types WHERE is_sample = true;

-- Insert sample workers with proper UUID generation
INSERT INTO workers (id, name, phone_number, address, shift_rate, payment_terms_days, notes, availability, is_sample, created_by, created_by_id, created_date, updated_date)
VALUES 
  (gen_random_uuid(), 'יוסי כהן', '050-1234567', 'תל אביב', 150.00, 30, 'עובד מנוסה', '{"sun": {"day": true, "night": false}, "mon": {"day": true, "night": false}, "tue": {"day": true, "night": false}, "wed": {"day": true, "night": false}, "thu": {"day": true, "night": false}, "fri": {"day": false, "night": false}, "sat": {"day": false, "night": false}}', true, 'system', (SELECT id FROM users LIMIT 1), NOW(), NOW()),
  (gen_random_uuid(), 'דוד לוי', '052-9876543', 'חיפה', 140.00, 30, 'עובד אמין', '{"sun": {"day": true, "night": true}, "mon": {"day": true, "night": true}, "tue": {"day": true, "night": true}, "wed": {"day": true, "night": true}, "thu": {"day": true, "night": true}, "fri": {"day": true, "night": false}, "sat": {"day": false, "night": false}}', true, 'system', (SELECT id FROM users LIMIT 1), NOW(), NOW()),
  (gen_random_uuid(), 'משה אברהם', '054-5555555', 'ירושלים', 160.00, 15, 'מומחה בתחום', '{"sun": {"day": true, "night": false}, "mon": {"day": true, "night": false}, "tue": {"day": true, "night": false}, "wed": {"day": true, "night": false}, "thu": {"day": true, "night": false}, "fri": {"day": false, "night": false}, "sat": {"day": false, "night": false}}', true, 'system', (SELECT id FROM users LIMIT 1), NOW(), NOW());

-- Insert sample vehicles  
INSERT INTO vehicles (id, name, license_plate, details, is_sample, created_by, created_by_id, created_date, updated_date)
VALUES
  (gen_random_uuid(), 'משאית איסוזו', '12-345-67', 'משאית גדולה לעבודות כבדות', true, 'system', (SELECT id FROM users LIMIT 1), NOW(), NOW()),
  (gen_random_uuid(), 'טנדר פורד', '98-765-43', 'רכב קל לעבודות קטנות', true, 'system', (SELECT id FROM users LIMIT 1), NOW(), NOW()),
  (gen_random_uuid(), 'מיניבוס', '11-222-33', 'רכב להובלת עובדים', true, 'system', (SELECT id FROM users LIMIT 1), NOW(), NOW());

-- Insert sample carts
INSERT INTO carts (id, name, details, is_sample, created_by, created_by_id, created_date, updated_date)
VALUES
  (gen_random_uuid(), 'עגלת כלים גדולה', 'עגלה לכלי עבודה כבדים', true, 'system', (SELECT id FROM users LIMIT 1), NOW(), NOW()),
  (gen_random_uuid(), 'עגלת חומרים', 'עגלה להובלת חומרי בנייה', true, 'system', (SELECT id FROM users LIMIT 1), NOW(), NOW()),
  (gen_random_uuid(), 'עגלה קטנה', 'עגלה לעבודות קלות', true, 'system', (SELECT id FROM users LIMIT 1), NOW(), NOW());

-- Insert sample clients
INSERT INTO clients (id, company_name, contact_person, phone, email, address, city, po_box, installation_rate, security_rate, payment_method, status, notes, is_sample, created_by, created_by_id, created_date, updated_date)
VALUES
  (gen_random_uuid(), 'חברת הבנייה הגדולה', 'אבי כהן', '03-1234567', 'avi@construction.co.il', 'רחוב הרצל 123', 'תל אביב', '12345', 200.00, 180.00, 1, 'active', 'לקוח VIP', true, 'system', (SELECT id FROM users LIMIT 1), NOW(), NOW()),
  (gen_random_uuid(), 'פרויקטים ושותפים', 'רחל לוי', '04-9876543', 'rachel@projects.co.il', 'שדרות בן גוריון 456', 'חיפה', '67890', 180.00, 160.00, 2, 'active', 'לקוח קבוע', true, 'system', (SELECT id FROM users LIMIT 1), NOW(), NOW());

-- Insert sample work types
INSERT INTO work_types (id, name_he, name_en, is_sample, created_by, created_by_id, created_date, updated_date)
VALUES
  (gen_random_uuid(), 'התקנה', 'Installation', true, 'system', (SELECT id FROM users LIMIT 1), NOW(), NOW()),
  (gen_random_uuid(), 'אבטחה', 'Security', true, 'system', (SELECT id FROM users LIMIT 1), NOW(), NOW()),
  (gen_random_uuid(), 'תחזוקה', 'Maintenance', true, 'system', (SELECT id FROM users LIMIT 1), NOW(), NOW());
