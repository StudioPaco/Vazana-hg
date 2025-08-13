-- Create username-based authentication system
-- Drop existing users table and update user_profiles for username auth
DROP TABLE IF EXISTS users;

-- Update user_profiles table to support username-based authentication
ALTER TABLE user_profiles 
DROP COLUMN IF EXISTS email,
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS password_hash TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- Create index for faster username lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);

-- Insert root user with default password (10203040)
-- Password hash for '10203040' using simple hash (in production, use bcrypt)
INSERT INTO user_profiles (
  id,
  username,
  password_hash,
  full_name,
  role,
  is_active,
  permissions,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'root',
  '10203040', -- Simple password storage for now
  'Root Administrator',
  'admin',
  true,
  '{"admin": true, "manage_users": true, "manage_settings": true}',
  NOW(),
  NOW()
) ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  updated_at = NOW();

-- Create sessions table for custom authentication
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for session lookups
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);

-- Enable RLS on user_profiles and user_sessions
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (true); -- Allow all for now, will be controlled by middleware

CREATE POLICY "Admins can manage all profiles" ON user_profiles
  FOR ALL USING (true); -- Allow all for now, will be controlled by middleware

CREATE POLICY "Users can manage their own sessions" ON user_sessions
  FOR ALL USING (true); -- Allow all for now, will be controlled by middleware
