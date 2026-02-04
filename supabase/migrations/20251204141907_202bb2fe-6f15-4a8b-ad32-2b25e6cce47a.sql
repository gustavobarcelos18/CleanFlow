
-- 1) tenant_profile: configuração do tenant por segmento
CREATE TABLE public.tenant_profile (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  segmentos jsonb NOT NULL DEFAULT '[]'::jsonb,
  modo_agenda text NOT NULL DEFAULT 'profissional' CHECK (modo_agenda IN ('profissional', 'recurso', 'local', 'externo', 'misto')),
  pais text DEFAULT 'BR',
  moeda text DEFAULT 'BRL',
  idioma text DEFAULT 'pt-BR',
  status_onboarding text NOT NULL DEFAULT 'novo' CHECK (status_onboarding IN ('novo', 'parcial', 'concluido')),
  meios_pagamento jsonb DEFAULT '[]'::jsonb,
  politicas_cobranca jsonb DEFAULT '{}'::jsonb,
  lembretes_config jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id)
);

-- 2) capability_matrix: matriz de recursos por segmento (dados de referência)
CREATE TABLE public.capability_matrix (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo_segmento text NOT NULL,
  recurso text NOT NULL,
  flag boolean NOT NULL DEFAULT false,
  flag_default boolean NOT NULL DEFAULT false,
  descricao text,
  categoria text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(codigo_segmento, recurso)
);

-- 3) tenant_feature_flags: flags específicas do tenant
CREATE TABLE public.tenant_feature_flags (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  recurso text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  origem text NOT NULL DEFAULT 'segmento' CHECK (origem IN ('segmento', 'manual')),
  atualizado_por uuid REFERENCES auth.users(id),
  atualizado_em timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, recurso)
);

-- 4) form_schema_registry: esquemas de formulário por segmento
CREATE TABLE public.form_schema_registry (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo_segmento text NOT NULL,
  tipo text NOT NULL,
  schema_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  ordem integer DEFAULT 0,
  ativo boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(codigo_segmento, tipo)
);

-- 5) navigation_blueprints: menus por segmento
CREATE TABLE public.navigation_blueprints (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo_segmento text NOT NULL,
  itens_menu jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(codigo_segmento)
);

-- 6) messaging_catalog: catálogo de mensagens por segmento
CREATE TABLE public.messaging_catalog (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo_segmento text NOT NULL,
  canal text NOT NULL CHECK (canal IN ('whatsapp', 'email', 'sms')),
  categoria text NOT NULL CHECK (categoria IN ('utilidade', 'marketing', 'autenticacao', 'servico')),
  template_id text,
  preview text NOT NULL,
  placeholders jsonb DEFAULT '[]'::jsonb,
  ativo boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 7) reporting_blueprints: relatórios por segmento
CREATE TABLE public.reporting_blueprints (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo_segmento text NOT NULL,
  kpis jsonb DEFAULT '[]'::jsonb,
  relatorios jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(codigo_segmento)
);

-- Habilitar RLS
ALTER TABLE public.tenant_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capability_matrix ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_schema_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.navigation_blueprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messaging_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reporting_blueprints ENABLE ROW LEVEL SECURITY;

-- Policies: tenant_profile
CREATE POLICY "Admins can manage own tenant profile" ON public.tenant_profile
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can view own tenant profile" ON public.tenant_profile
  FOR SELECT USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Support can manage tenant profiles" ON public.tenant_profile
  FOR ALL USING (has_support_access(auth.uid()));

-- Policies: capability_matrix (referência pública para leitura)
CREATE POLICY "Everyone can view capability matrix" ON public.capability_matrix
  FOR SELECT USING (true);

CREATE POLICY "Support can manage capability matrix" ON public.capability_matrix
  FOR ALL USING (has_support_access(auth.uid()));

-- Policies: tenant_feature_flags
CREATE POLICY "Admins can manage own tenant flags" ON public.tenant_feature_flags
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can view own tenant flags" ON public.tenant_feature_flags
  FOR SELECT USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Support can manage tenant flags" ON public.tenant_feature_flags
  FOR ALL USING (has_support_access(auth.uid()));

-- Policies: form_schema_registry (referência pública)
CREATE POLICY "Everyone can view form schemas" ON public.form_schema_registry
  FOR SELECT USING (true);

CREATE POLICY "Support can manage form schemas" ON public.form_schema_registry
  FOR ALL USING (has_support_access(auth.uid()));

-- Policies: navigation_blueprints (referência pública)
CREATE POLICY "Everyone can view navigation blueprints" ON public.navigation_blueprints
  FOR SELECT USING (true);

CREATE POLICY "Support can manage navigation blueprints" ON public.navigation_blueprints
  FOR ALL USING (has_support_access(auth.uid()));

