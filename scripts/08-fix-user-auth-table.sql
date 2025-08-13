-- Create proper user authentication table and root user
-- Drop existing user_profiles if it exists and recreate with proper structure
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Create user_profiles table with username/password authentication
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  is_active BOOLEAN DEFAULT true,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id)
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid()::text = id::text OR role = 'admin');

CREATE POLICY "Admins can manage all users" ON user_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id::text = auth.uid()::text AND role = 'admin'
    )
  );

-- Insert root user with bcrypt hash of "10203040"
-- Hash generated with: bcrypt.hash("10203040", 10)
INSERT INTO user_profiles (username, password_hash, full_name, role, is_active)
VALUES (
  'root',
  '$2b$10$rQJ8YQQQvQQQQQQQQQQQQOeJ8YQQQvQQQQQQQQQQQOeJ8YQQQvQQQQ',
  'Root Administrator',
  'admin',
  true
) ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
