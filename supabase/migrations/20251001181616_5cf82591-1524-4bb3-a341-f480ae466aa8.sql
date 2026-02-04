-- Add username to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username text UNIQUE;
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  price_monthly numeric(10,2) NOT NULL,
  price_annual numeric(10,2) NOT NULL,
  stripe_price_id_monthly text,
  stripe_price_id_annual text,
  stripe_product_id text,
  features jsonb DEFAULT '[]'::jsonb,
  max_professionals integer,
  max_messages_per_month integer,
  is_custom boolean DEFAULT false,
  active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES plans(id),
  stripe_subscription_id text UNIQUE,
  stripe_customer_id text,
  status text NOT NULL DEFAULT 'active',
  billing_cycle text NOT NULL DEFAULT 'monthly',
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  cancel_at_period_end boolean DEFAULT false,
  trial_end timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(tenant_id)
);

CREATE TABLE IF NOT EXISTS features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  category text,
  is_core boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS plan_features (
  plan_id uuid NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  feature_id uuid NOT NULL REFERENCES features(id) ON DELETE CASCADE,
  PRIMARY KEY (plan_id, feature_id)
);

DO $$ BEGIN
  CREATE TYPE system_role AS ENUM ('master', 'support', 'client');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS system_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  system_role system_role NOT NULL,
  permissions jsonb DEFAULT '{}'::jsonb,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tenant_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  feature_id uuid NOT NULL REFERENCES features(id) ON DELETE CASCADE,
  granted_by uuid REFERENCES system_users(id),
  granted_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  UNIQUE(tenant_id, feature_id)
);

