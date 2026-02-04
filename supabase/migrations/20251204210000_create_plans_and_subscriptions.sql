-- Migration: Create Plans, Subscriptions, and Limits tables
-- Description: Implements multi-tenant billing schema with plans, seats, and limits.

-- 1. Tabela de Preços dos Planos (Catálogo)
CREATE TABLE IF NOT EXISTS public.planos_precos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_plano TEXT NOT NULL UNIQUE, -- 'free_solo', 'pro_solo', 'company_base', etc.
    descricao TEXT NOT NULL,
    preco_mensal_brl NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    moeda TEXT NOT NULL DEFAULT 'BRL',
    ativo BOOLEAN NOT NULL DEFAULT true,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Tabela de Limites por Plano
CREATE TABLE IF NOT EXISTS public.planos_limites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_plano TEXT NOT NULL REFERENCES public.planos_precos(codigo_plano) ON DELETE CASCADE,
    max_profissionais INT DEFAULT 1, -- NULL pode significar ilimitado ou N/A
    max_secretarias INT DEFAULT 0, -- NULL pode significar ilimitado ou N/A
    max_unidades INT, -- NULL significa ilimitado ou controlado por outro nível
    max_clientes INT, -- NULL significa ilimitado
    mensagens_incluidas INT, -- NULL significa ilimitado
    flags JSONB DEFAULT '{}'::jsonb, -- Features adicionais
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(codigo_plano)
);

-- 3. Tabela de Assinaturas (Estado atual do Tenant)
CREATE TABLE IF NOT EXISTS public.assinaturas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    edition TEXT NOT NULL CHECK (edition IN ('solo', 'company', 'org')),
    codigo_plano TEXT NOT NULL REFERENCES public.planos_precos(codigo_plano),
    status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'past_due', 'canceled', 'trialing')) DEFAULT 'draft',
    ciclo_inicio TIMESTAMPTZ,
    ciclo_fim TIMESTAMPTZ,
    proximo_cobranca TIMESTAMPTZ,
    provider TEXT NOT NULL CHECK (provider IN ('stripe', 'pagarme', 'none')) DEFAULT 'none',
    provider_subscription_id TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Garantir apenas uma assinatura ativa por tenant
CREATE UNIQUE INDEX IF NOT EXISTS idx_assinaturas_tenant_active ON public.assinaturas (tenant_id) WHERE status IN ('active', 'past_due', 'trialing');

-- 4. Tabela de Assentos (Seats) da Assinatura
CREATE TABLE IF NOT EXISTS public.assinatura_seats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assinatura_id UUID NOT NULL REFERENCES public.assinaturas(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL CHECK (tipo IN ('profissional', 'secretaria')),
    quantidade INT NOT NULL DEFAULT 0 CHECK (quantidade >= 0),
    quantidade_incluida INT NOT NULL DEFAULT 0 CHECK (quantidade_incluida >= 0),
    quantidade_cobrada INT GENERATED ALWAYS AS (GREATEST(quantidade - quantidade_incluida, 0)) STORED,
    preco_unitario NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(assinatura_id, tipo)
);

-- 5. Histórico de Eventos da Assinatura (Audit Log)
CREATE TABLE IF NOT EXISTS public.assinatura_historico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assinatura_id UUID NOT NULL REFERENCES public.assinaturas(id) ON DELETE CASCADE,
    evento TEXT NOT NULL, -- 'created', 'upgraded', 'downgraded', 'canceled', 'payment_failed'
    payload JSONB DEFAULT '{}'::jsonb,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Itens de Faturamento (Billing Line Items) - Para cálculo detalhado
CREATE TABLE IF NOT EXISTS public.billing_itens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assinatura_id UUID NOT NULL REFERENCES public.assinaturas(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL CHECK (tipo IN ('plano', 'seat_extra', 'ajuste_prorata', 'desconto')),
    descricao TEXT NOT NULL,
    referencia_mes DATE NOT NULL, -- Primeiro dia do mês de referência
    quantidade INT NOT NULL DEFAULT 1,
    valor_unitario NUMERIC(12,2) NOT NULL,
    total NUMERIC(12,2) NOT NULL,
    meta JSONB DEFAULT '{}'::jsonb,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Faturas (Invoices)
CREATE TABLE IF NOT EXISTS public.billing_faturas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assinatura_id UUID NOT NULL REFERENCES public.assinaturas(id) ON DELETE CASCADE,
    provider_invoice_id TEXT,
    periodo_inicio TIMESTAMPTZ,
    periodo_fim TIMESTAMPTZ,
    total NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible')) DEFAULT 'draft',
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. RBAC Usuários (Controle de acesso interno do Tenant)
CREATE TABLE IF NOT EXISTS public.rbac_usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    papel TEXT NOT NULL CHECK (papel IN ('profissional', 'secretaria', 'admin_tenant', 'financeiro', 'leitura')),
    ativo BOOLEAN NOT NULL DEFAULT true,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, user_id)
);

