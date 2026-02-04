-- Adicionar coluna expirado à tabela tenant_credit_transactions
ALTER TABLE tenant_credit_transactions
ADD COLUMN IF NOT EXISTS expirado BOOLEAN DEFAULT false;

-- Adicionar coluna creditos_plano_mes_atual à tabela tenant_whatsapp_credits
ALTER TABLE tenant_whatsapp_credits
ADD COLUMN IF NOT EXISTS creditos_plano_mes_atual INTEGER DEFAULT 0;