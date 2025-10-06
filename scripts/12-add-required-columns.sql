-- Add necessary columns to all tables if they don't exist
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
        -- Add created_by_id if it doesn't exist
        EXECUTE format('
            DO $$ 
            BEGIN 
                IF NOT EXISTS (
                    SELECT FROM pg_attribute 
                    WHERE attrelid = ''public.%I''::regclass 
                    AND attname = ''created_by_id''
                ) THEN 
                    ALTER TABLE public.%I 
                    ADD COLUMN created_by_id UUID REFERENCES auth.users(id);
                END IF;
            END $$;
        ', table_name, table_name);

        -- Add is_sample if it doesn't exist
        EXECUTE format('
            DO $$ 
            BEGIN 
                IF NOT EXISTS (
                    SELECT FROM pg_attribute 
                    WHERE attrelid = ''public.%I''::regclass 
                    AND attname = ''is_sample''
                ) THEN 
                    ALTER TABLE public.%I 
                    ADD COLUMN is_sample BOOLEAN DEFAULT false;
                END IF;
            END $$;
        ', table_name, table_name);

        -- Add created_date if it doesn't exist
        EXECUTE format('
            DO $$ 
            BEGIN 
                IF NOT EXISTS (
                    SELECT FROM pg_attribute 
                    WHERE attrelid = ''public.%I''::regclass 
                    AND attname = ''created_date''
                ) THEN 
                    ALTER TABLE public.%I 
                    ADD COLUMN created_date TIMESTAMPTZ DEFAULT now();
                END IF;
            END $$;
        ', table_name, table_name);
    END LOOP;
END $$;