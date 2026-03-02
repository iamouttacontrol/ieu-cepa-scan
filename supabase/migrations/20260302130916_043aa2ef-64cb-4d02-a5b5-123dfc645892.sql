
-- Create scans table to store readiness scan data and results
CREATE TABLE public.scans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  company_name TEXT NOT NULL DEFAULT '',
  sector TEXT NOT NULL DEFAULT 'Agriculture & Food',
  company_size TEXT NOT NULL DEFAULT '',
  region TEXT NOT NULL DEFAULT 'Jakarta',
  product_type TEXT NOT NULL DEFAULT '',
  hs_code TEXT DEFAULT '',
  target_country TEXT NOT NULL DEFAULT 'Germany',
  export_experience TEXT NOT NULL DEFAULT '',
  compliance_dpp BOOLEAN NOT NULL DEFAULT false,
  compliance_eudr BOOLEAN NOT NULL DEFAULT false,
  compliance_ce BOOLEAN NOT NULL DEFAULT false,
  compliance_esg BOOLEAN NOT NULL DEFAULT false,
  compliance_origin BOOLEAN NOT NULL DEFAULT false,
  compliance_food_safety BOOLEAN NOT NULL DEFAULT false,
  score INTEGER,
  missing_requirements JSONB DEFAULT '[]'::jsonb,
  completed_requirements JSONB DEFAULT '[]'::jsonb,
  risk_level TEXT,
  risk_description TEXT,
  action_plan JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS (but allow public inserts for now since no auth yet)
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert scans (no auth required for MVP)
CREATE POLICY "Anyone can create scans" ON public.scans FOR INSERT WITH CHECK (true);

-- Allow anyone to read their own scans by id
CREATE POLICY "Anyone can read scans" ON public.scans FOR SELECT USING (true);

-- Allow updates to scans (for storing results)
CREATE POLICY "Anyone can update scans" ON public.scans FOR UPDATE USING (true);

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_scans_updated_at
  BEFORE UPDATE ON public.scans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
