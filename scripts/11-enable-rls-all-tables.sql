-- Enable RLS on all tables
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Create base policies for all tables
DO $$ 
DECLARE
    table_name text;
BEGIN
    FOR table_name IN SELECT tablename 
                      FROM pg_tables 
                      WHERE schemaname = 'public' 
                      AND tablename IN (
                          'business_settings',
                          'clients',
                          'work_types',
                          'vehicles',
                          'carts',
                          'workers',
                          'jobs',
                          'invoices'
                      )
    LOOP
        -- Allow authenticated users to read records they created or sample data
        EXECUTE format('
            CREATE POLICY "Read own or sample data" ON public.%I
            FOR SELECT TO authenticated
            USING (auth.uid() = created_by_id OR is_sample = true);
        ', table_name);

        -- Allow authenticated users to insert their own records
        EXECUTE format('
            CREATE POLICY "Insert own records" ON public.%I
            FOR INSERT TO authenticated
            WITH CHECK (auth.uid() = created_by_id);
        ', table_name);

        -- Allow authenticated users to update their own records
        EXECUTE format('
            CREATE POLICY "Update own records" ON public.%I
            FOR UPDATE TO authenticated
            USING (auth.uid() = created_by_id)
            WITH CHECK (auth.uid() = created_by_id);
        ', table_name);

        -- Allow authenticated users to delete their own records
        EXECUTE format('
            CREATE POLICY "Delete own records" ON public.%I
            FOR DELETE TO authenticated
            USING (auth.uid() = created_by_id);
        ', table_name);
    END LOOP;
END $$;

-- Create indices for better performance
CREATE INDEX IF NOT EXISTS idx_business_settings_created_by ON public.business_settings(created_by_id);
CREATE INDEX IF NOT EXISTS idx_clients_created_by ON public.clients(created_by_id);
CREATE INDEX IF NOT EXISTS idx_work_types_created_by ON public.work_types(created_by_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_created_by ON public.vehicles(created_by_id);
CREATE INDEX IF NOT EXISTS idx_carts_created_by ON public.carts(created_by_id);
CREATE INDEX IF NOT EXISTS idx_workers_created_by ON public.workers(created_by_id);
CREATE INDEX IF NOT EXISTS idx_jobs_created_by ON public.jobs(created_by_id);
CREATE INDEX IF NOT EXISTS idx_invoices_created_by ON public.invoices(created_by_id);