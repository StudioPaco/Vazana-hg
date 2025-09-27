-- Populate all tables with sample data for testing
-- This script ensures all dropdowns have data to display

-- Clear existing sample data first
DELETE FROM workers WHERE is_sample = true;
DELETE FROM vehicles WHERE is_sample = true;
DELETE FROM carts WHERE is_sample = true;
DELETE FROM clients WHERE is_sample = true;

-- Insert sample workers
INSERT INTO workers (name, phone, email, hourly_rate, is_sample, created_by_id) VALUES
('דוד כהן', '050-1234567', 'david@example.com', 80.00, true, 'sample-user'),
('מיכל לוי', '052-9876543', 'michal@example.com', 75.00, true, 'sample-user'),
('יוסי אברהם', '054-5555555', 'yossi@example.com', 90.00, true, 'sample-user');

-- Insert sample vehicles
INSERT INTO vehicles (name, license_plate, vehicle_type, is_sample, created_by_id) VALUES
('משאית פורד', '123-45-678', 'truck', true, 'sample-user'),
('ואן מרצדס', '987-65-432', 'van', true, 'sample-user'),
('רכב שירות', '555-11-222', 'service_car', true, 'sample-user');

-- Insert sample carts
INSERT INTO carts (name, cart_type, capacity, is_sample, created_by_id) VALUES
('עגלת כלים גדולה', 'tools', 500, true, 'sample-user'),
('עגלת ציוד חשמל', 'electrical', 300, true, 'sample-user'),
('עגלת חומרים', 'materials', 800, true, 'sample-user');

-- Insert sample clients
INSERT INTO clients (
  company_name, 
  contact_name, 
  phone, 
  email, 
  address, 
  city, 
  po_box,
  payment_method,
  hourly_rate,
  estimate_rate,
  discount,
  is_sample,
  created_by_id
) VALUES
('חברת הבנייה הגדולה', 'אבי כהן', '03-1234567', 'avi@building.co.il', 'רחוב הבנאים 15', 'תל אביב', '12345', 'monthly', 120.00, 150.00, 5.00, true, 'sample-user'),
('מפעלי התעשייה', 'רחל לוי', '04-9876543', 'rachel@industry.co.il', 'אזור התעשייה', 'חיפה', '67890', 'immediate', 100.00, 130.00, 0.00, true, 'sample-user'),
('חברת הנדסה מתקדמת', 'משה דוד', '02-5555555', 'moshe@engineering.co.il', 'רחוב המדע 8', 'ירושלים', '54321', 'monthly', 140.00, 170.00, 10.00, true, 'sample-user');

-- Ensure work types exist
INSERT INTO work_types (name_he, name_en, is_sample, created_by_id) VALUES
('תחזוקה כללית', 'General Maintenance', true, 'sample-user'),
('תיקונים חשמל', 'Electrical Repairs', true, 'sample-user'),
('עבודות צביעה', 'Painting Work', true, 'sample-user')
ON CONFLICT (name_he) DO NOTHING;
