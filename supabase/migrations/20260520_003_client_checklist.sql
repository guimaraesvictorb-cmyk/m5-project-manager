-- Phase 1: client checklist table
CREATE TABLE IF NOT EXISTS client_checklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  category text,
  sort_order int NOT NULL DEFAULT 0,
  completed_by uuid REFERENCES auth.users(id),
  completed_at timestamptz,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE client_checklist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "members can manage client checklist" ON client_checklist;
CREATE POLICY "members can manage client checklist" ON client_checklist
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE OR REPLACE FUNCTION update_client_checklist_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_client_checklist_updated_at ON client_checklist;
CREATE TRIGGER trg_client_checklist_updated_at
  BEFORE UPDATE ON client_checklist
  FOR EACH ROW EXECUTE FUNCTION update_client_checklist_updated_at();
