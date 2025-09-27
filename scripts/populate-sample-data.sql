-- Insert sample workers
INSERT INTO workers (id, name, phone_number, address, shift_rate, payment_terms_days, notes, availability, is_sample, created_by, created_by_id, created_date, updated_date)
VALUES 
  (gen_random_uuid(), 'יוסי כהן', '050-1234567', 'תל אביב', 150.00, 30, 'עובד מנוסה', '{"sunday": true, "monday": true, "tuesday": true, "wednesday": true, "thursday": true, "friday": false, "saturday": false}', true, 'system', gen_random_uuid(), NOW(), NOW()),
  (gen_random_uuid(), 'דוד לוי', '052-9876543', 'חיפה', 140.00, 30, 'עובד אמין', '{"sunday": true, "monday": true, "tuesday": true, "wednesday": true, "thursday": true, "friday": true, "saturday": false}', true, 'system', gen_random_uuid(), NOW(), NOW()),
  (gen_random_uuid(), 'משה אברהם', '054-5555555', 'ירושלים', 160.00, 15, 'מומחה בתחום', '{"sunday": true, "monday": true, "tuesday": true, "wednesday": true, "thursday": true, "friday": false, "saturday": false}', true, 'system', gen_random_uuid(), NOW(), NOW());

-- Insert sample vehicles  
INSERT INTO vehicles (id, name, license_plate, details, is_sample, created_by, created_by_id, created_date, updated_date)
VALUES
  (gen_random_uuid(), 'משאית איסוזו', '12-345-67', 'משאית גדולה לעבודות כבדות', true, 'system', gen_random_uuid(), NOW(), NOW()),
  (gen_random_uuid(), 'טנדר פורד', '98-765-43', 'רכב קל לעבודות קטנות', true, 'system', gen_random_uuid(), NOW(), NOW()),
  (gen_random_uuid(), 'מיניבוס', '11-222-33', 'רכב להובלת עובדים', true, 'system', gen_random_uuid(), NOW(), NOW());

-- Insert sample carts
INSERT INTO carts (id, name, details, is_sample, created_by, created_by_id, created_date, updated_date)
VALUES
  (gen_random_uuid(), 'עגלת כלים גדולה', 'עגלה לכלי עבודה כבדים', true, 'system', gen_random_uuid(), NOW(), NOW()),
  (gen_random_uuid(), 'עגלת חומרים', 'עגלה להובלת חומרי בנייה', true, 'system', gen_random_uuid(), NOW(), NOW()),
  (gen_random_uuid(), 'עגלה קטנה', 'עגלה לעבודות קלות', true, 'system', gen_random_uuid(), NOW(), NOW());

-- Insert sample clients
INSERT INTO clients (id, company_name, contact_person, phone, email, address, city, po_box, installation_rate, security_rate, payment_method, status, notes, is_sample, created_by, created_by_id, created_date, updated_date)
VALUES
  (gen_random_uuid(), 'חברת הבנייה הגדולה', 'אבי כהן', '03-1234567', 'avi@construction.co.il', 'רחוב הרצל 123', 'תל אביב', '12345', 200.00, 180.00, 1, 'active', 'לקוח VIP', true, 'system', gen_random_uuid(), NOW(), NOW()),
  (gen_random_uuid(), 'פרויקטים ושותפים', 'רחל לוי', '04-9876543', 'rachel@projects.co.il', 'שדרות בן גוריון 456', 'חיפה', '67890', 180.00, 160.00, 2, 'active', 'לקוח קבוע', true, 'system', gen_random_uuid(), NOW(), NOW());

-- Insert sample work types
INSERT INTO work_types (id, name_he, name_en, is_sample, created_by, created_by_id, created_date, updated_date)
VALUES
  (gen_random_uuid(), 'התקנה', 'Installation', true, 'system', gen_random_uuid(), NOW(), NOW()),
  (gen_random_uuid(), 'אבטחה', 'Security', true, 'system', gen_random_uuid(), NOW(), NOW()),
  (gen_random_uuid(), 'תחזוקה', 'Maintenance', true, 'system', gen_random_uuid(), NOW(), NOW());