-- Policies: messaging_catalog (referência pública)
CREATE POLICY "Everyone can view messaging catalog" ON public.messaging_catalog
  FOR SELECT USING (true);

CREATE POLICY "Support can manage messaging catalog" ON public.messaging_catalog
  FOR ALL USING (has_support_access(auth.uid()));

-- Policies: reporting_blueprints (referência pública)
CREATE POLICY "Everyone can view reporting blueprints" ON public.reporting_blueprints
  FOR SELECT USING (true);

CREATE POLICY "Support can manage reporting blueprints" ON public.reporting_blueprints
  FOR ALL USING (has_support_access(auth.uid()));

-- Inserir dados iniciais de capability_matrix para segmentos principais
INSERT INTO public.capability_matrix (codigo_segmento, recurso, flag, flag_default, descricao, categoria) VALUES
-- Saúde
('saude', 'prontuarios', true, true, 'Prontuários eletrônicos', 'core'),
('saude', 'convenios', true, true, 'Planos de saúde/convênios', 'financeiro'),
('saude', 'prescricoes', true, true, 'Prescrições médicas', 'clinico'),
('saude', 'exames', true, true, 'Exames e procedimentos', 'clinico'),
('saude', 'lembretes_consulta', true, true, 'Lembretes de consulta', 'comunicacao'),
('saude', 'lista_espera', true, true, 'Lista de espera', 'agendamento'),
('saude', 'pacotes', true, true, 'Pacotes de sessões', 'financeiro'),

-- Estética
('estetica', 'prontuarios', true, true, 'Prontuários simplificados', 'core'),
('estetica', 'pacotes', true, true, 'Pacotes de procedimentos', 'financeiro'),
('estetica', 'antes_depois', true, true, 'Fotos antes/depois', 'clinico'),
('estetica', 'lembretes_consulta', true, true, 'Lembretes de sessão', 'comunicacao'),
('estetica', 'lista_espera', true, true, 'Lista de espera', 'agendamento'),
('estetica', 'fidelidade', true, false, 'Programa de fidelidade', 'marketing'),

-- Veterinária
('veterinaria', 'pet_prontuario', true, true, 'Prontuário veterinário', 'core'),
('veterinaria', 'vacinas', true, true, 'Carteira de vacinação', 'clinico'),
('veterinaria', 'lembretes_vacina', true, true, 'Lembretes de vacina', 'comunicacao'),
('veterinaria', 'exames', true, true, 'Exames laboratoriais', 'clinico'),
('veterinaria', 'internacao', true, false, 'Controle de internação', 'clinico'),

-- Odontologia
('odontologia', 'prontuarios', true, true, 'Prontuários odontológicos', 'core'),
('odontologia', 'odontograma', true, true, 'Odontograma digital', 'clinico'),
('odontologia', 'orcamentos', true, true, 'Orçamentos de tratamento', 'financeiro'),
('odontologia', 'convenios', true, true, 'Convênios odontológicos', 'financeiro'),
('odontologia', 'lembretes_consulta', true, true, 'Lembretes de consulta', 'comunicacao'),

-- Educação/Cursos
('educacao', 'turmas', true, true, 'Gestão de turmas', 'core'),
('educacao', 'alunos', true, true, 'Cadastro de alunos', 'core'),
('educacao', 'matriculas', true, true, 'Matrículas', 'financeiro'),
('educacao', 'frequencia', true, true, 'Controle de frequência', 'core'),
('educacao', 'lembretes_aula', true, true, 'Lembretes de aula', 'comunicacao'),

-- Oficina Mecânica
('oficina', 'ordens_servico', true, true, 'Ordens de serviço', 'core'),
('oficina', 'veiculos', true, true, 'Cadastro de veículos', 'core'),
('oficina', 'orcamentos', true, true, 'Orçamentos', 'financeiro'),
('oficina', 'pecas', true, false, 'Controle de peças', 'estoque'),
('oficina', 'lembretes_revisao', true, true, 'Lembretes de revisão', 'comunicacao');

