-- Create default user for job creation if not exists
-- Run this in Supabase SQL Editor

-- First, check if the user already exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000001'
    ) THEN
        -- Insert the default user into auth.users
        INSERT INTO auth.users (
            id,
            instance_id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            last_sign_in_at,
            raw_app_meta_data,
            raw_user_meta_data,
            is_super_admin,
            created_at,
            updated_at,
            phone,
            phone_confirmed_at,
            email_change_token_new,
            email_change,
            email_change_sent_at,
            phone_change_token,
            phone_change,
            phone_change_sent_at,
            confirmation_token,
            recovery_token,
            email_change_token_current,
            email_change_confirm_status,
            banned_until,
            reauthentication_token,
            reauthentication_sent_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000001'::uuid,
            '00000000-0000-0000-0000-000000000000'::uuid,
            'authenticated',
            'authenticated', 
            'admin@example.com',
            '$2a$10$dummyhashedpassword', -- This won't work for login, just placeholder
            NOW(),
            NOW(),
            '{"provider": "email", "providers": ["email"]}',
            '{"full_name": "System Admin", "avatar_url": null}',
            false,
            NOW(),
            NOW(),
            null,
            null,
            '',
            '',
            null,
            '',
            '',
            null,
            '',
            '',
            '',
            0,
            null,
            '',
            null
        );
    END IF;
    
    -- Also insert into public.profiles if your app uses it
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles WHERE id = '00000000-0000-0000-0000-000000000001'
    ) THEN
        INSERT INTO public.profiles (
            id,
            email,
            full_name,
            created_at,
            updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000001'::uuid,
            'admin@example.com', 
            'System Admin',
            NOW(),
            NOW()
        );
    END IF;
END $$;