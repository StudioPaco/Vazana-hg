-- Ensure work types table has sample data for testing
INSERT INTO work_types (name_he, name_en) 
SELECT 'אבטחה', 'Security'
WHERE NOT EXISTS (SELECT 1 FROM work_types WHERE name_he = 'אבטחה');

INSERT INTO work_types (name_he, name_en) 
SELECT 'התקנות', 'Installation'
WHERE NOT EXISTS (SELECT 1 FROM work_types WHERE name_he = 'התקנות');

INSERT INTO work_types (name_he, name_en) 
SELECT 'ניקיון', 'Cleaning'
WHERE NOT EXISTS (SELECT 1 FROM work_types WHERE name_he = 'ניקיון');
