-- Migration 012: Expand business_settings to store all data currently in localStorage
-- Status: APPLIED on 2026-03-13
-- This migrates business data from client-side localStorage to encrypted server-side storage

-- STEP 1: Add missing business info columns
ALTER TABLE business_settings
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS fax TEXT,
ADD COLUMN IF NOT EXISTS mobile TEXT,
ADD COLUMN IF NOT EXISTS contact_name TEXT,
ADD COLUMN IF NOT EXISTS contact_position TEXT;

-- STEP 2: Add invoice settings columns (currently in localStorage)
ALTER TABLE business_settings
ADD COLUMN IF NOT EXISTS invoice_prefix VARCHAR(10) DEFAULT 'INV',
ADD COLUMN IF NOT EXISTS invoice_notes TEXT,
ADD COLUMN IF NOT EXISTS invoice_footer TEXT,
ADD COLUMN IF NOT EXISTS show_bank_details_on_invoice BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_logo_on_invoice BOOLEAN DEFAULT true;

-- STEP 3: Add work type rates (currently in localStorage as vazana-work-rates)
ALTER TABLE business_settings
ADD COLUMN IF NOT EXISTS work_rates JSONB DEFAULT '{}';

-- STEP 4: Create API function to get business settings
CREATE OR REPLACE FUNCTION get_business_settings()
RETURNS JSON AS $$
DECLARE
  settings_row business_settings%ROWTYPE;
  encryption_key TEXT;
BEGIN
  encryption_key := current_setting('app.encryption_key', true);
  
  SELECT * INTO settings_row FROM business_settings LIMIT 1;
  
  IF settings_row IS NULL THEN
    RETURN '{}'::JSON;
  END IF;
  
  RETURN json_build_object(
    'id', settings_row.id,
    'company_name', settings_row.company_name,
    'company_email', settings_row.company_email,
    'address', settings_row.address,
    'phone', settings_row.phone,
    'mobile', settings_row.mobile,
    'fax', settings_row.fax,
    'website', settings_row.website,
    'contact_name', settings_row.contact_name,
    'contact_position', settings_row.contact_position,
    'registration_number', CASE WHEN encryption_key IS NOT NULL AND settings_row.registration_number_encrypted IS NOT NULL 
      THEN decrypt_sensitive(settings_row.registration_number_encrypted, encryption_key) 
      ELSE settings_row.registration_number END,
    'vat_percentage', settings_row.vat_percentage,
    'bank_account_name', settings_row.bank_account_name,
    'bank_name', settings_row.bank_name,
    'bank_branch', CASE WHEN encryption_key IS NOT NULL AND settings_row.bank_branch_encrypted IS NOT NULL
      THEN decrypt_sensitive(settings_row.bank_branch_encrypted, encryption_key)
      ELSE settings_row.bank_branch END,
    'bank_account_number', CASE WHEN encryption_key IS NOT NULL AND settings_row.bank_account_number_encrypted IS NOT NULL
      THEN decrypt_sensitive(settings_row.bank_account_number_encrypted, encryption_key)
      ELSE settings_row.bank_account_number END,
    'default_payment_terms', settings_row.default_payment_terms,
    'invoice_prefix', settings_row.invoice_prefix,
    'invoice_notes', settings_row.invoice_notes,
    'invoice_footer', settings_row.invoice_footer,
    'show_bank_details_on_invoice', settings_row.show_bank_details_on_invoice,
    'show_logo_on_invoice', settings_row.show_logo_on_invoice,
    'logo_url', settings_row.logo_url,
    'work_rates', settings_row.work_rates,
    'day_shift_end_time', settings_row.day_shift_end_time,
    'night_shift_end_time', settings_row.night_shift_end_time,
    'auto_invoice_sync', settings_row.auto_invoice_sync
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 5: Create API function to update business settings
CREATE OR REPLACE FUNCTION update_business_settings(settings_data JSONB, encryption_key TEXT DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
  settings_id UUID;
BEGIN
  -- Get or create settings row
  SELECT id INTO settings_id FROM business_settings LIMIT 1;
  
  IF settings_id IS NULL THEN
    INSERT INTO business_settings (id) VALUES (gen_random_uuid()) RETURNING id INTO settings_id;
  END IF;
  
  -- Update all fields
  UPDATE business_settings SET
    company_name = COALESCE(settings_data->>'company_name', company_name),
    company_email = COALESCE(settings_data->>'company_email', company_email),
    address = COALESCE(settings_data->>'address', address),
    phone = COALESCE(settings_data->>'phone', phone),
    mobile = COALESCE(settings_data->>'mobile', mobile),
    fax = COALESCE(settings_data->>'fax', fax),
    website = COALESCE(settings_data->>'website', website),
    contact_name = COALESCE(settings_data->>'contact_name', contact_name),
    contact_position = COALESCE(settings_data->>'contact_position', contact_position),
    vat_percentage = COALESCE((settings_data->>'vat_percentage')::NUMERIC, vat_percentage),
    bank_account_name = COALESCE(settings_data->>'bank_account_name', bank_account_name),
    bank_name = COALESCE(settings_data->>'bank_name', bank_name),
    default_payment_terms = COALESCE(settings_data->>'default_payment_terms', default_payment_terms),
    invoice_prefix = COALESCE(settings_data->>'invoice_prefix', invoice_prefix),
    invoice_notes = COALESCE(settings_data->>'invoice_notes', invoice_notes),
    invoice_footer = COALESCE(settings_data->>'invoice_footer', invoice_footer),
    show_bank_details_on_invoice = COALESCE((settings_data->>'show_bank_details_on_invoice')::BOOLEAN, show_bank_details_on_invoice),
    show_logo_on_invoice = COALESCE((settings_data->>'show_logo_on_invoice')::BOOLEAN, show_logo_on_invoice),
    logo_url = COALESCE(settings_data->>'logo_url', logo_url),
    work_rates = COALESCE(settings_data->'work_rates', work_rates),
    -- Encrypt sensitive fields if key provided
    bank_account_number_encrypted = CASE WHEN encryption_key IS NOT NULL AND settings_data->>'bank_account_number' IS NOT NULL
      THEN encrypt_sensitive(settings_data->>'bank_account_number', encryption_key)
      ELSE bank_account_number_encrypted END,
    bank_branch_encrypted = CASE WHEN encryption_key IS NOT NULL AND settings_data->>'bank_branch' IS NOT NULL
      THEN encrypt_sensitive(settings_data->>'bank_branch', encryption_key)
      ELSE bank_branch_encrypted END,
    registration_number_encrypted = CASE WHEN encryption_key IS NOT NULL AND settings_data->>'registration_number' IS NOT NULL
      THEN encrypt_sensitive(settings_data->>'registration_number', encryption_key)
      ELSE registration_number_encrypted END,
    updated_at = NOW()
  WHERE id = settings_id;
  
  RETURN json_build_object('success', true, 'id', settings_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Record this migration
INSERT INTO schema_migrations (version, name, applied_by, notes)
VALUES ('012', 'expand-business-settings', 'v0', 'Added columns for all business data currently stored in localStorage')
ON CONFLICT (version) DO UPDATE SET applied_at = NOW();
