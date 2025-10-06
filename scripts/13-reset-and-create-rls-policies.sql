-- First, drop existing policies
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I;',
            pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- Enable RLS on all tables
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Allow logged-in users to read all relevant data
CREATE POLICY "read_all_clients" ON public.clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "read_all_work_types" ON public.work_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "read_all_workers" ON public.workers FOR SELECT TO authenticated USING (true);
CREATE POLICY "read_all_vehicles" ON public.vehicles FOR SELECT TO authenticated USING (true);
CREATE POLICY "read_all_carts" ON public.carts FOR SELECT TO authenticated USING (true);

-- Allow logged-in users to manage their own data
CREATE POLICY "manage_own_clients" ON public.clients 
    FOR ALL TO authenticated 
    USING (auth.uid() = created_by_id) 
    WITH CHECK (auth.uid() = created_by_id);

CREATE POLICY "manage_own_workers" ON public.workers 
    FOR ALL TO authenticated 
    USING (auth.uid() = created_by_id) 
    WITH CHECK (auth.uid() = created_by_id);

CREATE POLICY "manage_own_work_types" ON public.work_types 
    FOR ALL TO authenticated 
    USING (auth.uid() = created_by_id) 
    WITH CHECK (auth.uid() = created_by_id);

CREATE POLICY "manage_own_vehicles" ON public.vehicles 
    FOR ALL TO authenticated 
    USING (auth.uid() = created_by_id) 
    WITH CHECK (auth.uid() = created_by_id);

CREATE POLICY "manage_own_carts" ON public.carts 
    FOR ALL TO authenticated 
    USING (auth.uid() = created_by_id) 
    WITH CHECK (auth.uid() = created_by_id);

CREATE POLICY "manage_own_jobs" ON public.jobs 
    FOR ALL TO authenticated 
    USING (auth.uid() = created_by_id) 
    WITH CHECK (auth.uid() = created_by_id);

CREATE POLICY "read_own_profile" ON public.user_profiles 
    FOR SELECT TO authenticated 
    USING (auth.uid() = id);