-- Create user preferences table to store user-specific settings
-- Run this in Supabase SQL Editor

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    -- Job page preferences
    show_deleted_jobs BOOLEAN DEFAULT FALSE,
    show_finished_jobs BOOLEAN DEFAULT FALSE,
    -- Form preferences
    add_to_calendar_default BOOLEAN DEFAULT FALSE,
    -- Display preferences
    jobs_view_mode VARCHAR(10) DEFAULT 'list' CHECK (jobs_view_mode IN ('list', 'grid')),
    -- Filter preferences
    default_status_filter VARCHAR(50) DEFAULT 'all',
    default_client_filter VARCHAR(50) DEFAULT 'all',
    -- Other preferences (expandable)
    preferences_json JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one preference record per user
    UNIQUE(user_id)
);

-- Add RLS policies for user preferences
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only see and modify their own preferences
CREATE POLICY "Users can view own preferences" ON public.user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON public.user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON public.user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- Create or update function for preferences
CREATE OR REPLACE FUNCTION public.upsert_user_preference(
    p_user_id UUID,
    p_show_deleted_jobs BOOLEAN DEFAULT NULL,
    p_show_finished_jobs BOOLEAN DEFAULT NULL,
    p_add_to_calendar_default BOOLEAN DEFAULT NULL,
    p_jobs_view_mode VARCHAR DEFAULT NULL,
    p_default_status_filter VARCHAR DEFAULT NULL,
    p_default_client_filter VARCHAR DEFAULT NULL
)
RETURNS public.user_preferences AS $$
BEGIN
    INSERT INTO public.user_preferences (
        user_id,
        show_deleted_jobs,
        show_finished_jobs,
        add_to_calendar_default,
        jobs_view_mode,
        default_status_filter,
        default_client_filter,
        updated_at
    ) VALUES (
        p_user_id,
        COALESCE(p_show_deleted_jobs, FALSE),
        COALESCE(p_show_finished_jobs, FALSE),
        COALESCE(p_add_to_calendar_default, FALSE),
        COALESCE(p_jobs_view_mode, 'list'),
        COALESCE(p_default_status_filter, 'all'),
        COALESCE(p_default_client_filter, 'all'),
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        show_deleted_jobs = COALESCE(p_show_deleted_jobs, user_preferences.show_deleted_jobs),
        show_finished_jobs = COALESCE(p_show_finished_jobs, user_preferences.show_finished_jobs),
        add_to_calendar_default = COALESCE(p_add_to_calendar_default, user_preferences.add_to_calendar_default),
        jobs_view_mode = COALESCE(p_jobs_view_mode, user_preferences.jobs_view_mode),
        default_status_filter = COALESCE(p_default_status_filter, user_preferences.default_status_filter),
        default_client_filter = COALESCE(p_default_client_filter, user_preferences.default_client_filter),
        updated_at = NOW()
    RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create default preferences for existing users
INSERT INTO public.user_preferences (user_id, show_finished_jobs)
SELECT id, FALSE FROM auth.users 
ON CONFLICT (user_id) DO NOTHING;