-- Fix RLS on scans: scope to authenticated users by user_id
DROP POLICY IF EXISTS "Anyone can create scans" ON public.scans;
DROP POLICY IF EXISTS "Anyone can read scans" ON public.scans;
DROP POLICY IF EXISTS "Anyone can update scans" ON public.scans;

-- Users can only insert scans with their own user_id
CREATE POLICY "Users can insert own scans"
  ON public.scans FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can only read their own scans
CREATE POLICY "Users can read own scans"
  ON public.scans FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can only update their own scans
CREATE POLICY "Users can update own scans"
  ON public.scans FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Make user_id NOT NULL for future rows (set default to auth.uid())
ALTER TABLE public.scans ALTER COLUMN user_id SET DEFAULT auth.uid();