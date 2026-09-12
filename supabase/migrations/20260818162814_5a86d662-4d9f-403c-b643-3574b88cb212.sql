CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_own" ON public.profiles FOR ALL TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  image_path TEXT,
  condition_name TEXT NOT NULL,
  condition_summary TEXT,
  stage TEXT,
  risk_level TEXT NOT NULL,
  risk_percentage INTEGER NOT NULL DEFAULT 0,
  confidence INTEGER,
  environmental_impact TEXT,
  causes JSONB NOT NULL DEFAULT '[]'::jsonb,
  care_advice JSONB NOT NULL DEFAULT '[]'::jsonb,
  urgency TEXT,
  env_uv_index NUMERIC,
  env_aqi NUMERIC,
  env_temperature NUMERIC,
  env_wind_speed NUMERIC,
  env_humidity NUMERIC,
  location_label TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  raw_result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scans TO authenticated;
GRANT ALL ON public.scans TO service_role;
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scans_own" ON public.scans FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX scans_user_created_idx ON public.scans (user_id, created_at DESC);

CREATE POLICY "scan_images_select_own" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'scan-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "scan_images_insert_own" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'scan-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "scan_images_delete_own" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'scan-images' AND auth.uid()::text = (storage.foldername(name))[1]);