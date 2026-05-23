-- Phase 1: new fields on clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS tipo_servico text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS origem_lead text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS proxima_reuniao timestamptz;
