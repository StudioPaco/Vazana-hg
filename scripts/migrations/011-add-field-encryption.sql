-- Migration 011: Add field-level encryption for sensitive business data
-- Uses pgcrypto extension (already installed)
-- Encryption key should be stored in environment variable: DB_ENCRYPTION_KEY

-- This migration adds encrypted columns alongside existing plaintext columns
-- After verification, a follow-up migration will drop the plaintext columns

-- ============================================================================
-- STEP 1: Add encrypted columns to business_settings
-- ============================================================================

-- Bank account info (highly sensitive)
ALTER TABLE business_settings 
ADD COLUMN IF NOT EXISTS bank_account_number_encrypted BYTEA,
ADD COLUMN IF NOT EXISTS bank_branch_encrypted BYTEA,
ADD COLUMN IF NOT EXISTS tax_id_encrypted BYTEA;

-- ============================================================================
-- STEP 2: Add encrypted columns to clients (contact info)
-- ============================================================================

ALTER TABLE clients
ADD COLUMN IF NOT EXISTS phone_encrypted BYTEA,
ADD COLUMN IF NOT EXISTS email_encrypted BYTEA,
ADD COLUMN IF NOT EXISTS address_encrypted BYTEA;

-- ============================================================================
-- STEP 3: Create encryption/decryption helper functions
-- ============================================================================

-- Encrypt a value using AES-256 symmetric encryption
CREATE OR REPLACE FUNCTION encrypt_sensitive(plaintext TEXT, encryption_key TEXT)
RETURNS BYTEA AS $$
BEGIN
  IF plaintext IS NULL OR plaintext = '' THEN
    RETURN NULL;
  END IF;
  RETURN pgp_sym_encrypt(plaintext, encryption_key, 'cipher-algo=aes256');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Decrypt a value
CREATE OR REPLACE FUNCTION decrypt_sensitive(ciphertext BYTEA, encryption_key TEXT)
RETURNS TEXT AS $$
BEGIN
  IF ciphertext IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN pgp_sym_decrypt(ciphertext, encryption_key);
EXCEPTION
  WHEN OTHERS THEN
    -- Return NULL if decryption fails (wrong key, corrupted data)
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 4: Create views that auto-decrypt for authorized users
-- ============================================================================

-- Secure view for business_settings (decrypts on read)
CREATE OR REPLACE VIEW business_settings_secure AS
SELECT 
  id,
  business_name,
  -- Decrypt sensitive fields using the session variable
  decrypt_sensitive(bank_account_number_encrypted, current_setting('app.encryption_key', true)) as bank_account_number_decrypted,
  decrypt_sensitive(bank_branch_encrypted, current_setting('app.encryption_key', true)) as bank_branch_decrypted,
  decrypt_sensitive(tax_id_encrypted, current_setting('app.encryption_key', true)) as tax_id_decrypted,
  -- Keep non-sensitive fields as-is
  logo_url,
  address,
  phone,
  email,
  created_at,
  updated_at
FROM business_settings;

-- Secure view for clients
CREATE OR REPLACE VIEW clients_secure AS
SELECT 
  id,
  name,
  contact_person,
  -- Decrypt sensitive fields
  decrypt_sensitive(phone_encrypted, current_setting('app.encryption_key', true)) as phone_decrypted,
  decrypt_sensitive(email_encrypted, current_setting('app.encryption_key', true)) as email_decrypted,
  decrypt_sensitive(address_encrypted, current_setting('app.encryption_key', true)) as address_decrypted,
  -- Keep non-sensitive fields
  notes,
  is_active,
  created_at,
  updated_at
FROM clients;

-- ============================================================================
-- STEP 5: Grant appropriate permissions
-- ============================================================================

-- Revoke direct access to encryption functions from public
REVOKE ALL ON FUNCTION encrypt_sensitive(TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION decrypt_sensitive(BYTEA, TEXT) FROM PUBLIC;

-- Only authenticated users can use the secure views
GRANT SELECT ON business_settings_secure TO authenticated;
GRANT SELECT ON clients_secure TO authenticated;

-- ============================================================================
-- STEP 6: Add audit logging for encryption operations
-- ============================================================================

CREATE OR REPLACE FUNCTION log_encryption_access()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (table_name, record_id, action, changed_by, changes)
  VALUES (
    TG_TABLE_NAME,
    NEW.id::TEXT,
    'DECRYPT_ACCESS',
    current_setting('app.current_user', true),
    jsonb_build_object('accessed_at', NOW(), 'ip', inet_client_addr())
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- NOTES FOR APPLICATION CODE:
-- ============================================================================
-- 
-- Before querying encrypted data, set the encryption key in the session:
--   await supabase.rpc('set_config', { setting: 'app.encryption_key', value: process.env.DB_ENCRYPTION_KEY })
--
-- Or use the helper function in your API routes:
--   SELECT set_config('app.encryption_key', $1, true);
--
-- Then query the secure views:
--   SELECT * FROM business_settings_secure;
--   SELECT * FROM clients_secure;
--
-- To encrypt new data on insert:
--   INSERT INTO business_settings (bank_account_number_encrypted, ...)
--   VALUES (encrypt_sensitive($1, current_setting('app.encryption_key')), ...);
-- ============================================================================

-- Record this migration
INSERT INTO schema_migrations (version, name, applied_by, notes)
VALUES ('011', 'add-field-encryption', 'v0', 'Added pgcrypto-based field encryption for sensitive business data')
ON CONFLICT (version) DO UPDATE SET applied_at = NOW();
