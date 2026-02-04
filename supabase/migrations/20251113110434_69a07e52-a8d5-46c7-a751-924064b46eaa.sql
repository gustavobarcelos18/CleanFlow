-- Criar tabela tipos_profissional
CREATE TABLE IF NOT EXISTS public.tipos_profissional (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  acesso_prontuarios BOOLEAN DEFAULT false,
  cor TEXT DEFAULT '#6366f1',
  icone TEXT DEFAULT 'User',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.tipos_profissional ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários podem visualizar tipos do próprio tenant"
  ON public.tipos_profissional
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem criar tipos no próprio tenant"
  ON public.tipos_profissional
  FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem atualizar tipos do próprio tenant"
  ON public.tipos_profissional
  FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem deletar tipos do próprio tenant"
  ON public.tipos_profissional
  FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Trigger para atualizar updated_at
CREATE TRIGGER update_tipos_profissional_updated_at
  BEFORE UPDATE ON public.tipos_profissional
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Índices
CREATE INDEX idx_tipos_profissional_tenant_id ON public.tipos_profissional(tenant_id);
CREATE INDEX idx_tipos_profissional_ativo ON public.tipos_profissional(ativo);