-- Fix foreign key constraint issues when using anonymous access
-- This allows clients to be created without authentication

-- Option 1: Remove the DEFAULT auth.uid() that causes FK constraint issues
ALTER TABLE clients ALTER COLUMN created_by_id DROP DEFAULT;
ALTER TABLE clients ALTER COLUMN created_by DROP DEFAULT;

-- Option 2: Make created_by_id nullable and remove constraint temporarily
-- (You can add this back when you implement proper authentication)
-- ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_created_by_id_fkey;

-- Option 3: Create a system user for anonymous operations
-- Insert a system user that can be used for anonymous operations
DO $$
BEGIN
    -- Check if the system user already exists
    IF NOT EXISTS (
        SELECT 1 FROM auth.users 
        WHERE email = 'system@vazana.local'
    ) THEN
        -- Create system user in auth.users
        INSERT INTO auth.users (
            id,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_app_meta_data,
            raw_user_meta_data,
            is_super_admin,
            role
        ) VALUES (
            '00000000-0000-0000-0000-000000000001',
            'system@vazana.local',
            '',
            NOW(),
            NOW(),
            NOW(),
            '{"provider":"email","providers":["email"]}',
            '{"name":"System User"}',
            false,
            'authenticated'
        );
        
        RAISE NOTICE 'System user created successfully';
    ELSE
        RAISE NOTICE 'System user already exists';
    END IF;
END
$$;

-- Update existing clients with NULL created_by_id to use the system user
UPDATE clients 
SET created_by_id = '00000000-0000-0000-0000-000000000001'
WHERE created_by_id IS NULL;

-- Set the default to use the system user for anonymous operations
ALTER TABLE clients ALTER COLUMN created_by_id SET DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE clients ALTER COLUMN created_by SET DEFAULT 'system@vazana.local';

-- Do the same for other tables that might have this issue
ALTER TABLE workers ALTER COLUMN created_by_id DROP DEFAULT;
ALTER TABLE workers ALTER COLUMN created_by DROP DEFAULT;
ALTER TABLE workers ALTER COLUMN created_by_id SET DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE workers ALTER COLUMN created_by SET DEFAULT 'system@vazana.local';

ALTER TABLE vehicles ALTER COLUMN created_by_id DROP DEFAULT;
ALTER TABLE vehicles ALTER COLUMN created_by DROP DEFAULT;
ALTER TABLE vehicles ALTER COLUMN created_by_id SET DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE vehicles ALTER COLUMN created_by SET DEFAULT 'system@vazana.local';

ALTER TABLE carts ALTER COLUMN created_by_id DROP DEFAULT;
ALTER TABLE carts ALTER COLUMN created_by DROP DEFAULT;
ALTER TABLE carts ALTER COLUMN created_by_id SET DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE carts ALTER COLUMN created_by SET DEFAULT 'system@vazana.local';

ALTER TABLE work_types ALTER COLUMN created_by_id DROP DEFAULT;
ALTER TABLE work_types ALTER COLUMN created_by DROP DEFAULT;
ALTER TABLE work_types ALTER COLUMN created_by_id SET DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE work_types ALTER COLUMN created_by SET DEFAULT 'system@vazana.local';

ALTER TABLE jobs ALTER COLUMN created_by_id DROP DEFAULT;
ALTER TABLE jobs ALTER COLUMN created_by DROP DEFAULT;
ALTER TABLE jobs ALTER COLUMN created_by_id SET DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE jobs ALTER COLUMN created_by SET DEFAULT 'system@vazana.local';

-- Verify the fix
SELECT 
    'clients' as table_name, 
    created_by_id, 
    created_by, 
    company_name 
FROM clients 
WHERE created_by_id IS NULL OR created_by IS NULL
LIMIT 5;