-- ETAPA 3: Remarcação Guiada com Sugeridor de Horários

-- Tabela de preferências de horário do paciente (aprendizado histórico)
CREATE TABLE IF NOT EXISTS paciente_preferencias_horario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  paciente_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  periodo_preferido TEXT CHECK (periodo_preferido IN ('manha', 'tarde', 'noite', 'qualquer')),
  dias_semana_preferidos INTEGER[] DEFAULT '{1,2,3,4,5}', -- 0=dom, 1=seg, etc
  horario_min TIME,
  horario_max TIME,
  historico_agendamentos JSONB DEFAULT '[]'::jsonb,
  taxa_comparecimento NUMERIC(5,2) DEFAULT 100.00,
  ultima_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, paciente_id)
);

-- Tabela de sugestões de remarcação geradas
CREATE TABLE IF NOT EXISTS remarcacao_sugestoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  agendamento_original_id UUID NOT NULL REFERENCES agenda(id) ON DELETE CASCADE,
  paciente_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sugestoes JSONB NOT NULL, -- array de horários sugeridos com scores
  metodo_geracao TEXT NOT NULL DEFAULT 'automatico',
  enviado_em TIMESTAMP WITH TIME ZONE,
  respondido_em TIMESTAMP WITH TIME ZONE,
  horario_escolhido TIMESTAMP WITH TIME ZONE,
  sucesso BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'enviado', 'aceito', 'recusado', 'expirado'))
);

-- Tabela de métricas de remarcação automática
CREATE TABLE IF NOT EXISTS metricas_remarcacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  remarcacoes_solicitadas INTEGER DEFAULT 0,
  remarcacoes_automaticas INTEGER DEFAULT 0,
  remarcacoes_manuais INTEGER DEFAULT 0,
  taxa_automacao NUMERIC(5,2) DEFAULT 0,
  tempo_medio_resposta_minutos INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, data)
);

-- ETAPA 4: Orquestrador de Lembretes + A/B de Templates

-- Tabela de templates de lembrete
CREATE TABLE IF NOT EXISTS lembrete_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo_servico TEXT,
  janela_horas INTEGER NOT NULL, -- ex: 72, 24, 1
  variante TEXT NOT NULL DEFAULT 'A', -- para A/B testing
  assunto TEXT,
  corpo_mensagem TEXT NOT NULL,
  formato TEXT NOT NULL DEFAULT 'whatsapp' CHECK (formato IN ('whatsapp', 'email', 'sms')),
  ativo BOOLEAN DEFAULT true,
  score NUMERIC(5,2) DEFAULT 50.00,
  total_envios INTEGER DEFAULT 0,
  total_confirmacoes INTEGER DEFAULT 0,
  taxa_confirmacao NUMERIC(5,2) DEFAULT 0,
  criado_por UUID REFERENCES auth.users(id),
  recomendacao TEXT, -- 'promover', 'pausar', 'manter'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de configuração de lembretes por tipo de serviço
CREATE TABLE IF NOT EXISTS lembrete_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  tipo_servico TEXT NOT NULL,
  nivel_risco TEXT NOT NULL DEFAULT 'baixo' CHECK (nivel_risco IN ('baixo', 'medio', 'alto')),
  janelas_padrao INTEGER[] DEFAULT '{72, 24, 1}', -- horas antes
  template_ids JSONB DEFAULT '[]'::jsonb, -- array de template_id por janela
  ab_testing_ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, tipo_servico)
);

-- Tabela de histórico de lembretes enviados (para análise A/B)
CREATE TABLE IF NOT EXISTS lembrete_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  agendamento_id UUID NOT NULL REFERENCES agenda(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES lembrete_templates(id) ON DELETE CASCADE,
  janela_horas INTEGER NOT NULL,
  variante TEXT NOT NULL,
  enviado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  confirmado BOOLEAN DEFAULT false,
  confirmado_em TIMESTAMP WITH TIME ZONE,
  tempo_resposta_minutos INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_paciente_preferencias_tenant_paciente 
  ON paciente_preferencias_horario(tenant_id, paciente_id);
CREATE INDEX IF NOT EXISTS idx_remarcacao_sugestoes_status 
  ON remarcacao_sugestoes(status, created_at);
CREATE INDEX IF NOT EXISTS idx_lembrete_templates_score 
  ON lembrete_templates(tenant_id, score DESC) WHERE ativo = true;
CREATE INDEX IF NOT EXISTS idx_lembrete_historico_template 
  ON lembrete_historico(template_id, enviado_em DESC);

-- RLS Policies
ALTER TABLE paciente_preferencias_horario ENABLE ROW LEVEL SECURITY;
ALTER TABLE remarcacao_sugestoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE metricas_remarcacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE lembrete_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE lembrete_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE lembrete_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_view_preferencias ON paciente_preferencias_horario
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY staff_manage_preferencias ON paciente_preferencias_horario
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles 
      WHERE id = auth.uid() AND role = ANY(ARRAY['admin'::user_role, 'recepcao'::user_role])
    )
  );

