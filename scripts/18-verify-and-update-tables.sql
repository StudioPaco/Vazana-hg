-- Reset and verify all tables and their data
-- Drop and recreate if necessary

-- Ensure work_types table exists and has correct structure
CREATE TABLE IF NOT EXISTS work_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_he TEXT NOT NULL,
    name_en TEXT NOT NULL,
    created_date TIMESTAMPTZ DEFAULT NOW(),
    updated_date TIMESTAMPTZ DEFAULT NOW(),
    created_by_id UUID REFERENCES auth.users(id),
    created_by TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_sample BOOLEAN DEFAULT FALSE
);

-- Ensure workers table exists and has correct structure
CREATE TABLE IF NOT EXISTS workers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    address TEXT,
    shift_rate DECIMAL(10,2) NOT NULL,
    payment_terms_days INTEGER NOT NULL,
    notes TEXT,
    created_date TIMESTAMPTZ DEFAULT NOW(),
    updated_date TIMESTAMPTZ DEFAULT NOW(),
    created_by_id UUID REFERENCES auth.users(id),
    created_by TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_sample BOOLEAN DEFAULT FALSE
);

-- Ensure vehicles table exists and has correct structure
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    license_plate TEXT NOT NULL,
    details TEXT,
    created_date TIMESTAMPTZ DEFAULT NOW(),
    updated_date TIMESTAMPTZ DEFAULT NOW(),
    created_by_id UUID REFERENCES auth.users(id),
    created_by TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_sample BOOLEAN DEFAULT FALSE
);

-- Ensure carts table exists and has correct structure
CREATE TABLE IF NOT EXISTS carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    details TEXT,
    created_date TIMESTAMPTZ DEFAULT NOW(),
    updated_date TIMESTAMPTZ DEFAULT NOW(),
    created_by_id UUID REFERENCES auth.users(id),
    created_by TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_sample BOOLEAN DEFAULT FALSE
);

-- Insert sample data for work types if none exist
INSERT INTO work_types (name_he, name_en, is_sample)
SELECT 'אבטחה', 'Security', true
WHERE NOT EXISTS (SELECT 1 FROM work_types WHERE is_sample = true)
UNION ALL
SELECT 'התקנות', 'Installation', true
WHERE NOT EXISTS (SELECT 1 FROM work_types WHERE is_sample = true);

-- Insert sample worker if none exist
INSERT INTO workers (name, phone_number, shift_rate, payment_terms_days, notes, is_sample)
SELECT 'עובד לדוגמה', '050-1234567', 120.00, 30, 'עובד מערכת לדוגמה', true
WHERE NOT EXISTS (SELECT 1 FROM workers WHERE is_sample = true);

-- Insert sample vehicle if none exist
INSERT INTO vehicles (name, license_plate, details, is_sample)
SELECT 'רכב לדוגמה', '12-345-67', 'רכב מערכת לדוגמה', true
WHERE NOT EXISTS (SELECT 1 FROM vehicles WHERE is_sample = true);

-- Insert sample cart if none exist
INSERT INTO carts (name, details, is_sample)
SELECT 'עגלה לדוגמה', 'עגלת מערכת לדוגמה', true
WHERE NOT EXISTS (SELECT 1 FROM carts WHERE is_sample = true);

-- Enable Row Level Security (RLS)
ALTER TABLE work_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Users can view their own items or sample items" ON work_types
    FOR SELECT USING (auth.uid() = created_by_id OR is_sample = true);
CREATE POLICY "Users can manage their own items" ON work_types
    FOR ALL USING (auth.uid() = created_by_id);

CREATE POLICY "Users can view their own items or sample items" ON workers
    FOR SELECT USING (auth.uid() = created_by_id OR is_sample = true);
CREATE POLICY "Users can manage their own items" ON workers
    FOR ALL USING (auth.uid() = created_by_id);

CREATE POLICY "Users can view their own items or sample items" ON vehicles
    FOR SELECT USING (auth.uid() = created_by_id OR is_sample = true);
CREATE POLICY "Users can manage their own items" ON vehicles
    FOR ALL USING (auth.uid() = created_by_id);

CREATE POLICY "Users can view their own items or sample items" ON carts
    FOR SELECT USING (auth.uid() = created_by_id OR is_sample = true);
CREATE POLICY "Users can manage their own items" ON carts
    FOR ALL USING (auth.uid() = created_by_id);