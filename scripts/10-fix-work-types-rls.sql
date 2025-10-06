-- Enable RLS on work_types table if not already enabled
ALTER TABLE public.work_types ENABLE ROW LEVEL SECURITY;

-- Create policies for work_types
CREATE POLICY "Allow authenticated users to read all work types"
ON public.work_types
FOR SELECT
TO authenticated
USING (true);

-- Allow users to manage their own work types
CREATE POLICY "Allow users to insert their own work types"
ON public.work_types
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by_id);

CREATE POLICY "Allow users to update their own work types"
ON public.work_types
FOR UPDATE
TO authenticated
USING (auth.uid() = created_by_id)
WITH CHECK (auth.uid() = created_by_id);

CREATE POLICY "Allow users to delete their own work types"
ON public.work_types
FOR DELETE
TO authenticated
USING (auth.uid() = created_by_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_work_types_created_by ON public.work_types(created_by_id);