-- Add missing phone column to user_profiles table
-- This fixes the issue where phone numbers weren't being saved properly

-- Add phone column to user_profiles if it doesn't exist
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- Update any rows that might have 'root' as phone to NULL
UPDATE user_profiles SET phone = NULL WHERE phone = 'root';

-- Add index for phone column for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone ON user_profiles(phone);

-- Verify the change
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name = 'phone';