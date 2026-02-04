-- Criar tabela de especialidades
CREATE TABLE public.especialidades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  codigo_cfm TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(tenant_id, nome)
);

-- Habilitar RLS
ALTER TABLE public.especialidades ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para especialidades
CREATE POLICY "Users can view tenant especialidades"
  ON public.especialidades FOR SELECT
  USING (tenant_id IN (
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Admins can manage especialidades"
  ON public.especialidades FOR ALL
  USING (tenant_id IN (
    SELECT tenant_id FROM public.profiles 
    WHERE id = auth.uid() AND role = ANY(ARRAY['admin'::user_role, 'profissional'::user_role])
  ));

-- Criar tabela de exames e procedimentos (unificada)
CREATE TYPE public.tipo_exame_procedimento AS ENUM ('exame_laboratorial', 'exame_imagem', 'procedimento_cirurgico', 'procedimento_terapeutico', 'procedimento_diagnostico');

CREATE TABLE public.exames_procedimentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo tipo_exame_procedimento NOT NULL,
  codigo_tuss TEXT,
  descricao TEXT,
  tempo_preparo_minutos INTEGER,
  tempo_jejum_horas INTEGER,
  duracao_minutos INTEGER,
  valor NUMERIC(10, 2),
  instrucoes TEXT,
  requisitos TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.exames_procedimentos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para exames_procedimentos
CREATE POLICY "Users can view tenant exames_procedimentos"
  ON public.exames_procedimentos FOR SELECT
  USING (tenant_id IN (
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Admins can manage exames_procedimentos"
  ON public.exames_procedimentos FOR ALL
  USING (tenant_id IN (
    SELECT tenant_id FROM public.profiles 
    WHERE id = auth.uid() AND role = ANY(ARRAY['admin'::user_role, 'profissional'::user_role])
  ));

-- Adicionar campos profissionais à tabela profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS cpf TEXT,
  ADD COLUMN IF NOT EXISTS conselho_profissional TEXT,
  ADD COLUMN IF NOT EXISTS numero_registro TEXT,
  ADD COLUMN IF NOT EXISTS uf_registro TEXT,
  ADD COLUMN IF NOT EXISTS especialidade_id UUID REFERENCES public.especialidades(id);

-- Criar índices
CREATE INDEX idx_especialidades_tenant ON public.especialidades(tenant_id);
CREATE INDEX idx_especialidades_ativo ON public.especialidades(ativo);
CREATE INDEX idx_exames_procedimentos_tenant ON public.exames_procedimentos(tenant_id);
CREATE INDEX idx_exames_procedimentos_tipo ON public.exames_procedimentos(tipo);
CREATE INDEX idx_exames_procedimentos_ativo ON public.exames_procedimentos(ativo);

-- Trigger para updated_at
CREATE TRIGGER update_especialidades_updated_at
  BEFORE UPDATE ON public.especialidades
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exames_procedimentos_updated_at
  BEFORE UPDATE ON public.exames_procedimentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();