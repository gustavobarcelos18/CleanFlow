-- Tabela de formas de pagamento
CREATE TABLE IF NOT EXISTS public.formas_pagamento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('dinheiro', 'pix', 'cartao_debito', 'cartao_credito', 'plano_saude', 'outro')),
  ativo BOOLEAN DEFAULT true,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(tenant_id, nome)
);

-- Tabela de contas PIX
CREATE TABLE IF NOT EXISTS public.contas_pix (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  chave_pix TEXT NOT NULL,
  tipo_chave TEXT NOT NULL CHECK (tipo_chave IN ('cpf', 'cnpj', 'email', 'telefone', 'aleatoria')),
  banco TEXT,
  titular TEXT,
  ativo BOOLEAN DEFAULT true,
  padrao BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de valores pagos pelos planos de saúde
CREATE TABLE IF NOT EXISTS public.plano_saude_valores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  plano_saude_id UUID NOT NULL REFERENCES public.planos_saude(id) ON DELETE CASCADE,
  servico_id UUID REFERENCES public.servicos(id) ON DELETE SET NULL,
  exame_procedimento_id UUID REFERENCES public.exames_procedimentos(id) ON DELETE SET NULL,
  valor NUMERIC(10,2) NOT NULL,
  dias_recebimento INTEGER NOT NULL DEFAULT 30,
  vigencia_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  vigencia_fim DATE,
  ativo BOOLEAN DEFAULT true,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CHECK (servico_id IS NOT NULL OR exame_procedimento_id IS NOT NULL)
);

-- Tabela de contas a receber
CREATE TABLE IF NOT EXISTS public.contas_receber (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  agendamento_id UUID REFERENCES public.agenda(id) ON DELETE SET NULL,
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  plano_saude_id UUID REFERENCES public.planos_saude(id) ON DELETE SET NULL,
  valor NUMERIC(10,2) NOT NULL,
  data_vencimento DATE NOT NULL,
  data_recebimento DATE,
  valor_recebido NUMERIC(10,2),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'recebido', 'atrasado', 'cancelado')),
  forma_recebimento_id UUID REFERENCES public.formas_pagamento(id) ON DELETE SET NULL,
  conta_pix_id UUID REFERENCES public.contas_pix(id) ON DELETE SET NULL,
  observacoes TEXT,
  numero_guia TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id)
);

-- Adicionar campos na tabela agenda
ALTER TABLE public.agenda 
ADD COLUMN IF NOT EXISTS forma_pagamento_id UUID REFERENCES public.formas_pagamento(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS conta_pix_id UUID REFERENCES public.contas_pix(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS plano_saude_id UUID REFERENCES public.planos_saude(id) ON DELETE SET NULL;

-- Adicionar campos na tabela caixa_diario
ALTER TABLE public.caixa_diario
ADD COLUMN IF NOT EXISTS conta_pix_id UUID REFERENCES public.contas_pix(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS conta_receber_id UUID REFERENCES public.contas_receber(id) ON DELETE SET NULL;

-- Adicionar campo de permissão para alterar valores em profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS pode_alterar_valores BOOLEAN DEFAULT false;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_formas_pagamento_tenant ON public.formas_pagamento(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contas_pix_tenant ON public.contas_pix(tenant_id);
CREATE INDEX IF NOT EXISTS idx_plano_saude_valores_tenant ON public.plano_saude_valores(tenant_id);
CREATE INDEX IF NOT EXISTS idx_plano_saude_valores_plano ON public.plano_saude_valores(plano_saude_id);
CREATE INDEX IF NOT EXISTS idx_contas_receber_tenant ON public.contas_receber(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contas_receber_status ON public.contas_receber(status);
CREATE INDEX IF NOT EXISTS idx_contas_receber_vencimento ON public.contas_receber(data_vencimento);

-- Triggers para updated_at
CREATE TRIGGER update_formas_pagamento_updated_at
  BEFORE UPDATE ON public.formas_pagamento
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contas_pix_updated_at
  BEFORE UPDATE ON public.contas_pix
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_plano_saude_valores_updated_at
  BEFORE UPDATE ON public.plano_saude_valores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contas_receber_updated_at
  BEFORE UPDATE ON public.contas_receber
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies para formas_pagamento
ALTER TABLE public.formas_pagamento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view payment methods in same tenant"
  ON public.formas_pagamento FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can manage payment methods"
  ON public.formas_pagamento FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles 
      WHERE id = auth.uid() AND role = ANY(ARRAY['admin'::user_role, 'recepcao'::user_role])
    )
  );

-- RLS Policies para contas_pix
ALTER TABLE public.contas_pix ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view pix accounts in same tenant"
  ON public.contas_pix FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can manage pix accounts"
  ON public.contas_pix FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'::user_role
    )
  );

-- RLS Policies para plano_saude_valores
ALTER TABLE public.plano_saude_valores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view plan values in same tenant"
  ON public.plano_saude_valores FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can manage plan values"
  ON public.plano_saude_valores FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'::user_role
    )
  );

