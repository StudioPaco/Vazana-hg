-- Test script to verify RLS fix worked
-- Run this in Supabase SQL Editor to test user creation

-- Step 1: Check if policies were created correctly
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_profiles' AND schemaname = 'public';

-- Step 2: Test inserting a user (this should work now)
INSERT INTO public.user_profiles (
    username,
    full_name,
    password_hash,
    role,
    is_active,
    permissions,
    created_at,
    updated_at
) VALUES (
    'test-user-' || extract(epoch from now()),
    'Test User for RLS',
    'test_password_hash',
    'user',
    true,
    '{"maintenance": false}',
    NOW(),
    NOW()
);

-- Step 3: Check if the user was created
SELECT username, full_name, role, is_active, created_at 
FROM public.user_profiles 
WHERE full_name = 'Test User for RLS'
ORDER BY created_at DESC 
LIMIT 1;

-- Step 4: Clean up the test user
DELETE FROM public.user_profiles WHERE full_name = 'Test User for RLS';

-- Final result
SELECT 'User creation RLS test completed successfully!' as result;