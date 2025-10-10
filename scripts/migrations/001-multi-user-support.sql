-- Multi-user support database migration
-- This script adds user_id columns and sets up RLS policies

-- 1. Add user_id columns to relevant tables
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE workers ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE carts ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE work_types ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- 2. Create user preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  show_finished_jobs BOOLEAN DEFAULT true,
  show_deleted_jobs BOOLEAN DEFAULT false,
  jobs_view_mode TEXT DEFAULT 'list',
  theme_preference TEXT DEFAULT 'light',
  language_preference TEXT DEFAULT 'he',
  notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create user roles table for role-based access control
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user', 'viewer')),
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create client work type rates table (for enhanced client management)
CREATE TABLE IF NOT EXISTS client_work_type_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  work_type_id UUID REFERENCES work_types(id) ON DELETE CASCADE,
  rate DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, work_type_id)
);

-- 5. Create client payment logs table
CREATE TABLE IF NOT EXISTS client_payment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  month DATE NOT NULL, -- YYYY-MM format
  invoice_sent BOOLEAN DEFAULT false,
  invoice_sent_date DATE,
  payment_received BOOLEAN DEFAULT false,
  payment_received_date DATE,
  amount DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, month)
);

-- 6. Enable Row Level Security on all relevant tables
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_work_type_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_payment_logs ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies

-- User preferences: users can only manage their own preferences
CREATE POLICY "Users can manage their own preferences" 
ON user_preferences FOR ALL 
USING (auth.uid()::uuid = user_id);

-- User roles: users can only view their own role, admins can view all
CREATE POLICY "Users can view their own role" 
ON user_roles FOR SELECT 
USING (auth.uid()::uuid = user_id);

CREATE POLICY "Admins can manage all roles" 
ON user_roles FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid()::uuid AND role = 'admin'
  )
);

-- Jobs: users can see all jobs but only modify their own
CREATE POLICY "Users can view all jobs" 
ON jobs FOR SELECT 
USING (true);

CREATE POLICY "Users can modify their own jobs" 
ON jobs FOR ALL 
USING (auth.uid()::uuid = user_id);

-- Clients: users can see all clients, only creators can modify
CREATE POLICY "Users can view all clients" 
ON clients FOR SELECT 
USING (true);

CREATE POLICY "Users can modify their own clients" 
ON clients FOR ALL 
USING ((SELECT auth.uid())::uuid = created_by_id);

-- Similar policies for other resources
CREATE POLICY "Users can view all workers" 
ON workers FOR SELECT 
USING (true);

CREATE POLICY "Users can modify their own workers" 
ON workers FOR ALL 
USING ((SELECT auth.uid())::uuid = created_by_id);

CREATE POLICY "Users can view all vehicles" 
ON vehicles FOR SELECT 
USING (true);

CREATE POLICY "Users can modify their own vehicles" 
ON vehicles FOR ALL 
USING ((SELECT auth.uid())::uuid = created_by_id);

CREATE POLICY "Users can view all carts" 
ON carts FOR SELECT 
USING (true);

CREATE POLICY "Users can modify their own carts" 
ON carts FOR ALL 
USING ((SELECT auth.uid())::uuid = created_by_id);

CREATE POLICY "Users can view all work types" 
ON work_types FOR SELECT 
USING (true);

CREATE POLICY "Users can modify their own work types" 
ON work_types FOR ALL 
USING ((SELECT auth.uid())::uuid = created_by_id);

-- Client rates: users can only manage rates for their own clients
CREATE POLICY "Users can manage rates for their clients" 
ON client_work_type_rates FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM clients 
    WHERE clients.id = client_work_type_rates.client_id 
    AND clients.created_by_id = (SELECT auth.uid())::uuid
  )
);

-- Client payment logs: users can only manage logs for their own clients
CREATE POLICY "Users can manage payment logs for their clients" 
ON client_payment_logs FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM clients 
    WHERE clients.id = client_payment_logs.client_id 
    AND clients.created_by_id = (SELECT auth.uid())::uuid
  )
);

-- 8. Create functions for automatic user_id assignment
CREATE OR REPLACE FUNCTION set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION set_created_by()
RETURNS TRIGGER AS $$
BEGIN
  NEW.created_by_id = auth.uid();
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create triggers for automatic user assignment
CREATE TRIGGER set_jobs_user_id 
  BEFORE INSERT ON jobs 
  FOR EACH ROW 
  EXECUTE FUNCTION set_user_id();

CREATE TRIGGER set_clients_created_by 
  BEFORE INSERT ON clients 
  FOR EACH ROW 
  EXECUTE FUNCTION set_created_by();

CREATE TRIGGER set_workers_created_by 
  BEFORE INSERT ON workers 
  FOR EACH ROW 
  EXECUTE FUNCTION set_created_by();

CREATE TRIGGER set_vehicles_created_by 
  BEFORE INSERT ON vehicles 
  FOR EACH ROW 
  EXECUTE FUNCTION set_created_by();

CREATE TRIGGER set_carts_created_by 
  BEFORE INSERT ON carts 
  FOR EACH ROW 
  EXECUTE FUNCTION set_created_by();

-- 10. Create initial admin user role (run this after user is created)
-- INSERT INTO user_roles (user_id, role) 
-- VALUES ((SELECT id FROM auth.users WHERE email = 'admin@company.com'), 'admin')
-- ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- 11. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_created_by ON clients(created_by);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_client_rates_client_id ON client_work_type_rates(client_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_client_id ON client_payment_logs(client_id);

-- 12. Update existing data to have proper user associations (run carefully!)
-- This should be done manually based on your specific data
-- UPDATE jobs SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;
-- UPDATE clients SET created_by = (SELECT id FROM auth.users LIMIT 1) WHERE created_by IS NULL;