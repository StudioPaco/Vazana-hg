-- Migration 011: Add field-level encryption for sensitive business data
-- Status: APPLIED on 2026-03-13
-- Uses pgcrypto extension (already installed)

-- STEP 1: Add encrypted columns to business_settings
ALTER TABLE business_settings 
ADD COLUMN IF NOT EXISTS bank_account_number_encrypted BYTEA,
ADD COLUMN IF NOT EXISTS bank_branch_encrypted BYTEA,
ADD COLUMN IF NOT EXISTS registration_number_encrypted BYTEA;

-- STEP 2: Add encrypted columns to clients (contact info)
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS phone_encrypted BYTEA,
ADD COLUMN IF NOT EXISTS email_encrypted BYTEA,
ADD COLUMN IF NOT EXISTS address_encrypted BYTEA;

-- STEP 3: Create encryption/decryption helper functions
CREATE OR REPLACE FUNCTION encrypt_sensitive(plaintext TEXT, encryption_key TEXT)
RETURNS BYTEA AS $$
BEGIN
  IF plaintext IS NULL OR plaintext = '' THEN
    RETURN NULL;
  END IF;
  RETURN pgp_sym_encrypt(plaintext, encryption_key, 'cipher-algo=aes256');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrypt_sensitive(ciphertext BYTEA, encryption_key TEXT)
RETURNS TEXT AS $$
BEGIN
  IF ciphertext IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN pgp_sym_decrypt(ciphertext, encryption_key);
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 4: Create secure view for business_settings
CREATE OR REPLACE VIEW business_settings_secure AS
SELECT 
  id,
  company_name,
  company_email,
  address,
  phone,
  vat_percentage,
  bank_account_name,
  bank_name,
  decrypt_sensitive(bank_account_number_encrypted, current_setting('app.encryption_key', true)) as bank_account_number_decrypted,
  decrypt_sensitive(bank_branch_encrypted, current_setting('app.encryption_key', true)) as bank_branch_decrypted,
  decrypt_sensitive(registration_number_encrypted, current_setting('app.encryption_key', true)) as registration_number_decrypted,
  default_payment_terms,
  day_shift_end_time,
  night_shift_end_time,
  auto_invoice_sync,
  created_at,
  updated_at
FROM business_settings;

-- STEP 5: Create secure view for clients
CREATE OR REPLACE VIEW clients_secure AS
SELECT 
  id,
  company_name,
  contact_person,
  decrypt_sensitive(phone_encrypted, current_setting('app.encryption_key', true)) as phone_decrypted,
  decrypt_sensitive(email_encrypted, current_setting('app.encryption_key', true)) as email_decrypted,
  decrypt_sensitive(address_encrypted, current_setting('app.encryption_key', true)) as address_decrypted,
  city,
  po_box,
  payment_method,
  security_rate,
  installation_rate,
  notes,
  status,
  created_date,
  updated_date
FROM clients;

-- STEP 6: Revoke direct function access from public
REVOKE ALL ON FUNCTION encrypt_sensitive(TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION decrypt_sensitive(BYTEA, TEXT) FROM PUBLIC;

-- Record this migration
INSERT INTO schema_migrations (version, name, applied_by, notes)
VALUES ('011', 'add-field-encryption', 'v0', 'Added pgcrypto-based field encryption for sensitive business data')
ON CONFLICT (version) DO UPDATE SET applied_at = NOW();
