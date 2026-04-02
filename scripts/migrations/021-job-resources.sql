-- Additional resources per job (beyond primary worker/vehicle/cart)
-- Applied to production DB on 2026-04-03.
CREATE TABLE IF NOT EXISTS job_resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('worker', 'vehicle', 'cart')),
  resource_id UUID NOT NULL,
  resource_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_resources_job_id ON job_resources(job_id);
CREATE INDEX IF NOT EXISTS idx_job_resources_resource ON job_resources(resource_type, resource_id);

ALTER TABLE job_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read job_resources" ON job_resources FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated write job_resources" ON job_resources FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update job_resources" ON job_resources FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated delete job_resources" ON job_resources FOR DELETE TO authenticated USING (true);
