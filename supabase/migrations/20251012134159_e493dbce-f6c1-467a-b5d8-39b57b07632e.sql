-- ETAPA 3: Tickets de Suporte completo com SLAs e Macros

-- 1. Adicionar novos campos à tabela support_tickets
ALTER TABLE public.support_tickets
ADD COLUMN IF NOT EXISTS numero SERIAL,
ADD COLUMN IF NOT EXISTS origem TEXT DEFAULT 'manual' CHECK (origem IN ('chat', 'email', 'whatsapp', 'manual')),
ADD COLUMN IF NOT EXISTS participantes UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS anexos JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS sla JSONB DEFAULT '{"inicio": null, "limite": null, "atingido": false}',
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_numero ON public.support_tickets(numero);
CREATE INDEX IF NOT EXISTS idx_support_tickets_origem ON public.support_tickets(origem);
CREATE INDEX IF NOT EXISTS idx_support_tickets_tags ON public.support_tickets USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON public.support_tickets(assigned_to);

-- 2. Criar tabela de configurações de SLA
CREATE TABLE IF NOT EXISTS public.support_sla_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prioridade TEXT NOT NULL CHECK (prioridade IN ('low', 'medium', 'high', 'urgent')),
  tempo_resposta_horas INTEGER NOT NULL DEFAULT 24,
  tempo_resolucao_horas INTEGER NOT NULL DEFAULT 72,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(prioridade)
);

-- Inserir configurações padrão de SLA
INSERT INTO public.support_sla_configs (prioridade, tempo_resposta_horas, tempo_resolucao_horas) VALUES
  ('low', 48, 168),      -- 2 dias resposta, 7 dias resolução
  ('medium', 24, 72),    -- 1 dia resposta, 3 dias resolução
  ('high', 8, 24),       -- 8 horas resposta, 1 dia resolução
  ('urgent', 2, 8)       -- 2 horas resposta, 8 horas resolução
ON CONFLICT (prioridade) DO NOTHING;

-- 3. Criar tabela de macros de resposta
CREATE TABLE IF NOT EXISTS public.support_ticket_macros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  visibilidade TEXT NOT NULL DEFAULT 'global' CHECK (visibilidade IN ('global', 'tenant')),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  variaveis_exemplo JSONB DEFAULT '{}',
  categoria TEXT,
  ativo BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para macros
CREATE INDEX IF NOT EXISTS idx_macros_visibilidade ON public.support_ticket_macros(visibilidade);
CREATE INDEX IF NOT EXISTS idx_macros_tenant_id ON public.support_ticket_macros(tenant_id);
CREATE INDEX IF NOT EXISTS idx_macros_categoria ON public.support_ticket_macros(categoria);

