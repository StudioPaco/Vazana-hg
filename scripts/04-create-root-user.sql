-- Create root user with admin privileges
-- This script creates the initial admin user for the system

-- First, ensure the user_roles table exists and has the admin role
INSERT INTO user_roles (name, description, permissions) 
VALUES ('admin', 'System Administrator', ARRAY['all'])
ON CONFLICT (name) DO NOTHING;

-- Create the root user account
-- Note: In production, you should use Supabase Auth to create users
-- This is a simplified approach for initial setup

DO $$
DECLARE
    admin_role_id UUID;
    root_user_id UUID;
BEGIN
    -- Get the admin role ID
    SELECT id INTO admin_role_id FROM user_roles WHERE name = 'admin';
    
    -- Generate a UUID for the root user (this should match the Supabase Auth user ID)
    root_user_id := gen_random_uuid();
    
    -- Insert the root user profile
    INSERT INTO user_profiles (
        id,
        email,
        full_name,
        role_id,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        root_user_id,
        'amitkorach@gmail.com',
        'Amit Korach (Root Admin)',
        admin_role_id,
        true,
        NOW(),
        NOW()
    ) ON CONFLICT (email) DO UPDATE SET
        role_id = admin_role_id,
        is_active = true,
        updated_at = NOW();
        
    RAISE NOTICE 'Root user created/updated: amitkorach@gmail.com';
    RAISE NOTICE 'Please create this user in Supabase Auth with password: 10203040';
END $$;
