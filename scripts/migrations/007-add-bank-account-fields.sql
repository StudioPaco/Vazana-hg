-- Add bank account fields to business_settings table
-- Migration: 007-add-bank-account-fields.sql

-- Add bank account columns to business_settings table
ALTER TABLE business_settings 
ADD COLUMN IF NOT EXISTS bank_account_name TEXT,
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS bank_branch TEXT,
ADD COLUMN IF NOT EXISTS bank_account_number TEXT;

-- Update the updated_at timestamp for tracking
UPDATE business_settings 
SET updated_at = NOW() 
WHERE id IN (SELECT id FROM business_settings LIMIT 1);