-- Triggers para atualizado_em (usando função existente update_updated_at_column)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_planos_precos_modtime') THEN
        CREATE TRIGGER update_planos_precos_modtime BEFORE UPDATE ON public.planos_precos FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_planos_limites_modtime') THEN
        CREATE TRIGGER update_planos_limites_modtime BEFORE UPDATE ON public.planos_limites FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_assinaturas_modtime') THEN
        CREATE TRIGGER update_assinaturas_modtime BEFORE UPDATE ON public.assinaturas FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_assinatura_seats_modtime') THEN
        CREATE TRIGGER update_assinatura_seats_modtime BEFORE UPDATE ON public.assinatura_seats FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_billing_faturas_modtime') THEN
        CREATE TRIGGER update_billing_faturas_modtime BEFORE UPDATE ON public.billing_faturas FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_rbac_usuarios_modtime') THEN
        CREATE TRIGGER update_rbac_usuarios_modtime BEFORE UPDATE ON public.rbac_usuarios FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
    END IF;
END $$;

-- SEEDS (Idempotentes)
-- Inserir Planos de Preço
INSERT INTO public.planos_precos (codigo_plano, descricao, preco_mensal_brl, ativo)
VALUES
    ('free_solo', 'Plano Gratuito Individual', 0.00, true),
    ('pro_solo', 'Plano Profissional Individual', 99.90, true),
    ('company_base', 'Plano Empresarial Base', 299.90, true),
    ('company_extra_seat', 'Profissional Adicional (Company)', 49.90, true),
    ('pro_unit', 'Unidade Adicional (Multi-Org)', 199.90, true),
    ('multi_org_discount', 'Desconto Multi-Unidades (%)', 10.00, true)
ON CONFLICT (codigo_plano) DO UPDATE SET
    descricao = EXCLUDED.descricao,
    preco_mensal_brl = EXCLUDED.preco_mensal_brl;

-- Inserir Limites dos Planos
INSERT INTO public.planos_limites (codigo_plano, max_profissionais, max_secretarias, max_unidades, max_clientes)
VALUES
    ('free_solo', 1, 0, 1, 50),
    ('pro_solo', 1, 1, 1, NULL), -- NULL = Ilimitado
    ('company_base', 5, 3, 1, NULL),
    ('pro_unit', NULL, NULL, NULL, NULL) -- Limites definidos pela org
ON CONFLICT (codigo_plano) DO UPDATE SET
    max_profissionais = EXCLUDED.max_profissionais,
    max_secretarias = EXCLUDED.max_secretarias,
    max_unidades = EXCLUDED.max_unidades,
    max_clientes = EXCLUDED.max_clientes;

-- RLS Policies

-- Habilitar RLS
ALTER TABLE public.planos_precos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planos_limites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assinaturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assinatura_seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assinatura_historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_faturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rbac_usuarios ENABLE ROW LEVEL SECURITY;

-- Políticas de Leitura Pública (Planos)
DROP POLICY IF EXISTS "Planos visíveis para todos autenticados" ON public.planos_precos;
CREATE POLICY "Planos visíveis para todos autenticados" ON public.planos_precos FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Limites visíveis para todos autenticados" ON public.planos_limites;
CREATE POLICY "Limites visíveis para todos autenticados" ON public.planos_limites FOR SELECT TO authenticated USING (true);

-- Políticas para Assinaturas (Tenant Isolation)
DROP POLICY IF EXISTS "Ver assinaturas do próprio tenant" ON public.assinaturas;
CREATE POLICY "Ver assinaturas do próprio tenant" ON public.assinaturas
    FOR SELECT TO authenticated
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Ver seats do próprio tenant" ON public.assinatura_seats;
CREATE POLICY "Ver seats do próprio tenant" ON public.assinatura_seats
    FOR SELECT TO authenticated
    USING (
        assinatura_id IN (
            SELECT id FROM public.assinaturas WHERE tenant_id IN (
                SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Ver histórico do próprio tenant" ON public.assinatura_historico;
CREATE POLICY "Ver histórico do próprio tenant" ON public.assinatura_historico
    FOR SELECT TO authenticated
    USING (
        assinatura_id IN (
            SELECT id FROM public.assinaturas WHERE tenant_id IN (
                SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Ver faturas do próprio tenant" ON public.billing_faturas;
CREATE POLICY "Ver faturas do próprio tenant" ON public.billing_faturas
    FOR SELECT TO authenticated
    USING (
        assinatura_id IN (
            SELECT id FROM public.assinaturas WHERE tenant_id IN (
                SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Ver itens de billing do próprio tenant" ON public.billing_itens;
CREATE POLICY "Ver itens de billing do próprio tenant" ON public.billing_itens
    FOR SELECT TO authenticated
    USING (
        assinatura_id IN (
            SELECT id FROM public.assinaturas WHERE tenant_id IN (
                SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
            )
        )
    );

-- Políticas para RBAC
DROP POLICY IF EXISTS "Ver membros do próprio tenant" ON public.rbac_usuarios;
CREATE POLICY "Ver membros do próprio tenant" ON public.rbac_usuarios
    FOR SELECT TO authenticated
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins gerenciam RBAC" ON public.rbac_usuarios;
CREATE POLICY "Admins gerenciam RBAC" ON public.rbac_usuarios
    FOR ALL TO authenticated
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
