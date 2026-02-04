-- Create new procedimentos table (merging servicos with procedimentos from exames_procedimentos)
CREATE TABLE IF NOT EXISTS procedimentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nome text NOT NULL,
  duracao_minutos integer NOT NULL,
  preco numeric,
  codigo_tuss text,
  descricao text,
  tempo_preparo_minutos integer,
  instrucoes text,
  requisitos text,
  confirmacao_24h boolean DEFAULT false,
  ativo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create new exames table (only for exames from exames_procedimentos)
CREATE TABLE IF NOT EXISTS exames (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nome text NOT NULL,
  codigo_tuss text,
  descricao text,
  tempo_preparo_minutos integer,
  tempo_jejum_horas integer,
  duracao_minutos integer,
  preco numeric,
  instrucoes text,
  requisitos text,
  ativo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE procedimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE exames ENABLE ROW LEVEL SECURITY;

-- RLS policies for procedimentos
CREATE POLICY "Users can view tenant procedimentos"
  ON procedimentos FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Admins can manage procedimentos"
  ON procedimentos FOR ALL
  USING (tenant_id IN (
    SELECT tenant_id FROM profiles 
    WHERE id = auth.uid() AND role = ANY(ARRAY['admin'::user_role, 'profissional'::user_role])
  ));

-- RLS policies for exames
CREATE POLICY "Users can view tenant exames"
  ON exames FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Admins can manage exames"
  ON exames FOR ALL
  USING (tenant_id IN (
    SELECT tenant_id FROM profiles 
    WHERE id = auth.uid() AND role = ANY(ARRAY['admin'::user_role, 'profissional'::user_role])
  ));

-- Migrate data from servicos to procedimentos
INSERT INTO procedimentos (
  id, tenant_id, nome, duracao_minutos, preco, confirmacao_24h, ativo, created_at, updated_at
)
SELECT 
  id, tenant_id, nome, duracao_minutos, preco, confirmacao_24h, ativo, created_at, updated_at
FROM servicos;

-- Migrate procedimento data from exames_procedimentos to procedimentos
INSERT INTO procedimentos (
  tenant_id, nome, duracao_minutos, preco, codigo_tuss, descricao, 
  tempo_preparo_minutos, instrucoes, requisitos, ativo, created_at, updated_at
)
SELECT 
  tenant_id, nome, 
  COALESCE(duracao_minutos, 30) as duracao_minutos,
  valor as preco, 
  codigo_tuss, descricao,
  tempo_preparo_minutos, instrucoes, requisitos, ativo, created_at, updated_at
FROM exames_procedimentos
WHERE tipo IN ('procedimento_cirurgico', 'procedimento_terapeutico', 'procedimento_diagnostico');

-- Migrate exame data from exames_procedimentos to exames
INSERT INTO exames (
  tenant_id, nome, codigo_tuss, descricao, tempo_preparo_minutos, 
  tempo_jejum_horas, duracao_minutos, preco, instrucoes, requisitos, ativo, created_at, updated_at
)
SELECT 
  tenant_id, nome, codigo_tuss, descricao, tempo_preparo_minutos,
  tempo_jejum_horas, duracao_minutos, valor as preco, instrucoes, requisitos, ativo, created_at, updated_at
FROM exames_procedimentos
WHERE tipo IN ('exame_laboratorial', 'exame_imagem');

-- Add indexes for performance
CREATE INDEX idx_procedimentos_tenant ON procedimentos(tenant_id);
CREATE INDEX idx_procedimentos_ativo ON procedimentos(ativo);
CREATE INDEX idx_exames_tenant ON exames(tenant_id);
CREATE INDEX idx_exames_ativo ON exames(ativo);

-- Add trigger for updated_at
CREATE TRIGGER update_procedimentos_updated_at
  BEFORE UPDATE ON procedimentos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exames_updated_at
  BEFORE UPDATE ON exames
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();