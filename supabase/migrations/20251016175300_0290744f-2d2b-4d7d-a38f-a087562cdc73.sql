-- Adicionar constraints de unicidade para evitar nomes duplicados
-- em cadastros do mesmo tenant

-- ESPECIALIDADES: Não permitir especialidades com mesmo nome no tenant
ALTER TABLE public.especialidades 
ADD CONSTRAINT especialidades_tenant_nome_unique 
UNIQUE (tenant_id, nome);

-- EXAMES E PROCEDIMENTOS: Não permitir exames/procedimentos com mesmo nome no tenant
ALTER TABLE public.exames_procedimentos 
ADD CONSTRAINT exames_procedimentos_tenant_nome_unique 
UNIQUE (tenant_id, nome);

-- SERVIÇOS: Não permitir serviços com mesmo nome no tenant
ALTER TABLE public.servicos 
ADD CONSTRAINT servicos_tenant_nome_unique 
UNIQUE (tenant_id, nome);

-- PACOTES: Não permitir pacotes com mesmo nome no tenant
ALTER TABLE public.pacotes 
ADD CONSTRAINT pacotes_tenant_nome_unique 
UNIQUE (tenant_id, nome);