CREATE POLICY tenant_view_sugestoes ON remarcacao_sugestoes
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY staff_manage_sugestoes ON remarcacao_sugestoes
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles 
      WHERE id = auth.uid() AND role = ANY(ARRAY['admin'::user_role, 'recepcao'::user_role])
    )
  );

CREATE POLICY tenant_view_templates ON lembrete_templates
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY admin_manage_templates ON lembrete_templates
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'::user_role
    )
  );

CREATE POLICY tenant_view_configs ON lembrete_configs
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY admin_manage_configs ON lembrete_configs
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'::user_role
    )
  );

CREATE POLICY support_view_all_metrics ON metricas_remarcacao
  FOR SELECT USING (has_support_access(auth.uid()));

CREATE POLICY support_view_all_historico ON lembrete_historico
  FOR SELECT USING (has_support_access(auth.uid()));

-- Function para gerar sugestões de horários
CREATE OR REPLACE FUNCTION gerar_sugestoes_remarcacao(
  p_tenant_id UUID,
  p_agendamento_id UUID,
  p_limite INTEGER DEFAULT 5
)
RETURNS JSONB AS $$
DECLARE
  v_agendamento RECORD;
  v_preferencias RECORD;
  v_sugestoes JSONB := '[]'::jsonb;
  v_horario TIMESTAMP WITH TIME ZONE;
  v_score NUMERIC;
  v_dia INTEGER;
BEGIN
  -- Buscar agendamento original
  SELECT * INTO v_agendamento
  FROM agenda
  WHERE id = p_agendamento_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('erro', 'Agendamento não encontrado');
  END IF;

  -- Buscar preferências do paciente
  SELECT * INTO v_preferencias
  FROM paciente_preferencias_horario
  WHERE tenant_id = p_tenant_id AND paciente_id = v_agendamento.paciente_id;

  -- Gerar sugestões baseadas em slots disponíveis
  -- (Lógica simplificada - na prática seria mais complexa)
  FOR v_dia IN 1..14 LOOP
    v_horario := (v_agendamento.inicio + (v_dia || ' days')::interval)::date + TIME '09:00:00';
    
    -- Calcular score baseado em preferências
    v_score := 50.0;
    IF v_preferencias IS NOT NULL THEN
      IF v_preferencias.periodo_preferido = 'manha' AND EXTRACT(HOUR FROM v_horario) < 12 THEN
        v_score := v_score + 20.0;
      END IF;
    END IF;

    v_sugestoes := v_sugestoes || jsonb_build_object(
      'horario', v_horario,
      'score', v_score,
      'disponivel', true,
      'motivo_score', 'Baseado em preferências históricas'
    );

    EXIT WHEN jsonb_array_length(v_sugestoes) >= p_limite;
  END LOOP;

  RETURN v_sugestoes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function para atualizar scores de templates (A/B testing)
CREATE OR REPLACE FUNCTION atualizar_scores_templates()
RETURNS void AS $$
BEGIN
  UPDATE lembrete_templates t
  SET 
    taxa_confirmacao = CASE 
      WHEN t.total_envios > 0 
      THEN (t.total_confirmacoes::numeric / t.total_envios::numeric) * 100 
      ELSE 0 
    END,
    score = CASE
      WHEN t.total_envios >= 30 THEN
        (t.total_confirmacoes::numeric / t.total_envios::numeric) * 100
      ELSE
        50.0 -- score neutro para templates novos
    END,
    recomendacao = CASE
      WHEN t.total_envios >= 30 THEN
        CASE
          WHEN (t.total_confirmacoes::numeric / t.total_envios::numeric) >= 0.75 THEN 'promover'
          WHEN (t.total_confirmacoes::numeric / t.total_envios::numeric) <= 0.40 THEN 'pausar'
          ELSE 'manter'
        END
      ELSE 'testar'
    END,
    updated_at = now()
  WHERE ativo = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para atualizar métricas
CREATE OR REPLACE FUNCTION update_remarcacao_metrics()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'aceito' AND OLD.status != 'aceito' THEN
    INSERT INTO metricas_remarcacao (tenant_id, data, remarcacoes_automaticas)
    VALUES (NEW.tenant_id, CURRENT_DATE, 1)
    ON CONFLICT (tenant_id, data)
    DO UPDATE SET 
      remarcacoes_automaticas = metricas_remarcacao.remarcacoes_automaticas + 1,
      taxa_automacao = (metricas_remarcacao.remarcacoes_automaticas + 1)::numeric / 
                      (metricas_remarcacao.remarcacoes_solicitadas + 1)::numeric * 100,
      updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER remarcacao_metrics_trigger
  AFTER UPDATE ON remarcacao_sugestoes
  FOR EACH ROW
  EXECUTE FUNCTION update_remarcacao_metrics();