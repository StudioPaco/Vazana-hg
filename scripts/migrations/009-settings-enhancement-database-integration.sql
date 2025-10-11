-- ===================================================================
-- SETTINGS ENHANCEMENT DATABASE INTEGRATION
-- Run this SQL in your Supabase SQL Editor to add missing columns
-- ===================================================================

-- 1. ADD MISSING COLUMNS TO user_preferences TABLE
-- -------------------------------------------------------------------
ALTER TABLE public.user_preferences ADD COLUMN IF NOT EXISTS language VARCHAR(2) DEFAULT 'he';
ALTER TABLE public.user_preferences ADD COLUMN IF NOT EXISTS font_size INTEGER DEFAULT 16;
ALTER TABLE public.user_preferences ADD COLUMN IF NOT EXISTS session_timeout INTEGER DEFAULT 24;
ALTER TABLE public.user_preferences ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE public.user_preferences ADD COLUMN IF NOT EXISTS email_alerts_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE public.user_preferences ADD COLUMN IF NOT EXISTS auto_backup_enabled BOOLEAN DEFAULT TRUE;

-- 2. ADD MISSING COLUMNS TO business_settings TABLE  
-- -------------------------------------------------------------------
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS bank_account_name TEXT;
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS bank_branch TEXT;
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS bank_account_number TEXT;
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS default_payment_terms VARCHAR(50) DEFAULT 'current+15';

-- 3. CREATE payment_terms TABLE
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payment_terms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    value VARCHAR(50) NOT NULL UNIQUE,
    label TEXT NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by_id UUID REFERENCES auth.users(id)
);

-- Enable RLS for payment_terms
ALTER TABLE public.payment_terms ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_terms
CREATE POLICY "Users can view payment terms" ON public.payment_terms FOR SELECT USING (true);
CREATE POLICY "Admins can manage payment terms" ON public.payment_terms 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'root')
        )
    );

-- 4. CREATE audit_log TABLE FOR USER ACTIVITY MONITORING
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    username TEXT,
    action TEXT NOT NULL,
    table_name TEXT,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    details TEXT
);

-- Enable RLS for audit_log
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audit_log - only admins and root can view
CREATE POLICY "Admins can view audit log" ON public.audit_log 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'root')
        )
    );

-- System can insert audit entries
CREATE POLICY "System can insert audit log" ON public.audit_log 
    FOR INSERT WITH CHECK (true);

-- 5. CREATE resource_availability TABLE
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.resource_availability (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    resource_type VARCHAR(20) NOT NULL CHECK (resource_type IN ('worker', 'vehicle', 'cart')),
    resource_id UUID NOT NULL,
    date DATE NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    reason TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by_id UUID REFERENCES auth.users(id),
    UNIQUE(resource_type, resource_id, date)
);

-- Enable RLS for resource_availability
ALTER TABLE public.resource_availability ENABLE ROW LEVEL SECURITY;

-- RLS Policies for resource_availability
CREATE POLICY "Users can view own resource availability" ON public.resource_availability FOR SELECT USING (auth.uid() = created_by_id);
CREATE POLICY "Users can insert own resource availability" ON public.resource_availability FOR INSERT WITH CHECK (auth.uid() = created_by_id);
CREATE POLICY "Users can update own resource availability" ON public.resource_availability FOR UPDATE USING (auth.uid() = created_by_id);
CREATE POLICY "Users can delete own resource availability" ON public.resource_availability FOR DELETE USING (auth.uid() = created_by_id);

-- 6. CREATE whatsapp_integration TABLE
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.whatsapp_integration (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_phone_number_id TEXT,
    access_token TEXT,
    webhook_verify_token TEXT,
    is_active BOOLEAN DEFAULT FALSE,
    last_sync TIMESTAMP WITH TIME ZONE,
    configuration JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for whatsapp_integration
ALTER TABLE public.whatsapp_integration ENABLE ROW LEVEL SECURITY;

-- RLS Policies for whatsapp_integration - only admins
CREATE POLICY "Admins can manage whatsapp integration" ON public.whatsapp_integration 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'root')
        )
    );

-- 7. INSERT DEFAULT PAYMENT TERMS
-- -------------------------------------------------------------------
INSERT INTO public.payment_terms (value, label, sort_order, is_default) VALUES
    ('immediate', 'מיידי', 1, FALSE),
    ('current+15', 'שוטף +15', 2, TRUE),
    ('current+30', 'שוטף +30', 3, FALSE),
    ('current+60', 'שוטף +60', 4, FALSE),
    ('current+90', 'שוטף +90', 5, FALSE)
ON CONFLICT (value) DO NOTHING;

