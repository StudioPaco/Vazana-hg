-- Fix dropdown sample data to match current schema and ensure dropdowns work
-- This script creates sample data with proper user IDs and schema compliance

-- Use a consistent sample user ID for all sample data
DO $$
DECLARE
    sample_user_id UUID := '550e8400-e29b-41d4-a716-446655440000';
    sample_email TEXT := 'root@vazana.com';
BEGIN
    -- Clear existing sample data to avoid conflicts
    DELETE FROM jobs WHERE is_sample = true;
    DELETE FROM workers WHERE is_sample = true;
    DELETE FROM vehicles WHERE is_sample = true;
    DELETE FROM carts WHERE is_sample = true;
    DELETE FROM work_types WHERE is_sample = true;
    DELETE FROM clients WHERE is_sample = true;

    -- Insert sample work types
    INSERT INTO work_types (id, name_he, name_en, created_by_id, created_by, is_sample, created_date, updated_date) 
    VALUES 
        (gen_random_uuid(), 'אבטחה', 'Security', sample_user_id, sample_email, true, NOW(), NOW()),
        (gen_random_uuid(), 'התקנות', 'Installation', sample_user_id, sample_email, true, NOW(), NOW()),
        (gen_random_uuid(), 'תחזוקה', 'Maintenance', sample_user_id, sample_email, true, NOW(), NOW()),
        (gen_random_uuid(), 'ניקיון', 'Cleaning', sample_user_id, sample_email, true, NOW(), NOW());

    -- Insert sample workers
    INSERT INTO workers (id, name, phone_number, address, shift_rate, created_by_id, created_by, is_sample, created_date, updated_date, availability, payment_terms_days, notes) 
    VALUES 
        (gen_random_uuid(), 'יוסי כהן', '050-1234567', 'תל אביב, רחוב הראשי 10', 100.00, sample_user_id, sample_email, true, NOW(), NOW(), '{"monday": true, "tuesday": true, "wednesday": true, "thursday": true, "friday": true}', 30, 'עובד מנוסה באבטחה'),
        (gen_random_uuid(), 'משה לוי', '052-9876543', 'ירושלים, שדרות הנביאים 25', 120.00, sample_user_id, sample_email, true, NOW(), NOW(), '{"monday": true, "tuesday": true, "wednesday": true, "thursday": true, "friday": true, "saturday": true}', 15, 'מתמחה בהתקנות'),
        (gen_random_uuid(), 'דוד ישראלי', '054-5555555', 'חיפה, רחוב הרצל 5', 90.00, sample_user_id, sample_email, true, NOW(), NOW(), '{"sunday": true, "monday": true, "tuesday": true, "wednesday": true, "thursday": true}', 30, 'עובד תחזוקה מקצועי');

    -- Insert sample vehicles
    INSERT INTO vehicles (id, name, license_plate, details, created_by_id, created_by, is_sample, created_date, updated_date) 
    VALUES 
        (gen_random_uuid(), 'פורד טרנזיט', '123-45-678', 'רכב מסחרי גדול, מתאים לציוד כבד', sample_user_id, sample_email, true, NOW(), NOW()),
        (gen_random_uuid(), 'איווקו דיילי', '987-65-432', 'רכב בינוני, מתאים לעבודות יומיומיות', sample_user_id, sample_email, true, NOW(), NOW()),
        (gen_random_uuid(), 'סוזוקי קרי', '555-55-555', 'רכב קטן וחסכוני לעבודות קלות', sample_user_id, sample_email, true, NOW(), NOW());

    -- Insert sample carts
    INSERT INTO carts (id, name, details, created_by_id, created_by, is_sample, created_date, updated_date) 
    VALUES 
        (gen_random_uuid(), 'עגלת ציוד כבד', 'עגלה לציוד אבטחה וכלי עבודה כבדים', sample_user_id, sample_email, true, NOW(), NOW()),
        (gen_random_uuid(), 'נגרר קל', 'נגרר קטן לכלי עבודה בסיסיים', sample_user_id, sample_email, true, NOW(), NOW()),
        (gen_random_uuid(), 'עגלת חומרים', 'עגלה לחומרי בנייה וחומרי גלם', sample_user_id, sample_email, true, NOW(), NOW());

    -- Insert sample clients
    INSERT INTO clients (id, company_name, contact_person, phone, email, address, city, created_by_id, created_by, is_sample, created_date, updated_date, status, notes, payment_method, security_rate, installation_rate) 
    VALUES 
        (gen_random_uuid(), 'חברת ABC בע"מ', 'אברהם כהן', '03-1234567', 'abc@company.com', 'רחוב הראשי 1', 'תל אביב', sample_user_id, sample_email, true, NOW(), NOW(), 'active', 'לקוח VIP', 1, 150.00, 200.00),
        (gen_random_uuid(), 'משרדי XYZ', 'רחל לוי', '02-9876543', 'xyz@office.com', 'שדרות הנביאים 10', 'ירושלים', sample_user_id, sample_email, true, NOW(), NOW(), 'active', 'לקוח קבוע', 2, 120.00, 180.00),
        (gen_random_uuid(), 'קבוצת DEF', 'יוסי ישראלי', '04-5555555', 'def@group.com', 'רחוב הרצל 20', 'חיפה', sample_user_id, sample_email, true, NOW(), NOW(), 'active', 'לקוח חדש', 1, 100.00, 160.00);

    -- Verify data was inserted
    RAISE NOTICE 'Sample data inserted successfully:';
    RAISE NOTICE 'Work Types: %', (SELECT COUNT(*) FROM work_types WHERE is_sample = true);
    RAISE NOTICE 'Workers: %', (SELECT COUNT(*) FROM workers WHERE is_sample = true);
    RAISE NOTICE 'Vehicles: %', (SELECT COUNT(*) FROM vehicles WHERE is_sample = true);
    RAISE NOTICE 'Carts: %', (SELECT COUNT(*) FROM carts WHERE is_sample = true);
    RAISE NOTICE 'Clients: %', (SELECT COUNT(*) FROM clients WHERE is_sample = true);

END $$;
