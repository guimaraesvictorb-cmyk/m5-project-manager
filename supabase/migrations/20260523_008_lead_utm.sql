-- Add UTM tracking fields to leads
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS utm_source text,
  ADD COLUMN IF NOT EXISTS utm_medium text,
  ADD COLUMN IF NOT EXISTS utm_campaign text,
  ADD COLUMN IF NOT EXISTS utm_content text,
  ADD COLUMN IF NOT EXISTS utm_term text,
  ADD COLUMN IF NOT EXISTS landing_page text;

-- UTM capture log (tracks all form submissions with UTM data)
CREATE TABLE IF NOT EXISTS utm_captures (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  name text,
  email text,
  phone text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  landing_page text,
  ip_hash text,
  user_agent text,
  captured_at timestamptz DEFAULT now()
);

ALTER TABLE utm_captures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_read_utm_captures" ON utm_captures
  FOR ALL TO authenticated USING (auth.uid() IS NOT NULL);

-- Anon insert for public capture forms
CREATE POLICY "anon_insert_utm_captures" ON utm_captures
  FOR INSERT TO anon WITH CHECK (true);

-- Public function to receive lead from external form
CREATE OR REPLACE FUNCTION capture_lead_utm(
  p_name text,
  p_email text,
  p_phone text,
  p_utm_source text DEFAULT NULL,
  p_utm_medium text DEFAULT NULL,
  p_utm_campaign text DEFAULT NULL,
  p_utm_content text DEFAULT NULL,
  p_utm_term text DEFAULT NULL,
  p_landing_page text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_capture_id uuid;
BEGIN
  INSERT INTO utm_captures (name, email, phone, utm_source, utm_medium, utm_campaign, utm_content, utm_term, landing_page)
  VALUES (p_name, p_email, p_phone, p_utm_source, p_utm_medium, p_utm_campaign, p_utm_content, p_utm_term, p_landing_page)
  RETURNING id INTO v_capture_id;

  RETURN json_build_object('success', true, 'id', v_capture_id);
END;
$$;

GRANT EXECUTE ON FUNCTION capture_lead_utm(text, text, text, text, text, text, text, text, text) TO anon;
