-- HOTFIX: Fix trigger functions that reference "updated_at" instead of "updated_date"
-- This fixes the error: record "new" has no field "updated_at"
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New query)

-- Fix set_user_id() trigger (fires on jobs INSERT)
CREATE OR REPLACE FUNCTION set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  NEW.updated_date = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix set_created_by() trigger (fires on clients, workers, vehicles, carts INSERT)
CREATE OR REPLACE FUNCTION set_created_by()
RETURNS TRIGGER AS $$
BEGIN
  NEW.created_by_id = auth.uid();
  NEW.updated_date = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