-- Insert features and plans
INSERT INTO features (name, slug, description, category, is_core) VALUES
  ('Agendamento Básico', 'basic_scheduling', 'Agendamento de consultas básico', 'scheduling', true),
  ('Overbooking', 'overbooking', 'Overbooking automático de consultas', 'scheduling', false),
  ('Lista de Espera', 'waiting_list', 'Gestão de lista de espera', 'scheduling', false),
  ('Múltiplas Filas', 'multiple_queues', 'Múltiplas filas de espera', 'scheduling', false),
  ('Mensagens WhatsApp', 'whatsapp_messaging', 'Envio de mensagens via WhatsApp', 'messaging', true),
  ('Mensagens SMS', 'sms_messaging', 'Envio de mensagens via SMS', 'messaging', false),
  ('Relatórios Básicos', 'basic_reports', 'Relatórios básicos', 'reports', true),
  ('Exportação CSV', 'csv_export', 'Exportação de dados em CSV', 'reports', false),
  ('Auditoria Detalhada', 'detailed_audit', 'Auditoria detalhada de consultas', 'reports', false),
  ('Suporte Prioritário', 'priority_support', 'Acesso a suporte prioritário', 'admin', false),
  ('Gestão de Equipe', 'team_management', 'Gestão de múltiplos profissionais', 'admin', true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO plans (name, slug, description, price_monthly, price_annual, max_professionals, max_messages_per_month, display_order, features) VALUES
  ('Gratuito', 'free', 'Plano básico para começar', 0, 0, 1, 300, 1, 
   '["1 consultório", "1 profissional de saúde", "300 mensagens/mês", "Relatórios básicos"]'::jsonb),
  ('Profissional', 'professional', 'Para clínicas em crescimento', 99.00, 1009.20, 5, 1500, 2,
   '["Até 5 profissionais de saúde", "1.500 mensagens/mês", "Overbooking automático de consultas", "Lista de espera de pacientes", "Exportação CSV"]'::jsonb),
  ('Crescimento', 'growth', 'Para clínicas estabelecidas', 249.00, 2539.20, 15, 5000, 3,
   '["Até 15 profissionais de saúde", "5.000 mensagens/mês", "Múltiplas filas de espera", "Auditoria detalhada de consultas", "Suporte prioritário"]'::jsonb),
  ('Empresarial', 'enterprise', 'Plano customizado para grandes operações', 0, 0, -1, -1, 4,
   '["Profissionais ilimitados", "Mensagens ilimitadas", "Recursos customizados", "SLA garantido", "Suporte dedicado"]'::jsonb)
ON CONFLICT (slug) DO UPDATE SET 
  price_monthly = EXCLUDED.price_monthly,
  price_annual = EXCLUDED.price_annual,
  features = EXCLUDED.features;

UPDATE plans SET is_custom = true WHERE slug = 'enterprise';

INSERT INTO plan_features (plan_id, feature_id)
SELECT p.id, f.id FROM plans p, features f
WHERE p.slug = 'free' AND f.slug IN ('basic_scheduling', 'whatsapp_messaging', 'basic_reports', 'team_management')
ON CONFLICT DO NOTHING;

INSERT INTO plan_features (plan_id, feature_id)
SELECT p.id, f.id FROM plans p, features f
WHERE p.slug = 'professional' AND f.slug IN ('basic_scheduling', 'whatsapp_messaging', 'basic_reports', 'team_management', 'overbooking', 'waiting_list', 'csv_export')
ON CONFLICT DO NOTHING;

INSERT INTO plan_features (plan_id, feature_id)
SELECT p.id, f.id FROM plans p, features f
WHERE p.slug = 'growth' AND f.slug IN ('basic_scheduling', 'whatsapp_messaging', 'basic_reports', 'team_management', 'overbooking', 'waiting_list', 'multiple_queues', 'csv_export', 'detailed_audit', 'priority_support')
ON CONFLICT DO NOTHING;

INSERT INTO plan_features (plan_id, feature_id)
SELECT p.id, f.id FROM plans p, features f
WHERE p.slug = 'enterprise'
ON CONFLICT DO NOTHING;

-- Enable RLS on all tables
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE features ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_permissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Plans are viewable by everyone" ON plans;
DROP POLICY IF EXISTS "Master users can manage plans" ON plans;
DROP POLICY IF EXISTS "Users can view own tenant subscription" ON subscriptions;
DROP POLICY IF EXISTS "Master users can view all subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Master users can manage subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Features are viewable by everyone" ON features;
DROP POLICY IF EXISTS "Master users can manage features" ON features;
DROP POLICY IF EXISTS "Plan features are viewable by everyone" ON plan_features;
DROP POLICY IF EXISTS "Master users can manage plan features" ON plan_features;
DROP POLICY IF EXISTS "System users can view own record" ON system_users;
DROP POLICY IF EXISTS "Master users can view all system users" ON system_users;
DROP POLICY IF EXISTS "Master users can manage system users" ON system_users;
DROP POLICY IF EXISTS "Users can view own tenant permissions" ON tenant_permissions;
DROP POLICY IF EXISTS "Master users can manage tenant permissions" ON tenant_permissions;

-- Create RLS policies
CREATE POLICY "Plans are viewable by everyone" ON plans FOR SELECT USING (true);
CREATE POLICY "Master users can manage plans" ON plans FOR ALL 
  USING (EXISTS (SELECT 1 FROM system_users WHERE id = auth.uid() AND system_role = 'master'));

CREATE POLICY "Users can view own tenant subscription" ON subscriptions FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Master users can view all subscriptions" ON subscriptions FOR SELECT
  USING (EXISTS (SELECT 1 FROM system_users WHERE id = auth.uid() AND system_role IN ('master', 'support')));
CREATE POLICY "Master users can manage subscriptions" ON subscriptions FOR ALL
  USING (EXISTS (SELECT 1 FROM system_users WHERE id = auth.uid() AND system_role = 'master'));

CREATE POLICY "Features are viewable by everyone" ON features FOR SELECT USING (true);
CREATE POLICY "Master users can manage features" ON features FOR ALL
  USING (EXISTS (SELECT 1 FROM system_users WHERE id = auth.uid() AND system_role = 'master'));

CREATE POLICY "Plan features are viewable by everyone" ON plan_features FOR SELECT USING (true);
CREATE POLICY "Master users can manage plan features" ON plan_features FOR ALL
  USING (EXISTS (SELECT 1 FROM system_users WHERE id = auth.uid() AND system_role = 'master'));

CREATE POLICY "System users can view own record" ON system_users FOR SELECT USING (id = auth.uid());
CREATE POLICY "Master users can view all system users" ON system_users FOR SELECT
  USING (EXISTS (SELECT 1 FROM system_users WHERE id = auth.uid() AND system_role = 'master'));
CREATE POLICY "Master users can manage system users" ON system_users FOR ALL
  USING (EXISTS (SELECT 1 FROM system_users WHERE id = auth.uid() AND system_role = 'master'));

CREATE POLICY "Users can view own tenant permissions" ON tenant_permissions FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Master users can manage tenant permissions" ON tenant_permissions FOR ALL
  USING (EXISTS (SELECT 1 FROM system_users WHERE id = auth.uid() AND system_role = 'master'));

-- Drop existing triggers
DROP TRIGGER IF EXISTS update_plans_updated_at ON plans;
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
DROP TRIGGER IF EXISTS update_system_users_updated_at ON system_users;

-- Create triggers
CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_users_updated_at BEFORE UPDATE ON system_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to check feature access
CREATE OR REPLACE FUNCTION has_feature_access(p_tenant_id uuid, p_feature_slug text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_access boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM subscriptions s
    JOIN plan_features pf ON pf.plan_id = s.plan_id
    JOIN features f ON f.id = pf.feature_id
    WHERE s.tenant_id = p_tenant_id
      AND s.status = 'active'
      AND f.slug = p_feature_slug
    UNION
    SELECT 1 FROM tenant_permissions tp
    JOIN features f ON f.id = tp.feature_id
    WHERE tp.tenant_id = p_tenant_id
      AND f.slug = p_feature_slug
      AND (tp.expires_at IS NULL OR tp.expires_at > now())
  ) INTO v_has_access;
  
  RETURN COALESCE(v_has_access, false);
END;
$$;