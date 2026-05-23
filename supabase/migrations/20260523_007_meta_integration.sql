-- Meta Ads OAuth integration tokens
CREATE TABLE IF NOT EXISTS meta_integrations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  access_token text NOT NULL,
  token_expires_at timestamptz,
  ad_account_id text,
  ad_account_name text,
  fb_user_id text,
  fb_user_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE meta_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_own_meta_integration" ON meta_integrations
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Google Ads integration tokens
CREATE TABLE IF NOT EXISTS google_integrations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  access_token text NOT NULL,
  refresh_token text,
  token_expires_at timestamptz,
  customer_id text,
  customer_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE google_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_own_google_integration" ON google_integrations
  FOR ALL TO authenticated USING (auth.uid() = user_id);
