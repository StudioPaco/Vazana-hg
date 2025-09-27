-- Comprehensive test data to ensure all dropdowns work
-- This script ensures we have data for all required dropdowns

-- Clear existing test data (optional)
-- DELETE FROM jobs WHERE description LIKE '%TEST%';
-- DELETE FROM work_types WHERE name_he LIKE '%בדיקה%';

-- Ensure work types exist
INSERT INTO work_types (name_he, name_en) 
VALUES 
  ('אבטחה', 'Security'),
  ('התקנות', 'Installation'),
  ('תחזוקה', 'Maintenance'),
  ('ניקיון', 'Cleaning'),
  ('בדיקה', 'Testing')
ON CONFLICT (name_he) DO NOTHING;

-- Ensure workers exist
INSERT INTO workers (name, phone, address, hourly_rate) 
VALUES 
  ('יוסי כהן', '050-1234567', 'תל אביב', 100),
  ('משה לוי', '052-9876543', 'ירושלים', 120),
  ('דוד ישראלי', '054-5555555', 'חיפה', 90),
  ('עובד בדיקה', '050-0000000', 'כתובת בדיקה', 80)
ON CONFLICT (phone) DO NOTHING;

-- Ensure vehicles exist
INSERT INTO vehicles (license_plate, model, year) 
VALUES 
  ('123-45-678', 'פורד טרנזיט', 2020),
  ('987-65-432', 'איווקו דיילי', 2019),
  ('555-55-555', 'רכב בדיקה', 2021)
ON CONFLICT (license_plate) DO NOTHING;

-- Ensure clients exist
INSERT INTO clients (name, phone, email, address) 
VALUES 
  ('חברת ABC', '03-1234567', 'abc@company.com', 'רחוב הראשי 1, תל אביב'),
  ('לקוח פרטי', '050-9999999', 'private@email.com', 'רחוב השני 2, ירושלים'),
  ('לקוח בדיקה', '050-0000001', 'test@client.com', 'כתובת בדיקה')
ON CONFLICT (phone) DO NOTHING;

-- Create a test job to verify everything works
INSERT INTO jobs (
  client_id,
  work_type_id,
  description,
  location,
  scheduled_date,
  status,
  priority,
  estimated_hours,
  hourly_rate
)
SELECT 
  c.id,
  wt.id,
  'עבודת בדיקה - TEST JOB',
  'מיקום בדיקה',
  CURRENT_DATE + INTERVAL '1 day',
  'scheduled',
  'medium',
  4,
  100
FROM clients c, work_types wt
WHERE c.name = 'לקוח בדיקה' AND wt.name_he = 'בדיקה'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Verify data exists
SELECT 'Work Types Count:' as table_name, COUNT(*) as count FROM work_types
UNION ALL
SELECT 'Workers Count:', COUNT(*) FROM workers
UNION ALL
SELECT 'Vehicles Count:', COUNT(*) FROM vehicles
UNION ALL
SELECT 'Clients Count:', COUNT(*) FROM clients
UNION ALL
SELECT 'Jobs Count:', COUNT(*) FROM jobs;
