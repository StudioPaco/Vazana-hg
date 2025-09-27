-- Restore database schema after Supabase restoration
-- This ensures all tables exist with proper structure and RLS policies

-- Update database schema to exactly match Base44 entity structures
-- This replaces the previous schema with the exact field names and types

-- Drop existing tables to recreate with correct structure
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS workers CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS carts CASCADE;
DROP TABLE IF EXISTS work_types CASCADE;
DROP TABLE IF EXISTS receipts CASCADE;

-- Create clients table with exact Base44 structure
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL,
    contact_person TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT,
    city TEXT,
    po_box TEXT,
    email TEXT NOT NULL,
    payment_method INTEGER, -- Payment due days from beginning of next month
    security_rate DECIMAL(10,2), -- Standard shift rate for Security jobs
    installation_rate DECIMAL(10,2), -- Standard shift rate for Installation jobs
    notes TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_date TIMESTAMPTZ DEFAULT NOW(),
    updated_date TIMESTAMPTZ DEFAULT NOW(),
    created_by_id UUID REFERENCES auth.users(id),
    created_by TEXT,
    is_sample BOOLEAN DEFAULT FALSE
);

-- Create workers table with exact Base44 structure
CREATE TABLE workers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    address TEXT,
    shift_rate DECIMAL(10,2) NOT NULL,
    payment_terms_days INTEGER NOT NULL,
    availability JSONB DEFAULT '{
        "sun": {"day": false, "night": false},
        "mon": {"day": false, "night": false},
        "tue": {"day": false, "night": false},
        "wed": {"day": false, "night": false},
        "thu": {"day": false, "night": false},
        "fri": {"day": false, "night": false},
        "sat": {"day": false, "night": false}
    }',
    notes TEXT,
    created_date TIMESTAMPTZ DEFAULT NOW(),
    updated_date TIMESTAMPTZ DEFAULT NOW(),
    created_by_id UUID REFERENCES auth.users(id),
    created_by TEXT,
    is_sample BOOLEAN DEFAULT FALSE
);

-- Create vehicles table with exact Base44 structure
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    license_plate TEXT NOT NULL,
    details TEXT,
    created_date TIMESTAMPTZ DEFAULT NOW(),
    updated_date TIMESTAMPTZ DEFAULT NOW(),
    created_by_id UUID REFERENCES auth.users(id),
    created_by TEXT,
    is_sample BOOLEAN DEFAULT FALSE
);

-- Create carts table with exact Base44 structure
CREATE TABLE carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    details TEXT,
    created_date TIMESTAMPTZ DEFAULT NOW(),
    updated_date TIMESTAMPTZ DEFAULT NOW(),
    created_by_id UUID REFERENCES auth.users(id),
    created_by TEXT,
    is_sample BOOLEAN DEFAULT FALSE
);

-- Create work_types table with exact Base44 structure (bilingual)
CREATE TABLE work_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_en TEXT NOT NULL,
    name_he TEXT NOT NULL,
    created_date TIMESTAMPTZ DEFAULT NOW(),
    updated_date TIMESTAMPTZ DEFAULT NOW(),
    created_by_id UUID REFERENCES auth.users(id),
    created_by TEXT,
    is_sample BOOLEAN DEFAULT FALSE
);

-- Create jobs table with exact Base44 structure
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_number TEXT NOT NULL,
    client_id UUID NOT NULL REFERENCES clients(id),
    client_name TEXT NOT NULL,
    job_date DATE NOT NULL,
    work_type TEXT NOT NULL,
    shift_type TEXT NOT NULL CHECK (shift_type IN ('day', 'night', 'double')),
    site TEXT NOT NULL,
    city TEXT NOT NULL,
    service_description TEXT,
    worker_id UUID NOT NULL REFERENCES workers(id),
    worker_name TEXT NOT NULL,
    cart_id UUID REFERENCES carts(id),
    cart_name TEXT,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id),
    vehicle_name TEXT NOT NULL,
    job_specific_shift_rate DECIMAL(10,2),
    total_amount DECIMAL(10,2),
    payment_status TEXT DEFAULT 'ממתין' CHECK (payment_status IN ('ממתין', 'בוצע', 'לתשלום', 'שולם')),
    receipt_id UUID,
    notes TEXT,
    add_to_calendar BOOLEAN DEFAULT FALSE,
    created_date TIMESTAMPTZ DEFAULT NOW(),
    updated_date TIMESTAMPTZ DEFAULT NOW(),
    created_by_id UUID REFERENCES auth.users(id),
    created_by TEXT,
    is_sample BOOLEAN DEFAULT FALSE
);

