-- ============================================================
-- CLINFLOW DATABASE - COMPLETE SQL SCHEMA
-- Generated: 2024-12-04
-- Version: 2.0 - Multi-Unit Organizations + WhatsApp Outbox + Segment Engine
-- ============================================================

-- ============================================================
-- 1. EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

-- ============================================================
-- 2. CUSTOM ENUM TYPES
-- ============================================================
CREATE TYPE public.appointment_status AS ENUM (
  'agendado',
  'confirmado',
  'em_atendimento',
  'concluido',
  'cancelado',
  'falta'
);

CREATE TYPE public.message_channel AS ENUM (
  'whatsapp',
  'email',
  'sms'
);

CREATE TYPE public.message_status AS ENUM (
  'pendente',
  'enviado',
  'entregue',
  'erro'
);

CREATE TYPE public.modo_agendamento AS ENUM (
  'por_profissional',
  'por_clinica_sala',
  'por_recurso',
  'por_localizacao',
  'externo',
  'misto'
);

CREATE TYPE public.support_role AS ENUM (
  'master',
  'admin',
  'agente',
  'financeiro',
  'leitura'
);

CREATE TYPE public.support_ticket_priority AS ENUM (
  'low',
  'medium',
  'high',
  'urgent'
);

CREATE TYPE public.support_ticket_status AS ENUM (
  'open',
  'in_progress',
  'waiting_customer',
  'resolved',
  'closed'
);

CREATE TYPE public.system_role AS ENUM (
  'master',
  'support',
  'client',
  'support_basic',
  'support_intermediate'
);

CREATE TYPE public.tenant_status AS ENUM (
  'ativo',
  'suspenso',
  'trial'
);

CREATE TYPE public.tenant_type AS ENUM (
  'profissional',
  'clinica',
  'consultorio'
);

CREATE TYPE public.theme_preference AS ENUM (
  'claro',
  'escuro'
);

CREATE TYPE public.tipo_exame_procedimento AS ENUM (
  'exame_laboratorial',
  'exame_imagem',
  'procedimento_cirurgico',
  'procedimento_terapeutico',
  'procedimento_diagnostico'
);

CREATE TYPE public.user_role AS ENUM (
  'admin',
  'profissional',
  'recepcao',
  'paciente'
);

CREATE TYPE public.user_status AS ENUM (
  'ativo',
  'suspenso',
  'pendente'
);

CREATE TYPE public.org_role AS ENUM (
  'org_admin',
  'org_finance',
  'unit_admin',
  'unit_finance',
  'atendimento',
  'leitura'
);

-- ============================================================
-- 3. TABLES
-- ============================================================

-- ============================================================
-- 3.1 ORGANIZATIONS & MULTI-UNIT STRUCTURE
-- ============================================================

-- Organizations (Parent entity for multi-unit)
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_fantasia TEXT NOT NULL,
  razao_social TEXT,
  documento TEXT,
  pais TEXT DEFAULT 'BR',
  moeda TEXT DEFAULT 'BRL',
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  logo_url TEXT,
  status TEXT DEFAULT 'ativo',
  plano_base TEXT DEFAULT 'pro',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Units (Branches/Locations within an organization)
CREATE TABLE public.units (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cnpj TEXT,
  telefone TEXT,
  email TEXT,
  endereco JSONB,
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  horario_funcionamento JSONB DEFAULT '{"seg":{"inicio":"08:00","fim":"18:00"},"ter":{"inicio":"08:00","fim":"18:00"},"qua":{"inicio":"08:00","fim":"18:00"},"qui":{"inicio":"08:00","fim":"18:00"},"sex":{"inicio":"08:00","fim":"18:00"}}'::jsonb,
  configuracoes_override JSONB DEFAULT '{}'::jsonb,
  whatsapp_phone_number_id TEXT,
  whatsapp_business_account_id TEXT,
  status TEXT DEFAULT 'ativo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Unit Roles (User roles per unit)
CREATE TABLE public.unit_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role public.org_role NOT NULL DEFAULT 'atendimento',
  permissions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, unit_id)
);

-- Unit Policies (Configuration inheritance and overrides)
CREATE TABLE public.unit_policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE UNIQUE,
  inherit_services BOOLEAN DEFAULT true,
  inherit_payment_methods BOOLEAN DEFAULT true,
  inherit_messaging BOOLEAN DEFAULT true,
  local_services_enabled BOOLEAN DEFAULT false,
  local_payment_methods_enabled BOOLEAN DEFAULT false,
  local_messaging_enabled BOOLEAN DEFAULT false,
  custom_policies JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Appointment Transfers (Between units)
CREATE TABLE public.appointment_transfers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL,
  from_unit_id UUID NOT NULL REFERENCES public.units(id),
  to_unit_id UUID NOT NULL REFERENCES public.units(id),
  transferred_by UUID,
  motivo TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================================
-- 3.2 TENANTS & USERS
-- ============================================================

-- Tenants (Multi-tenant base)
CREATE TABLE public.tenants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  nome_fantasia TEXT,
  razao_social TEXT,
  tipo public.tenant_type NOT NULL DEFAULT 'profissional',
  status public.tenant_status NOT NULL DEFAULT 'ativo',
  email TEXT,
  telefone TEXT NOT NULL,
  cnpj TEXT,
  cidade TEXT NOT NULL,
  uf TEXT NOT NULL,
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  logo_url TEXT,
  cor_primaria TEXT DEFAULT '#016CA5',
  cor_acao TEXT DEFAULT '#25D366',
  segmentos TEXT[] DEFAULT '{}'::text[],
  modo_agendamento public.modo_agendamento DEFAULT 'por_profissional',
  antecedencia_minima_horas INTEGER DEFAULT 12,
  janela_agendamento_dias INTEGER DEFAULT 21,
  reagendamento_permitido_horas INTEGER DEFAULT 3,
  overbooking_ativo BOOLEAN DEFAULT false,
  whatsapp_ativo BOOLEAN DEFAULT true,
  email_ativo BOOLEAN DEFAULT true,
  sms_ativo BOOLEAN DEFAULT false,
  whatsapp_configurado BOOLEAN DEFAULT false,
  whatsapp_verificado BOOLEAN DEFAULT false,
  whatsapp_verificado_em TIMESTAMP WITH TIME ZONE,
  whatsapp_phone_number_id TEXT,
  whatsapp_business_account_id TEXT,
  callmebot_phone TEXT,
  callmebot_apikey TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- System Users (Support/Admin users)
CREATE TABLE public.system_users (
  id UUID NOT NULL PRIMARY KEY,
  system_role public.system_role NOT NULL DEFAULT 'client',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Profiles (Users within tenants)
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id),
  organization_id UUID REFERENCES public.organizations(id),
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT,
  role public.user_role NOT NULL DEFAULT 'admin',
  avatar_url TEXT,
  especialidade TEXT,
  registro_profissional TEXT,
  bio TEXT,
  pode_alterar_valores BOOLEAN DEFAULT false,
  tipo_profissional_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tenant Profile (Extended tenant configuration)
CREATE TABLE public.tenant_profile (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE UNIQUE,
  segmento_principal TEXT NOT NULL,
  subsegmentos TEXT[] DEFAULT '{}'::text[],
  onboarding_status TEXT DEFAULT 'novo',
  onboarding_step INTEGER DEFAULT 0,
  configuracoes_segmento JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tenant Feature Flags
CREATE TABLE public.tenant_feature_flags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  recurso TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT false,
  customizado BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(tenant_id, recurso)
);

