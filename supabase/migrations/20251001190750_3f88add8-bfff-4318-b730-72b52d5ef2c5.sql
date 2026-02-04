-- Criar tabela de pacotes de tratamentos
CREATE TABLE public.pacotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome text NOT NULL,
  descricao text,
  servico_id uuid REFERENCES public.servicos(id) ON DELETE SET NULL,
  numero_sessoes integer NOT NULL CHECK (numero_sessoes > 0),
  preco numeric NOT NULL CHECK (preco >= 0),
  validade_dias integer DEFAULT 90 CHECK (validade_dias > 0),
  renovacao_automatica boolean DEFAULT false,
  desconto_renovacao numeric DEFAULT 0 CHECK (desconto_renovacao >= 0 AND desconto_renovacao <= 100),
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de pacotes dos pacientes
CREATE TABLE public.pacientes_pacotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  pacote_id uuid NOT NULL REFERENCES public.pacotes(id) ON DELETE CASCADE,
  sessoes_restantes integer NOT NULL CHECK (sessoes_restantes >= 0),
  sessoes_total integer NOT NULL CHECK (sessoes_total > 0),
  data_compra timestamptz NOT NULL DEFAULT now(),
  data_validade timestamptz,
  renovacao_automatica boolean DEFAULT false,
  status text DEFAULT 'ativo' CHECK (status IN ('ativo', 'expirado', 'cancelado', 'finalizado')),
  valor_pago numeric NOT NULL CHECK (valor_pago >= 0),
  notificacao_renovacao_enviada boolean DEFAULT false,
  ultima_notificacao timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Adicionar coluna paciente_pacote_id na tabela agenda
ALTER TABLE public.agenda 
ADD COLUMN paciente_pacote_id uuid REFERENCES public.pacientes_pacotes(id) ON DELETE SET NULL;

-- Índices para performance
CREATE INDEX idx_pacotes_tenant ON public.pacotes(tenant_id);
CREATE INDEX idx_pacotes_ativo ON public.pacotes(ativo);
CREATE INDEX idx_pacientes_pacotes_tenant ON public.pacientes_pacotes(tenant_id);
CREATE INDEX idx_pacientes_pacotes_paciente ON public.pacientes_pacotes(paciente_id);
CREATE INDEX idx_pacientes_pacotes_status ON public.pacientes_pacotes(status);
CREATE INDEX idx_agenda_paciente_pacote ON public.agenda(paciente_pacote_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_pacotes_updated_at
  BEFORE UPDATE ON public.pacotes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pacientes_pacotes_updated_at
  BEFORE UPDATE ON public.pacientes_pacotes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para baixar sessão do pacote quando consulta é realizada
CREATE OR REPLACE FUNCTION public.baixar_sessao_pacote()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Se o agendamento está vinculado a um pacote e foi concluído
  IF NEW.paciente_pacote_id IS NOT NULL AND NEW.status = 'concluido' AND (OLD.status IS NULL OR OLD.status != 'concluido') THEN
    -- Baixar uma sessão do pacote
    UPDATE public.pacientes_pacotes
    SET 
      sessoes_restantes = sessoes_restantes - 1,
      status = CASE 
        WHEN sessoes_restantes - 1 = 0 THEN 'finalizado'
        ELSE status
      END,
      updated_at = now()
    WHERE id = NEW.paciente_pacote_id
      AND sessoes_restantes > 0;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para baixar sessão automaticamente
CREATE TRIGGER trigger_baixar_sessao_pacote
  AFTER UPDATE ON public.agenda
  FOR EACH ROW
  EXECUTE FUNCTION public.baixar_sessao_pacote();

-- Função para verificar pacotes expirando
CREATE OR REPLACE FUNCTION public.verificar_pacotes_expirando()
RETURNS TABLE (
  paciente_pacote_id uuid,
  paciente_id uuid,
  paciente_nome text,
  paciente_email text,
  paciente_telefone text,
  pacote_nome text,
  sessoes_restantes integer,
  dias_para_expirar integer,
  renovacao_automatica boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pp.id,
    pp.paciente_id,
    p.nome,
    p.email,
    p.telefone,
    pac.nome,
    pp.sessoes_restantes,
    EXTRACT(DAY FROM (pp.data_validade - now()))::integer,
    pp.renovacao_automatica
  FROM public.pacientes_pacotes pp
  JOIN public.pacientes p ON p.id = pp.paciente_id
  JOIN public.pacotes pac ON pac.id = pp.pacote_id
  WHERE pp.status = 'ativo'
    AND pp.data_validade IS NOT NULL
    AND pp.data_validade <= (now() + interval '7 days')
    AND (pp.notificacao_renovacao_enviada = false OR pp.ultima_notificacao < now() - interval '3 days');
END;
$$;

-- RLS Policies para pacotes
ALTER TABLE public.pacotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins e profissionais podem gerenciar pacotes"
ON public.pacotes
FOR ALL
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'profissional')
  )
);

CREATE POLICY "Staff pode visualizar pacotes"
ON public.pacotes
FOR SELECT
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'profissional', 'recepcao')
  )
);

-- RLS Policies para pacientes_pacotes
ALTER TABLE public.pacientes_pacotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff pode gerenciar pacotes de pacientes"
ON public.pacientes_pacotes
FOR ALL
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'profissional', 'recepcao')
  )
);

CREATE POLICY "Staff pode visualizar pacotes de pacientes"
ON public.pacientes_pacotes
FOR SELECT
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'profissional', 'recepcao')
  )
);