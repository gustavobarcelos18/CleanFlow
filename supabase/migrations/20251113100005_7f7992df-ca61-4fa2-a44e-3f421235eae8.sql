-- Add configuration fields to pacotes table
ALTER TABLE pacotes 
ADD COLUMN IF NOT EXISTS limiar_renovacao integer DEFAULT 2,
ADD COLUMN IF NOT EXISTS oferta_renovacao_ativa boolean DEFAULT true;

-- Add usage tracking to pacientes_pacotes
ALTER TABLE pacientes_pacotes
ADD COLUMN IF NOT EXISTS sessoes_utilizadas integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS ultimo_uso_em timestamp with time zone,
ADD COLUMN IF NOT EXISTS oferta_renovacao_enviada boolean DEFAULT false;

-- Create table for package usage history
CREATE TABLE IF NOT EXISTS historico_uso_pacotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  paciente_pacote_id uuid NOT NULL REFERENCES pacientes_pacotes(id) ON DELETE CASCADE,
  agendamento_id uuid REFERENCES agenda(id) ON DELETE SET NULL,
  sessoes_antes integer NOT NULL,
  sessoes_depois integer NOT NULL,
  data_uso timestamp with time zone NOT NULL DEFAULT now(),
  observacoes text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE historico_uso_pacotes ENABLE ROW LEVEL SECURITY;

-- RLS policies for historico_uso_pacotes
CREATE POLICY "Users can view their tenant's package usage history"
  ON historico_uso_pacotes FOR SELECT
  USING (tenant_id IN (
    SELECT tenant_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert package usage history"
  ON historico_uso_pacotes FOR INSERT
  WITH CHECK (tenant_id IN (
    SELECT tenant_id FROM profiles WHERE id = auth.uid()
  ));

-- Function to use package session
CREATE OR REPLACE FUNCTION usar_sessao_pacote(
  p_paciente_pacote_id uuid,
  p_agendamento_id uuid
) RETURNS jsonb AS $$
DECLARE
  v_pacote_info record;
  v_sessoes_restantes integer;
  v_deve_oferecer_renovacao boolean := false;
  v_tenant_id uuid;
BEGIN
  -- Get package info
  SELECT 
    pp.id,
    pp.tenant_id,
    pp.sessoes_totais,
    pp.sessoes_utilizadas,
    pp.renovacao_automatica,
    p.limiar_renovacao,
    p.oferta_renovacao_ativa,
    p.nome as pacote_nome
  INTO v_pacote_info
  FROM pacientes_pacotes pp
  JOIN pacotes p ON pp.pacote_id = p.id
  WHERE pp.id = p_paciente_pacote_id AND pp.ativo = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Pacote não encontrado ou inativo'
    );
  END IF;

  v_tenant_id := v_pacote_info.tenant_id;
  v_sessoes_restantes := v_pacote_info.sessoes_totais - v_pacote_info.sessoes_utilizadas - 1;

  -- Check if sessions available
  IF v_sessoes_restantes < 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Não há sessões disponíveis neste pacote'
    );
  END IF;

  -- Update package usage
  UPDATE pacientes_pacotes
  SET 
    sessoes_utilizadas = sessoes_utilizadas + 1,
    ultimo_uso_em = now(),
    updated_at = now()
  WHERE id = p_paciente_pacote_id;

  -- Record usage history
  INSERT INTO historico_uso_pacotes (
    tenant_id,
    paciente_pacote_id,
    agendamento_id,
    sessoes_antes,
    sessoes_depois
  ) VALUES (
    v_tenant_id,
    p_paciente_pacote_id,
    p_agendamento_id,
    v_pacote_info.sessoes_utilizadas,
    v_pacote_info.sessoes_utilizadas + 1
  );

  -- Check if should offer renewal
  IF v_pacote_info.oferta_renovacao_ativa AND 
     v_sessoes_restantes <= v_pacote_info.limiar_renovacao AND
     v_sessoes_restantes > 0 THEN
    v_deve_oferecer_renovacao := true;
    
    -- Mark offer as sent
    UPDATE pacientes_pacotes
    SET oferta_renovacao_enviada = true
    WHERE id = p_paciente_pacote_id AND oferta_renovacao_enviada = false;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'sessao_atual', v_pacote_info.sessoes_utilizadas + 1,
    'sessoes_totais', v_pacote_info.sessoes_totais,
    'sessoes_restantes', v_sessoes_restantes,
    'pacote_nome', v_pacote_info.pacote_nome,
    'deve_oferecer_renovacao', v_deve_oferecer_renovacao,
    'renovacao_automatica', v_pacote_info.renovacao_automatica
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;