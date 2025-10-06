-- Enable RLS on business_settings table
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for business_settings
CREATE POLICY "Allow authenticated users to read all business settings"
ON public.business_settings
FOR SELECT
TO authenticated
USING (true);

-- Allow owners to manage their own business settings
CREATE POLICY "Allow users to manage their own business settings"
ON public.business_settings
FOR ALL
TO authenticated
USING (auth.uid() = created_by_id)
WITH CHECK (auth.uid() = created_by_id);

-- Add policies for clients table
CREATE POLICY "Allow authenticated users to read their own clients"
ON public.clients
FOR SELECT
TO authenticated
USING (created_by_id = auth.uid() OR is_sample = true);

CREATE POLICY "Allow authenticated users to insert their own clients"
ON public.clients
FOR INSERT
TO authenticated
WITH CHECK (created_by_id = auth.uid());

CREATE POLICY "Allow authenticated users to update their own clients"
ON public.clients
FOR UPDATE
TO authenticated
USING (created_by_id = auth.uid())
WITH CHECK (created_by_id = auth.uid());

CREATE POLICY "Allow authenticated users to delete their own clients"
ON public.clients
FOR DELETE
TO authenticated
USING (created_by_id = auth.uid());

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_business_settings_created_by ON public.business_settings(created_by_id);
CREATE INDEX IF NOT EXISTS idx_clients_created_by ON public.clients(created_by_id);