-- RLS Policies para contas_receber
ALTER TABLE public.contas_receber ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view receivables in same tenant"
  ON public.contas_receber FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Staff can create receivables"
  ON public.contas_receber FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles 
      WHERE id = auth.uid() AND role = ANY(ARRAY['admin'::user_role, 'recepcao'::user_role, 'profissional'::user_role])
    )
  );

CREATE POLICY "Authorized users can update receivables"
  ON public.contas_receber FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles 
      WHERE id = auth.uid() AND (role = 'admin'::user_role OR pode_alterar_valores = true)
    )
  );

-- Função para criar conta a receber automaticamente
CREATE OR REPLACE FUNCTION public.criar_conta_receber_agendamento()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_forma_pagamento_tipo TEXT;
  v_dias_recebimento INTEGER;
BEGIN
  -- Só criar conta a receber se o status for concluído e houver forma de pagamento
  IF NEW.status = 'concluido' AND NEW.forma_pagamento_id IS NOT NULL THEN
    -- Verificar se é pagamento via plano ou cartão
    SELECT tipo INTO v_forma_pagamento_tipo
    FROM formas_pagamento
    WHERE id = NEW.forma_pagamento_id;
    
    -- Se for plano de saúde ou cartão, criar conta a receber
    IF v_forma_pagamento_tipo IN ('plano_saude', 'cartao_credito', 'cartao_debito') THEN
      -- Buscar dias de recebimento (padrão 30 dias para cartão, ou o cadastrado no plano)
      IF v_forma_pagamento_tipo = 'plano_saude' AND NEW.plano_saude_id IS NOT NULL THEN
        SELECT COALESCE(MAX(dias_recebimento), 30) INTO v_dias_recebimento
        FROM plano_saude_valores
        WHERE plano_saude_id = NEW.plano_saude_id
          AND servico_id = NEW.servico_id
          AND ativo = true
          AND (vigencia_fim IS NULL OR vigencia_fim >= CURRENT_DATE);
      ELSE
        v_dias_recebimento := 30; -- Padrão para cartão
      END IF;
      
      -- Criar conta a receber apenas se não existir
      INSERT INTO contas_receber (
        tenant_id,
        agendamento_id,
        paciente_id,
        plano_saude_id,
        valor,
        data_vencimento,
        status,
        created_by
      )
      SELECT
        NEW.tenant_id,
        NEW.id,
        NEW.paciente_id,
        NEW.plano_saude_id,
        COALESCE(NEW.valor_consulta, 0),
        CURRENT_DATE + v_dias_recebimento,
        'pendente',
        auth.uid()
      WHERE NOT EXISTS (
        SELECT 1 FROM contas_receber WHERE agendamento_id = NEW.id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para criar conta a receber
DROP TRIGGER IF EXISTS trigger_criar_conta_receber ON public.agenda;
CREATE TRIGGER trigger_criar_conta_receber
  AFTER INSERT OR UPDATE ON public.agenda
  FOR EACH ROW
  EXECUTE FUNCTION public.criar_conta_receber_agendamento();

-- Atualizar status de contas a receber atrasadas
CREATE OR REPLACE FUNCTION public.atualizar_status_contas_atrasadas()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE contas_receber
  SET status = 'atrasado'
  WHERE status = 'pendente'
    AND data_vencimento < CURRENT_DATE;
END;
$$;