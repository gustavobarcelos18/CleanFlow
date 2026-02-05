-- Criação da tabela de tickets de suporte para erros críticos do sistema
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz DEFAULT now(),
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
    organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
    organization_unit_id uuid REFERENCES public.units(id) ON DELETE SET NULL,
    page_url text NOT NULL,
    user_agent text,
    error_name text,
    error_message text,
    error_stack text,
    severity text DEFAULT 'critical',
    status text DEFAULT 'open',
    metadata jsonb DEFAULT '{}'::jsonb,
    
    CONSTRAINT severity_check CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    CONSTRAINT status_check CHECK (status IN ('open', 'in_progress', 'resolved', 'closed'))
);

-- Ativar RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Política para permitir apenas usuários autenticados inserirem tickets (Self-reporting)
CREATE POLICY "Users can report their own errors" 
ON public.support_tickets 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() IS NOT NULL);

-- Política para administradores (ajustar conforme roles do sistema, se existirem)
-- Por padrão, manteremos a leitura restrita. Se houver uma tabela de permissões de admin, seria adicionada aqui.
-- Exemplo genérico de permissão de visualização para admins:
-- CREATE POLICY "Admins can view all tickets" ON public.support_tickets FOR SELECT TO authenticated USING (/* lógica de admin */);

-- Comentários da tabela
COMMENT ON TABLE public.support_tickets IS 'Armazena erros críticos capturados pelo ErrorBoundary e capturadores globais.';
