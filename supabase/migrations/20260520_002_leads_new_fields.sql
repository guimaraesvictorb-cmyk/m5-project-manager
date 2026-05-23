-- Phase 1: new fields on leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tipo_servico text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS valor_proposta numeric(12,2);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS link_proposta text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS data_fechamento date;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS status_contrato text;
