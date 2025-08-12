-- Add user roles and permissions
CREATE TYPE user_role AS ENUM ('root', 'admin', 'manager', 'employee');

-- Add user profile table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    role user_role DEFAULT 'employee',
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create root user function (run once during setup)
CREATE OR REPLACE FUNCTION create_root_user(root_email TEXT, root_password TEXT)
RETURNS UUID AS $$
DECLARE
    root_user_id UUID;
BEGIN
    -- This would typically be called during initial setup
    -- Insert root user profile
    INSERT INTO user_profiles (id, email, full_name, role, permissions, is_active)
    VALUES (
        gen_random_uuid(),
        root_email,
        'Root Administrator',
        'root',
        '{"all": true}',
        true
    )
    RETURNING id INTO root_user_id;
    
    RETURN root_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policies for user profiles
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Root and admins can view all profiles" ON user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role IN ('root', 'admin')
            AND up.is_active = true
        )
    );

CREATE POLICY "Root can manage all users" ON user_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role = 'root'
            AND up.is_active = true
        )
    );

CREATE POLICY "Admins can manage non-root users" ON user_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role = 'admin'
            AND up.is_active = true
        )
        AND role != 'root'
    );

-- Function to check user permissions
CREATE OR REPLACE FUNCTION check_user_permission(permission_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_permissions JSONB;
    user_role_val user_role;
BEGIN
    SELECT permissions, role INTO user_permissions, user_role_val
    FROM user_profiles 
    WHERE id = auth.uid() AND is_active = true;
    
    -- Root has all permissions
    IF user_role_val = 'root' THEN
        RETURN true;
    END IF;
    
    -- Check specific permission
    RETURN (user_permissions->permission_name)::boolean = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing tables to include user-based access control
ALTER TABLE clients ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE workers ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE carts ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid();
