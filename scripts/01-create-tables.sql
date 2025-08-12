-- Create Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create WorkType table
CREATE TABLE IF NOT EXISTS public.work_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_he TEXT NOT NULL,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by_id UUID REFERENCES public.users(id),
  created_by TEXT,
  is_sample BOOLEAN DEFAULT FALSE
);

-- Create Client table
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  po_box TEXT,
  email TEXT,
  payment_method TEXT,
  security_rate DECIMAL(10,2),
  installation_rate DECIMAL(10,2),
  current_job_rate DECIMAL(10,2),
  notes TEXT,
  status TEXT DEFAULT 'active',
  created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by_id UUID REFERENCES public.users(id),
  created_by TEXT,
  is_sample BOOLEAN DEFAULT FALSE
);

-- Create Worker table
CREATE TABLE IF NOT EXISTS public.workers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone_number TEXT,
  address TEXT,
  shift_rate DECIMAL(10,2),
  payment_terms_days INTEGER,
  availability JSONB, -- Store availability schedule as JSON
  notes TEXT,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by_id UUID REFERENCES public.users(id),
  created_by TEXT,
  is_sample BOOLEAN DEFAULT FALSE
);

-- Create Vehicle table
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  license_plate TEXT,
  details TEXT,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by_id UUID REFERENCES public.users(id),
  created_by TEXT,
  is_sample BOOLEAN DEFAULT FALSE
);

-- Create Cart table
CREATE TABLE IF NOT EXISTS public.carts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  details TEXT,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by_id UUID REFERENCES public.users(id),
  created_by TEXT,
  is_sample BOOLEAN DEFAULT FALSE
);

-- Create Receipt table
CREATE TABLE IF NOT EXISTS public.receipts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  receipt_number TEXT,
  client_id UUID REFERENCES public.clients(id),
  total_amount DECIMAL(10,2),
  status TEXT DEFAULT 'draft',
  issue_date DATE,
  due_date DATE,
  notes TEXT,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by_id UUID REFERENCES public.users(id),
  created_by TEXT,
  is_sample BOOLEAN DEFAULT FALSE
);

-- Create Job table (main entity linking everything together)
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_number TEXT NOT NULL,
  client_id UUID REFERENCES public.clients(id),
  client_name TEXT, -- Denormalized for easier queries
  job_date DATE,
  work_type TEXT,
  shift_type TEXT CHECK (shift_type IN ('day', 'night')),
  site TEXT,
  city TEXT,
  service_description TEXT,
  worker_id UUID REFERENCES public.workers(id),
  worker_name TEXT, -- Denormalized for easier queries
  cart_id UUID REFERENCES public.carts(id),
  cart_name TEXT, -- Denormalized for easier queries
  vehicle_id UUID REFERENCES public.vehicles(id),
  vehicle_name TEXT, -- Denormalized for easier queries
  job_specific_shift_rate DECIMAL(10,2),
  total_amount DECIMAL(10,2),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'overdue')),
  receipt_id UUID REFERENCES public.receipts(id),
  notes TEXT,
  add_to_calendar BOOLEAN DEFAULT FALSE,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by_id UUID REFERENCES public.users(id),
  created_by TEXT,
  is_sample BOOLEAN DEFAULT FALSE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_jobs_client_id ON public.jobs(client_id);
CREATE INDEX IF NOT EXISTS idx_jobs_worker_id ON public.jobs(worker_id);
CREATE INDEX IF NOT EXISTS idx_jobs_job_date ON public.jobs(job_date);
CREATE INDEX IF NOT EXISTS idx_jobs_payment_status ON public.jobs(payment_status);
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);
CREATE INDEX IF NOT EXISTS idx_receipts_client_id ON public.receipts(client_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (users can only see their own data)
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own work_types" ON public.work_types FOR SELECT USING (auth.uid() = created_by_id);
CREATE POLICY "Users can insert own work_types" ON public.work_types FOR INSERT WITH CHECK (auth.uid() = created_by_id);
CREATE POLICY "Users can update own work_types" ON public.work_types FOR UPDATE USING (auth.uid() = created_by_id);
CREATE POLICY "Users can delete own work_types" ON public.work_types FOR DELETE USING (auth.uid() = created_by_id);

CREATE POLICY "Users can view own clients" ON public.clients FOR SELECT USING (auth.uid() = created_by_id);
CREATE POLICY "Users can insert own clients" ON public.clients FOR INSERT WITH CHECK (auth.uid() = created_by_id);
CREATE POLICY "Users can update own clients" ON public.clients FOR UPDATE USING (auth.uid() = created_by_id);
CREATE POLICY "Users can delete own clients" ON public.clients FOR DELETE USING (auth.uid() = created_by_id);

CREATE POLICY "Users can view own workers" ON public.workers FOR SELECT USING (auth.uid() = created_by_id);
CREATE POLICY "Users can insert own workers" ON public.workers FOR INSERT WITH CHECK (auth.uid() = created_by_id);
CREATE POLICY "Users can update own workers" ON public.workers FOR UPDATE USING (auth.uid() = created_by_id);
CREATE POLICY "Users can delete own workers" ON public.workers FOR DELETE USING (auth.uid() = created_by_id);

CREATE POLICY "Users can view own vehicles" ON public.vehicles FOR SELECT USING (auth.uid() = created_by_id);
CREATE POLICY "Users can insert own vehicles" ON public.vehicles FOR INSERT WITH CHECK (auth.uid() = created_by_id);
CREATE POLICY "Users can update own vehicles" ON public.vehicles FOR UPDATE USING (auth.uid() = created_by_id);
CREATE POLICY "Users can delete own vehicles" ON public.vehicles FOR DELETE USING (auth.uid() = created_by_id);

CREATE POLICY "Users can view own carts" ON public.carts FOR SELECT USING (auth.uid() = created_by_id);
CREATE POLICY "Users can insert own carts" ON public.carts FOR INSERT WITH CHECK (auth.uid() = created_by_id);
CREATE POLICY "Users can update own carts" ON public.carts FOR UPDATE USING (auth.uid() = created_by_id);
CREATE POLICY "Users can delete own carts" ON public.carts FOR DELETE USING (auth.uid() = created_by_id);

CREATE POLICY "Users can view own receipts" ON public.receipts FOR SELECT USING (auth.uid() = created_by_id);
CREATE POLICY "Users can insert own receipts" ON public.receipts FOR INSERT WITH CHECK (auth.uid() = created_by_id);
CREATE POLICY "Users can update own receipts" ON public.receipts FOR UPDATE USING (auth.uid() = created_by_id);
CREATE POLICY "Users can delete own receipts" ON public.receipts FOR DELETE USING (auth.uid() = created_by_id);

CREATE POLICY "Users can view own jobs" ON public.jobs FOR SELECT USING (auth.uid() = created_by_id);
CREATE POLICY "Users can insert own jobs" ON public.jobs FOR INSERT WITH CHECK (auth.uid() = created_by_id);
CREATE POLICY "Users can update own jobs" ON public.jobs FOR UPDATE USING (auth.uid() = created_by_id);
CREATE POLICY "Users can delete own jobs" ON public.jobs FOR DELETE USING (auth.uid() = created_by_id);
