-- Create root user in Supabase Auth
-- Run this in your Supabase SQL Editor

-- First, insert the user into auth.users (this creates the authentication record)
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
  gen_random_uuid(),
  'amitkorach@gmail.com',
  crypt('10203040', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Amit Korach", "role": "admin"}',
  false,
  'authenticated'
);

-- Then insert into your users table with admin role
INSERT INTO users (
  id,
  email,
  name,
  role,
  created_at,
  updated_at
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'amitkorach@gmail.com'),
  'amitkorach@gmail.com',
  'Amit Korach',
  'admin',
  now(),
  now()
);