-- Inserir navigation_blueprints para saúde (exemplo)
INSERT INTO public.navigation_blueprints (codigo_segmento, itens_menu) VALUES
('saude', '[
  {"chave": "dashboard", "label": "Dashboard", "rota": "/", "icone": "LayoutDashboard", "visibilidade_por_flag": []},
  {"chave": "agenda", "label": "Agenda", "rota": "/agenda", "icone": "Calendar", "visibilidade_por_flag": []},
  {"chave": "pacientes", "label": "Pacientes", "rota": "/pacientes", "icone": "Users", "visibilidade_por_flag": []},
  {"chave": "prontuarios", "label": "Prontuários", "rota": "/prontuarios", "icone": "FileText", "visibilidade_por_flag": ["prontuarios"]},
  {"chave": "atendimento", "label": "Atendimento", "rota": "/atendimento", "icone": "Stethoscope", "visibilidade_por_flag": []},
  {"chave": "financeiro", "label": "Financeiro", "rota": "/financeiro", "icone": "DollarSign", "visibilidade_por_flag": []},
  {"chave": "lista_espera", "label": "Lista de Espera", "rota": "/lista-espera", "icone": "Clock", "visibilidade_por_flag": ["lista_espera"]},
  {"chave": "whatsapp", "label": "WhatsApp", "rota": "/whatsapp", "icone": "MessageCircle", "visibilidade_por_flag": ["lembretes_consulta"]},
  {"chave": "relatorios", "label": "Relatórios", "rota": "/relatorios", "icone": "BarChart3", "visibilidade_por_flag": []},
  {"chave": "configuracoes", "label": "Configurações", "rota": "/configuracoes", "icone": "Settings", "visibilidade_por_flag": []}
]'::jsonb),
('estetica', '[
  {"chave": "dashboard", "label": "Dashboard", "rota": "/", "icone": "LayoutDashboard", "visibilidade_por_flag": []},
  {"chave": "agenda", "label": "Agenda", "rota": "/agenda", "icone": "Calendar", "visibilidade_por_flag": []},
  {"chave": "clientes", "label": "Clientes", "rota": "/pacientes", "icone": "Users", "visibilidade_por_flag": []},
  {"chave": "fichas", "label": "Fichas", "rota": "/prontuarios", "icone": "FileText", "visibilidade_por_flag": ["prontuarios"]},
  {"chave": "pacotes", "label": "Pacotes", "rota": "/pacotes", "icone": "Package", "visibilidade_por_flag": ["pacotes"]},
  {"chave": "financeiro", "label": "Financeiro", "rota": "/financeiro", "icone": "DollarSign", "visibilidade_por_flag": []},
  {"chave": "whatsapp", "label": "WhatsApp", "rota": "/whatsapp", "icone": "MessageCircle", "visibilidade_por_flag": ["lembretes_consulta"]},
  {"chave": "configuracoes", "label": "Configurações", "rota": "/configuracoes", "icone": "Settings", "visibilidade_por_flag": []}
]'::jsonb),
('veterinaria', '[
  {"chave": "dashboard", "label": "Dashboard", "rota": "/", "icone": "LayoutDashboard", "visibilidade_por_flag": []},
  {"chave": "agenda", "label": "Agenda", "rota": "/agenda", "icone": "Calendar", "visibilidade_por_flag": []},
  {"chave": "tutores", "label": "Tutores", "rota": "/pacientes", "icone": "Users", "visibilidade_por_flag": []},
  {"chave": "prontuarios", "label": "Prontuários", "rota": "/prontuarios", "icone": "FileText", "visibilidade_por_flag": ["pet_prontuario"]},
  {"chave": "vacinas", "label": "Vacinas", "rota": "/vacinas", "icone": "Syringe", "visibilidade_por_flag": ["vacinas"]},
  {"chave": "financeiro", "label": "Financeiro", "rota": "/financeiro", "icone": "DollarSign", "visibilidade_por_flag": []},
  {"chave": "whatsapp", "label": "WhatsApp", "rota": "/whatsapp", "icone": "MessageCircle", "visibilidade_por_flag": ["lembretes_vacina"]},
  {"chave": "configuracoes", "label": "Configurações", "rota": "/configuracoes", "icone": "Settings", "visibilidade_por_flag": []}
]'::jsonb);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_tenant_profile_updated_at
  BEFORE UPDATE ON public.tenant_profile
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_form_schema_registry_updated_at
  BEFORE UPDATE ON public.form_schema_registry
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_navigation_blueprints_updated_at
  BEFORE UPDATE ON public.navigation_blueprints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_messaging_catalog_updated_at
  BEFORE UPDATE ON public.messaging_catalog
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reporting_blueprints_updated_at
  BEFORE UPDATE ON public.reporting_blueprints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Função para aplicar flags do segmento ao tenant
CREATE OR REPLACE FUNCTION public.apply_segment_flags(p_tenant_id uuid, p_segmento text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Inserir ou atualizar flags baseadas no capability_matrix
  INSERT INTO tenant_feature_flags (tenant_id, recurso, enabled, origem)
  SELECT p_tenant_id, cm.recurso, cm.flag_default, 'segmento'
  FROM capability_matrix cm
  WHERE cm.codigo_segmento = p_segmento
  ON CONFLICT (tenant_id, recurso) 
  DO UPDATE SET 
    enabled = EXCLUDED.enabled,
    origem = 'segmento',
    atualizado_em = now()
  WHERE tenant_feature_flags.origem = 'segmento'; -- Não sobrescrever customizações manuais
END;
$$;