-- 8. CREATE INDEXES FOR PERFORMANCE
-- -------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON public.audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_resource_availability_resource ON public.resource_availability(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_availability_date ON public.resource_availability(date);

-- 9. UPDATE user_preferences UPSERT FUNCTION
-- -------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.upsert_user_preference(
    p_user_id UUID,
    p_show_deleted_jobs BOOLEAN DEFAULT NULL,
    p_show_finished_jobs BOOLEAN DEFAULT NULL,
    p_add_to_calendar_default BOOLEAN DEFAULT NULL,
    p_jobs_view_mode VARCHAR DEFAULT NULL,
    p_default_status_filter VARCHAR DEFAULT NULL,
    p_default_client_filter VARCHAR DEFAULT NULL,
    p_language VARCHAR DEFAULT NULL,
    p_font_size INTEGER DEFAULT NULL,
    p_session_timeout INTEGER DEFAULT NULL,
    p_notifications_enabled BOOLEAN DEFAULT NULL,
    p_email_alerts_enabled BOOLEAN DEFAULT NULL,
    p_auto_backup_enabled BOOLEAN DEFAULT NULL
)
RETURNS public.user_preferences AS $$
BEGIN
    INSERT INTO public.user_preferences (
        user_id, show_deleted_jobs, show_finished_jobs, add_to_calendar_default,
        jobs_view_mode, default_status_filter, default_client_filter,
        language, font_size, session_timeout, notifications_enabled, 
        email_alerts_enabled, auto_backup_enabled, updated_at
    ) VALUES (
        p_user_id,
        COALESCE(p_show_deleted_jobs, FALSE),
        COALESCE(p_show_finished_jobs, FALSE),
        COALESCE(p_add_to_calendar_default, FALSE),
        COALESCE(p_jobs_view_mode, 'list'),
        COALESCE(p_default_status_filter, 'all'),
        COALESCE(p_default_client_filter, 'all'),
        COALESCE(p_language, 'he'),
        COALESCE(p_font_size, 16),
        COALESCE(p_session_timeout, 24),
        COALESCE(p_notifications_enabled, TRUE),
        COALESCE(p_email_alerts_enabled, FALSE),
        COALESCE(p_auto_backup_enabled, TRUE),
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        show_deleted_jobs = COALESCE(p_show_deleted_jobs, user_preferences.show_deleted_jobs),
        show_finished_jobs = COALESCE(p_show_finished_jobs, user_preferences.show_finished_jobs),
        add_to_calendar_default = COALESCE(p_add_to_calendar_default, user_preferences.add_to_calendar_default),
        jobs_view_mode = COALESCE(p_jobs_view_mode, user_preferences.jobs_view_mode),
        default_status_filter = COALESCE(p_default_status_filter, user_preferences.default_status_filter),
        default_client_filter = COALESCE(p_default_client_filter, user_preferences.default_client_filter),
        language = COALESCE(p_language, user_preferences.language),
        font_size = COALESCE(p_font_size, user_preferences.font_size),
        session_timeout = COALESCE(p_session_timeout, user_preferences.session_timeout),
        notifications_enabled = COALESCE(p_notifications_enabled, user_preferences.notifications_enabled),
        email_alerts_enabled = COALESCE(p_email_alerts_enabled, user_preferences.email_alerts_enabled),
        auto_backup_enabled = COALESCE(p_auto_backup_enabled, user_preferences.auto_backup_enabled),
        updated_at = NOW()
    RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. CREATE AUDIT LOG TRIGGER FUNCTION
-- -------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.audit_log_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log for important tables
    IF TG_TABLE_NAME IN ('jobs', 'clients', 'workers', 'vehicles', 'carts', 'business_settings', 'user_profiles') THEN
        INSERT INTO public.audit_log (
            user_id, username, action, table_name, record_id,
            old_values, new_values, timestamp
        ) VALUES (
            auth.uid(),
            (SELECT COALESCE(full_name, username) FROM public.user_profiles WHERE id = auth.uid()),
            TG_OP,
            TG_TABLE_NAME,
            COALESCE(NEW.id, OLD.id),
            CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
            CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
            NOW()
        );
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. CREATE TRIGGERS FOR AUDIT LOG
-- -------------------------------------------------------------------
DROP TRIGGER IF EXISTS audit_jobs_changes ON public.jobs;
CREATE TRIGGER audit_jobs_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.jobs
    FOR EACH ROW EXECUTE FUNCTION public.audit_log_changes();

DROP TRIGGER IF EXISTS audit_clients_changes ON public.clients;
CREATE TRIGGER audit_clients_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.clients
    FOR EACH ROW EXECUTE FUNCTION public.audit_log_changes();

DROP TRIGGER IF EXISTS audit_workers_changes ON public.workers;
CREATE TRIGGER audit_workers_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.workers
    FOR EACH ROW EXECUTE FUNCTION public.audit_log_changes();

-- ===================================================================
-- VERIFICATION QUERIES (run these to verify the changes worked)
-- ===================================================================

-- Verify user_preferences columns
-- SELECT column_name, data_type, column_default FROM information_schema.columns 
-- WHERE table_name = 'user_preferences' ORDER BY ordinal_position;

-- Verify business_settings columns  
-- SELECT column_name, data_type, column_default FROM information_schema.columns 
-- WHERE table_name = 'business_settings' ORDER BY ordinal_position;

-- Verify new tables exist
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_name IN ('payment_terms', 'audit_log', 'resource_availability', 'whatsapp_integration');