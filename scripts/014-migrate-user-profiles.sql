-- 014: Migrate user_profiles for Supabase Auth integration
-- Run this in Supabase SQL Editor BEFORE calling the setup-owner endpoint.

-- 1. Add email column (login route needs it)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Drop old role CHECK constraint and widen to owner/admin/staff
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
ALTER TABLE user_profiles
  ADD CONSTRAINT user_profiles_role_check
  CHECK (role IN ('owner', 'admin', 'staff'));

-- 3. Make password_hash nullable (Supabase Auth handles passwords now)
ALTER TABLE user_profiles ALTER COLUMN password_hash DROP NOT NULL;

-- 4. Delete the old custom-auth root user (id doesn't match any auth.users row).
--    The owner will be recreated via the /api/auth/setup-owner endpoint
--    with id = auth.users.id so the session lookup works.
DELETE FROM user_profiles WHERE username = 'root';

-- 5. Ensure updated_at trigger exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
