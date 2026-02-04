-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('admin', 'profissional', 'recepcao', 'paciente');
CREATE TYPE tenant_type AS ENUM ('profissional', 'clinica', 'consultorio');
CREATE TYPE modo_agendamento AS ENUM ('por_profissional', 'por_clinica_sala');
CREATE TYPE appointment_status AS ENUM ('agendado', 'confirmado', 'em_atendimento', 'concluido', 'cancelado', 'falta');
CREATE TYPE message_channel AS ENUM ('whatsapp', 'email', 'sms');
CREATE TYPE message_status AS ENUM ('pendente', 'enviado', 'entregue', 'erro');

-- Profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  cidade TEXT,
  uf TEXT,
  role user_role DEFAULT 'paciente',
  tenant_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Tenants table (clinics/businesses)
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  tipo tenant_type NOT NULL,
  cnpj TEXT,
  telefone TEXT NOT NULL,
  email TEXT,
  cidade TEXT NOT NULL,
  uf TEXT NOT NULL,
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  modo_agendamento modo_agendamento DEFAULT 'por_profissional',
  
  -- Políticas de agendamento
  antecedencia_minima_horas INTEGER DEFAULT 12,
  janela_agendamento_dias INTEGER DEFAULT 21,
  reagendamento_permitido_horas INTEGER DEFAULT 3,
  overbooking_ativo BOOLEAN DEFAULT false,
  
  -- Identidade visual
  cor_primaria TEXT DEFAULT '#016CA5',
  cor_acao TEXT DEFAULT '#25D366',
  logo_url TEXT,
  
  -- Segmentos (array de strings)
  segmentos TEXT[] DEFAULT '{}',
  
  -- Canais de mensagem
  whatsapp_ativo BOOLEAN DEFAULT true,
  email_ativo BOOLEAN DEFAULT true,
  sms_ativo BOOLEAN DEFAULT false,
  callmebot_phone TEXT,
  callmebot_apikey TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tenant"
  ON public.tenants FOR SELECT
  USING (
    id IN (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can update own tenant"
  ON public.tenants FOR UPDATE
  USING (
    id IN (
      SELECT tenant_id FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'profissional')
    )
  );

-- Add foreign key after tenants table exists
ALTER TABLE public.profiles 
  ADD CONSTRAINT fk_tenant 
  FOREIGN KEY (tenant_id) 
  REFERENCES public.tenants(id) 
  ON DELETE CASCADE;

-- Serviços table
CREATE TABLE public.servicos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  duracao_minutos INTEGER NOT NULL,
  preco DECIMAL(10,2),
  confirmacao_24h BOOLEAN DEFAULT false,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tenant services"
  ON public.servicos FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage services"
  ON public.servicos FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'profissional')
    )
  );

-- Pacientes table
CREATE TABLE public.pacientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  email TEXT,
  preferencia_contato message_channel DEFAULT 'whatsapp',
  consentimento_lgpd BOOLEAN DEFAULT false,
  consentimento_data TIMESTAMPTZ,
  historico_faltas INTEGER DEFAULT 0,
  risco_no_show INTEGER DEFAULT 0,
  notas_internas TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tenant patients"
  ON public.pacientes FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Staff can manage patients"
  ON public.pacientes FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'profissional', 'recepcao')
    )
  );

-- Agenda table
CREATE TABLE public.agenda (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  servico_id UUID NOT NULL REFERENCES public.servicos(id) ON DELETE CASCADE,
  profissional_id UUID REFERENCES public.profiles(id),
  sala TEXT,
  inicio TIMESTAMPTZ NOT NULL,
  fim TIMESTAMPTZ NOT NULL,
  status appointment_status DEFAULT 'agendado',
  origem TEXT DEFAULT 'recepção',
  confirmado BOOLEAN DEFAULT false,
  confirmado_em TIMESTAMPTZ,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.agenda ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tenant appointments"
  ON public.agenda FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Staff can manage appointments"
  ON public.agenda FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'profissional', 'recepcao')
    )
  );

-- Lista de espera table
CREATE TABLE public.lista_espera (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  servico_id UUID REFERENCES public.servicos(id),
  profissional_id UUID REFERENCES public.profiles(id),
  preferencia_data_inicio DATE,
  preferencia_data_fim DATE,
  preferencia_hora_inicio TIME,
  preferencia_hora_fim TIME,
  prioridade INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.lista_espera ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tenant waiting list"
  ON public.lista_espera FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Staff can manage waiting list"
  ON public.lista_espera FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'profissional', 'recepcao')
    )
  );

-- Log de mensagens table
CREATE TABLE public.log_mensagens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  paciente_id UUID REFERENCES public.pacientes(id),
  canal message_channel NOT NULL,
  destinatario TEXT NOT NULL,
  template_usado TEXT,
  status message_status DEFAULT 'pendente',
  erro_mensagem TEXT,
  usuario_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.log_mensagens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tenant message logs"
  ON public.log_mensagens FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Staff can create message logs"
  ON public.log_mensagens FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'profissional', 'recepcao')
    )
  );

-- Auditoria table
CREATE TABLE public.auditoria (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES public.profiles(id),
  acao TEXT NOT NULL,
  tabela TEXT,
  registro_id UUID,
  dados_anteriores JSONB,
  dados_novos JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.auditoria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
  ON public.auditoria FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_servicos_updated_at
  BEFORE UPDATE ON public.servicos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pacientes_updated_at
  BEFORE UPDATE ON public.pacientes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agenda_updated_at
  BEFORE UPDATE ON public.agenda
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();