-- Share tokens for public client dashboards
CREATE TABLE IF NOT EXISTS client_share_tokens (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'base64url'),
  label text,
  expires_at timestamptz,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE client_share_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_manage_share_tokens" ON client_share_tokens
  FOR ALL TO authenticated USING (auth.uid() IS NOT NULL);

-- Public function to fetch client data by share token
CREATE OR REPLACE FUNCTION get_client_by_share_token(p_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_id uuid;
  v_expires_at timestamptz;
  v_result json;
BEGIN
  SELECT token_row.client_id, token_row.expires_at
  INTO v_client_id, v_expires_at
  FROM client_share_tokens token_row
  WHERE token_row.token = p_token;

  IF v_client_id IS NULL THEN
    RETURN json_build_object('error', 'Token inválido');
  END IF;

  IF v_expires_at IS NOT NULL AND v_expires_at < now() THEN
    RETURN json_build_object('error', 'Link expirado');
  END IF;

  SELECT json_build_object(
    'client', row_to_json(c),
    'metrics', (
      SELECT json_agg(m ORDER BY m.period DESC)
      FROM client_ads_metrics m
      WHERE m.client_id = v_client_id
    )
  )
  INTO v_result
  FROM clients c
  WHERE c.id = v_client_id;

  RETURN v_result;
END;
$$;

-- Allow anon to call this function
GRANT EXECUTE ON FUNCTION get_client_by_share_token(text) TO anon;
