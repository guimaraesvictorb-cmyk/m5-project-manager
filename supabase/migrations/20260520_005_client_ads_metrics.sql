-- Phase 2: ads metrics per client (manual entry, later replaced by API)
CREATE TABLE IF NOT EXISTS client_ads_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('meta', 'google')),
  period text NOT NULL, -- YYYY-MM
  investimento numeric(12,2),
  impressoes bigint,
  alcance bigint,
  cliques bigint,
  ctr numeric(8,4),
  resultados bigint,
  custo_por_resultado numeric(12,2),
  cpc numeric(12,2),
  conversoes numeric(12,2),
  custo_por_conversao numeric(12,2),
  roas numeric(8,4),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, platform, period)
);
ALTER TABLE client_ads_metrics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "members manage ads metrics" ON client_ads_metrics;
CREATE POLICY "members manage ads metrics" ON client_ads_metrics FOR ALL USING (auth.uid() IS NOT NULL);

ALTER TABLE client_ads_metrics ADD COLUMN IF NOT EXISTS synced_from_api boolean NOT NULL DEFAULT false;