-- Create receipts table
CREATE TABLE receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES jobs(id),
    receipt_number TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid')),
    created_date TIMESTAMPTZ DEFAULT NOW(),
    updated_date TIMESTAMPTZ DEFAULT NOW(),
    created_by_id UUID REFERENCES auth.users(id),
    created_by TEXT,
    is_sample BOOLEAN DEFAULT FALSE
);

-- Insert default work types (bilingual)
INSERT INTO work_types (name_en, name_he) VALUES 
('Security', 'אבטחה'),
('Installation', 'התקנות');

-- Enable RLS on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (users can only see their own data)
CREATE POLICY "Users can view own clients" ON clients FOR SELECT USING (auth.uid() = created_by_id);
CREATE POLICY "Users can insert own clients" ON clients FOR INSERT WITH CHECK (auth.uid() = created_by_id);
CREATE POLICY "Users can update own clients" ON clients FOR UPDATE USING (auth.uid() = created_by_id);
CREATE POLICY "Users can delete own clients" ON clients FOR DELETE USING (auth.uid() = created_by_id);

CREATE POLICY "Users can view own workers" ON workers FOR SELECT USING (auth.uid() = created_by_id);
CREATE POLICY "Users can insert own workers" ON workers FOR INSERT WITH CHECK (auth.uid() = created_by_id);
CREATE POLICY "Users can update own workers" ON workers FOR UPDATE USING (auth.uid() = created_by_id);
CREATE POLICY "Users can delete own workers" ON workers FOR DELETE USING (auth.uid() = created_by_id);

CREATE POLICY "Users can view own vehicles" ON vehicles FOR SELECT USING (auth.uid() = created_by_id);
CREATE POLICY "Users can insert own vehicles" ON vehicles FOR INSERT WITH CHECK (auth.uid() = created_by_id);
CREATE POLICY "Users can update own vehicles" ON vehicles FOR UPDATE USING (auth.uid() = created_by_id);
CREATE POLICY "Users can delete own vehicles" ON vehicles FOR DELETE USING (auth.uid() = created_by_id);

CREATE POLICY "Users can view own carts" ON carts FOR SELECT USING (auth.uid() = created_by_id);
CREATE POLICY "Users can insert own carts" ON carts FOR INSERT WITH CHECK (auth.uid() = created_by_id);
CREATE POLICY "Users can update own carts" ON carts FOR UPDATE USING (auth.uid() = created_by_id);
CREATE POLICY "Users can delete own carts" ON carts FOR DELETE USING (auth.uid() = created_by_id);

CREATE POLICY "Users can view work types" ON work_types FOR SELECT USING (true);
CREATE POLICY "Users can view own jobs" ON jobs FOR SELECT USING (auth.uid() = created_by_id);
CREATE POLICY "Users can insert own jobs" ON jobs FOR INSERT WITH CHECK (auth.uid() = created_by_id);
CREATE POLICY "Users can update own jobs" ON jobs FOR UPDATE USING (auth.uid() = created_by_id);
CREATE POLICY "Users can delete own jobs" ON jobs FOR DELETE USING (auth.uid() = created_by_id);

CREATE POLICY "Users can view own receipts" ON receipts FOR SELECT USING (auth.uid() = created_by_id);
CREATE POLICY "Users can insert own receipts" ON receipts FOR INSERT WITH CHECK (auth.uid() = created_by_id);
CREATE POLICY "Users can update own receipts" ON receipts FOR UPDATE USING (auth.uid() = created_by_id);
CREATE POLICY "Users can delete own receipts" ON receipts FOR DELETE USING (auth.uid() = created_by_id);
