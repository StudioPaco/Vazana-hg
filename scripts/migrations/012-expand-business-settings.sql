-- Migration 012: Expand business_settings to store all business data currently in localStorage
-- This consolidates: bankAccountInfo, vazana-business-*, vazana-payment-terms

-- ============================================================================
-- STEP 1: Add missing columns to business_settings
-- ============================================================================

ALTER TABLE business_settings
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS bank_account_name TEXT,
ADD COLUMN IF NOT EXISTS bank_account_number TEXT,  -- Will be encrypted in migration 011
ADD COLUMN IF NOT EXISTS bank_branch TEXT,          -- Will be encrypted in migration 011
ADD COLUMN IF NOT EXISTS tax_id TEXT,               -- Will be encrypted in migration 011
ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,2) DEFAULT 17.00,
ADD COLUMN IF NOT EXISTS default_payment_terms INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS invoice_prefix TEXT DEFAULT 'INV',
ADD COLUMN IF NOT EXISTS invoice_next_number INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS receipt_prefix TEXT DEFAULT 'RCP',
ADD COLUMN IF NOT EXISTS receipt_next_number INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS quote_prefix TEXT DEFAULT 'QT',
ADD COLUMN IF NOT EXISTS quote_next_number INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'ILS',
ADD COLUMN IF NOT EXISTS currency_symbol TEXT DEFAULT '₪',
ADD COLUMN IF NOT EXISTS date_format TEXT DEFAULT 'DD/MM/YYYY',
ADD COLUMN IF NOT EXISTS fiscal_year_start INTEGER DEFAULT 1,  -- Month (1-12)
ADD COLUMN IF NOT EXISTS default_job_duration INTEGER DEFAULT 60,  -- Minutes
ADD COLUMN IF NOT EXISTS working_hours_start TIME DEFAULT '08:00',
ADD COLUMN IF NOT EXISTS working_hours_end TIME DEFAULT '18:00',
ADD COLUMN IF NOT EXISTS working_days INTEGER[] DEFAULT ARRAY[0,1,2,3,4],  -- Sunday-Thursday (Israeli week)
ADD COLUMN IF NOT EXISTS whatsapp_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS auto_backup BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS settings_json JSONB DEFAULT '{}'::JSONB;  -- Catch-all for additional settings

-- ============================================================================
-- STEP 2: Create API for business settings CRUD
-- ============================================================================

-- Function to get all business settings (for API route)
CREATE OR REPLACE FUNCTION get_business_settings()
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', id,
    'business_name', business_name,
    'logo_url', logo_url,
    'address', address,
    'phone', phone,
    'email', email,
    'bank_name', bank_name,
    'bank_account_name', bank_account_name,
    'tax_rate', tax_rate,
    'default_payment_terms', default_payment_terms,
    'invoice_prefix', invoice_prefix,
    'invoice_next_number', invoice_next_number,
    'receipt_prefix', receipt_prefix,
    'receipt_next_number', receipt_next_number,
    'quote_prefix', quote_prefix,
    'quote_next_number', quote_next_number,
    'currency', currency,
    'currency_symbol', currency_symbol,
    'date_format', date_format,
    'fiscal_year_start', fiscal_year_start,
    'default_job_duration', default_job_duration,
    'working_hours_start', working_hours_start,
    'working_hours_end', working_hours_end,
    'working_days', working_days,
    'whatsapp_enabled', whatsapp_enabled,
    'email_notifications', email_notifications,
    'auto_backup', auto_backup,
    'settings_json', settings_json,
    'created_at', created_at,
    'updated_at', updated_at
  ) INTO result
  FROM business_settings
  LIMIT 1;
  
  RETURN COALESCE(result, '{}'::JSONB);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update business settings
CREATE OR REPLACE FUNCTION update_business_settings(settings JSONB)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  UPDATE business_settings SET
    business_name = COALESCE(settings->>'business_name', business_name),
    logo_url = COALESCE(settings->>'logo_url', logo_url),
    address = COALESCE(settings->>'address', address),
    phone = COALESCE(settings->>'phone', phone),
    email = COALESCE(settings->>'email', email),
    bank_name = COALESCE(settings->>'bank_name', bank_name),
    bank_account_name = COALESCE(settings->>'bank_account_name', bank_account_name),
    tax_rate = COALESCE((settings->>'tax_rate')::DECIMAL, tax_rate),
    default_payment_terms = COALESCE((settings->>'default_payment_terms')::INTEGER, default_payment_terms),
    invoice_prefix = COALESCE(settings->>'invoice_prefix', invoice_prefix),
    receipt_prefix = COALESCE(settings->>'receipt_prefix', receipt_prefix),
    quote_prefix = COALESCE(settings->>'quote_prefix', quote_prefix),
    currency = COALESCE(settings->>'currency', currency),
    currency_symbol = COALESCE(settings->>'currency_symbol', currency_symbol),
    date_format = COALESCE(settings->>'date_format', date_format),
    fiscal_year_start = COALESCE((settings->>'fiscal_year_start')::INTEGER, fiscal_year_start),
    default_job_duration = COALESCE((settings->>'default_job_duration')::INTEGER, default_job_duration),
    working_hours_start = COALESCE((settings->>'working_hours_start')::TIME, working_hours_start),
    working_hours_end = COALESCE((settings->>'working_hours_end')::TIME, working_hours_end),
    whatsapp_enabled = COALESCE((settings->>'whatsapp_enabled')::BOOLEAN, whatsapp_enabled),
    email_notifications = COALESCE((settings->>'email_notifications')::BOOLEAN, email_notifications),
    auto_backup = COALESCE((settings->>'auto_backup')::BOOLEAN, auto_backup),
    settings_json = COALESCE(settings->'settings_json', settings_json),
    updated_at = NOW()
  WHERE id = (SELECT id FROM business_settings LIMIT 1)
  RETURNING jsonb_build_object('success', true, 'updated_at', updated_at) INTO result;
  
  RETURN COALESCE(result, jsonb_build_object('success', false, 'error', 'No settings found'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_business_settings() TO authenticated;
GRANT EXECUTE ON FUNCTION update_business_settings(JSONB) TO authenticated;

-- Record this migration
INSERT INTO schema_migrations (version, name, applied_by, notes)
VALUES ('012', 'expand-business-settings', 'v0', 'Added columns for all business settings, replacing localStorage')
ON CONFLICT (version) DO UPDATE SET applied_at = NOW();
