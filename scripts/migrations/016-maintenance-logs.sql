-- 016-maintenance-logs.sql
-- Persistent maintenance log storage for remote monitoring

CREATE TABLE IF NOT EXISTS maintenance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  level TEXT NOT NULL CHECK (level IN ('info', 'warning', 'error', 'success')),
  message TEXT NOT NULL,
  component TEXT,
  details JSONB,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast queries by timestamp and level
CREATE INDEX IF NOT EXISTS idx_maintenance_logs_timestamp ON maintenance_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_maintenance_logs_level ON maintenance_logs(level);

-- Enable RLS
ALTER TABLE maintenance_logs ENABLE ROW LEVEL SECURITY;

-- Only admin/owner can read logs
CREATE POLICY "Admin/owner can read maintenance logs"
  ON maintenance_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('owner', 'admin')
    )
  );

-- Only admin/owner can insert logs
CREATE POLICY "Admin/owner can insert maintenance logs"
  ON maintenance_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('owner', 'admin')
    )
  );

-- Only owner can delete logs
CREATE POLICY "Owner can delete maintenance logs"
  ON maintenance_logs FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'owner'
    )
  );
