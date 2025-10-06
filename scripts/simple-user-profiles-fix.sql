-- Simple fix for user_profiles RLS to allow user creation
-- Run this in Supabase SQL Editor

-- Temporarily disable RLS on user_profiles to allow user creation
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DO $$
DECLARE
    pol_name text;
BEGIN
    FOR pol_name IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'user_profiles' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY %I ON public.user_profiles', pol_name);
    END LOOP;
END $$;

-- Create a simple permissive policy for user_profiles
CREATE POLICY "allow_all_user_profiles" ON public.user_profiles
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Make sure the table structure is correct
ALTER TABLE public.user_profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.user_profiles ALTER COLUMN created_by DROP NOT NULL;