-- Usuarios Suporte
CREATE TABLE public.usuarios_suporte (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_user_id UUID UNIQUE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  telefone TEXT,
  foto_url TEXT,
  status public.user_status DEFAULT 'ativo',
  funcoes public.support_role[] DEFAULT '{agente}'::support_role[],
  tema public.theme_preference DEFAULT 'claro',
  forcar_troca_senha BOOLEAN DEFAULT false,
  senha_temporaria TEXT,
  ultimo_acesso TIMESTAMP WITH TIME ZONE,
  dashboard_filters JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================================
-- 3.3 PLANS & SUBSCRIPTIONS
-- ============================================================

-- Plans
CREATE TABLE public.plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_monthly NUMERIC NOT NULL,
  price_yearly NUMERIC,
  features JSONB DEFAULT '[]'::jsonb,
  limits JSONB DEFAULT '{}'::jsonb,
  active BOOLEAN DEFAULT true,
  stripe_price_id TEXT,
  stripe_price_yearly_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Features
CREATE TABLE public.features (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT,
  is_core BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Plan Features (junction table)
CREATE TABLE public.plan_features (
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  feature_id UUID NOT NULL REFERENCES public.features(id) ON DELETE CASCADE,
  PRIMARY KEY (plan_id, feature_id)
);

-- Subscriptions
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.plans(id),
  status TEXT NOT NULL DEFAULT 'active',
  billing_cycle TEXT NOT NULL DEFAULT 'monthly',
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  trial_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tenant Permissions
CREATE TABLE public.tenant_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  feature_id UUID NOT NULL REFERENCES public.features(id),
  granted_by UUID,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================================
-- 3.4 SEGMENT CONFIGURATION SYSTEM
-- ============================================================

-- Capability Matrix (Features per segment)
CREATE TABLE public.capability_matrix (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo_segmento TEXT NOT NULL,
  recurso TEXT NOT NULL,
  flag BOOLEAN DEFAULT false,
  flag_default BOOLEAN DEFAULT false,
  categoria TEXT,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(codigo_segmento, recurso)
);

-- Navigation Blueprints (Menu items per segment)
CREATE TABLE public.navigation_blueprints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo_segmento TEXT NOT NULL,
  menu_item TEXT NOT NULL,
  path TEXT NOT NULL,
  icone TEXT,
  parent_menu TEXT,
  ordem INTEGER DEFAULT 0,
  recurso_requerido TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Form Schema Registry (Dynamic forms per segment)
CREATE TABLE public.form_schema_registry (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo_segmento TEXT NOT NULL,
  tipo TEXT NOT NULL,
  schema_json JSONB DEFAULT '{}'::jsonb,
  ordem INTEGER,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Messaging Catalog (Templates per segment)
CREATE TABLE public.messaging_catalog (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo_segmento TEXT NOT NULL,
  categoria TEXT NOT NULL,
  canal TEXT NOT NULL,
  template_nome TEXT NOT NULL,
  template_body TEXT NOT NULL,
  placeholders JSONB,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================================
-- 3.5 CLINICAL DATA
-- ============================================================

-- Tipos Profissional
CREATE TABLE public.tipos_profissional (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  cor TEXT DEFAULT '#6366f1',
  icone TEXT DEFAULT 'User',
  acesso_prontuarios BOOLEAN DEFAULT false,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Especialidades
CREATE TABLE public.especialidades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  codigo_cfm TEXT,
  conselho TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Servicos
CREATE TABLE public.servicos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id),
  unit_id UUID REFERENCES public.units(id),
  nome TEXT NOT NULL,
  descricao TEXT,
  duracao_minutos INTEGER NOT NULL DEFAULT 30,
  preco NUMERIC,
  cor TEXT DEFAULT '#6366f1',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Pacientes
CREATE TABLE public.pacientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id),
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  cpf TEXT,
  data_nascimento DATE,
  sexo TEXT,
  endereco JSONB,
  profissao TEXT,
  estado_civil TEXT,
  responsavel_nome TEXT,
  responsavel_telefone TEXT,
  responsavel_parentesco TEXT,
  plano_saude_id UUID,
  numero_carteirinha TEXT,
  notas_internas TEXT,
  consentimento_lgpd BOOLEAN DEFAULT false,
  consentimento_data TIMESTAMP WITH TIME ZONE,
  risco_no_show INTEGER DEFAULT 0,
  historico_faltas INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Planos de Saúde
CREATE TABLE public.planos_saude (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  codigo TEXT,
  tipo TEXT,
  telefone TEXT,
  email TEXT,
  site TEXT,
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Plano Saúde Valores
CREATE TABLE public.plano_saude_valores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  plano_saude_id UUID NOT NULL REFERENCES public.planos_saude(id) ON DELETE CASCADE,
  servico_id UUID REFERENCES public.servicos(id) ON DELETE CASCADE,
  exame_procedimento_id UUID,
  valor NUMERIC NOT NULL,
  dias_recebimento INTEGER NOT NULL DEFAULT 30,
  vigencia_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  vigencia_fim DATE,
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Prontuários
CREATE TABLE public.prontuarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  profissional_id UUID NOT NULL REFERENCES public.profiles(id),
  agendamento_id UUID,
  data_atendimento TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  queixa_principal TEXT,
  historia_doenca_atual TEXT,
  antecedentes_pessoais TEXT,
  antecedentes_familiares TEXT,
  habitos_vida TEXT,
  exame_fisico JSONB,
  sinais_vitais JSONB,
  hipotese_diagnostica TEXT,
  cid10 TEXT[],
  conduta TEXT,
  prescricoes JSONB,
  exames_solicitados JSONB,
  encaminhamentos TEXT,
  observacoes TEXT,
  status TEXT DEFAULT 'rascunho',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Exames/Procedimentos
CREATE TABLE public.exames_procedimentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo public.tipo_exame_procedimento NOT NULL,
  descricao TEXT,
  codigo_tuss TEXT,
  valor NUMERIC,
  duracao_minutos INTEGER,
  instrucoes TEXT,
  requisitos TEXT,
  tempo_jejum_horas INTEGER,
  tempo_preparo_minutos INTEGER,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Exames (legacy)
CREATE TABLE public.exames (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  codigo_tuss TEXT,
  preco NUMERIC,
  duracao_minutos INTEGER,
  instrucoes TEXT,
  requisitos TEXT,
  tempo_jejum_horas INTEGER,
  tempo_preparo_minutos INTEGER,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Procedimentos (legacy)
CREATE TABLE public.procedimentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  codigo_tuss TEXT,
  valor NUMERIC,
  duracao_minutos INTEGER,
  anestesia_necessaria BOOLEAN DEFAULT false,
  tipo_anestesia TEXT,
  instrucoes_preparo TEXT,
  instrucoes_pos TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================================
-- 3.6 SCHEDULING
-- ============================================================

-- Agenda (Appointments)
CREATE TABLE public.agenda (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id),
  unit_id UUID REFERENCES public.units(id),
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  servico_id UUID NOT NULL REFERENCES public.servicos(id),
  profissional_id UUID REFERENCES public.profiles(id),
  especialidade_id UUID REFERENCES public.especialidades(id),
  sala TEXT,
  inicio TIMESTAMP WITH TIME ZONE NOT NULL,
  fim TIMESTAMP WITH TIME ZONE NOT NULL,
  status public.appointment_status DEFAULT 'agendado',
  origem TEXT DEFAULT 'recepção',
  tipo_atendimento TEXT DEFAULT 'plano',
  confirmado BOOLEAN DEFAULT false,
  confirmado_em TIMESTAMP WITH TIME ZONE,
  notas TEXT,
  ordem INTEGER,
  paciente_pacote_id UUID,
  valor_consulta NUMERIC,
  forma_pagamento_id UUID,
  conta_pix_id UUID,
  plano_saude_id UUID REFERENCES public.planos_saude(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Alertas Risco
CREATE TABLE public.alertas_risco (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  prioridade TEXT NOT NULL DEFAULT 'media',
  titulo TEXT NOT NULL,
  descricao TEXT,
  paciente_id UUID REFERENCES public.pacientes(id),
  agendamento_id UUID REFERENCES public.agenda(id),
  lido BOOLEAN DEFAULT false,
  lido_em TIMESTAMP WITH TIME ZONE,
  lido_por UUID,
  resolvido BOOLEAN DEFAULT false,
  resolvido_em TIMESTAMP WITH TIME ZONE,
  resolvido_por UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Lista de Espera
CREATE TABLE public.lista_espera (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  servico_id UUID REFERENCES public.servicos(id),
  profissional_id UUID REFERENCES public.profiles(id),
  preferencia_data_inicio DATE,
  preferencia_data_fim DATE,
  preferencia_hora_inicio TIME,
  preferencia_hora_fim TIME,
  prioridade INTEGER DEFAULT 1,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Ofertas de Vaga
CREATE TABLE public.ofertas_vaga (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  lista_espera_id UUID NOT NULL REFERENCES public.lista_espera(id) ON DELETE CASCADE,
  agendamento_id UUID,
  horario_ofertado TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'pendente',
  expira_em TIMESTAMP WITH TIME ZONE NOT NULL,
  respondido_em TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Métricas Lista Espera
CREATE TABLE public.metricas_lista_espera (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  total_lista INTEGER DEFAULT 0,
  ofertas_enviadas INTEGER DEFAULT 0,
  ofertas_aceitas INTEGER DEFAULT 0,
  ofertas_recusadas INTEGER DEFAULT 0,
  ofertas_expiradas INTEGER DEFAULT 0,
  tempo_medio_resposta_minutos INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(tenant_id, data)
);

-- Remarcacao Sugestoes
CREATE TABLE public.remarcacao_sugestoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  agendamento_id UUID NOT NULL REFERENCES public.agenda(id) ON DELETE CASCADE,
  horario_sugerido TIMESTAMP WITH TIME ZONE NOT NULL,
  score NUMERIC DEFAULT 0,
  motivo_score TEXT,
  status TEXT DEFAULT 'pendente',
  respondido_em TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Métricas Remarcação
CREATE TABLE public.metricas_remarcacao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  remarcacoes_solicitadas INTEGER DEFAULT 0,
  remarcacoes_automaticas INTEGER DEFAULT 0,
  remarcacoes_manuais INTEGER DEFAULT 0,
  taxa_automacao NUMERIC DEFAULT 0,
  tempo_medio_remarcacao_minutos INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(tenant_id, data)
);

-- Paciente Preferências Horário
CREATE TABLE public.paciente_preferencias_horario (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  dias_semana_preferidos INTEGER[] DEFAULT '{1,2,3,4,5}'::integer[],
  periodo_preferido TEXT,
  horario_min TIME,
  horario_max TIME,
  historico_agendamentos JSONB DEFAULT '[]'::jsonb,
  taxa_comparecimento NUMERIC DEFAULT 100.00,
  ultima_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================================
-- 3.7 FINANCIAL
-- ============================================================

-- Formas de Pagamento
CREATE TABLE public.formas_pagamento (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL,
  ordem INTEGER,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Contas PIX
CREATE TABLE public.contas_pix (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  chave_pix TEXT NOT NULL,
  tipo_chave TEXT NOT NULL,
  banco TEXT,
  titular TEXT,
  ativo BOOLEAN DEFAULT true,
  padrao BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Pacotes
CREATE TABLE public.pacotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  servico_id UUID REFERENCES public.servicos(id),
  numero_sessoes INTEGER NOT NULL,
  preco NUMERIC NOT NULL,
  validade_dias INTEGER DEFAULT 90,
  renovacao_automatica BOOLEAN DEFAULT false,
  desconto_renovacao NUMERIC DEFAULT 0,
  limiar_renovacao INTEGER DEFAULT 2,
  oferta_renovacao_ativa BOOLEAN DEFAULT true,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Pacientes Pacotes (vínculo)
CREATE TABLE public.pacientes_pacotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  pacote_id UUID NOT NULL REFERENCES public.pacotes(id) ON DELETE CASCADE,
  sessoes_totais INTEGER NOT NULL,
  sessoes_utilizadas INTEGER DEFAULT 0,
  sessoes_restantes INTEGER GENERATED ALWAYS AS (sessoes_totais - sessoes_utilizadas) STORED,
  data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  data_validade DATE,
  valor_pago NUMERIC,
  forma_pagamento_id UUID REFERENCES public.formas_pagamento(id),
  status TEXT DEFAULT 'ativo',
  renovacao_automatica BOOLEAN DEFAULT false,
  oferta_renovacao_enviada BOOLEAN DEFAULT false,
  notificacao_renovacao_enviada BOOLEAN DEFAULT false,
  ultima_notificacao TIMESTAMP WITH TIME ZONE,
  ultimo_uso_em TIMESTAMP WITH TIME ZONE,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Histórico Uso Pacotes
CREATE TABLE public.historico_uso_pacotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  paciente_pacote_id UUID NOT NULL REFERENCES public.pacientes_pacotes(id) ON DELETE CASCADE,
  agendamento_id UUID REFERENCES public.agenda(id),
  data_uso DATE NOT NULL DEFAULT CURRENT_DATE,
  sessoes_antes INTEGER NOT NULL,
  sessoes_depois INTEGER NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Caixa Diário
CREATE TABLE public.caixa_diario (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id),
  unit_id UUID REFERENCES public.units(id),
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  tipo_lancamento TEXT NOT NULL,
  descricao TEXT,
  valor NUMERIC NOT NULL,
  forma_pagamento TEXT,
  paciente_id UUID REFERENCES public.pacientes(id),
  agendamento_id UUID REFERENCES public.agenda(id),
  profissional_id UUID REFERENCES public.profiles(id),
  conta_pix_id UUID REFERENCES public.contas_pix(id),
  conta_receber_id UUID,
  observacoes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Contas a Receber
CREATE TABLE public.contas_receber (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id),
  unit_id UUID REFERENCES public.units(id),
  agendamento_id UUID REFERENCES public.agenda(id),
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id),
  plano_saude_id UUID REFERENCES public.planos_saude(id),
  valor NUMERIC NOT NULL,
  data_vencimento DATE NOT NULL,
  data_recebimento DATE,
  valor_recebido NUMERIC,
  forma_recebimento_id UUID REFERENCES public.formas_pagamento(id),
  conta_pix_id UUID REFERENCES public.contas_pix(id),
  numero_guia TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  observacoes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Categorias Despesa
CREATE TABLE public.categorias_despesa (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Fornecedores
CREATE TABLE public.fornecedores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome_fantasia TEXT NOT NULL,
  razao_social TEXT,
  documento TEXT,
  telefone TEXT,
  email TEXT,
  endereco JSONB,
  status TEXT DEFAULT 'ativo',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================================
-- 3.8 BILLING & CREDITS
-- ============================================================

-- Credit Packages
CREATE TABLE public.credit_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  quantidade_creditos INTEGER NOT NULL,
  preco_base NUMERIC NOT NULL,
  preco_venda NUMERIC NOT NULL,
  markup_percentual NUMERIC NOT NULL,
  ativo BOOLEAN DEFAULT true,
  destaque BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tenant Credit Transactions
CREATE TABLE public.tenant_credit_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  quantidade INTEGER NOT NULL,
  preco_unitario NUMERIC,
  valor_total NUMERIC,
  saldo_anterior INTEGER NOT NULL,
  saldo_novo INTEGER NOT NULL,
  motivo TEXT,
  expirado BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tenant WhatsApp Credits
CREATE TABLE public.tenant_whatsapp_credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE UNIQUE,
  creditos_mensais INTEGER DEFAULT 0,
  creditos_avulsos INTEGER DEFAULT 0,
  creditos_usados_mes INTEGER DEFAULT 0,
  ultimo_reset TIMESTAMP WITH TIME ZONE DEFAULT now(),
  creditos_expirando DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Phone Number Packages
CREATE TABLE public.phone_number_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  quantidade_numeros INTEGER NOT NULL DEFAULT 1,
  preco_mensal NUMERIC NOT NULL,
  inclui_creditos INTEGER NOT NULL DEFAULT 0,
  destaque BOOLEAN NOT NULL DEFAULT false,
  ativo BOOLEAN NOT NULL DEFAULT true,
  moeda TEXT NOT NULL DEFAULT 'BRL',
  planos_permitidos TEXT[] NOT NULL DEFAULT '{pro,enterprise}'::text[],
  custo_provedor NUMERIC,
  markup_percentual NUMERIC DEFAULT 30.00,
  periodo_minimo_dias INTEGER DEFAULT 30,
  permite_cancelamento_imediato BOOLEAN DEFAULT false,
  stripe_price_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tenant Phone Subscriptions
CREATE TABLE public.tenant_phone_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES public.phone_number_packages(id),
  phone_number TEXT,
  phone_number_id TEXT,
  departamento TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  stripe_subscription_id TEXT,
  data_inicio TIMESTAMP WITH TIME ZONE DEFAULT now(),
  data_fim TIMESTAMP WITH TIME ZONE,
  cancelamento_solicitado_em TIMESTAMP WITH TIME ZONE,
  cancelamento_efetivo_em TIMESTAMP WITH TIME ZONE,
  motivo_cancelamento TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Precos Atual
CREATE TABLE public.precos_atual (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  categoria TEXT NOT NULL,
  preco_unitario NUMERIC NOT NULL,
  moeda TEXT NOT NULL DEFAULT 'BRL',
  vigencia_inicio TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  vigencia_fim TIMESTAMP WITH TIME ZONE,
  notas TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Historico Precos
CREATE TABLE public.historico_precos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  preco_id UUID REFERENCES public.precos_atual(id),
  categoria TEXT NOT NULL,
  preco_anterior NUMERIC,
  preco_novo NUMERIC NOT NULL,
  motivo TEXT,
  alterado_por UUID,
  validacao_ok BOOLEAN DEFAULT true,
  erros_validacao JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Markup Configs
CREATE TABLE public.markup_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id),
  plan_id UUID REFERENCES public.plans(id),
  categoria TEXT,
  margem_pct NUMERIC DEFAULT 0,
  vigencia_inicio TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  vigencia_fim TIMESTAMP WITH TIME ZONE,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- FX Rates
CREATE TABLE public.fx_rates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  moeda_origem TEXT NOT NULL DEFAULT 'USD',
  moeda_destino TEXT NOT NULL DEFAULT 'BRL',
  taxa NUMERIC NOT NULL,
  data_cotacao DATE NOT NULL DEFAULT CURRENT_DATE,
  fonte TEXT NOT NULL DEFAULT 'manual',
  override_manual BOOLEAN NOT NULL DEFAULT false,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Consumo Mensal
CREATE TABLE public.consumo_mensal (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  mes_referencia DATE NOT NULL,
  categoria TEXT NOT NULL,
  quantidade INTEGER DEFAULT 0,
  franquia INTEGER DEFAULT 0,
  excedente INTEGER DEFAULT 0,
  preco_unitario NUMERIC NOT NULL,
  total NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Faturas
CREATE TABLE public.faturas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  numero_fatura TEXT NOT NULL,
  mes_referencia DATE NOT NULL,
  data_emissao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data_vencimento DATE NOT NULL,
  valor_plano NUMERIC NOT NULL DEFAULT 0,
  valor_excedente NUMERIC NOT NULL DEFAULT 0,
  valor_total NUMERIC NOT NULL,
  moeda TEXT NOT NULL DEFAULT 'BRL',
  status TEXT NOT NULL DEFAULT 'pendente',
  link_pagamento TEXT,
  pago_em TIMESTAMP WITH TIME ZONE,
  notas_fiscais JSONB,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Itens Fatura
CREATE TABLE public.itens_fatura (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fatura_id UUID NOT NULL REFERENCES public.faturas(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  categoria TEXT NOT NULL,
  quantidade INTEGER NOT NULL,
  preco_unitario NUMERIC NOT NULL,
  total NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Dunning Configs
CREATE TABLE public.dunning_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dias_atraso INTEGER NOT NULL,
  acao TEXT NOT NULL,
  canal_notificacao TEXT[] DEFAULT '{email}'::text[],
  template_mensagem TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Historico Dunning
CREATE TABLE public.historico_dunning (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  fatura_id UUID NOT NULL REFERENCES public.faturas(id) ON DELETE CASCADE,
  dias_atraso INTEGER NOT NULL,
  acao_tomada TEXT NOT NULL,
  canal TEXT NOT NULL,
  mensagem_enviada TEXT,
  sucesso BOOLEAN DEFAULT true,
  erro_mensagem TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================================
-- 3.9 WHATSAPP SYSTEM
-- ============================================================

-- WhatsApp Conversations
CREATE TABLE public.whatsapp_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  wa_conversation_id TEXT,
  telefone TEXT NOT NULL,
  nome_contato TEXT,
  paciente_id UUID REFERENCES public.pacientes(id),
  atribuido_a UUID REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'ativo',
  ultima_mensagem_em TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- WhatsApp Messages
CREATE TABLE public.whatsapp_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
  wa_message_id TEXT,
  direcao TEXT NOT NULL,
  sender_id UUID,
  sender_type TEXT,
  conteudo TEXT NOT NULL,
  tipo_mensagem TEXT DEFAULT 'text',
  midia_url TEXT,
  status TEXT DEFAULT 'pendente',
  template_name TEXT,
  template_params JSONB,
  erro_mensagem TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- WhatsApp Outbox (Queue for sending)
CREATE TABLE public.whatsapp_outbox (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  phone_to TEXT NOT NULL,
  template_name TEXT NOT NULL,
  template_params JSONB DEFAULT '{}'::jsonb,
  idempotency_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'queued',
  retries INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  last_error TEXT,
  next_retry_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  wa_message_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- WhatsApp Send Log (Audit trail)
CREATE TABLE public.whatsapp_send_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  outbox_id UUID REFERENCES public.whatsapp_outbox(id),
  tenant_id UUID NOT NULL,
  phone_to TEXT NOT NULL,
  template_name TEXT NOT NULL,
  status TEXT NOT NULL,
  wa_message_id TEXT,
  error_message TEXT,
  latency_ms INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tenant WhatsApp Config
CREATE TABLE public.tenant_whatsapp_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE UNIQUE,
  max_messages_per_minute INTEGER DEFAULT 30,
  max_messages_per_hour INTEGER DEFAULT 500,
  max_messages_per_day INTEGER DEFAULT 5000,
  silence_start_hour INTEGER,
  silence_end_hour INTEGER,
  require_marketing_consent BOOLEAN DEFAULT true,
  require_operational_consent BOOLEAN DEFAULT false,
  auto_reply_enabled BOOLEAN DEFAULT false,
  auto_reply_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- WhatsApp Rate Limits
CREATE TABLE public.whatsapp_rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  max_messages_per_minute INTEGER DEFAULT 80,
  max_messages_per_hour INTEGER DEFAULT 1000,
  max_messages_per_day INTEGER DEFAULT 10000,
  current_minute_count INTEGER DEFAULT 0,
  current_hour_count INTEGER DEFAULT 0,
  current_day_count INTEGER DEFAULT 0,
  last_reset_minute TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_reset_hour TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_reset_day TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_throttled BOOLEAN DEFAULT false,
  throttle_reason TEXT,
  silence_start_hour INTEGER,
  silence_end_hour INTEGER,
  auto_throttle_enabled BOOLEAN DEFAULT true,
  throttle_on_optout_rate NUMERIC DEFAULT 0.10,
  throttle_on_block_rate NUMERIC DEFAULT 0.05,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, phone_number)
);

-- WhatsApp Metrics
CREATE TABLE public.whatsapp_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  periodo TIMESTAMP WITH TIME ZONE NOT NULL,
  mensagens_enviadas INTEGER DEFAULT 0,
  mensagens_entregues INTEGER DEFAULT 0,
  mensagens_lidas INTEGER DEFAULT 0,
  mensagens_falhadas INTEGER DEFAULT 0,
  erros_rede INTEGER DEFAULT 0,
  erros_template INTEGER DEFAULT 0,
  erros_numero_invalido INTEGER DEFAULT 0,
  erros_bloqueio INTEGER DEFAULT 0,
  erros_outros INTEGER DEFAULT 0,
  latencia_p50 INTEGER DEFAULT 0,
  latencia_p95 INTEGER DEFAULT 0,
  latencia_p99 INTEGER DEFAULT 0,
  tps_medio NUMERIC DEFAULT 0,
  tps_pico NUMERIC DEFAULT 0,
  optout_rate NUMERIC DEFAULT 0,
  block_rate NUMERIC DEFAULT 0,
  quality_rating TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- WhatsApp Alarms
CREATE TABLE public.whatsapp_alarms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id),
  alarm_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  severity TEXT NOT NULL,
  message TEXT NOT NULL,
  threshold_value NUMERIC NOT NULL,
  current_value NUMERIC NOT NULL,
  triggered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  acknowledged_by UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- WhatsApp DLQ (Dead Letter Queue)
CREATE TABLE public.whatsapp_dlq (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  original_message_id UUID,
  phone_number TEXT NOT NULL,
  message_content TEXT NOT NULL,
  template_name TEXT,
  template_params JSONB,
  error_type TEXT NOT NULL,
  error_message TEXT,
  attempt_count INTEGER DEFAULT 1,
  max_attempts INTEGER DEFAULT 3,
  next_retry_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- WhatsApp Reconciliation
CREATE TABLE public.whatsapp_reconciliation (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  meta_report_data JSONB NOT NULL,
  meta_total_messages INTEGER NOT NULL,
  meta_total_cost NUMERIC NOT NULL,
  internal_total_messages INTEGER NOT NULL,
  internal_total_cost NUMERIC NOT NULL,
  message_difference INTEGER,
  cost_difference NUMERIC,
  has_divergence BOOLEAN,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  correction_applied BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tenant WhatsApp Routing
CREATE TABLE public.tenant_whatsapp_routing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  usa_numero_compartilhado BOOLEAN NOT NULL DEFAULT true,
  ai_routing_enabled BOOLEAN NOT NULL DEFAULT true,
  ai_model TEXT NOT NULL DEFAULT 'gemini-2.5-flash',
  ai_system_prompt TEXT,
  menu_inicial_enabled BOOLEAN NOT NULL DEFAULT false,
  menu_opcoes JSONB DEFAULT '[]'::jsonb,
  fallback_departamento_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Lembrete Templates
CREATE TABLE public.lembrete_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  janela_horas INTEGER NOT NULL,
  variante TEXT NOT NULL DEFAULT 'A',
  formato TEXT NOT NULL DEFAULT 'whatsapp',
  assunto TEXT,
  corpo_mensagem TEXT NOT NULL,
  tipo_servico TEXT,
  ativo BOOLEAN DEFAULT true,
  score NUMERIC,
  taxa_confirmacao NUMERIC,
  total_envios INTEGER DEFAULT 0,
  total_confirmacoes INTEGER DEFAULT 0,
  recomendacao TEXT,
  criado_por UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Lembrete Configs
CREATE TABLE public.lembrete_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  tipo_servico TEXT NOT NULL,
  nivel_risco TEXT DEFAULT 'baixo',
  janelas_padrao INTEGER[] DEFAULT '{24,3}'::integer[],
  template_ids JSONB,
  ab_testing_ativo BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Lembrete Histórico
CREATE TABLE public.lembrete_historico (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  agendamento_id UUID NOT NULL REFERENCES public.agenda(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.lembrete_templates(id),
  janela_horas INTEGER NOT NULL,
  variante TEXT NOT NULL,
  enviado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
  confirmado BOOLEAN,
  confirmado_em TIMESTAMP WITH TIME ZONE,
  tempo_resposta_minutos INTEGER,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================================
-- 3.10 CONSENT & COMPLIANCE
-- ============================================================

-- Consent Records
CREATE TABLE public.consent_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL,
  contact_type TEXT DEFAULT 'paciente',
  consent_type TEXT NOT NULL,
  status TEXT NOT NULL,
  term_version TEXT NOT NULL,
  term_url TEXT,
  origin TEXT NOT NULL,
  given_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  revoked_at TIMESTAMP WITH TIME ZONE,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Anonymization Requests
CREATE TABLE public.anonymization_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL,
  contact_type TEXT NOT NULL,
  requested_by UUID NOT NULL,
  status TEXT DEFAULT 'pending',
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Data Retention Policies
CREATE TABLE public.data_retention_policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  retention_months INTEGER NOT NULL,
  description TEXT,
  last_cleanup_at TIMESTAMP WITH TIME ZONE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================================
-- 3.11 AUDIT & LOGGING
-- ============================================================

-- Auditoria
CREATE TABLE public.auditoria (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES public.profiles(id),
  acao TEXT NOT NULL,
  tabela TEXT,
  registro_id UUID,
  dados_anteriores JSONB,
  dados_novos JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Auditoria Admin
CREATE TABLE public.auditoria_admin (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID,
  tipo_evento TEXT NOT NULL,
  descricao TEXT,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Log Mensagens
CREATE TABLE public.log_mensagens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  paciente_id UUID REFERENCES public.pacientes(id),
  usuario_id UUID REFERENCES public.profiles(id),
  canal public.message_channel NOT NULL,
  destinatario TEXT NOT NULL,
  template_usado TEXT,
  status public.message_status DEFAULT 'pendente',
  erro_mensagem TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Message Audit
CREATE TABLE public.message_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  message_id UUID REFERENCES public.log_mensagens(id),
  actor_id UUID,
  actor_type TEXT NOT NULL,
  rota TEXT NOT NULL,
  status TEXT DEFAULT 'success',
  payload_hash TEXT NOT NULL,
  payload_preview JSONB,
  error_message TEXT,
  ip_address TEXT,
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- System Logs
CREATE TABLE public.system_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  service TEXT DEFAULT 'application',
  request_id UUID,
  user_id UUID,
  tenant_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Error Metrics
CREATE TABLE public.error_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  error_message TEXT,
  stack_trace TEXT,
  request_id UUID,
  user_id UUID,
  tenant_id UUID,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Export Audit
CREATE TABLE public.export_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  export_type TEXT NOT NULL,
  table_name TEXT,
  filters JSONB,
  record_count INTEGER,
  file_format TEXT,
  file_size_bytes INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================================
-- 3.12 SECURITY
-- ============================================================

-- Account Locks
CREATE TABLE public.account_locks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  locked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  locked_until TIMESTAMP WITH TIME ZONE NOT NULL,
  reason TEXT NOT NULL,
  failed_attempts INTEGER DEFAULT 0,
  alert_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Login Attempts
CREATE TABLE public.login_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  success BOOLEAN DEFAULT false,
  ip_address TEXT,
  user_agent TEXT,
  failure_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Two Factor Codes
CREATE TABLE public.two_factor_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================================
-- 3.13 SUPPORT SYSTEM
-- ============================================================

-- Support Tickets
CREATE TABLE public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero SERIAL,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  status public.support_ticket_status DEFAULT 'open',
  priority public.support_ticket_priority DEFAULT 'medium',
  assigned_to UUID,
  participantes UUID[] DEFAULT '{}'::uuid[],
  anexos JSONB DEFAULT '[]'::jsonb,
  tags TEXT[] DEFAULT '{}'::text[],
  origem TEXT DEFAULT 'manual',
  sla JSONB DEFAULT '{"inicio": null, "limite": null, "atingido": false}'::jsonb,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Support Messages
CREATE TABLE public.support_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL,
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Support Chat Sessions
CREATE TABLE public.support_chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_name TEXT,
  user_email TEXT,
  subject TEXT,
  status TEXT DEFAULT 'waiting',
  priority TEXT DEFAULT 'normal',
  assigned_agent_id UUID,
  assigned_agent_name TEXT,
  queue_position INTEGER,
  accepted_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  wait_time_seconds INTEGER,
  satisfaction_rating INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Support Chat Messages
CREATE TABLE public.support_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.support_chat_sessions(id) ON DELETE CASCADE,
  sender_id UUID,
  sender_type TEXT NOT NULL,
  sender_name TEXT,
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Support Macros
CREATE TABLE public.support_macros (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  categoria TEXT,
  atalho TEXT,
  ativo BOOLEAN DEFAULT true,
  uso_count INTEGER DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Support SLA Configs
CREATE TABLE public.support_sla_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prioridade TEXT NOT NULL UNIQUE,
  tempo_resposta_horas INTEGER NOT NULL DEFAULT 24,
  tempo_resolucao_horas INTEGER NOT NULL DEFAULT 72,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Support Metrics
CREATE TABLE public.support_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data DATE NOT NULL,
  tenant_id UUID REFERENCES public.tenants(id),
  tickets_abertos INTEGER DEFAULT 0,
  tickets_fechados INTEGER DEFAULT 0,
  tempo_medio_primeira_resposta_minutos INTEGER DEFAULT 0,
  slas_estourados INTEGER DEFAULT 0,
  chats_iniciados INTEGER DEFAULT 0,
  chats_finalizados INTEGER DEFAULT 0,
  tempo_medio_resolucao_horas NUMERIC DEFAULT 0,
  taxa_satisfacao NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(data, tenant_id)
);

-- Tenant Suporte
CREATE TABLE public.tenant_suporte (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE UNIQUE,
  contatos_suporte JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================================
-- 3.14 USER PREFERENCES
-- ============================================================

-- Dashboard Prefs
CREATE TABLE public.dashboard_prefs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  visible_cards JSONB DEFAULT '["appointments_today", "patients_waiting", "revenue_today", "pending_confirmations"]'::jsonb,
  card_order JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User Tour Preferences
CREATE TABLE public.user_tour_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  page_slug TEXT NOT NULL,
  tour_completed BOOLEAN DEFAULT false,
  tour_disabled BOOLEAN DEFAULT false,
  last_shown_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, page_slug)
);

-- Paciente Atribuicoes
CREATE TABLE public.paciente_atribuicoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  profissional_id UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(paciente_id, profissional_id)
);

-- ============================================================
-- 4. INDEXES
-- ============================================================

-- Agenda indexes
CREATE INDEX idx_agenda_tenant_data ON public.agenda USING btree (tenant_id, inicio DESC);
CREATE INDEX idx_agenda_profissional_data ON public.agenda USING btree (profissional_id, inicio) WHERE (status <> 'cancelado');
CREATE INDEX idx_agenda_especialidade ON public.agenda USING btree (especialidade_id);
CREATE INDEX idx_agenda_ordem ON public.agenda USING btree (tenant_id, ordem);
CREATE INDEX idx_agenda_paciente_pacote ON public.agenda USING btree (paciente_pacote_id);
CREATE INDEX idx_agenda_unit ON public.agenda USING btree (unit_id);
CREATE INDEX idx_agenda_organization ON public.agenda USING btree (organization_id);

-- Alertas Risco indexes
CREATE INDEX idx_alertas_risco_tenant ON public.alertas_risco USING btree (tenant_id);
CREATE INDEX idx_alertas_risco_paciente ON public.alertas_risco USING btree (paciente_id);
CREATE INDEX idx_alertas_risco_prioridade ON public.alertas_risco USING btree (prioridade);
CREATE INDEX idx_alertas_risco_resolvido ON public.alertas_risco USING btree (resolvido);
CREATE INDEX idx_alertas_lido_tenant ON public.alertas_risco USING btree (tenant_id, lido, created_at DESC);

-- Auditoria Admin indexes
CREATE INDEX idx_auditoria_admin_created_at ON public.auditoria_admin USING btree (created_at DESC);
CREATE INDEX idx_auditoria_admin_tipo_evento ON public.auditoria_admin USING btree (tipo_evento);
CREATE INDEX idx_auditoria_admin_usuario_id ON public.auditoria_admin USING btree (usuario_id);

-- Caixa Diario indexes
CREATE INDEX idx_caixa_diario_tenant_data ON public.caixa_diario USING btree (tenant_id, data);
CREATE INDEX idx_caixa_diario_profissional ON public.caixa_diario USING btree (profissional_id);
CREATE INDEX idx_caixa_diario_unit ON public.caixa_diario USING btree (unit_id);

-- Categorias Despesa indexes
CREATE INDEX idx_categorias_despesa_tenant_id ON public.categorias_despesa USING btree (tenant_id);
CREATE INDEX idx_categorias_despesa_ordem ON public.categorias_despesa USING btree (ordem);

-- Consent Records indexes
CREATE INDEX idx_consent_tenant ON public.consent_records USING btree (tenant_id);
CREATE INDEX idx_consent_contact ON public.consent_records USING btree (contact_id, contact_type);
CREATE INDEX idx_consent_status ON public.consent_records USING btree (status);

-- Contas a Receber indexes
CREATE INDEX idx_contas_receber_tenant ON public.contas_receber USING btree (tenant_id);
CREATE INDEX idx_contas_receber_status ON public.contas_receber USING btree (status);
CREATE INDEX idx_contas_receber_vencimento ON public.contas_receber USING btree (data_vencimento);
CREATE INDEX idx_contas_receber_plano ON public.contas_receber USING btree (plano_saude_id);

-- Faturas indexes
CREATE INDEX idx_faturas_tenant ON public.faturas USING btree (tenant_id);
CREATE INDEX idx_faturas_status ON public.faturas USING btree (status);
CREATE INDEX idx_faturas_mes_ref ON public.faturas USING btree (mes_referencia);

-- Lista Espera indexes
CREATE INDEX idx_lista_espera_tenant ON public.lista_espera USING btree (tenant_id);
CREATE INDEX idx_lista_espera_paciente ON public.lista_espera USING btree (paciente_id);
CREATE INDEX idx_lista_espera_ativo ON public.lista_espera USING btree (ativo);

-- Log Mensagens indexes
CREATE INDEX idx_log_mensagens_tenant ON public.log_mensagens USING btree (tenant_id);
CREATE INDEX idx_log_mensagens_paciente ON public.log_mensagens USING btree (paciente_id);
CREATE INDEX idx_log_mensagens_created ON public.log_mensagens USING btree (created_at DESC);

-- Pacientes indexes
CREATE INDEX idx_pacientes_tenant ON public.pacientes USING btree (tenant_id);
CREATE INDEX idx_pacientes_nome ON public.pacientes USING btree (nome);
CREATE INDEX idx_pacientes_cpf ON public.pacientes USING btree (cpf);
CREATE INDEX idx_pacientes_telefone ON public.pacientes USING btree (telefone);
CREATE INDEX idx_pacientes_organization ON public.pacientes USING btree (organization_id);

-- Prontuarios indexes
CREATE INDEX idx_prontuarios_tenant ON public.prontuarios USING btree (tenant_id);
CREATE INDEX idx_prontuarios_paciente ON public.prontuarios USING btree (paciente_id);
CREATE INDEX idx_prontuarios_profissional ON public.prontuarios USING btree (profissional_id);
CREATE INDEX idx_prontuarios_data ON public.prontuarios USING btree (data_atendimento DESC);

-- Servicos indexes
CREATE INDEX idx_servicos_tenant ON public.servicos USING btree (tenant_id);
CREATE INDEX idx_servicos_ativo ON public.servicos USING btree (ativo);
CREATE INDEX idx_servicos_unit ON public.servicos USING btree (unit_id);

-- Support Tickets indexes
CREATE INDEX idx_support_tickets_tenant ON public.support_tickets USING btree (tenant_id);
CREATE INDEX idx_support_tickets_status ON public.support_tickets USING btree (status);
CREATE INDEX idx_support_tickets_assigned ON public.support_tickets USING btree (assigned_to);
CREATE INDEX idx_support_tickets_created ON public.support_tickets USING btree (created_at DESC);

-- System Logs indexes
CREATE INDEX idx_system_logs_level ON public.system_logs USING btree (level);
CREATE INDEX idx_system_logs_service ON public.system_logs USING btree (service);
CREATE INDEX idx_system_logs_created ON public.system_logs USING btree (created_at DESC);
CREATE INDEX idx_system_logs_tenant ON public.system_logs USING btree (tenant_id);

-- WhatsApp Conversations indexes
CREATE INDEX idx_whatsapp_conversations_tenant ON public.whatsapp_conversations USING btree (tenant_id);
CREATE INDEX idx_whatsapp_conversations_phone ON public.whatsapp_conversations USING btree (telefone);
CREATE INDEX idx_whatsapp_conversations_paciente ON public.whatsapp_conversations USING btree (paciente_id);

-- WhatsApp Messages indexes
CREATE INDEX idx_whatsapp_messages_conversation ON public.whatsapp_messages USING btree (conversation_id);
CREATE INDEX idx_whatsapp_messages_timestamp ON public.whatsapp_messages USING btree (timestamp DESC);
CREATE INDEX idx_whatsapp_messages_status ON public.whatsapp_messages USING btree (status);

-- WhatsApp Metrics indexes
CREATE INDEX idx_whatsapp_metrics_tenant ON public.whatsapp_metrics USING btree (tenant_id);
CREATE INDEX idx_whatsapp_metrics_periodo ON public.whatsapp_metrics USING btree (periodo);

-- WhatsApp Outbox indexes
CREATE INDEX idx_whatsapp_outbox_tenant ON public.whatsapp_outbox USING btree (tenant_id);
CREATE INDEX idx_whatsapp_outbox_status ON public.whatsapp_outbox USING btree (status);
CREATE INDEX idx_whatsapp_outbox_next_retry ON public.whatsapp_outbox USING btree (next_retry_at) WHERE status IN ('queued', 'error');
CREATE INDEX idx_whatsapp_outbox_created ON public.whatsapp_outbox USING btree (created_at DESC);

-- Tenant Feature Flags indexes
CREATE INDEX idx_tenant_feature_flags_tenant ON public.tenant_feature_flags USING btree (tenant_id);
CREATE INDEX idx_tenant_feature_flags_recurso ON public.tenant_feature_flags USING btree (recurso);

-- Capability Matrix indexes
CREATE INDEX idx_capability_matrix_segmento ON public.capability_matrix USING btree (codigo_segmento);

-- Navigation Blueprints indexes
CREATE INDEX idx_navigation_blueprints_segmento ON public.navigation_blueprints USING btree (codigo_segmento);

-- Units indexes
CREATE INDEX idx_units_organization ON public.units USING btree (organization_id);
CREATE INDEX idx_units_status ON public.units USING btree (status);

-- Unit Roles indexes
CREATE INDEX idx_unit_roles_user ON public.unit_roles USING btree (user_id);
CREATE INDEX idx_unit_roles_unit ON public.unit_roles USING btree (unit_id);
CREATE INDEX idx_unit_roles_organization ON public.unit_roles USING btree (organization_id);

-- ============================================================
-- 5. ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tipos_profissional ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.especialidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planos_saude ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plano_saude_valores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formas_pagamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contas_pix ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pacotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pacientes_pacotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_uso_pacotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alertas_risco ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lista_espera ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ofertas_vaga ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metricas_lista_espera ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prontuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caixa_diario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contas_receber ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias_despesa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exames_procedimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exames ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procedimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria_admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.log_mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.two_factor_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anonymization_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_retention_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.export_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios_suporte ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_macros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_sla_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_suporte ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.precos_atual ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_precos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.markup_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumo_mensal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_fatura ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dunning_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_dunning ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_whatsapp_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phone_number_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_phone_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_alarms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_dlq ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_reconciliation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remarcacao_sugestoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metricas_remarcacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paciente_preferencias_horario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paciente_atribuicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_prefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tour_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lembrete_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lembrete_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lembrete_historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_whatsapp_routing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capability_matrix ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.navigation_blueprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_schema_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messaging_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fx_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_send_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_whatsapp_config ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 6. HELPER FUNCTIONS
-- ============================================================

-- Get user tenant ID safely
CREATE OR REPLACE FUNCTION public.get_user_tenant_id(p_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM profiles WHERE id = p_user_id LIMIT 1;
$$;

-- Check if user has support access
CREATE OR REPLACE FUNCTION public.has_support_access(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM usuarios_suporte 
    WHERE auth_user_id = p_user_id 
    AND status = 'ativo'
  );
$$;

-- Get support level
CREATE OR REPLACE FUNCTION public.get_support_level(p_user_id UUID)
RETURNS public.system_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN 'master' = ANY(funcoes) THEN 'master'::system_role
      WHEN 'admin' = ANY(funcoes) THEN 'support'::system_role
      ELSE 'support_basic'::system_role
    END
  FROM usuarios_suporte 
  WHERE auth_user_id = p_user_id 
  AND status = 'ativo'
  LIMIT 1;
$$;

-- Check if user has support role
CREATE OR REPLACE FUNCTION public.has_support_role(p_user_id UUID, p_role public.support_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM usuarios_suporte 
    WHERE auth_user_id = p_user_id 
    AND status = 'ativo'
    AND p_role = ANY(funcoes)
  );
$$;

-- Check if user has unit access
CREATE OR REPLACE FUNCTION public.has_unit_access(p_user_id UUID, p_unit_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM unit_roles 
    WHERE user_id = p_user_id 
    AND unit_id = p_unit_id
  );
$$;

-- Check if user has org role
CREATE OR REPLACE FUNCTION public.has_org_role(p_user_id UUID, p_org_id UUID, p_roles public.org_role[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM unit_roles 
    WHERE user_id = p_user_id 
    AND organization_id = p_org_id
    AND role = ANY(p_roles)
  );
$$;

-- Check valid consent
CREATE OR REPLACE FUNCTION public.has_valid_consent(
  p_tenant_id UUID,
  p_contact_id UUID,
  p_consent_type TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM consent_records
    WHERE tenant_id = p_tenant_id
    AND contact_id = p_contact_id
    AND consent_type = p_consent_type
    AND status = 'active'
    AND (expires_at IS NULL OR expires_at > now())
    AND revoked_at IS NULL
  );
$$;

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Log system event
CREATE OR REPLACE FUNCTION public.log_system_event(
  p_level TEXT,
  p_message TEXT,
  p_service TEXT DEFAULT 'application',
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO system_logs (level, message, service, metadata)
  VALUES (p_level, p_message, p_service, p_metadata)
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- Debit WhatsApp credit
CREATE OR REPLACE FUNCTION public.debitar_credito_whatsapp(
  p_tenant_id UUID,
  p_quantidade INTEGER DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_credits RECORD;
  v_total_available INTEGER;
BEGIN
  SELECT * INTO v_credits 
  FROM tenant_whatsapp_credits 
  WHERE tenant_id = p_tenant_id 
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  v_total_available := COALESCE(v_credits.creditos_mensais, 0) + 
                       COALESCE(v_credits.creditos_avulsos, 0) - 
                       COALESCE(v_credits.creditos_usados_mes, 0);
  
  IF v_total_available < p_quantidade THEN
    RETURN FALSE;
  END IF;
  
  UPDATE tenant_whatsapp_credits 
  SET creditos_usados_mes = creditos_usados_mes + p_quantidade,
      updated_at = now()
  WHERE tenant_id = p_tenant_id;
  
  RETURN TRUE;
END;
$$;

-- Credit WhatsApp
CREATE OR REPLACE FUNCTION public.creditar_whatsapp(
  p_tenant_id UUID,
  p_quantidade INTEGER,
  p_tipo TEXT DEFAULT 'avulso'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_tipo = 'mensal' THEN
    UPDATE tenant_whatsapp_credits 
    SET creditos_mensais = creditos_mensais + p_quantidade,
        updated_at = now()
    WHERE tenant_id = p_tenant_id;
  ELSE
    UPDATE tenant_whatsapp_credits 
    SET creditos_avulsos = creditos_avulsos + p_quantidade,
        updated_at = now()
    WHERE tenant_id = p_tenant_id;
  END IF;
  
  IF NOT FOUND THEN
    INSERT INTO tenant_whatsapp_credits (tenant_id, creditos_mensais, creditos_avulsos)
    VALUES (
      p_tenant_id,
      CASE WHEN p_tipo = 'mensal' THEN p_quantidade ELSE 0 END,
      CASE WHEN p_tipo = 'avulso' THEN p_quantidade ELSE 0 END
    );
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Use package session
CREATE OR REPLACE FUNCTION public.usar_sessao_pacote(
  p_paciente_pacote_id UUID,
  p_agendamento_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pacote RECORD;
BEGIN
  SELECT * INTO v_pacote 
  FROM pacientes_pacotes 
  WHERE id = p_paciente_pacote_id 
  FOR UPDATE;
  
  IF NOT FOUND OR v_pacote.sessoes_restantes <= 0 THEN
    RETURN FALSE;
  END IF;
  
  -- Record usage
  INSERT INTO historico_uso_pacotes (
    tenant_id, paciente_pacote_id, agendamento_id, 
    sessoes_antes, sessoes_depois
  ) VALUES (
    v_pacote.tenant_id, p_paciente_pacote_id, p_agendamento_id,
    v_pacote.sessoes_utilizadas, v_pacote.sessoes_utilizadas + 1
  );
  
  -- Update package
  UPDATE pacientes_pacotes 
  SET sessoes_utilizadas = sessoes_utilizadas + 1,
      ultimo_uso_em = now(),
      updated_at = now()
  WHERE id = p_paciente_pacote_id;
  
  RETURN TRUE;
END;
$$;

-- ============================================================
-- 7. WHATSAPP OUTBOX FUNCTIONS
-- ============================================================

-- Enqueue WhatsApp message
CREATE OR REPLACE FUNCTION public.enqueue_whatsapp_message(
  p_tenant_id UUID,
  p_phone_to TEXT,
  p_template_name TEXT,
  p_template_params JSONB DEFAULT '{}'::jsonb,
  p_idempotency_key TEXT DEFAULT NULL,
  p_check_consent BOOLEAN DEFAULT true,
  p_consent_type TEXT DEFAULT 'marketing'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_outbox_id UUID;
  v_idempotency TEXT;
  v_has_consent BOOLEAN;
  v_config RECORD;
BEGIN
  -- Generate idempotency key if not provided
  v_idempotency := COALESCE(p_idempotency_key, gen_random_uuid()::text);
  
  -- Check for duplicate
  SELECT id INTO v_outbox_id 
  FROM whatsapp_outbox 
  WHERE idempotency_key = v_idempotency;
  
  IF FOUND THEN
    RETURN v_outbox_id;
  END IF;
  
  -- Check consent if required
  IF p_check_consent AND p_consent_type = 'marketing' THEN
    SELECT require_marketing_consent INTO v_has_consent
    FROM tenant_whatsapp_config
    WHERE tenant_id = p_tenant_id;
    
    IF v_has_consent IS TRUE THEN
      -- Look for valid consent
      SELECT EXISTS (
        SELECT 1 FROM consent_records
        WHERE tenant_id = p_tenant_id
        AND consent_type = 'marketing'
        AND status = 'active'
        AND (expires_at IS NULL OR expires_at > now())
        AND revoked_at IS NULL
      ) INTO v_has_consent;
      
      IF NOT v_has_consent THEN
        RAISE EXCEPTION 'Marketing consent required but not found';
      END IF;
    END IF;
  END IF;
  
  -- Insert into outbox
  INSERT INTO whatsapp_outbox (
    tenant_id, phone_to, template_name, template_params, 
    idempotency_key, status
  ) VALUES (
    p_tenant_id, p_phone_to, p_template_name, p_template_params,
    v_idempotency, 'queued'
  )
  RETURNING id INTO v_outbox_id;
  
  RETURN v_outbox_id;
END;
$$;

-- Get outbox batch for processing
CREATE OR REPLACE FUNCTION public.get_whatsapp_outbox_batch(
  p_batch_size INTEGER DEFAULT 50,
  p_tenant_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  tenant_id UUID,
  phone_to TEXT,
  template_name TEXT,
  template_params JSONB,
  retries INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id, o.tenant_id, o.phone_to, o.template_name, 
    o.template_params, o.retries
  FROM whatsapp_outbox o
  WHERE o.status IN ('queued', 'error')
  AND (o.next_retry_at IS NULL OR o.next_retry_at <= now())
  AND o.retries < o.max_retries
  AND (p_tenant_id IS NULL OR o.tenant_id = p_tenant_id)
  ORDER BY o.created_at ASC
  LIMIT p_batch_size
  FOR UPDATE SKIP LOCKED;
END;
$$;

-- Mark message as sent
CREATE OR REPLACE FUNCTION public.mark_whatsapp_sent(
  p_outbox_id UUID,
  p_wa_message_id TEXT DEFAULT NULL,
  p_latency_ms INTEGER DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_outbox RECORD;
BEGIN
  SELECT * INTO v_outbox FROM whatsapp_outbox WHERE id = p_outbox_id;
  
  UPDATE whatsapp_outbox
  SET status = 'sent',
      sent_at = now(),
      wa_message_id = p_wa_message_id,
      updated_at = now()
  WHERE id = p_outbox_id;
  
  -- Log the send
  INSERT INTO whatsapp_send_log (
    outbox_id, tenant_id, phone_to, template_name,
    status, wa_message_id, latency_ms
  ) VALUES (
    p_outbox_id, v_outbox.tenant_id, v_outbox.phone_to, v_outbox.template_name,
    'sent', p_wa_message_id, p_latency_ms
  );
END;
$$;

-- Mark message as error
CREATE OR REPLACE FUNCTION public.mark_whatsapp_error(
  p_outbox_id UUID,
  p_error_message TEXT,
  p_latency_ms INTEGER DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_outbox RECORD;
  v_new_status TEXT;
BEGIN
  SELECT * INTO v_outbox FROM whatsapp_outbox WHERE id = p_outbox_id;
  
  -- Determine if we should retry
  IF v_outbox.retries + 1 >= v_outbox.max_retries THEN
    v_new_status := 'failed';
  ELSE
    v_new_status := 'error';
  END IF;
  
  UPDATE whatsapp_outbox
  SET status = v_new_status,
      retries = retries + 1,
      last_error = p_error_message,
      next_retry_at = CASE 
        WHEN v_new_status = 'error' THEN 
          now() + (power(2, retries + 1) * interval '1 minute')
        ELSE NULL
      END,
      updated_at = now()
  WHERE id = p_outbox_id;
  
  -- Log the error
  INSERT INTO whatsapp_send_log (
    outbox_id, tenant_id, phone_to, template_name,
    status, error_message, latency_ms
  ) VALUES (
    p_outbox_id, v_outbox.tenant_id, v_outbox.phone_to, v_outbox.template_name,
    v_new_status, p_error_message, p_latency_ms
  );
END;
$$;

-- ============================================================
-- 8. SEGMENT ENGINE FUNCTIONS
-- ============================================================

-- Preview segment configuration
CREATE OR REPLACE FUNCTION public.preview_segment_config(p_segmento TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_features JSONB;
  v_menu JSONB;
BEGIN
  -- Get features for segment
  SELECT jsonb_agg(jsonb_build_object(
    'recurso', recurso,
    'ativo', flag_default,
    'categoria', categoria,
    'descricao', descricao
  ))
  INTO v_features
  FROM capability_matrix
  WHERE codigo_segmento = p_segmento;
  
  -- Get menu for segment
  SELECT jsonb_agg(jsonb_build_object(
    'menu_item', menu_item,
    'path', path,
    'icone', icone,
    'parent_menu', parent_menu,
    'ordem', ordem
  ) ORDER BY ordem)
  INTO v_menu
  FROM navigation_blueprints
  WHERE codigo_segmento = p_segmento
  AND ativo = true;
  
  RETURN jsonb_build_object(
    'segmento', p_segmento,
    'features', COALESCE(v_features, '[]'::jsonb),
    'menu', COALESCE(v_menu, '[]'::jsonb)
  );
END;
$$;

-- Change tenant segment
CREATE OR REPLACE FUNCTION public.change_tenant_segment(
  p_tenant_id UUID,
  p_novo_segmento TEXT,
  p_preservar_customizacoes BOOLEAN DEFAULT true
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_custom_flags TEXT[];
  v_result JSONB;
BEGIN
  -- Save custom flags if preserving
  IF p_preservar_customizacoes THEN
    SELECT array_agg(recurso)
    INTO v_custom_flags
    FROM tenant_feature_flags
    WHERE tenant_id = p_tenant_id
    AND customizado = true;
  END IF;
  
  -- Update tenant profile
  UPDATE tenant_profile
  SET segmento_principal = p_novo_segmento,
      updated_at = now()
  WHERE tenant_id = p_tenant_id;
  
  IF NOT FOUND THEN
    INSERT INTO tenant_profile (tenant_id, segmento_principal)
    VALUES (p_tenant_id, p_novo_segmento);
  END IF;
  
  -- Delete non-custom flags
  DELETE FROM tenant_feature_flags
  WHERE tenant_id = p_tenant_id
  AND (NOT p_preservar_customizacoes OR customizado = false);
  
  -- Insert new flags from capability matrix
  INSERT INTO tenant_feature_flags (tenant_id, recurso, ativo, customizado)
  SELECT 
    p_tenant_id,
    cm.recurso,
    cm.flag_default,
    false
  FROM capability_matrix cm
  WHERE cm.codigo_segmento = p_novo_segmento
  AND NOT EXISTS (
    SELECT 1 FROM tenant_feature_flags tf
    WHERE tf.tenant_id = p_tenant_id
    AND tf.recurso = cm.recurso
  )
  ON CONFLICT (tenant_id, recurso) DO NOTHING;
  
  -- Return result
  SELECT jsonb_build_object(
    'success', true,
    'segmento', p_novo_segmento,
    'customizacoes_preservadas', v_custom_flags
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- Get tenant menu based on features
CREATE OR REPLACE FUNCTION public.get_tenant_menu(p_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_segmento TEXT;
  v_menu JSONB;
BEGIN
  -- Get tenant segment
  SELECT segmento_principal INTO v_segmento
  FROM tenant_profile
  WHERE tenant_id = p_tenant_id;
  
  IF v_segmento IS NULL THEN
    v_segmento := 'saude'; -- Default
  END IF;
  
  -- Get filtered menu
  SELECT jsonb_agg(jsonb_build_object(
    'menu_item', nb.menu_item,
    'path', nb.path,
    'icone', nb.icone,
    'parent_menu', nb.parent_menu,
    'ordem', nb.ordem
  ) ORDER BY nb.ordem)
  INTO v_menu
  FROM navigation_blueprints nb
  WHERE nb.codigo_segmento = v_segmento
  AND nb.ativo = true
  AND (
    nb.recurso_requerido IS NULL
    OR EXISTS (
      SELECT 1 FROM tenant_feature_flags tf
      WHERE tf.tenant_id = p_tenant_id
      AND tf.recurso = nb.recurso_requerido
      AND tf.ativo = true
    )
  );
  
  RETURN COALESCE(v_menu, '[]'::jsonb);
END;
$$;

-- Check if tenant has feature
CREATE OR REPLACE FUNCTION public.tenant_has_feature(p_tenant_id UUID, p_recurso TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM tenant_feature_flags
    WHERE tenant_id = p_tenant_id
    AND recurso = p_recurso
    AND ativo = true
  );
$$;

-- ============================================================
-- 9. TRIGGERS
-- ============================================================

-- Updated_at triggers for all main tables
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pacientes_updated_at BEFORE UPDATE ON public.pacientes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agenda_updated_at BEFORE UPDATE ON public.agenda
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prontuarios_updated_at BEFORE UPDATE ON public.prontuarios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_servicos_updated_at BEFORE UPDATE ON public.servicos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_outbox_updated_at BEFORE UPDATE ON public.whatsapp_outbox
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_feature_flags_updated_at BEFORE UPDATE ON public.tenant_feature_flags
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON public.units
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 10. INITIAL DATA
-- ============================================================

-- Default SLA configs
INSERT INTO public.support_sla_configs (prioridade, tempo_resposta_horas, tempo_resolucao_horas)
VALUES 
  ('low', 48, 168),
  ('medium', 24, 72),
  ('high', 8, 24),
  ('urgent', 2, 8)
ON CONFLICT (prioridade) DO NOTHING;

-- Default plans
INSERT INTO public.plans (name, description, price_monthly, features, limits)
VALUES 
  ('Free', 'Plano gratuito para começar', 0, '["agenda_basica", "1_profissional"]'::jsonb, '{"profissionais": 1, "pacientes": 100, "whatsapp_mensagens": 0}'::jsonb),
  ('Standard', 'Plano para consultórios', 99, '["agenda_completa", "lembretes_whatsapp", "relatorios_basicos"]'::jsonb, '{"profissionais": 3, "pacientes": 500, "whatsapp_mensagens": 1000}'::jsonb),
  ('Pro', 'Plano profissional', 199, '["todas_features", "api_acesso", "suporte_prioritario"]'::jsonb, '{"profissionais": 10, "pacientes": 2000, "whatsapp_mensagens": 2000}'::jsonb),
  ('Enterprise', 'Plano empresarial', 499, '["todas_features", "multi_unidade", "api_ilimitado", "gerente_conta"]'::jsonb, '{"profissionais": -1, "pacientes": -1, "whatsapp_mensagens": 5000}'::jsonb)
ON CONFLICT DO NOTHING;

-- Default credit packages
INSERT INTO public.credit_packages (nome, descricao, quantidade_creditos, preco_base, preco_venda, markup_percentual)
VALUES 
  ('Pacote Inicial', '1.000 mensagens WhatsApp', 1000, 50, 70, 40),
  ('Pacote Básico', '2.000 mensagens WhatsApp', 2000, 90, 126, 40),
  ('Pacote Profissional', '3.000 mensagens WhatsApp', 3000, 120, 168, 40),
  ('Pacote Empresarial', '5.000 mensagens WhatsApp', 5000, 175, 245, 40)
ON CONFLICT DO NOTHING;

-- Default capability matrix for healthcare segment
INSERT INTO public.capability_matrix (codigo_segmento, recurso, flag, flag_default, categoria, descricao)
VALUES 
  ('saude', 'prontuarios', true, true, 'clinico', 'Prontuários eletrônicos'),
  ('saude', 'planos_saude', true, true, 'financeiro', 'Gestão de convênios'),
  ('saude', 'exames', true, true, 'clinico', 'Solicitação de exames'),
  ('saude', 'prescricoes', true, true, 'clinico', 'Prescrições médicas'),
  ('saude', 'atestados', true, true, 'clinico', 'Emissão de atestados'),
  ('estetica', 'pacotes_sessoes', true, true, 'financeiro', 'Pacotes de sessões'),
  ('estetica', 'fotos_evolucao', true, true, 'clinico', 'Fotos de evolução'),
  ('estetica', 'fichas_anamnese', true, true, 'clinico', 'Fichas de anamnese'),
  ('veterinaria', 'pet_prontuario', true, true, 'clinico', 'Prontuário veterinário'),
  ('veterinaria', 'vacinas', true, true, 'clinico', 'Controle de vacinas')
ON CONFLICT DO NOTHING;

-- Default navigation blueprints
INSERT INTO public.navigation_blueprints (codigo_segmento, menu_item, path, icone, parent_menu, ordem, recurso_requerido, ativo)
VALUES
  ('saude', 'Dashboard', '/', 'LayoutDashboard', NULL, 1, NULL, true),
  ('saude', 'Agenda', '/agenda', 'Calendar', NULL, 2, NULL, true),
  ('saude', 'Pacientes', '/pacientes', 'Users', NULL, 3, NULL, true),
  ('saude', 'Prontuários', '/prontuarios', 'FileText', NULL, 4, 'prontuarios', true),
  ('saude', 'Financeiro', '/financeiro', 'DollarSign', NULL, 5, NULL, true),
  ('estetica', 'Dashboard', '/', 'LayoutDashboard', NULL, 1, NULL, true),
  ('estetica', 'Agenda', '/agenda', 'Calendar', NULL, 2, NULL, true),
  ('estetica', 'Clientes', '/pacientes', 'Users', NULL, 3, NULL, true),
  ('estetica', 'Pacotes', '/pacotes', 'Package', NULL, 4, 'pacotes_sessoes', true),
  ('veterinaria', 'Dashboard', '/', 'LayoutDashboard', NULL, 1, NULL, true),
  ('veterinaria', 'Agenda', '/agenda', 'Calendar', NULL, 2, NULL, true),
  ('veterinaria', 'Pets', '/pacientes', 'PawPrint', NULL, 3, NULL, true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- END OF SCHEMA
-- ============================================================