-- 4. Criar função para calcular SLA ao criar ticket
CREATE OR REPLACE FUNCTION public.calcular_sla_ticket()
RETURNS TRIGGER AS $$
DECLARE
  config_sla RECORD;
  limite_timestamp TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Buscar configuração de SLA baseada na prioridade
  SELECT tempo_resposta_horas, tempo_resolucao_horas
  INTO config_sla
  FROM public.support_sla_configs
  WHERE prioridade = NEW.priority;

  IF FOUND THEN
    -- Calcular limite baseado no tempo de resposta
    limite_timestamp := NEW.created_at + (config_sla.tempo_resposta_horas || ' hours')::INTERVAL;
    
    -- Atualizar campo SLA
    NEW.sla := jsonb_build_object(
      'inicio', NEW.created_at,
      'limite', limite_timestamp,
      'atingido', false,
      'tempo_resposta_horas', config_sla.tempo_resposta_horas,
      'tempo_resolucao_horas', config_sla.tempo_resolucao_horas
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger para calcular SLA
DROP TRIGGER IF EXISTS trigger_calcular_sla ON public.support_tickets;
CREATE TRIGGER trigger_calcular_sla
BEFORE INSERT ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION public.calcular_sla_ticket();

-- 5. Criar função para atualizar SLA quando status muda
CREATE OR REPLACE FUNCTION public.atualizar_sla_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o ticket foi resolvido ou fechado, marcar SLA como atingido
  IF NEW.status IN ('resolved', 'closed') AND OLD.status != NEW.status THEN
    NEW.sla := jsonb_set(
      COALESCE(NEW.sla, '{}'::jsonb),
      '{atingido}',
      'true'::jsonb
    );
    NEW.resolved_at := now();
    
    -- Registrar quem resolveu
    IF NEW.resolved_by IS NULL THEN
      NEW.resolved_by := auth.uid();
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger para atualizar SLA
DROP TRIGGER IF EXISTS trigger_atualizar_sla_status ON public.support_tickets;
CREATE TRIGGER trigger_atualizar_sla_status
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.atualizar_sla_status();

-- 6. Habilitar RLS nas novas tabelas
ALTER TABLE public.support_sla_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ticket_macros ENABLE ROW LEVEL SECURITY;

-- 7. Políticas RLS para support_sla_configs
CREATE POLICY "Support users can view SLA configs"
ON public.support_sla_configs
FOR SELECT
USING (has_support_access(auth.uid()));

CREATE POLICY "Master users can manage SLA configs"
ON public.support_sla_configs
FOR ALL
USING (
  has_support_access(auth.uid()) AND 
  get_support_level(auth.uid()) = 'master'
)
WITH CHECK (
  has_support_access(auth.uid()) AND 
  get_support_level(auth.uid()) = 'master'
);

-- 8. Políticas RLS para support_ticket_macros
CREATE POLICY "Support users can view macros"
ON public.support_ticket_macros
FOR SELECT
USING (
  has_support_access(auth.uid()) AND
  (visibilidade = 'global' OR tenant_id IS NULL OR tenant_id IN (
    SELECT tenant_id FROM public.vinculo_usuario_tenant
    WHERE usuario_id IN (
      SELECT id FROM public.usuarios_suporte WHERE auth_user_id = auth.uid()
    )
  ))
);

CREATE POLICY "Support users can create macros"
ON public.support_ticket_macros
FOR INSERT
WITH CHECK (
  has_support_access(auth.uid()) AND
  created_by = auth.uid()
);

CREATE POLICY "Support users can update own macros"
ON public.support_ticket_macros
FOR UPDATE
USING (
  has_support_access(auth.uid()) AND
  (created_by = auth.uid() OR get_support_level(auth.uid()) IN ('master', 'support'))
)
WITH CHECK (
  has_support_access(auth.uid()) AND
  (created_by = auth.uid() OR get_support_level(auth.uid()) IN ('master', 'support'))
);

CREATE POLICY "Master users can delete macros"
ON public.support_ticket_macros
FOR DELETE
USING (
  has_support_access(auth.uid()) AND
  get_support_level(auth.uid()) = 'master'
);

-- 9. Trigger para updated_at em macros
CREATE OR REPLACE FUNCTION public.update_macros_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_update_macros_updated_at
BEFORE UPDATE ON public.support_ticket_macros
FOR EACH ROW
EXECUTE FUNCTION public.update_macros_updated_at();

-- 10. Inserir algumas macros padrão
INSERT INTO public.support_ticket_macros (nome, conteudo, visibilidade, categoria, created_by, variaveis_exemplo) VALUES
  (
    'Saudação Inicial',
    'Olá {{nome_cliente}},

Obrigado por entrar em contato! Recebi sua solicitação e já estou analisando. 

Ticket #{{numero_ticket}}
Prioridade: {{prioridade}}

Em breve retornarei com mais informações.

Atenciosamente,
{{nome_agente}}',
    'global',
    'Saudações',
    (SELECT id FROM auth.users LIMIT 1),
    '{"nome_cliente": "Nome do Cliente", "numero_ticket": "123", "prioridade": "Alta", "nome_agente": "Agente"}'::jsonb
  ),
  (
    'Aguardando Informações',
    'Olá {{nome_cliente}},

Para dar continuidade ao atendimento do ticket #{{numero_ticket}}, preciso de algumas informações adicionais:

{{lista_informacoes}}

Assim que receber essas informações, darei prosseguimento imediato.

Atenciosamente,
{{nome_agente}}',
    'global',
    'Solicitações',
    (SELECT id FROM auth.users LIMIT 1),
    '{"nome_cliente": "Nome", "numero_ticket": "123", "lista_informacoes": "- Info 1\n- Info 2", "nome_agente": "Agente"}'::jsonb
  ),
  (
    'Problema Resolvido',
    'Olá {{nome_cliente}},

Ótima notícia! O problema reportado no ticket #{{numero_ticket}} foi resolvido.

Solução aplicada:
{{descricao_solucao}}

Por favor, confirme se está tudo funcionando corretamente. Se houver qualquer dúvida ou novo problema, estou à disposição.

Atenciosamente,
{{nome_agente}}',
    'global',
    'Resoluções',
    (SELECT id FROM auth.users LIMIT 1),
    '{"nome_cliente": "Nome", "numero_ticket": "123", "descricao_solucao": "Descrição da solução", "nome_agente": "Agente"}'::jsonb
  )
ON CONFLICT DO NOTHING;